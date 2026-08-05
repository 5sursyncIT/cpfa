// Catch-all CMS route — renders any published Page by slug.
// Real CMS pages (Accueil, About, Mot du Directeur, Partenaires) live at fixed
// routes; this route lets the editor publish ad-hoc pages without code.
//
// `?preview=1` lets an editor (cms:write) review an unpublished draft. The
// preview path bypasses the `published` filter, so it is gated behind a
// permission check before any draft content is fetched.

import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { fetchCmsPage, fetchCmsPagePreview } from '@/lib/cms-page';
import { BlockRenderer } from '@/components/cms/block-renderer';
import { resolveLocale, isLocale } from '@/i18n/request';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/rbac';

export const dynamic = 'force-dynamic';

async function canPreview() {
  const session = await auth();
  return Boolean(session?.user && hasPermission(session.user.roles, 'cms:write'));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await fetchCmsPage(slug, await resolveLocale());
  if (!page) return { title: (await getTranslations('pageDetail'))('notFound') };
  return {
    title: page.metaTitle ?? `${page.title} — CPFA`,
    description: page.metaDescription ?? undefined,
  };
}

export default async function CmsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string; locale?: string }>;
}) {
  const { slug } = await params;
  const { preview, locale: previewLocale } = await searchParams;

  const isPreview = preview === '1' && (await canPreview());
  const locale = isPreview && isLocale(previewLocale) ? previewLocale : await resolveLocale();

  const page = isPreview
    ? await fetchCmsPagePreview(slug, locale)
    : await fetchCmsPage(slug, locale);
  if (!page) notFound();

  return (
    <article className="container max-w-3xl py-16">
      {isPreview ? (
        <div className="mb-8 rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          {(await getTranslations('pageDetail'))('previewDraft')}
        </div>
      ) : null}
      <h1 className="text-4xl font-bold tracking-tight">{page.title}</h1>
      <div className="prose prose-slate mt-8 max-w-none">
        <BlockRenderer content={page.content} />
      </div>
    </article>
  );
}
