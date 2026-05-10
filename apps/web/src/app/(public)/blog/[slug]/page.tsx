import { notFound } from 'next/navigation';
import { prisma } from '@cpfa/db';
import { BlockRenderer } from '@/components/cms/block-renderer';
import { mediaUrl } from '@/lib/media';

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
  const cover = mediaUrl(article.coverKey);

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

      {cover ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={cover} alt="" className="mt-8 w-full rounded-lg border object-cover" />
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
