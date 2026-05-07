import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { computeOverdueDays, computePenaltyXof } from '@/lib/library-rules';
import { router, protectedProcedure, permissionProcedure } from '../trpc';

export const loansRouter = router({
  // Subscriber's own loans, current and past.
  mine: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.loan.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { borrowedAt: 'desc' },
      include: { resource: { select: { id: true, title: true, authors: true, coverKey: true } } },
    });
  }),

  // Active loans across all subscribers — librarian/admin view.
  listActive: permissionProcedure('library:manage')
    .input(
      z
        .object({
          take: z.number().int().min(1).max(100).default(50),
          cursor: z.string().optional(),
          overdueOnly: z.boolean().default(false),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const take = input?.take ?? 50;
      const items = await ctx.prisma.loan.findMany({
        where: {
          status: 'ACTIVE',
          ...(input?.overdueOnly ? { dueAt: { lt: new Date() } } : {}),
        },
        take: take + 1,
        ...(input?.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        orderBy: [{ dueAt: 'asc' }],
        include: {
          resource: { select: { title: true } },
          user: { select: { firstName: true, lastName: true, email: true } },
          subscription: { select: { cardNumber: true } },
        },
      });
      let nextCursor: string | undefined;
      if (items.length > take) nextCursor = items.pop()?.id;
      return { items, nextCursor };
    }),

  // Mark a loan as returned. Penalty for overdue days is computed at return-time
  // per docs/projet.md §4.3 (500 FCFA/day).
  return: permissionProcedure('library:manage')
    .input(z.object({ loanId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const loan = await ctx.prisma.loan.findUnique({ where: { id: input.loanId } });
      if (!loan) throw new TRPCError({ code: 'NOT_FOUND' });
      if (loan.status !== 'ACTIVE') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Le prêt est déjà clôturé.' });
      }

      const now = new Date();
      const overdueDays = computeOverdueDays(loan.dueAt, now);
      const penaltyAmount = computePenaltyXof(loan.dueAt, now);

      const [updated] = await ctx.prisma.$transaction([
        ctx.prisma.loan.update({
          where: { id: input.loanId },
          data: { status: 'RETURNED', returnedAt: now, penaltyAmount },
        }),
        ctx.prisma.auditLog.create({
          data: {
            actorId: ctx.session.user.id,
            action: 'loan.return',
            entity: 'Loan',
            entityId: input.loanId,
            diff: { overdueDays, penaltyAmount },
          },
        }),
      ]);
      return updated;
    }),
});
