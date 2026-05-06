import Link from 'next/link';
import { prisma } from '@cpfa/db';

export const metadata = { title: 'Actualités — CPFA' };
export const dynamic = 'force-dynamic';

export default async function BlogIndexPage() {
  const articles = await prisma.article.findMany({
    where: { published: true },
    orderBy: { publishedAt: 'desc' },
    take: 24,
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      publishedAt: true,
      tags: true,
      author: { select: { firstName: true, lastName: true } },
    },
  });

  return (
    <section className="container py-16">
      <header className="mb-10 max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight">Actualités du CPFA</h1>
        <p className="mt-2 text-muted-foreground">
          Communiqués, ouverture de sessions, retours d’expérience, réglementation.
        </p>
      </header>

      {articles.length === 0 ? (
        <p className="text-muted-foreground">Aucune publication pour le moment.</p>
      ) : (
        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <li key={article.id} className="rounded-lg border bg-card p-6 transition-shadow hover:shadow-sm">
              <Link href={`/blog/${article.slug}`} className="block">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  {article.publishedAt
                    ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(article.publishedAt)
                    : 'Brouillon'}
                </p>
                <h2 className="mt-2 text-lg font-semibold leading-snug">{article.title}</h2>
                {article.excerpt ? (
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{article.excerpt}</p>
                ) : null}
                {article.tags.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-1.5">
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
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
