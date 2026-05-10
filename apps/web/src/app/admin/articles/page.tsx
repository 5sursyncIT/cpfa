import Link from 'next/link';
import { prisma } from '@cpfa/db';
import { ArticlePublishToggle } from './article-publish-toggle';
import { CreateArticleButton } from './create-article-button';

export const dynamic = 'force-dynamic';

const fmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' });
const ALLOWED_LOCALES = ['fr', 'en'] as const;

export default async function AdminArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ locale?: string }>;
}) {
  const { locale: rawLocale } = await searchParams;
  const locale = rawLocale === 'en' ? 'en' : 'fr';

  const articles = await prisma.article.findMany({
    where: { locale },
    orderBy: { updatedAt: 'desc' },
    take: 100,
    select: {
      id: true,
      slug: true,
      title: true,
      locale: true,
      published: true,
      publishedAt: true,
      updatedAt: true,
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Actualités</h1>
        <div className="flex gap-2">
          <div className="flex gap-1 text-sm">
            {ALLOWED_LOCALES.map((loc) => (
              <a
                key={loc}
                href={`/admin/articles?locale=${loc}`}
                className={
                  'rounded-md border px-3 py-1.5 ' +
                  (loc === locale ? 'bg-primary text-primary-foreground' : 'bg-background')
                }
              >
                {loc.toUpperCase()}
              </a>
            ))}
          </div>
          <CreateArticleButton locale={locale} />
        </div>
      </div>

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
                    <Link href={`/admin/articles/${a.id}`} className="hover:underline">
                      {a.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{a.slug}</td>
                  <td className="px-4 py-3 text-muted-foreground">{fmt.format(a.updatedAt)}</td>
                  <td className="px-4 py-3">
                    {a.published ? `Oui · ${a.publishedAt ? fmt.format(a.publishedAt) : ''}` : 'Non'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <ArticlePublishToggle id={a.id} published={a.published} />
                      {a.published ? (
                        <Link
                          href={`/blog/${a.slug}`}
                          className="text-xs text-muted-foreground hover:underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          ↗ voir
                        </Link>
                      ) : null}
                    </div>
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
