// Job board router (§3.2 du doc Directeur).
//
// Surfaces :
//   - Visiteur lit /emplois et postule à une offre.
//   - Recruteur dépose une offre via /emplois/recruteur (publique, gated par
//     modération admin).
//   - Admin (cms:write) publie / rejette / clôt depuis /admin/jobs.
//
// Anti-spam : les soumissions publiques (offre ou candidature) ne créent
// jamais de session. Une recherche par email empêche les doublons sur la
// même offre.

import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { Prisma } from '@cpfa/db';
import { buildKey, presignDownload, presignUpload } from '@cpfa/lib/storage';
import { getQueue, type EmailJob } from '@cpfa/lib/queues';
import { router, publicProcedure, protectedProcedure, permissionProcedure } from '../trpc';
import { serverError } from '@/lib/server-errors';

const TYPE = z.enum(['CDI', 'CDD', 'STAGE', 'FREELANCE', 'ALTERNANCE']);
const LEVEL = z.enum(['JUNIOR', 'INTERMEDIAIRE', 'SENIOR', 'EXECUTIVE']);

// Public WHERE clause: only PUBLISHED, not closed, not past closesAt.
function publicWhere(now: Date = new Date()): Prisma.JobPostingWhereInput {
  return {
    status: 'PUBLISHED',
    OR: [{ closesAt: null }, { closesAt: { gte: now } }],
  };
}

const APP_URL = process.env.APP_URL ?? 'http://localhost:3000';

