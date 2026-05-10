// Server-side accessor for site settings. Use from RSC + route handlers.
//
// Reads the row matching (key, locale). If absent or malformed:
//   1. tries the FR fallback row (defaultLocale)
//   2. falls back to the registry default
// — so EN visitors see French content as long as the editor hasn't localised
// it yet, rather than blank slots.
//
// Also tolerates DB unreachable (e.g. during `next build` static prerender):
// returns the registry default and logs a warning.

import { prisma } from '@cpfa/db';
import { defaultLocale, resolveLocale, type Locale } from '@/i18n/request';
import {
  parseSettingValue,
  settingsRegistry,
  type SettingKey,
  type SettingValue,
} from './registry';

export async function getSetting<K extends SettingKey>(
  key: K,
  locale?: Locale,
): Promise<SettingValue<K>> {
  const targetLocale = locale ?? (await resolveLocale());
  try {
    const row = await prisma.siteSetting.findUnique({
      where: { key_locale: { key, locale: targetLocale } },
    });
    if (row) return parseSettingValue(key, row.value);

    // Fallback to the canonical FR row before the hardcoded default.
    if (targetLocale !== defaultLocale) {
      const fallback = await prisma.siteSetting.findUnique({
        where: { key_locale: { key, locale: defaultLocale } },
      });
      if (fallback) return parseSettingValue(key, fallback.value);
    }
    return settingsRegistry[key].default as SettingValue<K>;
  } catch (err) {
    console.warn(`[site-settings] DB lookup failed for ${key} — using default.`, err);
    return settingsRegistry[key].default as SettingValue<K>;
  }
}
