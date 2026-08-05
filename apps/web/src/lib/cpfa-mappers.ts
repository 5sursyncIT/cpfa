// Adapters between Prisma models and the design-system view models.
//
// Every label produced here is user-facing, so each adapter takes the active
// `locale`. It defaults to FR, which keeps the back-office call sites — French
// by design, see CLAUDE.md — working untouched while the public site passes the
// locale it resolved from the request.
//
// The enum labels live inline rather than in `messages/*.json` because they are
// keyed on Prisma enums, not on editable copy: adding a `ResourceKind` must
// break the build here, not silently render a missing-message placeholder. Same
// reasoning as `subscription-procedure.ts`.

import type { Course, Resource, ResourceKind } from '@cpfa/db';
import { defaultLocale, formatDurationHours, formatXof, type Locale } from '@cpfa/lib/i18n';
import type { BookCover, BookData } from '@/components/cpfa/book';
import type { FormationCardData, FormationCover } from '@/components/cpfa/formation-card';

// Re-exported under the names the rest of the app already imports.
export { formatXof as fmtXof, formatDurationHours as durationLabel } from '@cpfa/lib/i18n';

// ── FormationCard ───────────────────────────────────────────────────────

const COURSE_CATEGORY: Record<Locale, Record<string, string>> = {
  fr: {
    DIPLOMANT: 'Cursus diplômant',
    CERTIFIANT: 'Certification',
    CARTE: 'Sur mesure',
    AUDITORAT: 'Auditorat',
  },
  en: {
    DIPLOMANT: 'Degree programme',
    CERTIFIANT: 'Certification',
    CARTE: 'Tailor-made',
    AUDITORAT: 'Audit track',
  },
};

const COURSE_LEVEL: Record<Locale, Record<string, string>> = {
  fr: {
    INITIATION: 'Initiation',
    INTERMEDIAIRE: 'Intermédiaire',
    AVANCE: 'Avancé',
  },
  en: {
    INITIATION: 'Introductory',
    INTERMEDIAIRE: 'Intermediate',
    AVANCE: 'Advanced',
  },
};

const COVER_PALETTE: FormationCover[] = ['navy', 'orange', 'cream', 'ink'];

export function pickCover<T extends string>(seed: string, palette: T[]): T {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return palette[h % palette.length]!;
}

export function courseCategoryLabel(kind: string, locale: Locale = defaultLocale): string {
  return COURSE_CATEGORY[locale]?.[kind] ?? COURSE_CATEGORY[defaultLocale][kind] ?? kind;
}

export function courseLevelLabel(level: string, locale: Locale = defaultLocale): string {
  return COURSE_LEVEL[locale]?.[level] ?? COURSE_LEVEL[defaultLocale][level] ?? level;
}

export function courseToCard(
  c: Pick<
    Course,
    | 'slug'
    | 'title'
    | 'kind'
    | 'level'
    | 'durationHours'
    | 'priceXof'
    | 'description'
    | 'coverImageKey'
  >,
  locale: Locale = defaultLocale,
): FormationCardData {
  return {
    slug: c.slug,
    title: c.title,
    kind: c.kind,
    category: courseCategoryLabel(c.kind, locale),
    description: c.description,
    duration: formatDurationHours(c.durationHours, locale),
    level: courseLevelLabel(c.level, locale),
    priceLabel: formatXof(c.priceXof, locale),
    cover: pickCover<FormationCover>(c.slug, COVER_PALETTE),
    coverImageKey: c.coverImageKey,
  };
}

// ── Book ────────────────────────────────────────────────────────────────

const BOOK_PALETTE: BookCover[] = ['navy', 'orange', 'ink', 'cream', 'olive'];

const KIND_LABEL: Record<Locale, Record<ResourceKind, string>> = {
  fr: {
    BOOK: 'Ouvrage',
    JOURNAL: 'Revue',
    THESIS: 'Mémoire',
    AUDIO: 'Audio',
    VIDEO: 'Vidéo',
    DIGITAL: 'Numérique',
    OTHER: 'Autre',
  },
  en: {
    BOOK: 'Book',
    JOURNAL: 'Journal',
    THESIS: 'Dissertation',
    AUDIO: 'Audio',
    VIDEO: 'Video',
    DIGITAL: 'Digital',
    OTHER: 'Other',
  },
};

const ANONYMOUS: Record<Locale, string> = { fr: 'Anonyme', en: 'Anonymous' };

const BOOK_STATUS: Record<Locale, { dispo: string; emprunte: string }> = {
  fr: { dispo: 'Dispo', emprunte: 'Sortie' },
  en: { dispo: 'In', emprunte: 'Out' },
};

export function resourceKindLabel(kind: ResourceKind, locale: Locale = defaultLocale): string {
  return KIND_LABEL[locale]?.[kind] ?? KIND_LABEL[defaultLocale][kind] ?? kind;
}

export function resourceToBook(
  r: Pick<Resource, 'id' | 'title' | 'authors'>,
  locale: Locale = defaultLocale,
): BookData {
  // The library is a consultation-on-site catalogue — every catalogued title
  // is available to consult in the reading room.
  const anonymous = ANONYMOUS[locale] ?? ANONYMOUS[defaultLocale];
  const status = BOOK_STATUS[locale] ?? BOOK_STATUS[defaultLocale];
  return {
    id: r.id,
    title: r.title,
    author: (r.authors[0] ?? anonymous).toUpperCase(),
    status: 'dispo',
    statusLabel: status.dispo,
    cover: pickCover<BookCover>(r.id, BOOK_PALETTE),
  };
}
