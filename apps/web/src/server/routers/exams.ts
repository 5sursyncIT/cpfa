import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, publicProcedure, permissionProcedure } from '../trpc';

export const examsRouter = router({
  list: publicProcedure
    .input(
      z
        .object({
          openOnly: z.boolean().default(true),
          take: z.number().int().min(1).max(50).default(24),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const now = new Date();
      return ctx.prisma.exam.findMany({
        where: {
          published: true,
          ...(input?.openOnly ?? true ? { openAt: { lte: now }, closeAt: { gte: now } } : {}),
        },
        orderBy: { closeAt: 'asc' },
        take: input?.take ?? 24,
        select: {
          id: true,
          slug: true,
          title: true,
          kind: true,
          openAt: true,
          closeAt: true,
          examAt: true,
          feeXof: true,
        },
      });
    }),

  bySlug: publicProcedure
    .input(z.object({ slug: z.string().min(1).max(160) }))
    .query(async ({ ctx, input }) => {
      const exam = await ctx.prisma.exam.findUnique({
        where: { slug: input.slug },
      });
      if (!exam || !exam.published) throw new TRPCError({ code: 'NOT_FOUND' });
      return exam;
    }),

  // Admin actions
  togglePublished: permissionProcedure('admin:any')
    .input(z.object({ id: z.string().cuid(), published: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.auditLog.create({
        data: {
          actorId: ctx.session.user.id,
          action: input.published ? 'exam.publish' : 'exam.unpublish',
          entity: 'Exam',
          entityId: input.id,
        },
      });
      return ctx.prisma.exam.update({
        where: { id: input.id },
        data: { published: input.published },
      });
    }),
});
