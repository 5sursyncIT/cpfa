import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, publicProcedure } from '../trpc';

export const articlesRouter = router({
  list: publicProcedure
    .input(
      z
        .object({
          take: z.number().int().min(1).max(50).default(12),
          cursor: z.string().optional(),
          tag: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const take = input?.take ?? 12;
      const items = await ctx.prisma.article.findMany({
        where: {
          published: true,
          ...(input?.tag ? { tags: { has: input.tag } } : {}),
        },
        take: take + 1,
        ...(input?.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        orderBy: { publishedAt: 'desc' },
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          coverKey: true,
          publishedAt: true,
          tags: true,
          author: { select: { firstName: true, lastName: true } },
        },
      });
      let nextCursor: string | undefined;
      if (items.length > take) nextCursor = items.pop()?.id;
      return { items, nextCursor };
    }),

  bySlug: publicProcedure
    .input(z.object({ slug: z.string().min(1).max(160) }))
    .query(async ({ ctx, input }) => {
      const article = await ctx.prisma.article.findFirst({
        where: { slug: input.slug, published: true },
        include: { author: { select: { firstName: true, lastName: true, avatarUrl: true } } },
      });
      if (!article) throw new TRPCError({ code: 'NOT_FOUND' });
      return article;
    }),
});
