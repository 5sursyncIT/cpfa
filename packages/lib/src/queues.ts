import { Queue, type ConnectionOptions } from 'bullmq';
import IORedis from 'ioredis';

export type QueueName = 'email' | 'pdf' | 'loan-reminders' | 'payment-webhook';

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
    | 'loan-reminder'
    | 'contact'
    | 'convocation'
    | 'trainer-approved'
    | 'trainer-rejected'
    | 'job-application-recruiter'
    | 'job-application-candidate'
    | 'job-posted'
    | 'receipt';
  data: Record<string, unknown>;
  replyTo?: string;
  // Worker resolves storageKey to a presigned URL at send-time so the URL
  // stays fresh (presigned ≤ 1h). Used by the receipt flow to attach the
  // generated invoice PDF.
  attachments?: Array<{
    filename: string;
    storageKey: string;
    contentType?: string;
  }>;
};

export type PdfJob =
  | { kind: 'subscriber-card'; subscriptionId: string }
  | { kind: 'invoice'; paymentId: string }
  | { kind: 'convocation'; registrationId: string };

export type LoanReminderJob = { loanId: string };

export type PaymentWebhookJob = {
  provider: 'wave' | 'orange-money';
  payload: unknown;
};
