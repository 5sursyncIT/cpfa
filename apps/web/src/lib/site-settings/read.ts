// Lecture d'un réglage pour une locale explicite — sans `next/headers`, donc
// utilisable hors requête HTTP (worker BullMQ, scripts). `./get` s'appuie
// dessus après avoir résolu la locale du visiteur.
//
// Même résolution : ligne (key, locale) → ligne FR → défaut du registre. Une
// base injoignable dégrade vers le défaut plutôt que de faire échouer le job.

import { prisma } from '@cpfa/db';
import { defaultLocale, type Locale } from '@/i18n/locales';
import { settingDefault } from './defaults';
import { parseSettingValue, type SettingKey, type SettingValue } from './registry';

export async function readSetting<K extends SettingKey>(
  key: K,
  locale: Locale = defaultLocale,
): Promise<SettingValue<K>> {
  // Le défaut est résolu d'emblée : il sert à la fois de dernier maillon et de
  // repli quand une ligne existe mais est malformée — dans les deux cas c'est
  // la langue du visiteur qui doit décider, pas le français.
  const fallbackValue = settingDefault(key, locale);
  try {
    const row = await prisma.siteSetting.findUnique({
      where: { key_locale: { key, locale } },
    });
    if (row) return parseSettingValue(key, row.value, fallbackValue);

    if (locale !== defaultLocale) {
      const fallback = await prisma.siteSetting.findUnique({
        where: { key_locale: { key, locale: defaultLocale } },
      });
      if (fallback) return parseSettingValue(key, fallback.value, fallbackValue);
    }
    return fallbackValue;
  } catch (err) {
    console.warn(`[site-settings] DB lookup failed for ${key} — using default.`, err);
    return fallbackValue;
  }
}
