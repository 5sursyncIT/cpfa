// Recherche globale du site — interroge Page (CMS), Article (blog), Course
// (formations), Resource (bibliothèque). Utilise des `contains` Postgres
// case-insensitive plutôt que tsvector pour rester simple : V1 suffit pour
// quelques milliers de lignes. Migration vers `to_tsvector` quand le volume
// le justifiera.
//
// Limite à `take` par type pour garder la latence raisonnable (≤ 150 ms
// même sans index dédié).

import { prisma } from '@cpfa/db';
import { defaultLocale, type Locale } from '@/i18n/request';

export type SearchHit = {
  kind: 'page' | 'article' | 'course' | 'resource';
  href: string;
  title: string;
  snippet?: string;
  meta?: string;
};

const PER_KIND_LIMIT = 6;

export async function searchSite(
  query: string,
  locale: Locale = defaultLocale,
): Promise<SearchHit[]> {
  const term = query.trim();
  if (term.length < 2) return [];

  const ilike = { contains: term, mode: 'insensitive' as const };

  const [pages, articles, courses, resources] = await Promise.all([
    prisma.page.findMany({
      where: {
        published: true,
        locale,
        OR: [{ title: ilike }, { metaDescription: ilike }],
      },
      take: PER_KIND_LIMIT,
      select: { slug: true, title: true, metaDescription: true },
    }),
    prisma.article.findMany({
      where: {
        published: true,
        locale,
        OR: [{ title: ilike }, { excerpt: ilike }, { tags: { has: term.toLowerCase() } }],
      },
      take: PER_KIND_LIMIT,
      orderBy: { publishedAt: 'desc' },
      select: { slug: true, title: true, excerpt: true, publishedAt: true },
    }),
    prisma.course.findMany({
      where: {
        published: true,
        OR: [{ title: ilike }, { description: ilike }],
      },
      take: PER_KIND_LIMIT,
      select: { slug: true, title: true, description: true, kind: true },
    }),
    prisma.resource.findMany({
      where: {
        OR: [
          { title: ilike },
          { authors: { has: term } },
          { isbn: ilike },
        ],
      },
      take: PER_KIND_LIMIT,
      select: { id: true, title: true, authors: true },
    }),
  ]);

  const hits: SearchHit[] = [
    ...pages.map((p) => ({
      kind: 'page' as const,
      href: `/p/${p.slug}`,
      title: p.title,
      snippet: p.metaDescription ?? undefined,
    })),
    ...articles.map((a) => ({
      kind: 'article' as const,
      href: `/blog/${a.slug}`,
      title: a.title,
      snippet: a.excerpt ?? undefined,
      meta: a.publishedAt
        ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(a.publishedAt)
        : undefined,
    })),
    ...courses.map((c) => ({
      kind: 'course' as const,
      href: `/formations/${c.slug}`,
      title: c.title,
      snippet: c.description ?? undefined,
      meta: c.kind,
    })),
    ...resources.map((r) => ({
      kind: 'resource' as const,
      href: `/bibliotheque/${r.id}`,
      title: r.title,
      meta: r.authors?.join(', '),
    })),
  ];

  return hits;
}
