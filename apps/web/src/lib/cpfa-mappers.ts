// Adapters between Prisma models and the design-system view models.

import type { Course, Resource, ResourceKind } from '@cpfa/db';
import type { BookCover, BookData } from '@/components/cpfa/book';
import type { FormationCardData, FormationCover } from '@/components/cpfa/formation-card';

// ── FormationCard ───────────────────────────────────────────────────────

const COURSE_CATEGORY: Record<string, string> = {
  DIPLOMANT: 'Cursus diplômant',
  CERTIFIANT: 'Certification',
  CARTE: 'Sur mesure',
  AUDITORAT: 'Auditorat',
};

const COURSE_LEVEL: Record<string, string> = {
  INITIATION: 'Initiation',
  INTERMEDIAIRE: 'Intermédiaire',
  AVANCE: 'Avancé',
};

const COVER_PALETTE: FormationCover[] = ['navy', 'orange', 'cream', 'ink'];

export function pickCover<T extends string>(seed: string, palette: T[]): T {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return palette[h % palette.length]!;
}

export function fmtXof(amount: number): string {
  if (amount === 0) return 'Gratuit';
  return `${amount.toLocaleString('fr-FR')} FCFA`;
}

export function durationLabel(hours: number): string {
  if (hours >= 200) {
    const months = Math.round(hours / 100);
    return `${months} mois`;
  }
  if (hours >= 40) {
    const weeks = Math.round(hours / 35);
    return `${weeks} sem`;
  }
  return `${hours} h`;
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
): FormationCardData {
  return {
    slug: c.slug,
    title: c.title,
    category: COURSE_CATEGORY[c.kind] ?? c.kind,
    description: c.description,
    duration: durationLabel(c.durationHours),
    level: COURSE_LEVEL[c.level] ?? c.level,
    priceLabel: fmtXof(c.priceXof),
    cover: pickCover<FormationCover>(c.slug, COVER_PALETTE),
    coverImageKey: c.coverImageKey,
  };
}

// ── Book ────────────────────────────────────────────────────────────────

const BOOK_PALETTE: BookCover[] = ['navy', 'orange', 'ink', 'cream', 'olive'];

const KIND_LABEL: Record<ResourceKind, string> = {
  BOOK: 'Ouvrage',
  JOURNAL: 'Revue',
  THESIS: 'Mémoire',
  AUDIO: 'Audio',
  VIDEO: 'Vidéo',
  DIGITAL: 'Numérique',
  OTHER: 'Autre',
};

export function resourceKindLabel(kind: ResourceKind): string {
  return KIND_LABEL[kind] ?? kind;
}

export function resourceToBook(
  r: Pick<Resource, 'id' | 'title' | 'authors' | 'totalCopies'> & {
    activeLoans?: number;
  },
): BookData {
  const onLoan = r.activeLoans ?? 0;
  const status: 'dispo' | 'emprunte' = onLoan >= r.totalCopies ? 'emprunte' : 'dispo';
  return {
    id: r.id,
    title: r.title,
    author: (r.authors[0] ?? 'Anonyme').toUpperCase(),
    status,
    cover: pickCover<BookCover>(r.id, BOOK_PALETTE),
  };
}
