import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, publicProcedure, permissionProcedure } from '../trpc';
import type { Prisma } from '@cpfa/db';

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
});
