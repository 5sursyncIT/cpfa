import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { Prisma } from '@cpfa/db';
import { router, permissionProcedure } from '../trpc';

const blockSchema = z
  .object({
    kind: z.enum(['heading', 'paragraph', 'image']),
    text: z.string().optional(),
    level: z.number().int().min(2).max(4).optional(),
    src: z.string().optional(),
    alt: z.string().optional(),
  })
  .passthrough();

const pageInput = z.object({
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/, 'Slug invalide (a-z, 0-9, tirets).'),
  title: z.string().min(2).max(200),
  locale: z.string().default('fr'),
  metaTitle: z.string().max(200).optional(),
  metaDescription: z.string().max(500).optional(),
  content: z.array(blockSchema),
  published: z.boolean().default(false),
});

export const cmsRouter = router({
  // Page CRUD ──────────────────────────────────────────────────────────────
  pages: router({
    list: permissionProcedure('cms:write').query(async ({ ctx }) =>
      ctx.prisma.page.findMany({
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          slug: true,
          title: true,
          locale: true,
          published: true,
          updatedAt: true,
        },
      }),
    ),

    byId: permissionProcedure('cms:write')
      .input(z.object({ id: z.string().cuid() }))
      .query(async ({ ctx, input }) => {
        const page = await ctx.prisma.page.findUnique({ where: { id: input.id } });
        if (!page) throw new TRPCError({ code: 'NOT_FOUND' });
        return page;
      }),

    create: permissionProcedure('cms:write')
      .input(pageInput)
      .mutation(async ({ ctx, input }) => {
        const page = await ctx.prisma.page.create({
          data: {
            ...input,
            content: input.content as Prisma.InputJsonValue,
            publishedAt: input.published ? new Date() : null,
          },
        });
        await ctx.prisma.auditLog.create({
          data: {
            actorId: ctx.session.user.id,
            action: 'page.create',
            entity: 'Page',
            entityId: page.id,
          },
        });
        return page;
      }),

    update: permissionProcedure('cms:write')
      .input(z.object({ id: z.string().cuid() }).merge(pageInput.partial()))
      .mutation(async ({ ctx, input }) => {
        const { id, content, ...rest } = input;
        const before = await ctx.prisma.page.findUnique({ where: { id } });
        if (!before) throw new TRPCError({ code: 'NOT_FOUND' });

        const next = await ctx.prisma.page.update({
          where: { id },
          data: {
            ...rest,
            ...(content ? { content: content as Prisma.InputJsonValue } : {}),
            ...(rest.published === true && !before.publishedAt ? { publishedAt: new Date() } : {}),
          },
        });

        await ctx.prisma.auditLog.create({
          data: {
            actorId: ctx.session.user.id,
            action: 'page.update',
            entity: 'Page',
            entityId: id,
            diff: { from: before.title, to: next.title, published: next.published },
          },
        });

        return next;
      }),
  }),

  // Article admin actions ────────────────────────────────────────────────
  articles: router({
    list: permissionProcedure('cms:write').query(async ({ ctx }) =>
      ctx.prisma.article.findMany({
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          slug: true,
          title: true,
          published: true,
          publishedAt: true,
          updatedAt: true,
        },
      }),
    ),

    togglePublished: permissionProcedure('cms:write')
      .input(z.object({ id: z.string().cuid(), published: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        await ctx.prisma.auditLog.create({
          data: {
            actorId: ctx.session.user.id,
            action: input.published ? 'article.publish' : 'article.unpublish',
            entity: 'Article',
            entityId: input.id,
          },
        });
        return ctx.prisma.article.update({
          where: { id: input.id },
          data: {
            published: input.published,
            ...(input.published ? { publishedAt: new Date() } : {}),
          },
        });
      }),
  }),
});
