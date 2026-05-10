// Testimonials router. Public consumers (home carrousel, /enseigner-au-cpfa,
// /espaces-apprenants) read via `list`; admin CRUD is gated by `cms:write`.

import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, publicProcedure, permissionProcedure } from '../trpc';

const SCOPE = z.enum(['STUDENT', 'TEACHER', 'PROFESSIONAL', 'PARTNER']);

const testimonialInput = z.object({
  scope: SCOPE,
  authorName: z.string().min(2).max(120),
  authorRole: z.string().max(160).optional(),
  authorPhotoKey: z.string().max(400).optional(),
  quote: z.string().min(10).max(1000),
  locale: z.enum(['fr', 'en']).default('fr'),
  published: z.boolean().default(false),
  displayOrder: z.number().int().min(0).max(9999).default(0),
});

export const testimonialsRouter = router({
  // Public: list published testimonials, optionally filtered by scope and locale.
  list: publicProcedure
    .input(
      z
        .object({
          scope: SCOPE.optional(),
          scopes: z.array(SCOPE).optional(),
          locale: z.enum(['fr', 'en']).default('fr'),
          take: z.number().int().min(1).max(50).default(20),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const locale = input?.locale ?? 'fr';
      const scopeFilter = input?.scope
        ? { scope: input.scope }
        : input?.scopes && input.scopes.length > 0
          ? { scope: { in: input.scopes } }
          : {};
      return ctx.prisma.testimonial.findMany({
        where: { published: true, locale, ...scopeFilter },
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
        take: input?.take ?? 20,
      });
    }),

  // Admin: list everything (incl. drafts).
  adminList: permissionProcedure('cms:write')
    .input(
      z
        .object({
          scope: SCOPE.optional(),
          locale: z.enum(['fr', 'en']).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.testimonial.findMany({
        where: {
          ...(input?.scope ? { scope: input.scope } : {}),
          ...(input?.locale ? { locale: input.locale } : {}),
        },
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      });
    }),

  byId: permissionProcedure('cms:write')
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const t = await ctx.prisma.testimonial.findUnique({ where: { id: input.id } });
      if (!t) throw new TRPCError({ code: 'NOT_FOUND' });
      return t;
    }),

  create: permissionProcedure('cms:write')
    .input(testimonialInput)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.testimonial.create({
        data: {
          ...input,
          authorRole: input.authorRole ?? null,
          authorPhotoKey: input.authorPhotoKey ?? null,
        },
      });
    }),

  update: permissionProcedure('cms:write')
    .input(z.object({ id: z.string().cuid() }).merge(testimonialInput.partial()))
    .mutation(async ({ ctx, input }) => {
      const { id, ...rest } = input;
      return ctx.prisma.testimonial.update({ where: { id }, data: rest });
    }),

  togglePublished: permissionProcedure('cms:write')
    .input(z.object({ id: z.string().cuid(), published: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.testimonial.update({
        where: { id: input.id },
        data: { published: input.published },
      });
    }),

  delete: permissionProcedure('cms:write')
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.testimonial.delete({ where: { id: input.id } });
      return { ok: true };
    }),
});
