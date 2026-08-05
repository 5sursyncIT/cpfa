// Locale-aware formatting, shared by every surface that renders a date, an
// amount or a duration to a human: the Next.js app, the React Email templates
// and the @react-pdf documents.
//
// It lives here rather than in `apps/web/src/lib` because emails and PDFs are
// rendered from the BullMQ worker, outside any HTTP request — they can't reach
// `next-intl`'s message catalogue, but they still have to speak the recipient's
// language. Everything below is a pure function of `(value, locale)`.
//
// Deliberately dependency-free: no bullmq, no ioredis, no zod. `@cpfa/emails`
// and `@cpfa/pdf` import it through the `@cpfa/lib/i18n` subpath so they never
// pull the Redis/S3 side of this package into their bundle.

export const locales = ['fr', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'fr';

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value);
}

// BCP-47 tags handed to Intl. EN maps to en-GB, not en-US: the audience is the
// CIMA zone and IIA Yaoundé's international partners, where the day-first date
// order ("5 August 2026") matches the French habit the site is built around.
const INTL_LOCALE: Record<Locale, string> = { fr: 'fr-FR', en: 'en-GB' };

export function intlLocale(locale: Locale = defaultLocale): string {
  return INTL_LOCALE[locale] ?? INTL_LOCALE[defaultLocale];
}

// ── Dates ───────────────────────────────────────────────────────────────

export type DateStyle = 'long' | 'medium' | 'short';

/** 2026-08-05 → « 5 août 2026 » (fr) / "5 August 2026" (en). */
export function formatDate(
  date: Date,
  locale: Locale = defaultLocale,
  dateStyle: DateStyle = 'long',
): string {
  return new Intl.DateTimeFormat(intlLocale(locale), { dateStyle }).format(date);
}

/** Adds the time: « 5 août 2026 à 14:30 » / "5 August 2026 at 14:30". */
export function formatDateTime(
  date: Date,
  locale: Locale = defaultLocale,
  dateStyle: DateStyle = 'long',
): string {
  return new Intl.DateTimeFormat(intlLocale(locale), { dateStyle, timeStyle: 'short' }).format(
    date,
  );
}

/** Month abbreviations for the compact date chips (« 05 / Août 26 »). */
export function monthsShort(locale: Locale = defaultLocale): string[] {
  const fmt = new Intl.DateTimeFormat(intlLocale(locale), { month: 'short' });
  return Array.from({ length: 12 }, (_, m) => fmt.format(new Date(Date.UTC(2024, m, 15))));
}

// ── Numbers & money ─────────────────────────────────────────────────────

export function formatNumber(value: number, locale: Locale = defaultLocale): string {
  return new Intl.NumberFormat(intlLocale(locale)).format(value);
}

const FREE_LABEL: Record<Locale, string> = { fr: 'Gratuit', en: 'Free' };

/**
 * Amounts are always in FCFA (XOF) — the currency never varies, only its
 * grouping. A zero amount reads as « Gratuit » / "Free" rather than "0 FCFA",
 * which is what every catalogue card and enrolment panel wants.
 */
export function formatXof(amount: number, locale: Locale = defaultLocale): string {
  if (amount === 0) return FREE_LABEL[locale] ?? FREE_LABEL[defaultLocale];
  return `${formatNumber(amount, locale)} FCFA`;
}

/** Same grouping, but never substitutes a word for zero — for invoices and receipts. */
export function formatXofExact(amount: number, locale: Locale = defaultLocale): string {
  return `${formatNumber(amount, locale)} FCFA`;
}

// ── Durations ───────────────────────────────────────────────────────────

const DURATION_UNITS: Record<Locale, { months: string; weeks: string; hours: string }> = {
  fr: { months: 'mois', weeks: 'sem', hours: 'h' },
  en: { months: 'months', weeks: 'wks', hours: 'h' },
};

/**
 * Course length, collapsed to the coarsest unit that stays readable on a card:
 * 200 h+ reads in months, 40 h+ in weeks, anything shorter in hours.
 */
export function formatDurationHours(hours: number, locale: Locale = defaultLocale): string {
  const units = DURATION_UNITS[locale] ?? DURATION_UNITS[defaultLocale];
  if (hours >= 200) return `${Math.round(hours / 100)} ${units.months}`;
  if (hours >= 40) return `${Math.round(hours / 35)} ${units.weeks}`;
  return `${hours} ${units.hours}`;
}

/** Whole-day span between two instants, e.g. a seminar running Mon→Wed. */
export function daysBetween(start: Date, end: Date): number {
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)));
}
