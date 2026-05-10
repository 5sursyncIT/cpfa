import { Prisma } from '@cpfa/db';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, permissionProcedure, protectedProcedure } from '../trpc';
import { confirmPayment } from '@/lib/payments-confirm';
import { getPaymentProvider } from '@cpfa/lib/payments';

const PROVIDER_VALUES = [
  'WAVE',
  'ORANGE_MONEY',
  'PAYTECH',
  'STATIC_QR',
  'CASH',
  'BANK_TRANSFER',
] as const;
const PURPOSE_VALUES = [
  'COURSE_REGISTRATION',
  'SEMINAR_REGISTRATION',
  'EXAM_FEE',
  'LIBRARY_SUBSCRIPTION',
  'LIBRARY_PENALTY',
  'OTHER',
] as const;

export const paymentsRouter = router({
  list: permissionProcedure('payment:validate')
    .input(
      z
        .object({
          status: z.enum(['PENDING', 'CONFIRMED', 'FAILED', 'REFUNDED']).optional(),
          take: z.number().int().min(1).max(200).default(50),
          cursor: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const take = input?.take ?? 50;
      const items = await ctx.prisma.payment.findMany({
        where: input?.status ? { status: input.status } : {},
        take: take + 1,
        ...(input?.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          subscription: { select: { cardNumber: true } },
        },
      });
      let nextCursor: string | undefined;
      if (items.length > take) nextCursor = items.pop()?.id;
      return { items, nextCursor };
    }),

  // Comptable manually marks a static-QR payment as received.
  // For LIBRARY_SUBSCRIPTION the subscription is activated in one transaction.
  confirm: permissionProcedure('payment:validate')
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const result = await confirmPayment(input.id, { actorId: ctx.session.user.id });
      if (result.kind === 'not-found') throw new TRPCError({ code: 'NOT_FOUND' });
      return ctx.prisma.payment.findUniqueOrThrow({ where: { id: input.id } });
    }),

  // Initiate a hosted-checkout flow (PayTech in production). The caller must
  // own the payment. Returns the redirectUrl the client should navigate to.
  // Idempotent for PENDING payments — repeated calls reuse the same checkout
  // session via providerRef when the provider supports it.
  initiate: protectedProcedure
    .input(z.object({ paymentId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const payment = await ctx.prisma.payment.findUnique({
        where: { id: input.paymentId },
        include: { user: { select: { id: true, email: true } } },
      });
      if (!payment) throw new TRPCError({ code: 'NOT_FOUND' });
      if (payment.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      if (payment.status !== 'PENDING') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Paiement déjà ${payment.status.toLowerCase()}.`,
        });
      }

      const provider = getPaymentProvider();
      const result = await provider.initiate({
        amountXof: payment.amountXof,
        reference: payment.id,
        customer: { id: payment.userId, email: payment.user.email ?? undefined },
        description: `CPFA — ${payment.purpose}`,
      });

      if (result.providerRef && result.providerRef !== payment.providerRef) {
        await ctx.prisma.payment.update({
          where: { id: payment.id },
          data: { providerRef: result.providerRef, provider: providerEnumFor(result.provider) },
        });
      }

      if (!result.redirectUrl && !result.qrPayload) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Provider returned neither redirectUrl nor qrPayload.',
        });
      }

      return {
        provider: result.provider,
        redirectUrl: result.redirectUrl,
        qrPayload: result.qrPayload,
      };
    }),

  // Refund a confirmed payment. Records the action in audit log; the actual
  // money movement happens out-of-band (Wave/PayTech dashboards, bank wire).
  refund: permissionProcedure('payment:validate')
    .input(
      z.object({
        id: z.string().cuid(),
        reason: z.string().trim().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const payment = await ctx.prisma.payment.findUnique({ where: { id: input.id } });
      if (!payment) throw new TRPCError({ code: 'NOT_FOUND' });
      if (payment.status !== 'CONFIRMED') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Seuls les paiements CONFIRMED peuvent être remboursés.',
        });
      }
      const updated = await ctx.prisma.payment.update({
        where: { id: input.id },
        data: { status: 'REFUNDED' },
      });
      await ctx.prisma.auditLog.create({
        data: {
          actorId: ctx.session.user.id,
          action: 'payment.refund',
          entity: 'Payment',
          entityId: input.id,
          diff: { reason: input.reason ?? null, amountXof: payment.amountXof },
        },
      });
      return updated;
    }),

  // Manual entry — front-desk cash, bank transfer received offline, etc.
  // Produces a CONFIRMED payment immediately. Caller specifies the user.
  manualRecord: permissionProcedure('payment:validate')
    .input(
      z.object({
        userId: z.string().cuid(),
        amountXof: z.number().int().min(1).max(100_000_000),
        provider: z.enum(PROVIDER_VALUES).default('CASH'),
        purpose: z.enum(PURPOSE_VALUES).default('OTHER'),
        subscriptionId: z.string().cuid().optional(),
        receivedAt: z.date().optional(),
        notes: z.string().trim().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const created = await ctx.prisma.payment.create({
        data: {
          userId: input.userId,
          amountXof: input.amountXof,
          provider: input.provider,
          purpose: input.purpose,
          subscriptionId: input.subscriptionId ?? null,
          status: 'CONFIRMED',
          receivedAt: input.receivedAt ?? new Date(),
          metadata: input.notes ? ({ notes: input.notes } as Prisma.InputJsonValue) : undefined,
        },
      });
      await ctx.prisma.auditLog.create({
        data: {
          actorId: ctx.session.user.id,
          action: 'payment.manualRecord',
          entity: 'Payment',
          entityId: created.id,
          diff: {
            amountXof: input.amountXof,
            provider: input.provider,
            purpose: input.purpose,
            notes: input.notes ?? null,
          },
        },
      });
      return created;
    }),

  adminGet: permissionProcedure('payment:validate')
    .input(z.object({ id: z.string().cuid() }))
    .query(({ ctx, input }) =>
      ctx.prisma.payment.findUniqueOrThrow({
        where: { id: input.id },
        include: {
          user: true,
          subscription: { select: { id: true, cardNumber: true, tier: true, status: true } },
          registration: {
            include: {
              course: { select: { title: true } },
              seminar: { select: { title: true } },
              exam: { select: { title: true } },
            },
          },
        },
      }),
    ),
});

function providerEnumFor(id: string): 'PAYTECH' | 'STATIC_QR' | 'WAVE' | 'ORANGE_MONEY' {
  switch (id) {
    case 'paytech':
      return 'PAYTECH';
    case 'wave':
      return 'WAVE';
    case 'orange-money':
      return 'ORANGE_MONEY';
    default:
      return 'STATIC_QR';
  }
}
