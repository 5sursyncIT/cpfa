import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/rbac';
import { prisma } from '@cpfa/db';
import { ArticlePublishToggle } from './article-publish-toggle';
import { CreateArticleButton } from './create-article-button';
import { CloneArticleButton } from './clone-article-button';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Actualités — Admin CPFA' };

const fmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' });
const ALLOWED_LOCALES = ['fr', 'en'] as const;

export default async function AdminArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ locale?: string; q?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect('/sign-in?callbackUrl=/admin/articles');
  if (!hasPermission(session.user.roles, 'cms:write')) redirect('/admin');

  const { locale: rawLocale, q } = await searchParams;
  const locale = rawLocale === 'en' ? 'en' : 'fr';

  const otherLocale = locale === 'fr' ? 'en' : 'fr';

  const [articles, otherArticles] = await Promise.all([
    prisma.article.findMany({
      where: {
        locale,
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { slug: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
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
    }),
    prisma.article.findMany({
      where: { locale: otherLocale },
      orderBy: { updatedAt: 'desc' },
      take: 100,
      select: { id: true, slug: true, title: true, locale: true, published: true },
    }),
  ]);

  const ownSlugs = new Set(articles.map((a) => a.slug));
  const missingFromCurrent = otherArticles.filter((a) => !ownSlugs.has(a.slug));

  return (
    <>
      <div
        className="row"
        style={{ justifyContent: 'space-between', alignItems: 'end', marginBottom: 24, gap: 24 }}
      >
        <div>
          <div className="breadcrumb">
            Admin · <span>Actualités</span>
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 3vw, 36px)', marginTop: 8 }}>
            Actualités · {articles.length}
          </h2>
        </div>
        <div className="row gap-2">
          <div className="row gap-2" style={{ alignItems: 'center' }}>
            {ALLOWED_LOCALES.map((loc) => (
              <Link
                key={loc}
                href={`/admin/articles?locale=${loc}`}
                className={'pill ' + (loc === locale ? 'pill-orange' : '')}
                style={{ textDecoration: 'none', textTransform: 'uppercase' }}
              >
                {loc}
              </Link>
            ))}
          </div>
          <CreateArticleButton locale={locale} />
        </div>
      </div>

      <form className="panel" style={{ padding: 16, marginBottom: 16 }}>
        <div className="row gap-3" style={{ alignItems: 'end' }}>
          <div style={{ flex: 1 }}>
            <label className="label" htmlFor="filter-q">Recherche</label>
            <input
              id="filter-q"
              name="q"
              defaultValue={q ?? ''}
              placeholder="Titre, slug"
              className="input"
            />
          </div>
          {locale ? <input type="hidden" name="locale" value={locale} /> : null}
          <button type="submit" className="btn btn-ghost btn-sm">Filtrer</button>
          {q ? <Link href={`/admin/articles?locale=${locale}`} className="btn-link fs-13">Réinitialiser</Link> : null}
        </div>
      </form>

      {missingFromCurrent.length > 0 ? (
        <div className="panel" style={{ marginBottom: 16 }}>
          <div className="panel-head">
            <h4>
              Articles présents en {otherLocale.toUpperCase()} mais manquants en{' '}
              {locale.toUpperCase()} · {missingFromCurrent.length}
            </h4>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Titre ({otherLocale.toUpperCase()})</th>
                <th>Slug</th>
                <th>Publication</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {missingFromCurrent.map((a) => (
                <tr key={a.id}>
                  <td>{a.title}</td>
                  <td className="mono fs-13 text-soft">{a.slug}</td>
                  <td>
                    {a.published ? (
                      <span className="pill pill-success">Publié</span>
                    ) : (
                      <span className="pill">Brouillon</span>
                    )}
                  </td>
                  <td>
                    <CloneArticleButton sourceId={a.id} targetLocale={locale} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="panel">
        {articles.length === 0 ? (
          <p className="text-soft" style={{ padding: 24 }}>Aucun article.</p>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Slug</th>
                <th>Mis à jour</th>
                <th>Publication</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {articles.map((a) => (
                <tr key={a.id}>
                  <td>
                    <Link
                      href={`/admin/articles/${a.id}`}
                      style={{ color: 'inherit', textDecoration: 'none', fontWeight: 500 }}
                    >
                      {a.title}
                    </Link>
                  </td>
                  <td className="mono fs-13 text-soft">{a.slug}</td>
                  <td className="mono fs-13 text-soft">{fmt.format(a.updatedAt)}</td>
                  <td>
                    {a.published ? (
                      <span className="pill pill-success">
                        Publié{a.publishedAt ? ` · ${fmt.format(a.publishedAt)}` : ''}
                      </span>
                    ) : (
                      <span className="pill">Brouillon</span>
                    )}
                  </td>
                  <td>
                    <div className="row gap-2">
                      <ArticlePublishToggle id={a.id} published={a.published} />
                      {a.published ? (
                        <Link
                          href={`/blog/${a.slug}`}
                          className="btn-link fs-13"
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
        )}
      </div>
    </>
  );
}
