// Signed ticket that lets a visitor through the maintenance gate.
//
// Self-contained (HMAC-SHA256 over a tiny JSON payload) so verifying it costs
// no DB round-trip, and built on Web Crypto only — no native module, so the
// same helper works from a server component, a server action or the edge.
// Revoking every outstanding ticket at once = rotate MAINTENANCE_SECRET.

export const MAINTENANCE_COOKIE = 'cpfa_maintenance_access';
export const MAINTENANCE_TICKET_TTL_SECONDS = 60 * 60 * 12; // 12 h

export type BypassTicket = {
  /** Who unlocked: the staff account e-mail, or `preview` for the shared password. */
  sub: string;
  /** Expiry, unix seconds. */
  exp: number;
};

const encoder = new TextEncoder();

function bypassSecret(): string {
  const secret = process.env.MAINTENANCE_SECRET || process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      'MAINTENANCE_SECRET (ou AUTH_SECRET) doit être défini pour signer les accès maintenance.',
    );
  }
  return secret;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function sign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(bypassSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return toBase64Url(new Uint8Array(signature));
}

// Length-independent compare so a wrong signature can't be narrowed down by
// timing. Both operands are base64url of a fixed-size digest in practice.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function issueBypassTicket(
  sub: string,
  ttlSeconds: number = MAINTENANCE_TICKET_TTL_SECONDS,
): Promise<string> {
  const ticket: BypassTicket = { sub, exp: Math.floor(Date.now() / 1000) + ttlSeconds };
  const payload = toBase64Url(encoder.encode(JSON.stringify(ticket)));
  return `${payload}.${await sign(payload)}`;
}

// Never throws: a malformed/expired/forged cookie is simply "no ticket", so a
// missing secret degrades to "everyone sees the maintenance page" rather than
// crashing every public request.
export async function readBypassTicket(
  token: string | undefined | null,
): Promise<BypassTicket | null> {
  if (!token) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;
  try {
    if (!timingSafeEqual(signature, await sign(payload))) return null;
    const parsed = JSON.parse(new TextDecoder().decode(fromBase64Url(payload))) as BypassTicket;
    if (typeof parsed?.exp !== 'number' || parsed.exp * 1000 <= Date.now()) return null;
    if (typeof parsed.sub !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}
