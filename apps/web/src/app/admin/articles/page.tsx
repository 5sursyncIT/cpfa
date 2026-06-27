import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/rbac';
import { prisma } from '@cpfa/db';
import { ArticlePublishToggle } from './article-publish-toggle';
import { ArticleDeleteButton } from './article-delete-button';
import { CreateArticleButton } from './create-article-button';
import { CloneArticleButton } from './clone-article-button';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Actualités — Admin CPFA' };

const fmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' });
const ALLOWED_LOCALES = ['fr', 'en'] as const;

export default async function AdminArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ locale?: string; q?: string; status?: string; tag?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect('/sign-in?callbackUrl=/admin/articles');
  if (!hasPermission(session.user.roles, 'cms:write')) redirect('/admin');

  const { locale: rawLocale, q, status: rawStatus, tag: rawTag } = await searchParams;
  const locale = rawLocale === 'en' ? 'en' : 'fr';
  const status = rawStatus === 'published' || rawStatus === 'draft' ? rawStatus : 'all';
  const tag = rawTag?.trim() || '';

  const otherLocale = locale === 'fr' ? 'en' : 'fr';

  const [articles, otherArticles] = await Promise.all([
    prisma.article.findMany({
      where: {
        locale,
        ...(status === 'all' ? {} : { published: status === 'published' }),
        ...(tag ? { tags: { has: tag } } : {}),
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
              placeholder="Titre ou adresse"
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="filter-tag">Tag</label>
            <input
              id="filter-tag"
              name="tag"
              defaultValue={tag}
              placeholder="cima, ohada…"
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="filter-status">Statut</label>
            <select id="filter-status" name="status" defaultValue={status} className="input">
              <option value="all">Tous</option>
              <option value="published">Publiés</option>
              <option value="draft">Brouillons</option>
            </select>
          </div>
          {locale ? <input type="hidden" name="locale" value={locale} /> : null}
          <button type="submit" className="btn btn-ghost btn-sm">Filtrer</button>
          {q || tag || status !== 'all' ? <Link href={`/admin/articles?locale=${locale}`} className="btn-link fs-13">Réinitialiser</Link> : null}
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
                <th>Adresse</th>
                <th>Publication</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {missingFromCurrent.map((a) => (
                <tr key={a.id}>
                  <td>{a.title}</td>
                  <td className="mono fs-13 text-soft">/blog/{a.slug}</td>
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
                <th>Adresse</th>
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
                  <td className="mono fs-13 text-soft">/blog/{a.slug}</td>
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
                      ) : (
                        <Link
                          href={`/blog/${a.slug}?preview=1`}
                          className="btn-link fs-13"
                          target="_blank"
                          rel="noreferrer"
                        >
                          ↗ aperçu
                        </Link>
                      )}
                      <ArticleDeleteButton id={a.id} title={a.title} />
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
