import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, publicProcedure } from '../trpc';

export const pagesRouter = router({
  bySlug: publicProcedure
    .input(z.object({ slug: z.string().min(1).max(120), locale: z.string().default('fr') }))
    .query(async ({ ctx, input }) => {
      const page = await ctx.prisma.page.findFirst({
        where: { slug: input.slug, locale: input.locale, published: true },
      });
      if (!page) throw new TRPCError({ code: 'NOT_FOUND' });
      return page;
    }),

  listPublished: publicProcedure
    .input(z.object({ locale: z.string().default('fr') }).optional())
    .query(async ({ ctx, input }) =>
      ctx.prisma.page.findMany({
        where: { published: true, locale: input?.locale ?? 'fr' },
        select: { id: true, slug: true, title: true, publishedAt: true },
        orderBy: { publishedAt: 'desc' },
      }),
    ),
});
