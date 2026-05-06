import { notFound } from 'next/navigation';
import { prisma } from '@cpfa/db';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await prisma.article.findFirst({
    where: { slug, published: true },
    select: { title: true, excerpt: true },
  });
  if (!article) return { title: 'Article introuvable — CPFA' };
  return {
    title: `${article.title} — CPFA`,
    description: article.excerpt ?? undefined,
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await prisma.article.findFirst({
    where: { slug, published: true },
    include: { author: { select: { firstName: true, lastName: true } } },
  });
  if (!article) notFound();

  const fullName = [article.author.firstName, article.author.lastName].filter(Boolean).join(' ');

  return (
    <article className="container max-w-3xl py-16">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">
        {article.publishedAt
          ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(article.publishedAt)
          : 'Brouillon'}
        {fullName ? ` · ${fullName}` : ''}
      </p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">{article.title}</h1>
      {article.excerpt ? (
        <p className="mt-4 text-lg text-muted-foreground">{article.excerpt}</p>
      ) : null}

      <div className="prose prose-slate mt-8 max-w-none">
        <BlockRenderer content={article.content} />
      </div>

      {article.tags.length > 0 ? (
        <div className="mt-10 flex flex-wrap gap-1.5">
          {article.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border bg-muted/30 px-2 py-0.5 text-xs text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function BlockRenderer({ content }: { content: unknown }) {
  if (!content || typeof content !== 'object') return null;
  const blocks = Array.isArray(content) ? content : [];
  return (
    <>
      {blocks.map((block, i) => {
        if (typeof block !== 'object' || block === null) return null;
        const b = block as { kind?: string; text?: string; level?: number };
        if (b.kind === 'heading') {
          const level = Math.min(Math.max(b.level ?? 2, 2), 4) as 2 | 3 | 4;
          const Tag = `h${level}` as 'h2' | 'h3' | 'h4';
          return <Tag key={i}>{b.text}</Tag>;
        }
        if (b.kind === 'paragraph') return <p key={i}>{b.text}</p>;
        return null;
      })}
    </>
  );
}
