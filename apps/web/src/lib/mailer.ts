// Single mailer module — every outbound email goes through this. The worker
// calls `sendEmail` with a job payload; routes that need to send synchronously
// can call directly. When RESEND_API_KEY isn't set we log to stdout so dev
// without Resend credentials still reaches green-path code.

import { Resend } from 'resend';
import {
  ContactFormEmail,
  ConvocationEmail,
  LoanReminderEmail,
  MagicLinkEmail,
  TrainerApprovedEmail,
  TrainerRejectedEmail,
  JobApplicationRecruiterEmail,
  JobApplicationCandidateEmail,
  JobPostedEmail,
  ReceiptEmail,
  render,
} from '@cpfa/emails';

let _client: Resend | null | undefined;

function getResend(): Resend | null {
  if (_client !== undefined) return _client;
  const key = process.env.RESEND_API_KEY;
  _client = key ? new Resend(key) : null;
  return _client;
}

export type EmailTemplate =
  | { kind: 'magic-link'; data: { url: string; expiresInMinutes?: number } }
  | { kind: 'loan-reminder'; data: import('@cpfa/emails').LoanReminderEmailProps }
  | { kind: 'contact'; data: import('@cpfa/emails').ContactFormEmailProps }
  | { kind: 'convocation'; data: import('@cpfa/emails').ConvocationEmailProps }
  | { kind: 'trainer-approved'; data: import('@cpfa/emails').TrainerApprovedEmailProps }
  | { kind: 'trainer-rejected'; data: import('@cpfa/emails').TrainerRejectedEmailProps }
  | {
      kind: 'job-application-recruiter';
      data: import('@cpfa/emails').JobApplicationRecruiterEmailProps;
    }
  | {
      kind: 'job-application-candidate';
      data: import('@cpfa/emails').JobApplicationCandidateEmailProps;
    }
  | { kind: 'job-posted'; data: import('@cpfa/emails').JobPostedEmailProps }
  | { kind: 'receipt'; data: import('@cpfa/emails').ReceiptEmailProps };

// Optional attachments. Use either `path` (server-side fetched URL — practical
// for our presigned S3 download URLs) or `content` (raw base64). Resend
// downloads `path` server-side so the URL must remain reachable for ~30 s.
export type EmailAttachment = {
  filename: string;
  path?: string;
  content?: string; // base64 encoded
  contentType?: string;
};

export async function sendEmail({
  to,
  subject,
  template,
  replyTo,
  attachments,
}: {
  to: string;
  subject: string;
  template: EmailTemplate;
  replyTo?: string;
  attachments?: EmailAttachment[];
}): Promise<{ id: string | null; mocked: boolean }> {
  const html = await render(componentFor(template));
  const from = process.env.EMAIL_FROM ?? 'CPFA <noreply@cpfa.local>';
  const client = getResend();

  if (!client) {
    // eslint-disable-next-line no-console
    console.log(
      `[mailer:mock] to=${to} subject=${JSON.stringify(subject)} kind=${template.kind}` +
        (attachments?.length ? ` attachments=${attachments.length}` : ''),
    );
    return { id: null, mocked: true };
  }

  const result = await client.emails.send({
    from,
    to,
    subject,
    html,
    replyTo,
    ...(attachments && attachments.length > 0
      ? {
          attachments: attachments.map((a) => ({
            filename: a.filename,
            ...(a.content !== undefined ? { content: a.content } : {}),
            ...(a.path !== undefined ? { path: a.path } : {}),
            ...(a.contentType !== undefined ? { content_type: a.contentType } : {}),
          })),
        }
      : {}),
  });

  if (result.error) {
    throw new Error(`Resend error: ${result.error.message}`);
  }
  return { id: result.data?.id ?? null, mocked: false };
}

function componentFor(template: EmailTemplate) {
  switch (template.kind) {
    case 'magic-link':
      return MagicLinkEmail(template.data);
    case 'loan-reminder':
      return LoanReminderEmail(template.data);
    case 'contact':
      return ContactFormEmail(template.data);
    case 'convocation':
      return ConvocationEmail(template.data);
    case 'trainer-approved':
      return TrainerApprovedEmail(template.data);
    case 'trainer-rejected':
      return TrainerRejectedEmail(template.data);
    case 'job-application-recruiter':
      return JobApplicationRecruiterEmail(template.data);
    case 'job-application-candidate':
      return JobApplicationCandidateEmail(template.data);
    case 'job-posted':
      return JobPostedEmail(template.data);
    case 'receipt':
      return ReceiptEmail(template.data);
  }
}

export function subjectFor(template: EmailTemplate): string {
  switch (template.kind) {
    case 'magic-link':
      return 'Votre lien de connexion CPFA';
    case 'loan-reminder':
      return template.data.daysOverdue && template.data.daysOverdue > 0
        ? 'Retour en retard — Bibliothèque CPFA'
        : "Rappel d'échéance — Bibliothèque CPFA";
    case 'contact':
      return `[Contact CPFA] ${template.data.subject}`;
    case 'convocation':
      return `Convocation — ${template.data.target}`;
    case 'trainer-approved':
      return 'Votre candidature formateur est acceptée — CPFA';
    case 'trainer-rejected':
      return 'Suite donnée à votre candidature formateur — CPFA';
    case 'job-application-recruiter':
      return `Nouvelle candidature — ${template.data.jobTitle}`;
    case 'job-application-candidate':
      return `Candidature transmise — ${template.data.jobTitle}`;
    case 'job-posted':
      return `Votre offre est en ligne — ${template.data.jobTitle}`;
    case 'receipt':
      return `Reçu N° ${template.data.invoiceNumber} — CPFA`;
  }
}
