import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { Prisma } from '@cpfa/db';
import { router, permissionProcedure } from '../trpc';

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
      const payment = await ctx.prisma.payment.findUnique({
        where: { id: input.id },
        include: { subscription: true },
      });
      if (!payment) throw new TRPCError({ code: 'NOT_FOUND' });
      if (payment.status === 'CONFIRMED') return payment;

      const now = new Date();
      const ops: Prisma.PrismaPromise<unknown>[] = [
        ctx.prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'CONFIRMED', receivedAt: now },
        }),
        ctx.prisma.auditLog.create({
          data: {
            actorId: ctx.session.user.id,
            action: 'payment.confirm',
            entity: 'Payment',
            entityId: payment.id,
            diff: { amountXof: payment.amountXof, purpose: payment.purpose },
          },
        }),
      ];

      if (payment.purpose === 'LIBRARY_SUBSCRIPTION' && payment.subscription) {
        const expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
        ops.push(
          ctx.prisma.subscription.update({
            where: { id: payment.subscription.id },
            data: { status: 'ACTIVE', startedAt: now, expiresAt },
          }),
        );
      }

      // For training payments, update the linked registration to PAID.
      if (
        payment.purpose === 'COURSE_REGISTRATION' ||
        payment.purpose === 'SEMINAR_REGISTRATION' ||
        payment.purpose === 'EXAM_FEE'
      ) {
        const reg = await ctx.prisma.registration.findFirst({
          where: { paymentId: payment.id },
          select: { id: true },
        });
        if (reg) {
          ops.push(
            ctx.prisma.registration.update({
              where: { id: reg.id },
              data: { status: 'PAID' },
            }),
          );
        }
      }

      const results = await ctx.prisma.$transaction(ops);
      return results[0];
    }),
});
