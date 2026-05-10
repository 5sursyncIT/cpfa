import { Prisma } from '@cpfa/db';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { computeOverdueDays, computePenaltyXof } from '@/lib/library-rules';
import { router, protectedProcedure, permissionProcedure } from '../trpc';

const LOAN_STATUSES = ['ACTIVE', 'RETURNED', 'OVERDUE', 'LOST'] as const;

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

  // ── Admin / librarian — full history with filters ──────────────────────
  adminList: permissionProcedure('library:manage')
    .input(
      z.object({
        status: z.enum(LOAN_STATUSES).optional(),
        overdueOnly: z.boolean().default(false),
        q: z.string().trim().max(120).optional(),
        userId: z.string().cuid().optional(),
        resourceId: z.string().cuid().optional(),
        take: z.number().int().min(1).max(100).default(50),
        cursor: z.string().optional(),
      }).optional(),
    )
    .query(async ({ ctx, input }) => {
      const q = input?.q?.trim();
      const where: Prisma.LoanWhereInput = {
        ...(input?.status ? { status: input.status } : {}),
        ...(input?.overdueOnly
          ? { status: 'ACTIVE', dueAt: { lt: new Date() } }
          : {}),
        ...(input?.userId ? { userId: input.userId } : {}),
        ...(input?.resourceId ? { resourceId: input.resourceId } : {}),
        ...(q
          ? {
              OR: [
                { resource: { title: { contains: q, mode: 'insensitive' } } },
                { user: { email: { contains: q, mode: 'insensitive' } } },
                { user: { firstName: { contains: q, mode: 'insensitive' } } },
                { user: { lastName: { contains: q, mode: 'insensitive' } } },
                { subscription: { cardNumber: { contains: q, mode: 'insensitive' } } },
              ],
            }
          : {}),
      };
      const take = input?.take ?? 50;
      const items = await ctx.prisma.loan.findMany({
        where,
        take: take + 1,
        ...(input?.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        orderBy: [{ borrowedAt: 'desc' }],
        include: {
          resource: { select: { id: true, title: true } },
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
          subscription: { select: { id: true, cardNumber: true } },
        },
      });
      let nextCursor: string | undefined;
      if (items.length > take) nextCursor = items.pop()?.id;
      return { items, nextCursor };
    }),

  // Mark an active loan as LOST. Charges the full penalty equal to overdue
  // days × daily rate at the moment of loss declaration. The librarian can
  // separately collect the penalty via collectPenalty.
  markLost: permissionProcedure('library:manage')
    .input(
      z.object({
        loanId: z.string().cuid(),
        notes: z.string().trim().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const loan = await ctx.prisma.loan.findUnique({ where: { id: input.loanId } });
      if (!loan) throw new TRPCError({ code: 'NOT_FOUND' });
      if (loan.status !== 'ACTIVE') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Le prêt est déjà clôturé.' });
      }
      const now = new Date();
      const penaltyAmount = computePenaltyXof(loan.dueAt, now);
      const [updated] = await ctx.prisma.$transaction([
        ctx.prisma.loan.update({
          where: { id: input.loanId },
          data: {
            status: 'LOST',
            returnedAt: now,
            penaltyAmount,
            notes: input.notes ?? loan.notes,
          },
        }),
        ctx.prisma.auditLog.create({
          data: {
            actorId: ctx.session.user.id,
            action: 'loan.markLost',
            entity: 'Loan',
            entityId: input.loanId,
            diff: { penaltyAmount, notes: input.notes ?? null },
          },
        }),
      ]);
      return updated;
    }),

  // Record collection of a loan's penalty. Creates a Payment with purpose
  // LIBRARY_PENALTY (provider CASH by default — front-desk register).
  collectPenalty: permissionProcedure('library:manage')
    .input(
      z.object({
        loanId: z.string().cuid(),
        provider: z
          .enum(['CASH', 'WAVE', 'ORANGE_MONEY', 'PAYTECH', 'BANK_TRANSFER', 'STATIC_QR'])
          .default('CASH'),
        amountXof: z.number().int().min(0).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const loan = await ctx.prisma.loan.findUnique({
        where: { id: input.loanId },
        include: { subscription: { select: { id: true } } },
      });
      if (!loan) throw new TRPCError({ code: 'NOT_FOUND' });
      const amountXof = input.amountXof ?? loan.penaltyAmount;
      if (amountXof <= 0) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Aucune pénalité à encaisser.' });
      }
      const payment = await ctx.prisma.payment.create({
        data: {
          userId: loan.userId,
          subscriptionId: loan.subscriptionId,
          amountXof,
          provider: input.provider,
          status: 'CONFIRMED',
          purpose: 'LIBRARY_PENALTY',
          receivedAt: new Date(),
          metadata: { loanId: loan.id } as Prisma.InputJsonValue,
        },
      });
      await ctx.prisma.auditLog.create({
        data: {
          actorId: ctx.session.user.id,
          action: 'loan.penaltyCollected',
          entity: 'Loan',
          entityId: loan.id,
          diff: { amountXof, paymentId: payment.id, provider: input.provider },
        },
      });
      return payment;
    }),
});
