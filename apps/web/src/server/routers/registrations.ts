import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { getPaymentProvider } from '@cpfa/lib/payments';
import { getQueue } from '@cpfa/lib/queues';
import { router, protectedProcedure, permissionProcedure } from '../trpc';

const registerCourseInput = z.object({
  courseId: z.string().cuid(),
  sessionId: z.string().cuid().optional(),
  notes: z.string().max(1000).optional(),
});

const registerSeminarInput = z.object({
  seminarId: z.string().cuid(),
  notes: z.string().max(1000).optional(),
});

const registerExamInput = z.object({
  examId: z.string().cuid(),
  notes: z.string().max(1000).optional(),
});

export const registrationsRouter = router({
  // Subscriber-side: list my registrations (any status).
  mine: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.registration.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        course: { select: { slug: true, title: true, priceXof: true } },
        seminar: { select: { slug: true, title: true, priceXof: true, startsAt: true } },
        exam: { select: { slug: true, title: true, feeXof: true } },
        session: { select: { startsAt: true, location: true } },
        payment: { select: { id: true, status: true, amountXof: true, metadata: true } },
      },
    });
  }),

  byId: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const reg = await ctx.prisma.registration.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
        include: {
          course: true,
          seminar: true,
          exam: true,
          session: true,
          payment: true,
          attachments: true,
        },
      });
      if (!reg) throw new TRPCError({ code: 'NOT_FOUND' });
      return reg;
    }),

  registerForCourse: protectedProcedure
    .input(registerCourseInput)
    .mutation(({ ctx, input }) => createRegistration(ctx, { kind: 'course', ...input })),

  registerForSeminar: protectedProcedure
    .input(registerSeminarInput)
    .mutation(({ ctx, input }) => createRegistration(ctx, { kind: 'seminar', ...input })),

  registerForExam: protectedProcedure
    .input(registerExamInput)
    .mutation(({ ctx, input }) => createRegistration(ctx, { kind: 'exam', ...input })),

  // Admin/comptable: validate or reject. Validation triggers convocation email.
  listPending: permissionProcedure('admin:any')
    .input(z.object({ status: z.enum(['SUBMITTED', 'PAID']).optional() }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.prisma.registration.findMany({
        where: input?.status
          ? { status: input.status }
          : { status: { in: ['SUBMITTED', 'PAID'] } },
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          course: { select: { title: true } },
          seminar: { select: { title: true } },
          exam: { select: { title: true } },
          payment: { select: { status: true, amountXof: true } },
        },
      });
    }),

  validate: permissionProcedure('admin:any')
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const reg = await ctx.prisma.registration.findUnique({
        where: { id: input.id },
        include: {
          user: true,
          course: { select: { title: true } },
          seminar: { select: { title: true, startsAt: true, location: true } },
          exam: { select: { title: true, examAt: true } },
          session: { select: { startsAt: true, location: true } },
        },
      });
      if (!reg) throw new TRPCError({ code: 'NOT_FOUND' });

      const updated = await ctx.prisma.registration.update({
        where: { id: input.id },
        data: { status: 'VALIDATED', validatedAt: new Date() },
      });

      await ctx.prisma.auditLog.create({
        data: {
          actorId: ctx.session.user.id,
          action: 'registration.validate',
          entity: 'Registration',
          entityId: input.id,
        },
      });

      const target = reg.course?.title ?? reg.seminar?.title ?? reg.exam?.title ?? 'CPFA';
      const date = reg.session?.startsAt ?? reg.seminar?.startsAt ?? reg.exam?.examAt ?? null;
      const startsAt = date
        ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' }).format(date)
        : undefined;
      const location = reg.session?.location ?? reg.seminar?.location ?? undefined;
      const fullName =
        [reg.user.firstName, reg.user.lastName].filter(Boolean).join(' ') || reg.user.email;
      const baseUrl = process.env.APP_URL ?? 'http://localhost:3000';

      // Fire-and-forget: worker renders convocation HTML and sends via Resend.
      await getQueue('email').add('convocation', {
        to: reg.user.email,
        template: 'convocation',
        data: {
          candidateName: fullName,
          target,
          startsAt,
          location,
          pdfUrl: `${baseUrl}/api/registrations/${reg.id}/convocation`,
        },
      });

      return updated;
    }),

  reject: permissionProcedure('admin:any')
    .input(z.object({ id: z.string().cuid(), reason: z.string().min(3).max(500) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.auditLog.create({
        data: {
          actorId: ctx.session.user.id,
          action: 'registration.reject',
          entity: 'Registration',
          entityId: input.id,
          diff: { reason: input.reason },
        },
      });
      return ctx.prisma.registration.update({
        where: { id: input.id },
        data: { status: 'REJECTED', notes: input.reason },
      });
    }),
});

