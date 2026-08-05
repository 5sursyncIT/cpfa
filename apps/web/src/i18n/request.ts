import { cookies, headers } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';

// Active locales. FR is canonical (default + fallback for missing translations
// in the DB). EN is fully wired but its body copy depends on editors creating
// `locale: 'en'` rows in Page / Article / SiteSetting. The shell (nav, footer,
// CTAs) ships translated via the JSON message files.
//
// Les constantes vivent dans ./locales (sans `next/headers`) pour rester
// importables depuis le worker ; on les ré-exporte ici, où tout le code les
// cherche déjà.
export {
  locales,
  defaultLocale,
  LOCALE_COOKIE,
  isLocale,
  intlLocale,
  type Locale,
} from './locales';

import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from './locales';

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
