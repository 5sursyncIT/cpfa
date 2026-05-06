// Catch-all CMS route — renders any published Page by slug.
// Real CMS pages (Accueil, About, Mot du Directeur, Partenaires) live at fixed
// routes; this route lets the editor publish ad-hoc pages without code.

import { notFound } from 'next/navigation';
import { prisma } from '@cpfa/db';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await prisma.page.findFirst({
    where: { slug, locale: 'fr', published: true },
    select: { title: true, metaTitle: true, metaDescription: true },
  });
  if (!page) return { title: 'Page introuvable — CPFA' };
  return {
    title: page.metaTitle ?? `${page.title} — CPFA`,
    description: page.metaDescription ?? undefined,
  };
}

export default async function CmsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await prisma.page.findFirst({
    where: { slug, locale: 'fr', published: true },
  });
  if (!page) notFound();

  return (
    <article className="container max-w-3xl py-16">
      <h1 className="text-4xl font-bold tracking-tight">{page.title}</h1>
      <BlockRenderer content={page.content} />
    </article>
  );
}

// Minimal block renderer. Real implementation lands in S6 (admin/CMS) — for now,
// supports a flat array of { kind: 'paragraph' | 'heading' | 'image', ... }.
function BlockRenderer({ content }: { content: unknown }) {
  if (!content || typeof content !== 'object') return null;
  const blocks = Array.isArray(content) ? content : [];
  return (
    <div className="prose prose-slate mt-8 max-w-none">
      {blocks.map((block, i) => {
        if (typeof block !== 'object' || block === null) return null;
        const b = block as { kind?: string; text?: string; level?: number; src?: string; alt?: string };
        if (b.kind === 'heading') {
          const level = Math.min(Math.max(b.level ?? 2, 2), 4) as 2 | 3 | 4;
          const Tag = `h${level}` as 'h2' | 'h3' | 'h4';
          return <Tag key={i}>{b.text}</Tag>;
        }
        if (b.kind === 'paragraph') return <p key={i}>{b.text}</p>;
        if (b.kind === 'image' && b.src) {
          // eslint-disable-next-line @next/next/no-img-element
          return <img key={i} src={b.src} alt={b.alt ?? ''} />;
        }
        return null;
      })}
    </div>
  );
}
