// Helper for routes that mix a hardcoded JSX layout with an editor-overridable
// CMS body. Each migration target owns a stable slug — editors find it in
// /admin/cms; if they unpublish or delete the row, the route gracefully
// falls back to the original hardcoded version.
//
// Locale-aware: tries the requested locale first, then falls back to FR
// before giving up. So an EN visitor sees the FR version of a page until
// the editor publishes a localised one.

import { prisma } from '@cpfa/db';
import { defaultLocale, type Locale } from '@/i18n/request';

export type CmsOverride = {
  title: string;
  metaTitle: string | null;
  metaDescription: string | null;
  content: unknown;
};

export async function fetchCmsPage(
  slug: string,
  locale: Locale = defaultLocale,
): Promise<CmsOverride | null> {
  const own = await prisma.page.findFirst({
    where: { slug, locale, published: true },
    select: { title: true, metaTitle: true, metaDescription: true, content: true },
  });
  if (own) return own;
  if (locale === defaultLocale) return null;
  return prisma.page.findFirst({
    where: { slug, locale: defaultLocale, published: true },
    select: { title: true, metaTitle: true, metaDescription: true, content: true },
  });
}

// Preview variant: returns the page row regardless of its `published` flag, so
// editors can review a draft before publishing. Callers MUST gate this behind
// a `cms:write` permission check — it intentionally bypasses publication state.
// Tries the requested locale first, then falls back to FR.
export async function fetchCmsPagePreview(
  slug: string,
  locale: Locale = defaultLocale,
): Promise<CmsOverride | null> {
  const own = await prisma.page.findFirst({
    where: { slug, locale },
    select: { title: true, metaTitle: true, metaDescription: true, content: true },
  });
  if (own) return own;
  if (locale === defaultLocale) return null;
  return prisma.page.findFirst({
    where: { slug, locale: defaultLocale },
    select: { title: true, metaTitle: true, metaDescription: true, content: true },
  });
}
