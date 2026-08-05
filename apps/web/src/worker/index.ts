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
import { defaultLocale, formatDate, formatDateTime } from '@cpfa/lib/i18n';
import {
  renderSubscriberCard,
  renderInvoice,
  renderConvocation,
  renderSubscriptionContract,
} from '@cpfa/pdf';
import { sendEmail, subjectFor, type EmailAttachment, type EmailTemplate } from '../lib/mailer';
import { confirmPayment } from '../lib/payments-confirm';
import { readSetting } from '../lib/site-settings/read';
import { localeForEmail, recipientLocale } from '../lib/recipient-locale';
import { getLibraryTiers } from '../lib/library-pricing';
import { buildSubscriptionContract, contractStorageKey } from '../lib/subscription-contract';

const connection = makeConnection();

const emailWorker = new Worker<EmailJob>(
  'email',
  async (job) => {
    const { to, template, data, replyTo, attachments } = job.data;
    const tmpl = { kind: template, data } as unknown as EmailTemplate;
    // La préférence enregistrée du destinataire fait foi. `job.data.locale` ne
    // sert que pour les adresses sans compte (recruteur ou candidat externe),
    // où elle porte la locale de la requête qui a enfilé le message.
    const locale = await localeForEmail(to, job.data.locale);
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
      subject: subjectFor(tmpl, locale),
      template: tmpl,
      locale,
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
        include: {
          user: { select: { firstName: true, lastName: true, email: true, locale: true } },
        },
      });
      if (!sub) throw new Error(`subscription ${data.subscriptionId} not found`);
      const locale = recipientLocale(sub.user);
      const fullName =
        [sub.user.firstName, sub.user.lastName].filter(Boolean).join(' ') ||
        sub.user.email ||
        'Abonné CPFA';
      const validUntil = sub.expiresAt ? formatDate(sub.expiresAt, locale, 'medium') : '—';
      const qrDataUrl = await qrToDataUrl(sub.qrPayload);
      const pdf = await renderSubscriberCard({
        fullName,
        cardNumber: sub.cardNumber,
        validUntil,
        qrDataUrl,
        locale,
      });
      const key = `card/${sub.id}/${sub.cardNumber}.pdf`;
      await putObject({ key, body: pdf, contentType: 'application/pdf' });
      await prisma.subscription.update({ where: { id: sub.id }, data: { cardPdfKey: key } });
      return { key };
    }

    // Contrat d'abonnement — rendu à l'activation, archivé tel quel (c'est la
    // version que l'abonné signe) puis envoyé en pièce jointe.
    if (data.kind === 'subscription-contract') {
      const sub = await prisma.subscription.findUnique({
        where: { id: data.subscriptionId },
        include: {
          user: { select: { firstName: true, lastName: true, email: true, locale: true } },
        },
      });
      if (!sub) throw new Error(`subscription ${data.subscriptionId} not found`);

      const locale = recipientLocale(sub.user);

      // Le CONTRAT lui-même reste en français, quelle que soit la langue de
      // l'abonné : c'est un document contractuel qui reproduit mot pour mot
      // l'original papier signé par la Direction, et un PDF moitié français
      // moitié anglais n'aurait aucune valeur. Pour l'ouvrir à l'anglais il
      // faut d'abord que le réglage `library.contract` existe en `en` (les
      // huit articles traduits et validés) — sans quoi le fallback FR du CMS
      // produirait des articles français sous un habillage anglais.
      // L'e-mail qui l'accompagne, lui, suit bien la langue de l'abonné.
      const mentions = await readSetting('library.contract', 'fr');
      const contract = buildSubscriptionContract({
        subscription: sub,
        user: sub.user,
        mentions,
        tiers: await getLibraryTiers('fr'),
      });
      const pdf = await renderSubscriptionContract(contract);
      const key = contractStorageKey(sub.id, sub.cardNumber);
      await putObject({ key, body: pdf, contentType: 'application/pdf' });

      if (sub.user.email) {
        await getQueue<EmailJob>('email').add(
          'subscription-contract',
          {
            to: sub.user.email,
            template: 'subscription-contract',
            data: {
              subscriberName: contract.subscriberName,
              cardNumber: sub.cardNumber,
              tierLabel: contract.tierLabel,
              expiresAt: contract.expiresAt,
            },
            locale,
            attachments: [
              {
                filename: `contrat-abonnement-${sub.cardNumber}.pdf`,
                storageKey: key,
                contentType: 'application/pdf',
              },
            ],
          },
          { jobId: `subscription-contract:${sub.id}` },
        );
      }
      return { key };
    }

    if (data.kind === 'invoice') {
      const invoice = await prisma.invoice.findUnique({
        where: { paymentId: data.paymentId },
        include: {
          user: { select: { firstName: true, lastName: true, email: true, locale: true } },
          payment: { select: { purpose: true, amountXof: true } },
        },
      });
      if (!invoice) throw new Error(`invoice for payment ${data.paymentId} not found`);
      const customerName =
        [invoice.user.firstName, invoice.user.lastName].filter(Boolean).join(' ') ||
        invoice.user.email;
      const locale = recipientLocale(invoice.user);
      const issuedAtLabel = formatDate(invoice.issuedAt, locale, 'medium');
      const pdf = await renderInvoice({
        number: invoice.number,
        customerName,
        amountXof: invoice.amountXof,
        description: invoice.payment.purpose,
        issuedAt: issuedAtLabel,
        locale,
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
            locale,
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
          user: { select: { firstName: true, lastName: true, email: true, locale: true } },
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
      const locale = recipientLocale(reg.user);
      const startsAt = date ? formatDateTime(date, locale) : undefined;
      const location = reg.session?.location ?? reg.seminar?.location ?? undefined;
      const pdf = await renderConvocation({
        registrationId: reg.id,
        candidateName,
        target,
        kind,
        startsAt,
        location,
        locale,
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
