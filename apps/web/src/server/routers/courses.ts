import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, publicProcedure, permissionProcedure } from '../trpc';
import type { Prisma } from '@cpfa/db';

const COURSE_KINDS = ['DIPLOMANT', 'CERTIFIANT', 'CARTE', 'AUDITORAT'] as const;
const COURSE_LEVELS = ['INITIATION', 'INTERMEDIAIRE', 'AVANCE'] as const;

const courseInputSchema = z.object({
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9-]+$/),
  title: z.string().trim().min(1).max(300),
  kind: z.enum(COURSE_KINDS).default('DIPLOMANT'),
  level: z.enum(COURSE_LEVELS).default('INITIATION'),
  durationHours: z.number().int().min(1).max(10000).default(1),
  priceXof: z.number().int().min(0).max(100_000_000).default(0),
  description: z.string().trim().max(8000).optional().nullable(),
  admissionCriteria: z.array(z.string().trim().min(1).max(400)).max(20).default([]),
  brochureKey: z.string().trim().max(500).optional().nullable(),
  coverImageKey: z.string().trim().max(500).optional().nullable(),
  published: z.boolean().default(false),
  applicationsOpenAt: z.date().nullable().optional(),
  applicationsCloseAt: z.date().nullable().optional(),
});

export const coursesRouter = router({
  list: publicProcedure
    .input(
      z
        .object({
          kind: z.enum(['DIPLOMANT', 'CERTIFIANT', 'CARTE', 'AUDITORAT']).optional(),
          level: z.enum(['INITIATION', 'INTERMEDIAIRE', 'AVANCE']).optional(),
          q: z.string().trim().min(1).max(120).optional(),
          take: z.number().int().min(1).max(50).default(24),
          cursor: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const take = input?.take ?? 24;
      const where: Prisma.CourseWhereInput = {
        published: true,
        ...(input?.kind ? { kind: input.kind } : {}),
        ...(input?.level ? { level: input.level } : {}),
        ...(input?.q
          ? {
              OR: [
                { title: { contains: input.q, mode: 'insensitive' } },
                { description: { contains: input.q, mode: 'insensitive' } },
              ],
            }
          : {}),
      };

      const items = await ctx.prisma.course.findMany({
        where,
        take: take + 1,
        ...(input?.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          slug: true,
          title: true,
          kind: true,
          level: true,
          durationHours: true,
          priceXof: true,
          coverImageKey: true,
        },
      });

      let nextCursor: string | undefined;
      if (items.length > take) nextCursor = items.pop()?.id;
      return { items, nextCursor };
    }),

  bySlug: publicProcedure
    .input(z.object({ slug: z.string().min(1).max(160) }))
    .query(async ({ ctx, input }) => {
      const course = await ctx.prisma.course.findUnique({
        where: { slug: input.slug },
        include: {
          modules: { orderBy: { position: 'asc' }, include: { lessons: { orderBy: { position: 'asc' } } } },
          sessions: { orderBy: { startsAt: 'asc' } },
        },
      });
      if (!course || !course.published) throw new TRPCError({ code: 'NOT_FOUND' });
      return course;
    }),

  // Admin: configure the application window. Both null = always open.
  // Used by the Director to gate diplômantes (DTA, BTS) outside concours.
  setApplicationWindow: permissionProcedure('admin:any')
    .input(
      z
        .object({
          courseId: z.string().cuid(),
          applicationsOpenAt: z.date().nullable(),
          applicationsCloseAt: z.date().nullable(),
        })
        .refine(
          (v) =>
            !v.applicationsOpenAt ||
            !v.applicationsCloseAt ||
            v.applicationsOpenAt < v.applicationsCloseAt,
          { message: "La date d'ouverture doit précéder la date de fermeture." },
        ),
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.prisma.course.update({
        where: { id: input.courseId },
        data: {
          applicationsOpenAt: input.applicationsOpenAt,
          applicationsCloseAt: input.applicationsCloseAt,
        },
        select: {
          id: true,
          slug: true,
          applicationsOpenAt: true,
          applicationsCloseAt: true,
        },
      });
      await ctx.prisma.auditLog.create({
        data: {
          actorId: ctx.session.user.id,
          action: 'course.setApplicationWindow',
          entity: 'Course',
          entityId: input.courseId,
          diff: {
            applicationsOpenAt: input.applicationsOpenAt?.toISOString() ?? null,
            applicationsCloseAt: input.applicationsCloseAt?.toISOString() ?? null,
          },
        },
      });
      return updated;
    }),

  // ── Admin CRUD ───────────────────────────────────────────────────────────
  adminList: permissionProcedure('admin:any').query(({ ctx }) =>
    ctx.prisma.course.findMany({
      orderBy: [{ kind: 'asc' }, { title: 'asc' }],
      include: { _count: { select: { registrations: true, sessions: true } } },
    }),
  ),

  adminGet: permissionProcedure('admin:any')
    .input(z.object({ id: z.string().cuid() }))
    .query(({ ctx, input }) =>
      ctx.prisma.course.findUniqueOrThrow({ where: { id: input.id } }),
    ),

  adminCreate: permissionProcedure('admin:any')
    .input(courseInputSchema)
    .mutation(async ({ ctx, input }) => {
      const created = await ctx.prisma.course.create({
        data: {
          ...input,
          description: input.description ?? null,
          brochureKey: input.brochureKey ?? null,
          coverImageKey: input.coverImageKey ?? null,
          applicationsOpenAt: input.applicationsOpenAt ?? null,
          applicationsCloseAt: input.applicationsCloseAt ?? null,
        },
      });
      await ctx.prisma.auditLog.create({
        data: {
          actorId: ctx.session.user.id,
          action: 'course.create',
          entity: 'Course',
          entityId: created.id,
          diff: { title: created.title, kind: created.kind, slug: created.slug },
        },
      });
      return created;
    }),

  adminUpdate: permissionProcedure('admin:any')
    .input(z.object({ id: z.string().cuid() }).merge(courseInputSchema.partial()))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const updated = await ctx.prisma.course.update({
        where: { id },
        data: {
          ...data,
          description: data.description === undefined ? undefined : (data.description ?? null),
          brochureKey: data.brochureKey === undefined ? undefined : (data.brochureKey ?? null),
          coverImageKey:
            data.coverImageKey === undefined ? undefined : (data.coverImageKey ?? null),
          applicationsOpenAt:
            data.applicationsOpenAt === undefined ? undefined : (data.applicationsOpenAt ?? null),
          applicationsCloseAt:
            data.applicationsCloseAt === undefined ? undefined : (data.applicationsCloseAt ?? null),
        },
      });
      await ctx.prisma.auditLog.create({
        data: {
          actorId: ctx.session.user.id,
          action: 'course.update',
          entity: 'Course',
          entityId: id,
          diff: data as Prisma.InputJsonValue,
        },
      });
      return updated;
    }),

  togglePublished: permissionProcedure('admin:any')
    .input(z.object({ id: z.string().cuid(), published: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.prisma.course.update({
        where: { id: input.id },
        data: { published: input.published },
      });
      await ctx.prisma.auditLog.create({
        data: {
          actorId: ctx.session.user.id,
          action: 'course.togglePublished',
          entity: 'Course',
          entityId: input.id,
          diff: { published: input.published },
        },
      });
      return updated;
    }),

  adminDelete: permissionProcedure('admin:any')
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const cnt = await ctx.prisma.registration.count({ where: { courseId: input.id } });
      if (cnt > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Refusé : ${cnt} inscription(s) historique(s). Dépubliez plutôt que supprimer.`,
        });
      }
      await ctx.prisma.course.delete({ where: { id: input.id } });
      await ctx.prisma.auditLog.create({
        data: {
          actorId: ctx.session.user.id,
          action: 'course.delete',
          entity: 'Course',
          entityId: input.id,
        },
      });
      return { ok: true };
    }),
});
