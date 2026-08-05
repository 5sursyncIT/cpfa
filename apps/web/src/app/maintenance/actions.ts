'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import argon2 from 'argon2';
import { prisma } from '@cpfa/db';
import {
  MAINTENANCE_COOKIE,
  MAINTENANCE_TICKET_TTL_SECONDS,
  issueBypassTicket,
} from '@/lib/maintenance/bypass-token';
import {
  getMaintenanceSettings,
  isMaintenanceStaff,
  type MaintenanceSettings,
} from '@/lib/maintenance/guard';

// Brute-force damper. In-memory on purpose: the gate protects an unreleased
// site, not user data, and a Redis round-trip per attempt isn't worth it. The
// counter resets on restart and is per-instance — it slows a script down, it
// doesn't claim to be a distributed rate limiter.
const ATTEMPT_WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const attempts = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt <= Date.now()) return false;
  return entry.count >= MAX_ATTEMPTS;
}

function recordFailure(ip: string): void {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt <= now) {
    attempts.set(ip, { count: 1, resetAt: now + ATTEMPT_WINDOW_MS });
    return;
  }
  entry.count += 1;
}

async function clientIp(): Promise<string> {
  const headerList = await headers();
  return (
    headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headerList.get('x-real-ip')?.trim() ||
    'unknown'
  );
}

// Staff account: e-mail + mot de passe du site. The password is verified before
// the role is looked at so a wrong password and an unauthorised account are
// indistinguishable from the outside.
async function verifyStaffAccount(email: string, password: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { email: true, passwordHash: true, roles: true },
  });
  if (!user?.passwordHash) return null;
  if (!(await argon2.verify(user.passwordHash, password))) return null;
  if (!isMaintenanceStaff(user.roles)) return null;
  return user.email;
}

// Shared preview password, set from /admin/maintenance. Empty hash = path off.
async function verifyPreviewPassword(
  settings: MaintenanceSettings,
  password: string,
): Promise<string | null> {
  if (!settings.previewPasswordHash) return null;
  try {
    if (!(await argon2.verify(settings.previewPasswordHash, password))) return null;
  } catch {
    return null;
  }
  return 'preview';
}

/**
 * Handles the unlock form on /maintenance. On success, drops a signed bypass
 * cookie valid 12 h and sends the visitor to the site.
 */
export async function unlockMaintenanceAction(formData: FormData): Promise<void> {
  const settings = await getMaintenanceSettings();
  if (!settings.enabled) redirect('/');

  const ip = await clientIp();
  if (isRateLimited(ip)) redirect('/maintenance?error=rate');

  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();
  const password = String(formData.get('password') ?? '');
  if (!password) redirect('/maintenance?error=invalid');

  const subject = email
    ? await verifyStaffAccount(email, password)
    : await verifyPreviewPassword(settings, password);

  if (!subject) {
    recordFailure(ip);
    redirect('/maintenance?error=invalid');
  }

  attempts.delete(ip);
  const cookieStore = await cookies();
  cookieStore.set(MAINTENANCE_COOKIE, await issueBypassTicket(subject), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: MAINTENANCE_TICKET_TTL_SECONDS,
  });
  redirect('/');
}

/** Drops the bypass cookie — "quitter l'aperçu" on the preview banner. */
export async function lockMaintenanceAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(MAINTENANCE_COOKIE);
  redirect('/maintenance');
}
