// Trainer module router (§4.6 of docs/projet.md).
// Surfaces:
//   - Public-but-auth-gated candidacy submission via `apply`
//   - Trainer self-service: `me`, `mySchedule`, `listResources`
//   - Admin review (`trainer:manage`): listCandidacies, approve, reject,
//     assignToSession, requestResourceUpload, confirmResource

import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { Prisma } from '@cpfa/db';
import { buildKey, presignDownload, presignUpload } from '@cpfa/lib/storage';
import { getQueue, type EmailJob } from '@cpfa/lib/queues';
import {
  router,
  protectedProcedure,
  permissionProcedure,
  publicProcedure,
} from '../trpc';

// FORMATEUR-only gate. Approved trainers automatically get the role granted
// by `approve`; we still re-check here so the procedure is correct in
// isolation (defense in depth).
const trainerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!ctx.session!.user.roles.includes('FORMATEUR')) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Réservé aux formateurs validés.' });
  }
  return next();
});

const applyInput = z.object({
  bio: z.string().min(20).max(4000),
  domains: z.array(z.string().min(2).max(80)).min(1).max(10),
  phone: z.string().min(7).max(30).optional(),
  experienceYears: z.number().int().min(0).max(70).optional(),
  cvKey: z.string().min(8).max(400).optional(),
});

