import { z } from 'zod';
import { router, publicProcedure, permissionProcedure } from '../trpc';

export const libraryRouter = router({
  search: publicProcedure
    .input(
      z.object({
        q: z.string().trim().min(1).max(120).optional(),
        take: z.number().int().min(1).max(50).default(20),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where = input.q
        ? {
            OR: [
              { title: { contains: input.q, mode: 'insensitive' as const } },
              { authors: { hasSome: [input.q] } },
              { isbn: { equals: input.q } },
            ],
          }
        : {};

      const items = await ctx.prisma.resource.findMany({
        where,
        take: input.take + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        orderBy: { createdAt: 'desc' },
      });

      let nextCursor: string | undefined;
      if (items.length > input.take) {
        const next = items.pop();
        nextCursor = next?.id;
      }
      return { items, nextCursor };
    }),

  // Borrow flow — librarian only.
  borrow: permissionProcedure('library:manage')
    .input(
      z.object({
        resourceId: z.string().cuid(),
        subscriptionId: z.string().cuid(),
        durationDays: z.number().int().min(1).max(30).default(14),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Library rules per docs/projet.md §4.3:
      // - 14-day default duration
      // - max 3 concurrent active loans per subscriber
      const activeLoans = await ctx.prisma.loan.count({
        where: { subscriptionId: input.subscriptionId, status: 'ACTIVE' },
      });
      if (activeLoans >= 3) {
        throw new Error('Le quota de 3 prêts simultanés est atteint.');
      }

      const subscription = await ctx.prisma.subscription.findUnique({
        where: { id: input.subscriptionId },
        select: { userId: true, status: true },
      });
      if (!subscription || subscription.status !== 'ACTIVE') {
        throw new Error("L'abonnement n'est pas actif.");
      }

      const dueAt = new Date(Date.now() + input.durationDays * 24 * 60 * 60 * 1000);
      return ctx.prisma.loan.create({
        data: {
          resourceId: input.resourceId,
          userId: subscription.userId,
          subscriptionId: input.subscriptionId,
          dueAt,
        },
      });
    }),
});
