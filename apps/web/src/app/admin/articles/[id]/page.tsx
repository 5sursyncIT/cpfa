import { notFound } from 'next/navigation';
import { prisma } from '@cpfa/db';
import { ArticleEditor } from './article-editor';

export const dynamic = 'force-dynamic';

export default async function AdminArticleEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await prisma.article.findUnique({ where: { id } });
  if (!article) notFound();

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Article</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">{article.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          /blog/{article.slug} · {article.published ? 'Publié' : 'Brouillon'}
        </p>
      </header>

      <ArticleEditor
        id={article.id}
        initial={{
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt ?? '',
          tags: article.tags,
          coverKey: article.coverKey ?? null,
          published: article.published,
          content: Array.isArray(article.content) ? (article.content as unknown[]) : [],
        }}
      />
    </div>
  );
}
