// Maintenance gate — server side.
//
// The switch lives in the `site.maintenance` SiteSetting row (locale `fr`,
// always: it is a global operational flag, not localised copy) and is enforced
// by the public layout, which is the single entry point every visitor-facing
// route goes through. Two ways past a closed gate:
//   1. a staff session (Auth.js JWT already decoded for the request), or
//   2. a signed bypass cookie issued by /maintenance after a successful login
//      — either a staff account (e-mail + mot de passe) or the shared preview
//      password set by an admin.
//
// Everything here is deliberately Node-only (Prisma + Auth.js): the gate sits
// in the layout rather than in middleware so it can read the DB toggle directly
// instead of round-tripping to an internal API from the edge runtime.

import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Role } from '@cpfa/db';
import { auth } from '@/lib/auth';
import { getSetting } from '@/lib/site-settings/get';
import type { SettingValue } from '@/lib/site-settings/registry';
import { MAINTENANCE_COOKIE, readBypassTicket } from './bypass-token';

export type MaintenanceSettings = SettingValue<'site.maintenance'>;

// Roles that keep browsing while the gate is closed. Deliberately narrower
// than "any signed-in user": a candidat or an abonné has no reason to see a
// half-deployed site, and their own /me space stays reachable regardless.
const STAFF_ROLES: readonly Role[] = [
  'EDITEUR',
  'BIBLIOTHECAIRE',
  'COMPTABLE',
  'ADMIN',
  'SUPER_ADMIN',
];

export function isMaintenanceStaff(roles: readonly Role[] | undefined | null): boolean {
  return Boolean(roles?.some((role) => STAFF_ROLES.includes(role)));
}

// `cache` dedupes within a single request — the layout, the banner and the
// /maintenance page all read the same value without extra queries.
export const getMaintenanceSettings = cache(async (): Promise<MaintenanceSettings> => {
  return getSetting('site.maintenance', 'fr');
});

export const hasMaintenanceBypass = cache(async (): Promise<boolean> => {
  const cookieStore = await cookies();
  const ticket = await readBypassTicket(cookieStore.get(MAINTENANCE_COOKIE)?.value);
  if (ticket) return true;

  const session = await auth();
  return isMaintenanceStaff(session?.user?.roles);
});

/**
 * Redirects to the maintenance splash unless the gate is open or the visitor
 * holds a bypass. Called from the public layout; no-op when maintenance is off.
 */
export async function enforceMaintenance(): Promise<void> {
  const settings = await getMaintenanceSettings();
  if (!settings.enabled) return;
  if (await hasMaintenanceBypass()) return;
  redirect('/maintenance');
}