export const trainersRouter = router({
  // Visiteur peut consulter combien de formateurs sont déjà approuvés (utile pour
  // afficher un compteur sur /devenir-formateur sans exposer de PII).
  publicCount: publicProcedure.query(async ({ ctx }) => {
    return { approved: await ctx.prisma.trainerProfile.count({ where: { status: 'APPROVED' } }) };
  }),

  // Submit or update one's own candidacy. Re-applying after a REJECTED status
  // resets the row to PENDING so admins can review again with the new data.
  // Named `submitApplication` because tRPC's proxy reserves Function-prototype
  // method names like `apply`/`call`/`bind`.
  submitApplication: protectedProcedure.input(applyInput).mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;
    const existing = await ctx.prisma.trainerProfile.findUnique({ where: { userId } });

    if (existing?.status === 'APPROVED') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Vous êtes déjà formateur — modifiez votre fiche depuis votre espace.',
      });
    }

    const data = {
      bio: input.bio,
      domains: input.domains,
      phone: input.phone ?? null,
      experienceYears: input.experienceYears ?? null,
      cvKey: input.cvKey ?? existing?.cvKey ?? null,
      status: 'PENDING' as const,
      submittedAt: new Date(),
      reviewedAt: null,
      reviewedById: null,
      rejectionReason: null,
    };

    return ctx.prisma.trainerProfile.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  }),

  // Trainer-side read: own profile + pending status.
  me: protectedProcedure.query(async ({ ctx }) => {
    const profile = await ctx.prisma.trainerProfile.findUnique({
      where: { userId: ctx.session.user.id },
    });
    return profile;
  }),

  // Presigned PUT for the candidate's CV. The Trainer profile row's `cvKey`
  // is updated either by `apply` (with the returned key) or, for an approved
  // trainer updating their CV, by `updateCv` below.
  requestCvUpload: protectedProcedure
    .input(
      z.object({
        fileName: z.string().min(1).max(160),
        mimeType: z.string().min(3).max(120),
        sizeBytes: z.number().int().min(1).max(25 * 1024 * 1024),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const key = buildKey('trainer-cv', ctx.session.user.id, input.fileName);
      const presigned = await presignUpload({
        key,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
      });
      return { ...presigned, key };
    }),

  // Approved trainer can replace their CV without re-submitting the whole
  // candidacy.
  updateCv: trainerProcedure
    .input(z.object({ cvKey: z.string().min(8).max(400) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.trainerProfile.update({
        where: { userId: ctx.session.user.id },
        data: { cvKey: input.cvKey },
      });
    }),

  // Trainer's own teaching schedule — every CourseSession assigned to them.
  mySchedule: trainerProcedure
    .input(
      z
        .object({
          fromDate: z.date().optional(),
          toDate: z.date().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const where: Prisma.CourseSessionWhereInput = {
        trainerId: ctx.session.user.id,
      };
      if (input?.fromDate || input?.toDate) {
        where.startsAt = {};
        if (input?.fromDate) where.startsAt.gte = input.fromDate;
        if (input?.toDate) where.startsAt.lte = input.toDate;
      }
      return ctx.prisma.courseSession.findMany({
        where,
        orderBy: { startsAt: 'asc' },
        include: {
          course: { select: { title: true, slug: true } },
          _count: { select: { registrations: true } },
        },
      });
    }),

  // Pedagogical resources visible to all approved trainers. Returns presigned
  // GET URLs valid for 5 minutes so the resource list always shows fresh links.
  listResources: trainerProcedure.query(async ({ ctx }) => {
    const items = await ctx.prisma.trainerResource.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        course: { select: { title: true, slug: true } },
        module: { select: { title: true } },
      },
    });
    return Promise.all(
      items.map(async (r) => ({
        ...r,
        downloadUrl: await presignDownload(r.storageKey, 300),
      })),
    );
  }),

  // Admin: list candidacies, default PENDING.
  listCandidacies: permissionProcedure('trainer:manage')
    .input(
      z
        .object({
          status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.trainerProfile.findMany({
        where: { status: input?.status ?? 'PENDING' },
        orderBy: { submittedAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              roles: true,
            },
          },
          reviewedBy: { select: { id: true, email: true } },
        },
      });
    }),

  approve: permissionProcedure('trainer:manage')
    .input(z.object({ profileId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const profile = await ctx.prisma.trainerProfile.findUnique({
        where: { id: input.profileId },
        include: { user: true },
      });
      if (!profile) throw new TRPCError({ code: 'NOT_FOUND' });
      if (profile.status === 'APPROVED') return profile;

      const now = new Date();
      const newRoles = profile.user.roles.includes('FORMATEUR')
        ? profile.user.roles
        : [...profile.user.roles, 'FORMATEUR' as const];

      await ctx.prisma.$transaction([
        ctx.prisma.trainerProfile.update({
          where: { id: profile.id },
          data: {
            status: 'APPROVED',
            reviewedAt: now,
            reviewedById: ctx.session.user.id,
            rejectionReason: null,
          },
        }),
        ctx.prisma.user.update({ where: { id: profile.userId }, data: { roles: newRoles } }),
        ctx.prisma.auditLog.create({
          data: {
            actorId: ctx.session.user.id,
            action: 'trainer.approve',
            entity: 'TrainerProfile',
            entityId: profile.id,
            diff: { userId: profile.userId },
          },
        }),
      ]);

      const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
      await getQueue<EmailJob>('email').add('trainer-approved', {
        to: profile.user.email,
        template: 'trainer-approved',
        data: {
          firstName: profile.user.firstName ?? null,
          spaceUrl: `${appUrl}/me/formateur`,
        },
      });

      return ctx.prisma.trainerProfile.findUniqueOrThrow({ where: { id: profile.id } });
    }),

  reject: permissionProcedure('trainer:manage')
    .input(
      z.object({
        profileId: z.string().cuid(),
        reason: z.string().min(5).max(2000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const profile = await ctx.prisma.trainerProfile.findUnique({
        where: { id: input.profileId },
        include: { user: { select: { email: true, firstName: true } } },
      });
      if (!profile) throw new TRPCError({ code: 'NOT_FOUND' });

      await ctx.prisma.$transaction([
        ctx.prisma.trainerProfile.update({
          where: { id: profile.id },
          data: {
            status: 'REJECTED',
            reviewedAt: new Date(),
            reviewedById: ctx.session.user.id,
            rejectionReason: input.reason,
          },
        }),
        ctx.prisma.auditLog.create({
          data: {
            actorId: ctx.session.user.id,
            action: 'trainer.reject',
            entity: 'TrainerProfile',
            entityId: profile.id,
            diff: { reason: input.reason },
          },
        }),
      ]);

      await getQueue<EmailJob>('email').add('trainer-rejected', {
        to: profile.user.email,
        template: 'trainer-rejected',
        data: {
          firstName: profile.user.firstName ?? null,
          reason: input.reason,
        },
      });

      return ctx.prisma.trainerProfile.findUniqueOrThrow({ where: { id: profile.id } });
    }),

  // Link a CourseSession to a trainer (must be FORMATEUR). Pass `trainerId: null`
  // to unassign.
  assignToSession: permissionProcedure('trainer:manage')
    .input(
      z.object({
        sessionId: z.string().cuid(),
        trainerId: z.string().cuid().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.trainerId) {
        const trainer = await ctx.prisma.user.findUnique({
          where: { id: input.trainerId },
          select: { roles: true },
        });
        if (!trainer || !trainer.roles.includes('FORMATEUR')) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'L’utilisateur ciblé n’est pas un formateur approuvé.',
          });
        }
      }
      const session = await ctx.prisma.courseSession.update({
        where: { id: input.sessionId },
        data: { trainerId: input.trainerId },
      });
      await ctx.prisma.auditLog.create({
        data: {
          actorId: ctx.session.user.id,
          action: 'session.assignTrainer',
          entity: 'CourseSession',
          entityId: session.id,
          diff: { trainerId: input.trainerId },
        },
      });
      return session;
    }),

  requestResourceUpload: permissionProcedure('trainer:manage')
    .input(
      z.object({
        fileName: z.string().min(1).max(160),
        mimeType: z.string().min(3).max(120),
        sizeBytes: z.number().int().min(1).max(25 * 1024 * 1024),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const key = buildKey('trainer-resource', ctx.session.user.id, input.fileName);
      const presigned = await presignUpload({
        key,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
      });
      return { ...presigned, key };
    }),

  confirmResource: permissionProcedure('trainer:manage')
    .input(
      z.object({
        title: z.string().min(2).max(160),
        description: z.string().max(2000).optional(),
        storageKey: z.string().min(8).max(400),
        mimeType: z.string(),
        sizeBytes: z.number().int().min(1),
        courseId: z.string().cuid().optional(),
        moduleId: z.string().cuid().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.trainerResource.create({
        data: {
          title: input.title,
          description: input.description ?? null,
          storageKey: input.storageKey,
          mimeType: input.mimeType,
          sizeBytes: input.sizeBytes,
          courseId: input.courseId ?? null,
          moduleId: input.moduleId ?? null,
          uploadedById: ctx.session.user.id,
        },
      });
    }),

  deleteResource: permissionProcedure('trainer:manage')
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.trainerResource.delete({ where: { id: input.id } });
      return { ok: true };
    }),
});
