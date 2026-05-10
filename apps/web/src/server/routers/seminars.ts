import type { Prisma } from '@cpfa/db';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, publicProcedure, permissionProcedure } from '../trpc';

const seminarInputSchema = z
  .object({
    slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9-]+$/),
    title: z.string().trim().min(1).max(300),
    startsAt: z.date(),
    endsAt: z.date(),
    location: z.string().trim().max(200).optional().nullable(),
    priceXof: z.number().int().min(0).max(100_000_000).default(0),
    capacity: z.number().int().min(0).max(10_000).default(50),
    description: z.string().trim().max(8000).optional().nullable(),
    brochureKey: z.string().trim().max(500).optional().nullable(),
    published: z.boolean().default(false),
  })
  .refine((v) => v.endsAt >= v.startsAt, {
    message: 'La date de fin doit être après la date de début.',
    path: ['endsAt'],
  });

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

  // ── Admin CRUD ───────────────────────────────────────────────────────────
  adminList: permissionProcedure('admin:any').query(({ ctx }) =>
    ctx.prisma.seminar.findMany({
      orderBy: { startsAt: 'desc' },
      include: { _count: { select: { registrations: true } } },
    }),
  ),

  adminGet: permissionProcedure('admin:any')
    .input(z.object({ id: z.string().cuid() }))
    .query(({ ctx, input }) =>
      ctx.prisma.seminar.findUniqueOrThrow({
        where: { id: input.id },
        include: { speakers: true },
      }),
    ),

  adminCreate: permissionProcedure('admin:any')
    .input(seminarInputSchema)
    .mutation(async ({ ctx, input }) => {
      const created = await ctx.prisma.seminar.create({
        data: {
          ...input,
          location: input.location ?? null,
          description: input.description ?? null,
          brochureKey: input.brochureKey ?? null,
        },
      });
      await ctx.prisma.auditLog.create({
        data: {
          actorId: ctx.session.user.id,
          action: 'seminar.create',
          entity: 'Seminar',
          entityId: created.id,
          diff: { title: created.title, slug: created.slug, startsAt: created.startsAt },
        },
      });
      return created;
    }),

  adminUpdate: permissionProcedure('admin:any')
    .input(
      z
        .object({ id: z.string().cuid() })
        .merge(
          z.object({
            slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9-]+$/).optional(),
            title: z.string().trim().min(1).max(300).optional(),
            startsAt: z.date().optional(),
            endsAt: z.date().optional(),
            location: z.string().trim().max(200).nullable().optional(),
            priceXof: z.number().int().min(0).max(100_000_000).optional(),
            capacity: z.number().int().min(0).max(10_000).optional(),
            description: z.string().trim().max(8000).nullable().optional(),
            brochureKey: z.string().trim().max(500).nullable().optional(),
            published: z.boolean().optional(),
          }),
        ),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const updated = await ctx.prisma.seminar.update({
        where: { id },
        data: {
          ...data,
          location: data.location === undefined ? undefined : (data.location ?? null),
          description: data.description === undefined ? undefined : (data.description ?? null),
          brochureKey: data.brochureKey === undefined ? undefined : (data.brochureKey ?? null),
        },
      });
      await ctx.prisma.auditLog.create({
        data: {
          actorId: ctx.session.user.id,
          action: 'seminar.update',
          entity: 'Seminar',
          entityId: id,
          diff: data as Prisma.InputJsonValue,
        },
      });
      return updated;
    }),

  togglePublished: permissionProcedure('admin:any')
    .input(z.object({ id: z.string().cuid(), published: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.prisma.seminar.update({
        where: { id: input.id },
        data: { published: input.published },
      });
      await ctx.prisma.auditLog.create({
        data: {
          actorId: ctx.session.user.id,
          action: 'seminar.togglePublished',
          entity: 'Seminar',
          entityId: input.id,
          diff: { published: input.published },
        },
      });
      return updated;
    }),

  adminDelete: permissionProcedure('admin:any')
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const cnt = await ctx.prisma.registration.count({ where: { seminarId: input.id } });
      if (cnt > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Refusé : ${cnt} inscription(s) historique(s). Dépubliez plutôt que supprimer.`,
        });
      }
      await ctx.prisma.seminar.delete({ where: { id: input.id } });
      await ctx.prisma.auditLog.create({
        data: {
          actorId: ctx.session.user.id,
          action: 'seminar.delete',
          entity: 'Seminar',
          entityId: input.id,
        },
      });
      return { ok: true };
    }),
});
