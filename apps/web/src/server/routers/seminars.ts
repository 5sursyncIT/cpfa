import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, publicProcedure } from '../trpc';

export const seminarsRouter = router({
  list: publicProcedure
    .input(
      z
        .object({
          upcomingOnly: z.boolean().default(true),
          take: z.number().int().min(1).max(50).default(24),
          cursor: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const take = input?.take ?? 24;
      const items = await ctx.prisma.seminar.findMany({
        where: {
          published: true,
          ...(input?.upcomingOnly ?? true ? { startsAt: { gte: new Date() } } : {}),
        },
        take: take + 1,
        ...(input?.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        orderBy: { startsAt: 'asc' },
        select: {
          id: true,
          slug: true,
          title: true,
          startsAt: true,
          endsAt: true,
          location: true,
          priceXof: true,
        },
      });
      let nextCursor: string | undefined;
      if (items.length > take) nextCursor = items.pop()?.id;
      return { items, nextCursor };
    }),

  bySlug: publicProcedure
    .input(z.object({ slug: z.string().min(1).max(160) }))
    .query(async ({ ctx, input }) => {
      const seminar = await ctx.prisma.seminar.findUnique({
        where: { slug: input.slug },
        include: { speakers: true },
      });
      if (!seminar || !seminar.published) throw new TRPCError({ code: 'NOT_FOUND' });
      return seminar;
    }),
});
