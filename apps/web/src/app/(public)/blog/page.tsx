import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@cpfa/db';
import { mediaUrl } from '@/lib/media';
import { defaultLocale, resolveLocale } from '@/i18n/request';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const t = await getTranslations('nav');
  return { title: `${t('blog')} — CPFA` };
}

export default async function BlogIndexPage() {
  const locale = await resolveLocale();
  const t = await getTranslations('blog');
  // Prefer articles in the current locale; if none exist (likely the case
  // until editors localise the blog), fall back to the canonical FR feed so
  // EN visitors don't land on an empty page.
  let articles = await prisma.article.findMany({
    where: { published: true, locale },
    orderBy: { publishedAt: 'desc' },
    take: 24,
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      coverKey: true,
      publishedAt: true,
      tags: true,
      author: { select: { firstName: true, lastName: true } },
    },
  });
  if (articles.length === 0 && locale !== defaultLocale) {
    articles = await prisma.article.findMany({
      where: { published: true, locale: defaultLocale },
      orderBy: { publishedAt: 'desc' },
      take: 24,
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        coverKey: true,
        publishedAt: true,
        tags: true,
        author: { select: { firstName: true, lastName: true } },
      },
    });
  }
  const dateFormatter = new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'fr-FR', {
    dateStyle: 'medium',
  });

  return (
    <section className="container py-16">
      <header className="mb-10 max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight">{t('title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('intro')}</p>
      </header>

      {articles.length === 0 ? (
        <p className="text-muted-foreground">{t('empty')}</p>
      ) : (
        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => {
            const cover = mediaUrl(article.coverKey);
            return (
            <li key={article.id} className="overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-sm">
              <Link href={`/blog/${article.slug}`} className="block">
                {cover ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={cover} alt="" className="aspect-video w-full object-cover" />
                ) : null}
                <div className="p-6">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  {article.publishedAt ? dateFormatter.format(article.publishedAt) : '—'}
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
                </div>
              </Link>
            </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
