'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import argon2 from 'argon2';
import { Prisma, prisma } from '@cpfa/db';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/rbac';
import { getMaintenanceSettings } from '@/lib/maintenance/guard';
import { settingsRegistry } from '@/lib/site-settings/registry';

const SETTING_KEY = 'site.maintenance';
// Global flag: always stored on the FR row so there is exactly one switch,
// whatever language the visitor browses in.
const SETTING_LOCALE = 'fr';
const MIN_PREVIEW_PASSWORD_LENGTH = 8;

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect('/sign-in?callbackUrl=/admin/maintenance');
  if (!hasPermission(session.user.roles, 'admin:any')) redirect('/admin');
  return session.user;
}

/**
 * Saves the whole maintenance screen in one go: on/off switch, splash copy and
 * the optional shared preview password (hashed here, never stored in clear).
 */
export async function saveMaintenanceAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  const current = await getMaintenanceSettings();

  const previewPassword = String(formData.get('previewPassword') ?? '').trim();
  const clearPreview = formData.get('clearPreviewPassword') === 'on';

  if (previewPassword && previewPassword.length < MIN_PREVIEW_PASSWORD_LENGTH) {
    redirect('/admin/maintenance?error=password');
  }

  // Blank field = leave the existing password untouched; the form never echoes
  // it back, so an admin editing the message can't accidentally wipe it.
  let previewPasswordHash = current.previewPasswordHash;
  if (clearPreview) previewPasswordHash = '';
  else if (previewPassword)
    previewPasswordHash = await argon2.hash(previewPassword, {
      type: argon2.argon2id,
    });

  const parsed = settingsRegistry[SETTING_KEY].schema.safeParse({
    enabled: formData.get('enabled') === 'on',
    title: String(formData.get('title') ?? '').trim(),
    message: String(formData.get('message') ?? '').trim(),
    reopensAt: String(formData.get('reopensAt') ?? '').trim(),
    contactEmail: String(formData.get('contactEmail') ?? '').trim(),
    previewPasswordHash,
  });
  if (!parsed.success) redirect('/admin/maintenance?error=invalid');

  const value = parsed.data as Prisma.InputJsonValue;
  await prisma.siteSetting.upsert({
    where: { key_locale: { key: SETTING_KEY, locale: SETTING_LOCALE } },
    create: { key: SETTING_KEY, locale: SETTING_LOCALE, value, updatedById: user.id },
    update: { value, updatedById: user.id },
  });

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: parsed.data.enabled ? 'maintenance.enable' : 'maintenance.disable',
      entity: 'SiteSetting',
      entityId: SETTING_KEY,
      // The hash stays out of the audit trail — only whether one is set.
      diff: {
        enabled: parsed.data.enabled,
        previewPasswordSet: Boolean(parsed.data.previewPasswordHash),
      },
    },
  });

  // The gate is read by the public layout on every request; drop the cached
  // render tree so the change takes effect immediately.
  revalidatePath('/', 'layout');
  redirect('/admin/maintenance?saved=1');
}
