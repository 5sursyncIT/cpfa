import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, permissionProcedure, protectedProcedure } from '../trpc';
import { confirmPayment } from '@/lib/payments-confirm';
import { getPaymentProvider } from '@cpfa/lib/payments';

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
