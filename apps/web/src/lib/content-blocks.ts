// Server-side accessors for the editable content entities (key figures,
// partners, governance, homepage testimonials). Public pages call these.
//
// Resolution mirrors getSetting():
//   1. rows for the requested locale
//   2. else FR rows
//   3. else the seeded registry default (so the site never shows blank slots,
//      even before the tables are populated)
// DB errors degrade to the registry default and are logged.

import { prisma } from '@cpfa/db';
import { defaultLocale, type Locale } from '@/i18n/request';
import { settingDefault } from './site-settings/defaults';

export type KeyFigureView = { value: string; sup: string; label: string };
export type PartnerView = { name: string; logoKey: string | null; url: string | null };
export type GovernanceView = { role: string; name: string; note: string };
export type TestimonialView = { quote: string; name: string; role: string };

export async function getKeyFigures(
  section: 'HOME' | 'ABOUT',
  locale: Locale = defaultLocale,
): Promise<KeyFigureView[]> {
  const defaultKey = section === 'HOME' ? 'home.stats' : 'about.stats';
  try {
    const rows = await firstNonEmpty(locale, (loc) =>
      prisma.keyFigure.findMany({
        where: { section, locale: loc },
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
        select: { value: true, sup: true, label: true },
      }),
    );
    if (rows) return rows;
    return defaultKeyFigures(defaultKey, locale);
  } catch (err) {
    console.warn('[content-blocks] key figures lookup failed — using default.', err);
    return defaultKeyFigures(defaultKey, locale);
  }
}

function defaultKeyFigures(key: 'home.stats' | 'about.stats', locale: Locale): KeyFigureView[] {
  return settingDefault(key, locale).map((s) => ({
    value: s.value,
    sup: s.sup ?? '',
    label: s.label,
  }));
}

export async function getPartners(locale: Locale = defaultLocale): Promise<PartnerView[]> {
  try {
    const rows = await firstNonEmpty(locale, (loc) =>
      prisma.partner.findMany({
        where: { locale: loc },
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
        select: { name: true, logoKey: true, url: true },
      }),
    );
    if (rows) return rows;
    return settingDefault('footer.partnerLogos', locale).map((p) => ({
      name: p.name,
      logoKey: p.logoKey || null,
      url: p.url || null,
    }));
  } catch (err) {
    console.warn('[content-blocks] partners lookup failed — using default.', err);
    return [];
  }
}

export async function getGovernance(locale: Locale = defaultLocale): Promise<GovernanceView[]> {
  try {
    const rows = await firstNonEmpty(locale, (loc) =>
      prisma.governanceMember.findMany({
        where: { locale: loc },
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
        select: { role: true, name: true, note: true },
      }),
    );
    if (rows) return rows.map((g) => ({ role: g.role, name: g.name, note: g.note ?? '' }));
    return defaultGovernance(locale);
  } catch (err) {
    console.warn('[content-blocks] governance lookup failed — using default.', err);
    return defaultGovernance(locale);
  }
}

function defaultGovernance(locale: Locale): GovernanceView[] {
  return settingDefault('about.governance', locale).map((g) => ({
    role: g.role,
    name: g.name,
    note: g.note ?? '',
  }));
}

// Homepage testimonials carousel — reads the managed Testimonial table
// (published rows), mapped to the {quote, name, role} shape the homepage uses.
export async function getHomeTestimonials(
  locale: Locale = defaultLocale,
): Promise<TestimonialView[]> {
  try {
    const rows = await firstNonEmpty(locale, (loc) =>
      prisma.testimonial.findMany({
        // Les voix d'enseignants ont leur propre section sur
        // /devenir-formateur — sans ce filtre elles remontaient aussi sous
        // « Voix d'alumni » sur la page d'accueil.
        where: { published: true, locale: loc, scope: { not: 'TEACHER' } },
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
        select: { quote: true, authorName: true, authorRole: true },
      }),
    );
    if (rows)
      return rows.map((t) => ({ quote: t.quote, name: t.authorName, role: t.authorRole ?? '' }));
    return settingDefault('home.testimonials', locale).map((t) => ({
      quote: t.quote,
      name: t.name,
      role: t.role,
    }));
  } catch (err) {
    console.warn('[content-blocks] testimonials lookup failed — using default.', err);
    return [];
  }
}

// Run the query for `locale`; if it returns nothing and locale isn't FR, retry
// with FR. Returns null when both are empty (caller applies the default).
async function firstNonEmpty<T>(
  locale: Locale,
  query: (loc: Locale) => Promise<T[]>,
): Promise<T[] | null> {
  const own = await query(locale);
  if (own.length > 0) return own;
  if (locale !== defaultLocale) {
    const fr = await query(defaultLocale);
    if (fr.length > 0) return fr;
  }
  return null;
}
