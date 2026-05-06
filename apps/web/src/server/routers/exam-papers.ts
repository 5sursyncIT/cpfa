import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { presignDownload, buildKey, presignUpload } from '@cpfa/lib/storage';
import { router, protectedProcedure, publicProcedure, permissionProcedure } from '../trpc';

export const examPapersRouter = router({
  // List papers for an exam — visibility depends on access level + viewer's
  // registration status. Public papers are always shown; REGISTERED requires
  // any registration; PAID requires PAID/VALIDATED status.
  listForExam: publicProcedure
    .input(z.object({ examId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const session = ctx.session;

      const accessLevels: ('PUBLIC' | 'REGISTERED' | 'PAID')[] = ['PUBLIC'];
      if (session?.user) {
        const reg = await ctx.prisma.registration.findFirst({
          where: { examId: input.examId, userId: session.user.id },
          select: { status: true },
        });
        if (reg) {
          accessLevels.push('REGISTERED');
          if (reg.status === 'PAID' || reg.status === 'VALIDATED') accessLevels.push('PAID');
        }
      }

      return ctx.prisma.examPaper.findMany({
        where: { examId: input.examId, accessLevel: { in: accessLevels } },
        orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          title: true,
          year: true,
          mimeType: true,
          sizeBytes: true,
          accessLevel: true,
        },
      });
    }),

  // Returns a short-lived signed URL — the route enforces visibility rules
  // server-side so the URL is never minted for unauthorized users.
  getDownloadUrl: protectedProcedure
    .input(z.object({ paperId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const paper = await ctx.prisma.examPaper.findUnique({
        where: { id: input.paperId },
        include: { exam: { select: { id: true } } },
      });
      if (!paper) throw new TRPCError({ code: 'NOT_FOUND' });

      if (paper.accessLevel !== 'PUBLIC') {
        const reg = await ctx.prisma.registration.findFirst({
          where: { examId: paper.exam.id, userId: ctx.session.user.id },
          select: { status: true },
        });
        const ok =
          paper.accessLevel === 'REGISTERED'
            ? !!reg
            : reg?.status === 'PAID' || reg?.status === 'VALIDATED';
        if (!ok) throw new TRPCError({ code: 'FORBIDDEN', message: 'Inscription requise pour cette épreuve.' });
      }

      return { url: await presignDownload(paper.fileKey, 300) };
    }),

  // Admin: presign upload for a new paper, then confirm.
  createPresignedUpload: permissionProcedure('admin:any')
    .input(
      z.object({
        examId: z.string().cuid(),
        fileName: z.string().min(1).max(160),
        mimeType: z.string().min(3).max(120),
        sizeBytes: z.number().int().min(1).max(25 * 1024 * 1024),
      }),
    )
    .mutation(async ({ input }) => {
      const key = buildKey('paper', input.examId, input.fileName);
      const presigned = await presignUpload({
        key,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
      });
      return { ...presigned, key };
    }),

  create: permissionProcedure('admin:any')
    .input(
      z.object({
        examId: z.string().cuid(),
        title: z.string().min(2).max(160),
        year: z.number().int().min(1990).max(2100).optional(),
        fileKey: z.string().min(8).max(400),
        mimeType: z.string(),
        sizeBytes: z.number().int().min(1),
        accessLevel: z.enum(['PUBLIC', 'REGISTERED', 'PAID']).default('PAID'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const paper = await ctx.prisma.examPaper.create({ data: input });
      await ctx.prisma.auditLog.create({
        data: {
          actorId: ctx.session.user.id,
          action: 'examPaper.create',
          entity: 'ExamPaper',
          entityId: paper.id,
        },
      });
      return paper;
    }),
});