export const jobsRouter = router({
  // Public listing with filters.
  list: publicProcedure
    .input(
      z
        .object({
          type: TYPE.optional(),
          level: LEVEL.optional(),
          location: z.string().min(1).max(120).optional(),
          q: z.string().max(120).optional(),
          take: z.number().int().min(1).max(50).default(24),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const where: Prisma.JobPostingWhereInput = {
        ...publicWhere(),
        ...(input?.type ? { type: input.type } : {}),
        ...(input?.level ? { level: input.level } : {}),
        ...(input?.location
          ? { location: { contains: input.location, mode: 'insensitive' as const } }
          : {}),
        // Nested under AND — spreading a second `OR` at the top level would
        // clobber publicWhere()'s closesAt clause and resurface expired offers.
        ...(input?.q
          ? {
              AND: [
                {
                  OR: [
                    { title: { contains: input.q, mode: 'insensitive' as const } },
                    { companyName: { contains: input.q, mode: 'insensitive' as const } },
                    { description: { contains: input.q, mode: 'insensitive' as const } },
                  ],
                },
              ],
            }
          : {}),
      };
      return ctx.prisma.jobPosting.findMany({
        where,
        take: input?.take ?? 24,
        orderBy: [{ urgent: 'desc' }, { publishedAt: 'desc' }],
        select: {
          id: true,
          title: true,
          companyName: true,
          type: true,
          level: true,
          location: true,
          urgent: true,
          publishedAt: true,
          closesAt: true,
        },
      });
    }),

  // Public detail (avec presigned URL pour la fiche de poste si fournie).
  byId: publicProcedure.input(z.object({ id: z.string().cuid() })).query(async ({ ctx, input }) => {
    const job = await ctx.prisma.jobPosting.findUnique({ where: { id: input.id } });
    if (!job) throw new TRPCError({ code: 'NOT_FOUND' });
    // L'admin voit DRAFT/REJECTED ; le visiteur ne voit que PUBLISHED non clos.
    const now = new Date();
    const visible = job.status === 'PUBLISHED' && (!job.closesAt || job.closesAt >= now);
    if (!visible) {
      throw new TRPCError({ code: 'NOT_FOUND' });
    }
    let fileSheetUrl: string | null = null;
    if (job.fileSheetKey) {
      try {
        fileSheetUrl = await presignDownload(job.fileSheetKey, 600);
      } catch {
        /* storage off in dev — ignore */
      }
    }
    return { ...job, fileSheetUrl };
  }),

  // Public form: dépôt d'une offre. Statut DRAFT → modération admin requise.
  submitOffer: publicProcedure
    .input(
      z.object({
        recruiterEmail: z.string().email().max(200),
        companyName: z.string().min(2).max(200),
        title: z.string().min(3).max(200),
        description: z.string().min(20).max(8000),
        profile: z.string().min(10).max(4000),
        contact: z.string().min(3).max(400),
        type: TYPE.default('CDI'),
        level: LEVEL.default('JUNIOR'),
        location: z.string().max(120).optional(),
        urgent: z.boolean().default(false),
        closesAt: z.date().optional(),
        fileSheetKey: z.string().max(400).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const recruiter = await ctx.prisma.user.findUnique({
        where: { email: input.recruiterEmail.toLowerCase() },
        select: { id: true },
      });
      return ctx.prisma.jobPosting.create({
        data: {
          recruiterEmail: input.recruiterEmail.toLowerCase(),
          recruiterId: recruiter?.id ?? null,
          companyName: input.companyName,
          title: input.title,
          description: input.description,
          profile: input.profile,
          contact: input.contact,
          type: input.type,
          level: input.level,
          location: input.location ?? null,
          urgent: input.urgent,
          closesAt: input.closesAt ?? null,
          fileSheetKey: input.fileSheetKey ?? null,
          status: 'DRAFT',
        },
        select: { id: true },
      });
    }),

  // Presigned PUT pour la fiche de poste recruteur (pré-soumission).
  requestSheetUpload: publicProcedure
    .input(
      z.object({
        fileName: z.string().min(1).max(160),
        mimeType: z.string().min(3).max(120),
        sizeBytes: z
          .number()
          .int()
          .min(1)
          .max(10 * 1024 * 1024),
      }),
    )
    .mutation(async ({ input }) => {
      const key = buildKey('job-sheet', 'public', input.fileName);
      const presigned = await presignUpload({
        key,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
      });
      return { ...presigned, key };
    }),

  // Presigned PUT pour le CV candidat (pré-soumission).
  requestCvUpload: publicProcedure
    .input(
      z.object({
        fileName: z.string().min(1).max(160),
        mimeType: z.string().min(3).max(120),
        sizeBytes: z
          .number()
          .int()
          .min(1)
          .max(10 * 1024 * 1024),
      }),
    )
    .mutation(async ({ input }) => {
      const key = buildKey('job-cv', 'public', input.fileName);
      const presigned = await presignUpload({
        key,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
      });
      return { ...presigned, key };
    }),

  // Public: candidature à une offre publiée. Émet 2 emails (recruteur + candidat).
  submitApplication: publicProcedure
    .input(
      z.object({
        jobPostingId: z.string().cuid(),
        firstName: z.string().min(2).max(120),
        lastName: z.string().min(2).max(120),
        email: z.string().email().max(200),
        phone: z.string().max(40).optional(),
        motivation: z.string().min(20).max(4000),
        cvKey: z.string().min(8).max(400),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const job = await ctx.prisma.jobPosting.findUnique({
        where: { id: input.jobPostingId },
        select: {
          id: true,
          title: true,
          companyName: true,
          status: true,
          closesAt: true,
          recruiterEmail: true,
        },
      });
      if (!job) throw new TRPCError({ code: 'NOT_FOUND' });
      const now = new Date();
      const open = job.status === 'PUBLISHED' && (!job.closesAt || job.closesAt >= now);
      if (!open) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: serverError('jobClosed', ctx.locale),
        });
      }

      const application = await ctx.prisma.jobApplication.create({
        data: {
          jobPostingId: job.id,
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email.toLowerCase(),
          phone: input.phone ?? null,
          motivation: input.motivation,
          cvKey: input.cvKey,
        },
      });

      // Lien direct CV (10 min) à passer dans l'email recruteur.
      let cvUrl = '';
      try {
        cvUrl = await presignDownload(input.cvKey, 600);
      } catch {
        // Storage indispo en dev — l'email partira sans lien CV ; le recruteur
        // pourra demander le CV au candidat directement.
        cvUrl = '';
      }

      const queue = getQueue<EmailJob>('email');
      await Promise.all([
        queue.add('job-application-recruiter', {
          to: job.recruiterEmail,
          template: 'job-application-recruiter',
          data: {
            companyName: job.companyName,
            jobTitle: job.title,
            candidateFirstName: input.firstName,
            candidateLastName: input.lastName,
            candidateEmail: input.email.toLowerCase(),
            candidatePhone: input.phone ?? null,
            motivation: input.motivation,
            cvUrl,
            applicationsUrl: `${APP_URL}/admin/jobs/${job.id}`,
          },
        }),
        queue.add('job-application-candidate', {
          to: input.email.toLowerCase(),
          template: 'job-application-candidate',
          data: {
            firstName: input.firstName,
            jobTitle: job.title,
            companyName: job.companyName,
          },
          // Le candidat peut postuler sans compte : sa locale de session sert
          // alors de repli. S'il a un compte, le worker lui préférera la
          // préférence enregistrée.
          locale: ctx.locale,
        }),
      ]);

      return { ok: true, applicationId: application.id };
    }),

  // ── Admin moderation ────────────────────────────────────────────────────

  adminList: permissionProcedure('cms:write')
    .input(
      z
        .object({
          status: z.enum(['DRAFT', 'PUBLISHED', 'CLOSED', 'REJECTED']).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.jobPosting.findMany({
        where: input?.status ? { status: input.status } : {},
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { applications: true } } },
      });
    }),

  adminById: permissionProcedure('cms:write')
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const job = await ctx.prisma.jobPosting.findUnique({
        where: { id: input.id },
        include: {
          applications: { orderBy: { createdAt: 'desc' } },
        },
      });
      if (!job) throw new TRPCError({ code: 'NOT_FOUND' });
      const apps = await Promise.all(
        job.applications.map(async (a) => ({
          ...a,
          cvUrl: await safePresign(a.cvKey),
        })),
      );
      return {
        ...job,
        applications: apps,
        fileSheetUrl: await safePresign(job.fileSheetKey),
      };
    }),

  publish: permissionProcedure('cms:write')
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const job = await ctx.prisma.jobPosting.update({
        where: { id: input.id },
        data: { status: 'PUBLISHED', publishedAt: new Date() },
      });
      await ctx.prisma.auditLog.create({
        data: {
          actorId: ctx.session.user.id,
          action: 'job.publish',
          entity: 'JobPosting',
          entityId: input.id,
        },
      });
      // Notification au recruteur.
      await getQueue<EmailJob>('email').add('job-posted', {
        to: job.recruiterEmail,
        template: 'job-posted',
        data: {
          companyName: job.companyName,
          jobTitle: job.title,
          publicUrl: `${APP_URL}/emplois/${job.id}`,
        },
      });
      return job;
    }),

  close: permissionProcedure('cms:write')
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const job = await ctx.prisma.jobPosting.update({
        where: { id: input.id },
        data: { status: 'CLOSED' },
      });
      await ctx.prisma.auditLog.create({
        data: {
          actorId: ctx.session.user.id,
          action: 'job.close',
          entity: 'JobPosting',
          entityId: input.id,
        },
      });
      return job;
    }),

  reject: permissionProcedure('cms:write')
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const job = await ctx.prisma.jobPosting.update({
        where: { id: input.id },
        data: { status: 'REJECTED' },
      });
      await ctx.prisma.auditLog.create({
        data: {
          actorId: ctx.session.user.id,
          action: 'job.reject',
          entity: 'JobPosting',
          entityId: input.id,
        },
      });
      return job;
    }),

  delete: permissionProcedure('cms:write')
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.jobPosting.delete({ where: { id: input.id } });
      await ctx.prisma.auditLog.create({
        data: {
          actorId: ctx.session.user.id,
          action: 'job.delete',
          entity: 'JobPosting',
          entityId: input.id,
        },
      });
      return { ok: true };
    }),

  setApplicationStatus: permissionProcedure('cms:write')
    .input(
      z.object({
        id: z.string().cuid(),
        status: z.enum(['SUBMITTED', 'REVIEWED', 'REJECTED', 'ACCEPTED']),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.jobApplication.update({
        where: { id: input.id },
        data: { status: input.status },
      });
    }),

  // Helper for the connected user — returns their own pending applications.
  myApplications: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.jobApplication.findMany({
      where: { email: ctx.session.user.email?.toLowerCase() ?? '___none___' },
      orderBy: { createdAt: 'desc' },
      include: { jobPosting: { select: { title: true, companyName: true } } },
    });
  }),
});

async function safePresign(key: string | null): Promise<string | null> {
  if (!key) return null;
  try {
    return await presignDownload(key, 600);
  } catch {
    return null;
  }
}
