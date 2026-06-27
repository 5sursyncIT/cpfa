// Local filesystem storage. All uploaded and generated files live under
// STORAGE_DIR on the local disk (no S3 / object store). The public API keeps
// the same shape as the previous S3 implementation so callers don't change:
//
//   - presignUpload(): returns a short-lived signed URL to POST/PUT bytes to
//     `/api/upload` (the storage key is carried inside the signed token).
//   - presignDownload(): returns a short-lived signed URL to GET bytes from
//     `/api/files` (the key is carried in the path, authorised by the token).
//   - putObject(): server-side write (used by the worker for generated PDFs).
//   - readObject(): server-side read (used by the worker for email attachments).
//   - objectExists(): existence check (used by confirm-upload mutations).
//
// Storage keys are unchanged (`<kind>/<scopeId>/<stamp>-<rand>-<name>`), so no
// data migration is required when moving an existing deployment to local disk.

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

export function storageRoot(): string {
  return process.env.STORAGE_DIR
    ? path.resolve(process.env.STORAGE_DIR)
    : path.resolve(process.cwd(), 'storage');
}

// Resolve a storage key to an absolute path, refusing anything that would
// escape the storage root (path traversal defence).
export function objectPath(key: string): string {
  const root = storageRoot();
  const full = path.resolve(root, key);
  if (full !== root && !full.startsWith(root + path.sep)) {
    throw new Error(`Invalid storage key: ${key}`);
  }
  return full;
}

function storageSecret(): string {
  const s = process.env.STORAGE_SECRET ?? process.env.AUTH_SECRET;
  if (!s) {
    throw new Error('STORAGE_SECRET (or AUTH_SECRET) must be set to sign storage URLs.');
  }
  return s;
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

// ── Signed token helpers ────────────────────────────────────────────────────
// A token is `<base64url(payload)>.<base64url(hmac)>` where payload is a JSON
// object. Used both for uploads (binds key + mime + max size) and downloads
// (binds key). Verification is constant-time and checks expiry.

function sign(payload: Record<string, unknown>): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const mac = createHmac('sha256', storageSecret()).update(body).digest('base64url');
  return `${body}.${mac}`;
}

function verify(token: string): Record<string, unknown> | null {
  const dot = token.lastIndexOf('.');
  if (dot < 0) return null;
  const body = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  const expected = createHmac('sha256', storageSecret()).update(body).digest('base64url');
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (typeof payload.exp === 'number' && payload.exp < Date.now() / 1000) return null;
  return payload;
}

// Verify an upload token and return the approved key + constraints, or null.
export function verifyUploadToken(
  token: string,
): { key: string; mimeType: string; maxBytes: number } | null {
  const p = verify(token);
  if (!p || p.t !== 'up' || typeof p.key !== 'string' || typeof p.mime !== 'string') return null;
  return { key: p.key, mimeType: p.mime, maxBytes: typeof p.max === 'number' ? p.max : MAX_BYTES };
}

// Verify a download token for a given key.
export function verifyDownloadToken(token: string, key: string): boolean {
  const p = verify(token);
  return !!p && p.t === 'dl' && p.key === key;
}

// ── Public API (S3-compatible signatures) ───────────────────────────────────

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
  const token = sign({
    t: 'up',
    key,
    mime: mimeType,
    max: sizeBytes,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  });
  // Method stays PUT so existing client upload code is unchanged; the route
  // accepts both PUT and POST.
  return {
    url: `/api/upload?token=${encodeURIComponent(token)}`,
    method: 'PUT',
    headers: { 'Content-Type': mimeType },
  };
}

export async function presignDownload(
  key: string,
  expiresInSeconds = 300,
): Promise<string> {
  const token = sign({
    t: 'dl',
    key,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  });
  const encoded = key
    .split('/')
    .map((s) => encodeURIComponent(s))
    .join('/');
  return `/api/files/${encoded}?token=${encodeURIComponent(token)}`;
}

export async function objectExists(key: string): Promise<boolean> {
  try {
    await stat(objectPath(key));
    return true;
  } catch {
    return false;
  }
}

// Server-side direct write. Used by the worker for generated PDFs (cards,
// invoices, convocations) and by the upload route for browser uploads.
export async function putObject({
  key,
  body,
}: {
  key: string;
  body: Buffer | Uint8Array;
  contentType?: string;
}): Promise<{ key: string }> {
  const full = objectPath(key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, body);
  return { key };
}

// Server-side direct read. Used by the worker to attach generated PDFs to
// emails as base64 content.
export async function readObject(key: string): Promise<Buffer> {
  return readFile(objectPath(key));
}

// Best-effort content type from a key's extension, for streaming responses.
export function contentTypeForKey(key: string): string {
  const ext = path.extname(key).toLowerCase();
  switch (ext) {
    case '.pdf':
      return 'application/pdf';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.webp':
      return 'image/webp';
    case '.gif':
      return 'image/gif';
    case '.svg':
      return 'image/svg+xml';
    case '.doc':
      return 'application/msword';
    case '.docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    default:
      return 'application/octet-stream';
  }
}
