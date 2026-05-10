import { cookies, headers } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';

// Active locales. FR is canonical (default + fallback for missing translations
// in the DB). EN is fully wired but its body copy depends on editors creating
// `locale: 'en'` rows in Page / Article / SiteSetting. The shell (nav, footer,
// CTAs) ships translated via the JSON message files.
export const locales = ['fr', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'fr';

export const LOCALE_COOKIE = 'NEXT_LOCALE';

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value);
}

// Server-side resolver. Honoured precedence:
//   1. NEXT_LOCALE cookie (set by the switcher in the top nav)
//   2. Accept-Language header negotiation (heuristic, EN only when no FR)
//   3. defaultLocale (FR)
export async function resolveLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value;
  if (fromCookie && isLocale(fromCookie)) return fromCookie;

  const headerList = await headers();
  const accept = headerList.get('accept-language') ?? '';
  if (/\ben\b/i.test(accept) && !/\bfr\b/i.test(accept)) return 'en';

  return defaultLocale;
}

export default getRequestConfig(async () => {
  const locale = await resolveLocale();
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
