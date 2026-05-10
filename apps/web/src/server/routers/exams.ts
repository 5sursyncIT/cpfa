import type { Prisma } from '@cpfa/db';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, publicProcedure, permissionProcedure } from '../trpc';

const EXAM_KINDS = ['CONCOURS', 'EXAM_BLANC', 'CERTIFICATION'] as const;

const examInputSchema = z
  .object({
    slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9-]+$/),
    kind: z.enum(EXAM_KINDS).default('CONCOURS'),
    title: z.string().trim().min(1).max(300),
    openAt: z.date(),
    closeAt: z.date(),
    examAt: z.date().nullable().optional(),
    feeXof: z.number().int().min(0).max(100_000_000).default(0),
    description: z.string().trim().max(8000).optional().nullable(),
    noticeKey: z.string().trim().max(500).optional().nullable(),
    published: z.boolean().default(false),
  })
  .refine((v) => v.closeAt >= v.openAt, {
    message: "La date de clôture doit être après l'ouverture.",
    path: ['closeAt'],
  });

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

  // ── Admin CRUD ───────────────────────────────────────────────────────────
  adminList: permissionProcedure('admin:any').query(({ ctx }) =>
    ctx.prisma.exam.findMany({
      orderBy: { closeAt: 'desc' },
      include: { _count: { select: { registrations: true, papers: true } } },
    }),
  ),

  adminGet: permissionProcedure('admin:any')
    .input(z.object({ id: z.string().cuid() }))
    .query(({ ctx, input }) =>
      ctx.prisma.exam.findUniqueOrThrow({ where: { id: input.id } }),
    ),

  adminCreate: permissionProcedure('admin:any')
    .input(examInputSchema)
    .mutation(async ({ ctx, input }) => {
      const created = await ctx.prisma.exam.create({
        data: {
          ...input,
          examAt: input.examAt ?? null,
          description: input.description ?? null,
          noticeKey: input.noticeKey ?? null,
        },
      });
      await ctx.prisma.auditLog.create({
        data: {
          actorId: ctx.session.user.id,
          action: 'exam.create',
          entity: 'Exam',
          entityId: created.id,
          diff: { title: created.title, slug: created.slug, kind: created.kind },
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
            kind: z.enum(EXAM_KINDS).optional(),
            title: z.string().trim().min(1).max(300).optional(),
            openAt: z.date().optional(),
            closeAt: z.date().optional(),
            examAt: z.date().nullable().optional(),
            feeXof: z.number().int().min(0).max(100_000_000).optional(),
            description: z.string().trim().max(8000).nullable().optional(),
            noticeKey: z.string().trim().max(500).nullable().optional(),
            published: z.boolean().optional(),
          }),
        ),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const updated = await ctx.prisma.exam.update({
        where: { id },
        data: {
          ...data,
          examAt: data.examAt === undefined ? undefined : (data.examAt ?? null),
          description: data.description === undefined ? undefined : (data.description ?? null),
          noticeKey: data.noticeKey === undefined ? undefined : (data.noticeKey ?? null),
        },
      });
      await ctx.prisma.auditLog.create({
        data: {
          actorId: ctx.session.user.id,
          action: 'exam.update',
          entity: 'Exam',
          entityId: id,
          diff: data as Prisma.InputJsonValue,
        },
      });
      return updated;
    }),

  adminDelete: permissionProcedure('admin:any')
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const cnt = await ctx.prisma.registration.count({ where: { examId: input.id } });
      if (cnt > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Refusé : ${cnt} candidature(s) historique(s). Dépubliez plutôt.`,
        });
      }
      await ctx.prisma.exam.delete({ where: { id: input.id } });
      await ctx.prisma.auditLog.create({
        data: {
          actorId: ctx.session.user.id,
          action: 'exam.delete',
          entity: 'Exam',
          entityId: input.id,
        },
      });
      return { ok: true };
    }),
});
