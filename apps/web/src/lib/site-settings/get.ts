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
//
// La lecture elle-même vit dans ./read, sans `next/headers`, pour que le
// worker puisse s'en servir ; ici on ne fait qu'y ajouter la locale du
// visiteur.

import { resolveLocale, type Locale } from '@/i18n/request';
import { readSetting } from './read';
import type { SettingKey, SettingValue } from './registry';

export async function getSetting<K extends SettingKey>(
  key: K,
  locale?: Locale,
): Promise<SettingValue<K>> {
  const targetLocale = locale ?? (await resolveLocale());
  return readSetting(key, targetLocale);
}
