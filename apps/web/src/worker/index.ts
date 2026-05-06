// BullMQ worker — runs out-of-band jobs:
// - Email sending (transactional + reminders)
// - PDF generation (subscriber cards, invoices, convocations)
// - Loan reminders (cron-driven; emits per-loan jobs)
// - Payment webhook side-effects
//
// Started with `pnpm worker`. In production, run as a separate process from the web app.

import { Worker } from 'bullmq';
import {
  makeConnection,
  type EmailJob,
  type PdfJob,
  type LoanReminderJob,
  type PaymentWebhookJob,
} from '@cpfa/lib/queues';

const connection = makeConnection();

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

const loanReminderWorker = new Worker<LoanReminderJob>(
  'loan-reminders',
  async (job) => {
    // eslint-disable-next-line no-console
    console.log('[worker:loan-reminders]', job.data.loanId);
    // TODO: load loan, compute penalty, enqueue email job.
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

// eslint-disable-next-line no-console
console.log('CPFA worker started — listening to queues: email, pdf, loan-reminders, payment-webhook');
