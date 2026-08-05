import { Queue, type ConnectionOptions } from 'bullmq';
import IORedis from 'ioredis';

export type QueueName = 'email' | 'pdf' | 'payment-webhook';

let _connection: IORedis | undefined;

export function getRedis(): IORedis {
  if (_connection) return _connection;
  const url = process.env.REDIS_URL;
  if (!url) throw new Error('REDIS_URL is not set');
  _connection = new IORedis(url, { maxRetriesPerRequest: null });
  return _connection;
}

export function makeConnection(): ConnectionOptions {
  return getRedis();
}

const queues = new Map<QueueName, Queue>();

export function getQueue<T = unknown>(name: QueueName): Queue<T> {
  const existing = queues.get(name);
  if (existing) return existing as Queue<T>;
  const q = new Queue<T>(name, { connection: makeConnection() });
  queues.set(name, q);
  return q;
}

export type EmailJob = {
  to: string;
  // Magic-link is sent inline by Auth.js (Resend provider) — never enqueued here.
  template:
    | 'contact'
    | 'convocation'
    | 'trainer-approved'
    | 'trainer-rejected'
    | 'job-application-recruiter'
    | 'job-application-candidate'
    | 'job-posted'
    | 'receipt'
    | 'subscription-contract'
    | 'payment-instructions'
    | 'payment-declared';
  data: Record<string, unknown>;
  replyTo?: string;
  // Langue du destinataire, résolue à l'enfilement (la locale de la requête qui
  // a déclenché l'envoi). Absente ⇒ français, la locale par défaut du site.
  locale?: import('./i18n').Locale;
  // Worker resolves storageKey to a presigned URL at send-time so the URL
  // stays fresh (presigned ≤ 1h). Used by the receipt flow to attach the
  // generated invoice PDF.
  attachments?: Array<{
    filename: string;
    storageKey: string;
    contentType?: string;
  }>;
};

// `locale` suit la même règle que pour les e-mails : résolue à l'enfilement,
// elle décide de la langue du document produit et de l'e-mail qui l'accompagne.
export type PdfJob = { locale?: import('./i18n').Locale } & (
  | { kind: 'subscriber-card'; subscriptionId: string }
  | { kind: 'subscription-contract'; subscriptionId: string }
  | { kind: 'invoice'; paymentId: string }
  | { kind: 'convocation'; registrationId: string }
);

export type PaymentWebhookJob = {
  provider: 'wave' | 'orange-money';
  payload: unknown;
};
