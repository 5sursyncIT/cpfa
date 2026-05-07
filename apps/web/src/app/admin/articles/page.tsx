import Link from 'next/link';
import { prisma } from '@cpfa/db';
import { ArticlePublishToggle } from './article-publish-toggle';

export const dynamic = 'force-dynamic';

const fmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' });

export default async function AdminArticlesPage() {
  const articles = await prisma.article.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 100,
    select: {
      id: true,
      slug: true,
      title: true,
      published: true,
      publishedAt: true,
      updatedAt: true,
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Actualités</h1>

      {articles.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun article.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full divide-y text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Titre</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Mis à jour</th>
                <th className="px-4 py-3">Publié</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {articles.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/blog/${a.slug}`} className="hover:underline">
                      {a.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{a.slug}</td>
                  <td className="px-4 py-3 text-muted-foreground">{fmt.format(a.updatedAt)}</td>
                  <td className="px-4 py-3">
                    {a.published ? `Oui · ${a.publishedAt ? fmt.format(a.publishedAt) : ''}` : 'Non'}
                  </td>
                  <td className="px-4 py-3">
                    <ArticlePublishToggle id={a.id} published={a.published} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
