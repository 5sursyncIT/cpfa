// S3-compatible storage (OVH / Backblaze B2 / MinIO local).
// All uploads go through presigned PUT URLs so the web tier never streams files.
// Reads happen via short-lived presigned GET URLs created when a route hands a
// downloadable resource to the user.

import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomBytes } from 'node:crypto';

let _client: S3Client | undefined;

function getClient(): S3Client {
  if (_client) return _client;
  const endpoint = process.env.S3_ENDPOINT;
  const region = process.env.S3_REGION ?? 'us-east-1';
  const accessKeyId = process.env.S3_ACCESS_KEY;
  const secretAccessKey = process.env.S3_SECRET_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'Storage not configured — set S3_ENDPOINT / S3_ACCESS_KEY / S3_SECRET_KEY (.env). MinIO is wired in docker-compose for local dev.',
    );
  }

  _client = new S3Client({
    endpoint,
    region,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
  });
  return _client;
}

function bucket(): string {
  const b = process.env.S3_BUCKET;
  if (!b) throw new Error('S3_BUCKET is not set');
  return b;
}

export type UploadKind =
  | 'attachment' // registration attachments (CV, ID, diploma copies)
  | 'paper' // exam paper bank
  | 'cover' // book/article cover images
  | 'brochure' // course/seminar brochures
  | 'media' // generic CMS media
  | 'trainer-cv' // trainer candidacy CV
  | 'trainer-resource' // pedagogical resource shared with approved trainers
  | 'job-cv' // candidate CV submitted to a JobApplication
  | 'job-sheet'; // recruiter-uploaded job description PDF

const MAX_BYTES = 25 * 1024 * 1024; // 25MB
const ALLOWED_MIME = new Set<string>([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

export function buildKey(kind: UploadKind, scopeId: string, originalName: string): string {
  const safe = originalName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
  const stamp = Date.now().toString(36);
  const rand = randomBytes(4).toString('hex');
  return `${kind}/${scopeId}/${stamp}-${rand}-${safe}`;
}

export async function presignUpload({
  key,
  mimeType,
  sizeBytes,
  expiresInSeconds = 600,
}: {
  key: string;
  mimeType: string;
  sizeBytes: number;
  expiresInSeconds?: number;
}): Promise<{ url: string; method: 'PUT'; headers: Record<string, string> }> {
  if (!ALLOWED_MIME.has(mimeType)) {
    throw new Error(`MIME type non autorisé : ${mimeType}`);
  }
  if (sizeBytes > MAX_BYTES) {
    throw new Error(`Fichier trop volumineux (max ${MAX_BYTES / 1024 / 1024} Mo).`);
  }
  const command = new PutObjectCommand({
    Bucket: bucket(),
    Key: key,
    ContentType: mimeType,
    ContentLength: sizeBytes,
  });
  const url = await getSignedUrl(getClient(), command, { expiresIn: expiresInSeconds });
  return { url, method: 'PUT', headers: { 'Content-Type': mimeType } };
}

export async function presignDownload(
  key: string,
  expiresInSeconds = 300,
): Promise<string> {
  const command = new GetObjectCommand({ Bucket: bucket(), Key: key });
  return getSignedUrl(getClient(), command, { expiresIn: expiresInSeconds });
}

export async function objectExists(key: string): Promise<boolean> {
  try {
    await getClient().send(new HeadObjectCommand({ Bucket: bucket(), Key: key }));
    return true;
  } catch {
    return false;
  }
}

// Server-side direct upload. Used by the worker for generated PDFs (cards,
// invoices, convocations) where the bytes never leave the cluster, so a
// presigned PUT roundtrip would be wasteful.
export async function putObject({
  key,
  body,
  contentType,
}: {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
}): Promise<{ key: string }> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
  return { key };
}
