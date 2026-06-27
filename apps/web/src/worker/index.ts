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
  type PaymentWebhookJob,
} from '@cpfa/lib/queues';
import { putObject, readObject } from '@cpfa/lib/storage';
import { qrToDataUrl } from '@cpfa/lib/qr';
import { renderSubscriberCard, renderInvoice, renderConvocation } from '@cpfa/pdf';
import { sendEmail, subjectFor, type EmailAttachment, type EmailTemplate } from '../lib/mailer';
import { confirmPayment } from '../lib/payments-confirm';

const connection = makeConnection();

const emailWorker = new Worker<EmailJob>(
  'email',
  async (job) => {
    const { to, template, data, replyTo, attachments } = job.data;
    const tmpl = { kind: template, data } as unknown as EmailTemplate;
    // Read attachment bytes straight from local disk and attach as base64 —
    // the queue payload only carries the storage key, so nothing goes stale on
    // a retry days later.
    let resolvedAttachments: EmailAttachment[] | undefined;
    if (attachments && attachments.length > 0) {
      resolvedAttachments = [];
      for (const a of attachments) {
        try {
          const bytes = await readObject(a.storageKey);
          resolvedAttachments.push({
            filename: a.filename,
            content: bytes.toString('base64'),
            contentType: a.contentType,
          });
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn(`[worker:email] read failed for ${a.storageKey}`, err);
        }
      }
    }
    const result = await sendEmail({
      to,
      subject: subjectFor(tmpl),
      template: tmpl,
      replyTo,
      attachments: resolvedAttachments,
    });
    // eslint-disable-next-line no-console
    console.log(
      `[worker:email] ${template} → ${to} ${result.mocked ? '(mocked, SMTP not configured)' : `id=${result.id}`}`,
    );
  },
  { connection },
);

const pdfWorker = new Worker<PdfJob>(
  'pdf',
  async (job) => {
    const data = job.data;
    if (data.kind === 'subscriber-card') {
      const sub = await prisma.subscription.findUnique({
        where: { id: data.subscriptionId },
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
      });
      if (!sub) throw new Error(`subscription ${data.subscriptionId} not found`);
      const fullName =
        [sub.user.firstName, sub.user.lastName].filter(Boolean).join(' ') ||
        sub.user.email ||
        'Abonné CPFA';
      const validUntil = sub.expiresAt
        ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(sub.expiresAt)
        : '—';
      const qrDataUrl = await qrToDataUrl(sub.qrPayload);
      const pdf = await renderSubscriberCard({
        fullName,
        cardNumber: sub.cardNumber,
        validUntil,
        qrDataUrl,
      });
      const key = `card/${sub.id}/${sub.cardNumber}.pdf`;
      await putObject({ key, body: pdf, contentType: 'application/pdf' });
      await prisma.subscription.update({ where: { id: sub.id }, data: { cardPdfKey: key } });
      return { key };
    }

    if (data.kind === 'invoice') {
      const invoice = await prisma.invoice.findUnique({
        where: { paymentId: data.paymentId },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          payment: { select: { purpose: true, amountXof: true } },
        },
      });
      if (!invoice) throw new Error(`invoice for payment ${data.paymentId} not found`);
      const customerName =
        [invoice.user.firstName, invoice.user.lastName].filter(Boolean).join(' ') ||
        invoice.user.email;
      const issuedAtLabel = new Intl.DateTimeFormat('fr-FR', {
        dateStyle: 'medium',
      }).format(invoice.issuedAt);
      const pdf = await renderInvoice({
        number: invoice.number,
        customerName,
        amountXof: invoice.amountXof,
        description: invoice.payment.purpose,
        issuedAt: issuedAtLabel,
      });
      const key = `invoice/${invoice.id}/${invoice.number}.pdf`;
      await putObject({ key, body: pdf, contentType: 'application/pdf' });
      await prisma.invoice.update({ where: { id: invoice.id }, data: { pdfKey: key } });

      // Chain to a receipt email — the email worker resolves the storageKey
      // to a fresh presigned URL at send-time so Resend can fetch the PDF.
      if (invoice.user.email) {
        await getQueue<EmailJob>('email').add(
          'receipt',
          {
            to: invoice.user.email,
            template: 'receipt',
            data: {
              customerName,
              invoiceNumber: invoice.number,
              amountXof: invoice.amountXof,
              description: invoice.payment.purpose,
              issuedAt: issuedAtLabel,
            },
            attachments: [
              {
                filename: `${invoice.number}.pdf`,
                storageKey: key,
                contentType: 'application/pdf',
              },
            ],
          },
          { jobId: `receipt:${invoice.id}` },
        );
      }
      return { key };
    }

    if (data.kind === 'convocation') {
      const reg = await prisma.registration.findUnique({
        where: { id: data.registrationId },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          course: { select: { title: true } },
          seminar: { select: { title: true, startsAt: true, location: true } },
          exam: { select: { title: true, examAt: true } },
          session: { select: { startsAt: true, location: true } },
        },
      });
      if (!reg) throw new Error(`registration ${data.registrationId} not found`);
      const candidateName =
        [reg.user.firstName, reg.user.lastName].filter(Boolean).join(' ') || reg.user.email;
      const target = reg.course?.title ?? reg.seminar?.title ?? reg.exam?.title ?? '—';
      const kind: 'course' | 'seminar' | 'exam' = reg.courseId
        ? 'course'
        : reg.seminarId
          ? 'seminar'
          : 'exam';
      const date = reg.session?.startsAt ?? reg.seminar?.startsAt ?? reg.exam?.examAt ?? null;
      const startsAt = date
        ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' }).format(date)
        : undefined;
      const location = reg.session?.location ?? reg.seminar?.location ?? undefined;
      const pdf = await renderConvocation({
        registrationId: reg.id,
        candidateName,
        target,
        kind,
        startsAt,
        location,
      });
      const key = `convocation/${reg.id}.pdf`;
      await putObject({ key, body: pdf, contentType: 'application/pdf' });
      return { key };
    }

    throw new Error(`unknown pdf job kind: ${(data as { kind: string }).kind}`);
  },
  { connection },
);

const paymentWebhookWorker = new Worker<PaymentWebhookJob>(
  'payment-webhook',
  async (job) => {
    const verified = job.data.payload as {
      ok?: boolean;
      reference?: string;
      providerRef?: string;
    } | null;
    if (!verified?.ok || !verified.reference) {
      // eslint-disable-next-line no-console
      console.warn('[worker:payment-webhook] dropped — missing reference', job.data.provider);
      return;
    }
    const result = await confirmPayment(verified.reference, { actorId: null });
    // eslint-disable-next-line no-console
    console.log(
      `[worker:payment-webhook] ${job.data.provider} payment=${verified.reference} → ${result.kind}`,
    );
  },
  { connection },
);

for (const w of [emailWorker, pdfWorker, paymentWebhookWorker]) {
  w.on('failed', (job, err) => {
    // eslint-disable-next-line no-console
    console.error(`[worker] ${w.name} failed (job ${job?.id}):`, err);
  });
}

// eslint-disable-next-line no-console
console.log('CPFA worker started — listening to queues: email, pdf, payment-webhook');
