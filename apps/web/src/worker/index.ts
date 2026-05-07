// BullMQ worker — runs out-of-band jobs:
// - Email sending (transactional + reminders)
// - PDF generation (subscriber cards, invoices, convocations)
// - Loan reminders (cron-driven; emits per-loan jobs)
// - Payment webhook side-effects
//
// Started with `pnpm worker`. In production, run as a separate process from the web app.

import { Worker } from 'bullmq';
import { prisma } from '@cpfa/db';
import {
  getQueue,
  makeConnection,
  type EmailJob,
  type PdfJob,
  type LoanReminderJob,
  type PaymentWebhookJob,
} from '@cpfa/lib/queues';
import { computeOverdueDays, computePenaltyXof } from '../lib/library-rules';

const connection = makeConnection();

const REMINDER_WINDOW_DAYS = 3;

const emailWorker = new Worker<EmailJob>(
  'email',
  async (job) => {
    // eslint-disable-next-line no-console
    console.log('[worker:email]', job.name, job.data.to, job.data.template);
    // TODO: render with @cpfa/emails + Resend SDK.
  },
  { connection },
);

const pdfWorker = new Worker<PdfJob>(
  'pdf',
  async (job) => {
    // eslint-disable-next-line no-console
    console.log('[worker:pdf]', job.name, job.data.kind);
    // TODO: render with @cpfa/pdf + upload to S3.
  },
  { connection },
);

const loanReminderWorker = new Worker<LoanReminderJob | { kind: 'sweep' }>(
  'loan-reminders',
  async (job) => {
    // The repeatable cron emits a 'sweep' job; sweep finds candidate loans and
    // enqueues per-loan reminder jobs. Per-loan jobs render an email payload and
    // hand off to the email queue.
    if (job.name === 'sweep') {
      const now = new Date();
      const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_DAYS * 24 * 60 * 60 * 1000);

      const candidates = await prisma.loan.findMany({
        where: {
          status: 'ACTIVE',
          OR: [{ dueAt: { lte: windowEnd } }, { dueAt: { lt: now } }],
        },
        select: { id: true },
      });

      const queue = getQueue<LoanReminderJob>('loan-reminders');
      for (const c of candidates) {
        await queue.add('remind', { loanId: c.id }, { jobId: `remind:${c.id}:${now.toDateString()}` });
      }
      // eslint-disable-next-line no-console
      console.log(`[worker:loan-reminders] swept ${candidates.length} loans`);
      return;
    }

    const data = job.data as LoanReminderJob;
    const loan = await prisma.loan.findUnique({
      where: { id: data.loanId },
      include: {
        resource: { select: { title: true } },
        user: { select: { firstName: true, email: true } },
      },
    });
    if (!loan || loan.status !== 'ACTIVE') return;

    const now = new Date();
    const daysOverdue = computeOverdueDays(loan.dueAt, now);
    const penaltyXof = computePenaltyXof(loan.dueAt, now);

    await getQueue<EmailJob>('email').add('loan-reminder', {
      to: loan.user.email,
      template: 'loan-reminder',
      data: {
        firstName: loan.user.firstName ?? null,
        resourceTitle: loan.resource.title,
        dueDate: new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(loan.dueAt),
        daysOverdue,
        penaltyXof,
      },
    });
  },
  { connection },
);

const paymentWebhookWorker = new Worker<PaymentWebhookJob>(
  'payment-webhook',
  async (job) => {
    // eslint-disable-next-line no-console
    console.log('[worker:payment-webhook]', job.data.provider);
    // TODO: verify, mark Payment as CONFIRMED, trigger downstream jobs.
  },
  { connection },
);

for (const w of [emailWorker, pdfWorker, loanReminderWorker, paymentWebhookWorker]) {
  w.on('failed', (job, err) => {
    // eslint-disable-next-line no-console
    console.error(`[worker] ${w.name} failed (job ${job?.id}):`, err);
  });
}

// Schedule the daily sweep at 09:00 Africa/Dakar (UTC+0). Idempotent — repeating
// jobs in BullMQ are keyed by name + repeat options. Wrapped in an IIFE because
// the worker is bundled to CJS (no top-level await).
void (async () => {
  await getQueue('loan-reminders').add(
    'sweep',
    {},
    { repeat: { pattern: '0 9 * * *', tz: 'Africa/Dakar' }, removeOnComplete: 100 },
  );
  // eslint-disable-next-line no-console
  console.log('CPFA worker started — listening to queues: email, pdf, loan-reminders, payment-webhook');
})();
