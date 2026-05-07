import { Prisma } from '@cpfa/db';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
  LIBRARY_LOAN_DAYS,
  dueDateFromNow,
  evaluateBorrowEligibility,
} from '@/lib/library-rules';
import { router, publicProcedure, permissionProcedure } from '../trpc';

export const libraryRouter = router({
  search: publicProcedure
    .input(
      z.object({
        q: z.string().trim().min(1).max(120).optional(),
        kind: z
          .enum(['BOOK', 'JOURNAL', 'THESIS', 'AUDIO', 'VIDEO', 'DIGITAL', 'OTHER'])
          .optional(),
        take: z.number().int().min(1).max(50).default(20),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Full-text search via PG `to_tsvector` once we have the GIN index migration.
      // For now, fall back to ILIKE across title/authors/isbn — covers ~80% of queries
      // and works without a generated tsvector column.
      const q = input.q?.trim();
      const where: Prisma.ResourceWhereInput = {
        ...(input.kind ? { kind: input.kind } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { subtitle: { contains: q, mode: 'insensitive' } },
                { authors: { hasSome: [q] } },
                { keywords: { hasSome: [q] } },
                { isbn: q.length >= 10 ? { equals: q } : undefined },
              ].filter(Boolean) as Prisma.ResourceWhereInput[],
            }
          : {}),
      };

      const items = await ctx.prisma.resource.findMany({
        where,
        take: input.take + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        orderBy: [{ createdAt: 'desc' }],
        select: {
          id: true,
          title: true,
          subtitle: true,
          authors: true,
          kind: true,
          publishedYear: true,
          coverKey: true,
          totalCopies: true,
        },
      });

      let nextCursor: string | undefined;
      if (items.length > input.take) nextCursor = items.pop()?.id;
      return { items, nextCursor };
    }),

  byId: publicProcedure.input(z.object({ id: z.string().cuid() })).query(async ({ ctx, input }) => {
    const resource = await ctx.prisma.resource.findUnique({
      where: { id: input.id },
      include: { category: true },
    });
    if (!resource) throw new TRPCError({ code: 'NOT_FOUND' });

    const activeLoans = await ctx.prisma.loan.count({
      where: { resourceId: input.id, status: 'ACTIVE' },
    });
    return { ...resource, available: Math.max(0, resource.totalCopies - activeLoans) };
  }),

  // Borrow flow — librarian only.
  // Library rules per docs/projet.md §4.3:
  //  - 14-day default duration
  //  - max 3 concurrent active loans per subscriber
  borrow: permissionProcedure('library:manage')
    .input(
      z.object({
        resourceId: z.string().cuid(),
        subscriptionId: z.string().cuid(),
        durationDays: z.number().int().min(1).max(30).default(LIBRARY_LOAN_DAYS),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [subscription, resource, activeLoans, copiesOnLoan] = await Promise.all([
        ctx.prisma.subscription.findUnique({
          where: { id: input.subscriptionId },
          select: { userId: true, status: true, expiresAt: true },
        }),
        ctx.prisma.resource.findUnique({
          where: { id: input.resourceId },
          select: { totalCopies: true },
        }),
        ctx.prisma.loan.count({
          where: { subscriptionId: input.subscriptionId, status: 'ACTIVE' },
        }),
        ctx.prisma.loan.count({
          where: { resourceId: input.resourceId, status: 'ACTIVE' },
        }),
      ]);
      if (!subscription) throw new TRPCError({ code: 'NOT_FOUND', message: 'Abonnement introuvable.' });
      if (!resource) throw new TRPCError({ code: 'NOT_FOUND', message: 'Ressource introuvable.' });

      const eligibility = evaluateBorrowEligibility({
        subscription,
        activeLoansForSubscription: activeLoans,
        totalCopies: resource.totalCopies,
        copiesOnLoan,
      });
      if (!eligibility.ok) {
        const message =
          eligibility.reason === 'subscription-not-usable'
            ? "L'abonnement n'est pas actif ou a expiré."
            : eligibility.reason === 'quota-reached'
              ? 'Quota de 3 prêts simultanés atteint.'
              : 'Aucun exemplaire disponible.';
        throw new TRPCError({ code: 'BAD_REQUEST', message });
      }

      const dueAt = dueDateFromNow(new Date(), input.durationDays);
      const loan = await ctx.prisma.loan.create({
        data: {
          resourceId: input.resourceId,
          userId: subscription.userId,
          subscriptionId: input.subscriptionId,
          dueAt,
        },
      });

      await ctx.prisma.auditLog.create({
        data: {
          actorId: ctx.session?.user.id,
          action: 'loan.borrow',
          entity: 'Loan',
          entityId: loan.id,
          diff: { resourceId: input.resourceId, subscriptionId: input.subscriptionId, dueAt },
        },
      });

      return loan;
    }),

  // Borrow flow keyed by QR — what the librarian's scanner posts.
  borrowByQr: permissionProcedure('library:manage')
    .input(
      z.object({
        resourceQr: z.string().min(8),
        subscriptionQr: z.string().min(8),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [resource, subscription] = await Promise.all([
        ctx.prisma.resource.findUnique({
          where: { qrPayload: input.resourceQr },
          select: { id: true },
        }),
        ctx.prisma.subscription.findUnique({
          where: { qrPayload: input.subscriptionQr },
          select: { id: true },
        }),
      ]);
      if (!resource || !subscription) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'QR code inconnu.' });
      }
      // Reuse the regular borrow procedure's logic via a direct call would be ideal,
      // but tRPC doesn't expose internal call without a caller. Inline-trigger:
      return libraryBorrow({ ctx, resourceId: resource.id, subscriptionId: subscription.id });
    }),
});

async function libraryBorrow({
  ctx,
  resourceId,
  subscriptionId,
}: {
  ctx: { prisma: import('@cpfa/db').PrismaClient; session: { user: { id: string } } | null };
  resourceId: string;
  subscriptionId: string;
}) {
  const dueAt = dueDateFromNow(new Date(), LIBRARY_LOAN_DAYS);
  const subscription = await ctx.prisma.subscription.findUnique({
    where: { id: subscriptionId },
    select: { userId: true },
  });
  if (!subscription) throw new TRPCError({ code: 'NOT_FOUND' });

  return ctx.prisma.loan.create({
    data: { resourceId, userId: subscription.userId, subscriptionId, dueAt },
  });
}
