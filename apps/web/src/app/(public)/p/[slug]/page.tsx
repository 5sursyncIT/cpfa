// Catch-all CMS route — renders any published Page by slug.
// Real CMS pages (Accueil, About, Mot du Directeur, Partenaires) live at fixed
// routes; this route lets the editor publish ad-hoc pages without code.

import { notFound } from 'next/navigation';
import { fetchCmsPage } from '@/lib/cms-page';
import { BlockRenderer } from '@/components/cms/block-renderer';
import { resolveLocale } from '@/i18n/request';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await fetchCmsPage(slug, await resolveLocale());
  if (!page) return { title: 'Page introuvable — CPFA' };
  return {
    title: page.metaTitle ?? `${page.title} — CPFA`,
    description: page.metaDescription ?? undefined,
  };
}

export default async function CmsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await fetchCmsPage(slug, await resolveLocale());
  if (!page) notFound();

  return (
    <article className="container max-w-3xl py-16">
      <h1 className="text-4xl font-bold tracking-tight">{page.title}</h1>
      <div className="prose prose-slate mt-8 max-w-none">
        <BlockRenderer content={page.content} />
      </div>
    </article>
  );
}