type Ctx = { prisma: import('@cpfa/db').PrismaClient; session: { user: { id: string; email?: string | null } } };

type CreateRegistrationInput =
  | ({ kind: 'course' } & z.infer<typeof registerCourseInput>)
  | ({ kind: 'seminar' } & z.infer<typeof registerSeminarInput>)
  | ({ kind: 'exam' } & z.infer<typeof registerExamInput>);

async function createRegistration(ctx: Ctx, input: CreateRegistrationInput) {
  // Resolve the price for the chosen target.
  let amountXof = 0;
  let purpose: 'COURSE_REGISTRATION' | 'SEMINAR_REGISTRATION' | 'EXAM_FEE';
  let description: string;

  if (input.kind === 'course') {
    const course = await ctx.prisma.course.findUnique({
      where: { id: input.courseId },
      select: { id: true, title: true, priceXof: true, published: true },
    });
    if (!course?.published) throw new TRPCError({ code: 'NOT_FOUND' });
    amountXof = course.priceXof;
    purpose = 'COURSE_REGISTRATION';
    description = `Inscription — ${course.title}`;
  } else if (input.kind === 'seminar') {
    const seminar = await ctx.prisma.seminar.findUnique({
      where: { id: input.seminarId },
      select: { id: true, title: true, priceXof: true, published: true, capacity: true },
    });
    if (!seminar?.published) throw new TRPCError({ code: 'NOT_FOUND' });
    const taken = await ctx.prisma.registration.count({
      where: { seminarId: seminar.id, status: { in: ['SUBMITTED', 'PAID', 'VALIDATED'] } },
    });
    if (taken >= seminar.capacity) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Séminaire complet.' });
    }
    amountXof = seminar.priceXof;
    purpose = 'SEMINAR_REGISTRATION';
    description = `Inscription — ${seminar.title}`;
  } else {
    const exam = await ctx.prisma.exam.findUnique({
      where: { id: input.examId },
      select: { id: true, title: true, feeXof: true, published: true, openAt: true, closeAt: true },
    });
    if (!exam?.published) throw new TRPCError({ code: 'NOT_FOUND' });
    const now = new Date();
    if (now < exam.openAt || now > exam.closeAt) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Inscriptions fermées.' });
    }
    amountXof = exam.feeXof;
    purpose = 'EXAM_FEE';
    description = `Frais — ${exam.title}`;
  }

  const registration = await ctx.prisma.registration.create({
    data: {
      userId: ctx.session.user.id,
      status: 'SUBMITTED',
      submittedAt: new Date(),
      notes: input.notes,
      ...(input.kind === 'course'
        ? { courseId: input.courseId, sessionId: input.sessionId }
        : input.kind === 'seminar'
          ? { seminarId: input.seminarId }
          : { examId: input.examId }),
    },
  });

  // Free events: skip payment entirely.
  if (amountXof === 0) {
    await ctx.prisma.auditLog.create({
      data: {
        actorId: ctx.session.user.id,
        action: 'registration.submit',
        entity: 'Registration',
        entityId: registration.id,
        diff: { kind: input.kind, free: true },
      },
    });
    return { registration, payment: null };
  }

  const provider = getPaymentProvider();
  const init = await provider.initiate({
    amountXof,
    reference: registration.id,
    customer: { id: ctx.session.user.id, email: ctx.session.user.email ?? undefined },
    description,
  });

  const payment = await ctx.prisma.payment.create({
    data: {
      userId: ctx.session.user.id,
      amountXof,
      provider:
        init.provider === 'wave' ? 'WAVE' : init.provider === 'orange-money' ? 'ORANGE_MONEY' : 'STATIC_QR',
      status: 'PENDING',
      purpose,
      providerRef: init.providerRef,
      metadata: { redirectUrl: init.redirectUrl, qrPayload: init.qrPayload },
    },
  });

  await ctx.prisma.registration.update({
    where: { id: registration.id },
    data: { paymentId: payment.id },
  });

  await ctx.prisma.auditLog.create({
    data: {
      actorId: ctx.session.user.id,
      action: 'registration.submit',
      entity: 'Registration',
      entityId: registration.id,
      diff: { kind: input.kind, amountXof, paymentId: payment.id },
    },
  });

  return { registration, payment };
}
