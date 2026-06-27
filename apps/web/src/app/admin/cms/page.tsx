import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/rbac';
import { prisma } from '@cpfa/db';
import { CreatePageButton } from './create-page-button';
import { ClonePageButton } from './clone-page-button';
import { PagePublishToggle } from './page-publish-toggle';
import { PageDeleteButton } from './page-delete-button';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Pages CMS — Admin CPFA' };

const fmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' });
const ALLOWED_LOCALES = ['fr', 'en'] as const;

export default async function AdminCmsPage({
  searchParams,
}: {
  searchParams: Promise<{ locale?: string; q?: string; status?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect('/sign-in?callbackUrl=/admin/cms');
  if (!hasPermission(session.user.roles, 'cms:write')) redirect('/admin');

  const { locale: rawLocale, q, status: rawStatus } = await searchParams;
  const locale = rawLocale === 'en' ? 'en' : 'fr';
  const status = rawStatus === 'published' || rawStatus === 'draft' ? rawStatus : 'all';

  const otherLocale = locale === 'fr' ? 'en' : 'fr';

  const [pages, otherPages] = await Promise.all([
    prisma.page.findMany({
      where: {
        locale,
        ...(status === 'all' ? {} : { published: status === 'published' }),
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
      take: 200,
      select: {
        id: true,
        slug: true,
        title: true,
        locale: true,
        published: true,
        updatedAt: true,
      },
    }),
    // For coverage panel: pages in the OTHER locale that have no twin in the
    // current one. Editors can clone them in one click to bootstrap a translation.
    prisma.page.findMany({
      where: { locale: otherLocale },
      orderBy: { updatedAt: 'desc' },
      take: 200,
      select: { id: true, slug: true, title: true, locale: true, published: true },
    }),
  ]);

  const ownSlugs = new Set(pages.map((p) => p.slug));
  const missingFromCurrent = otherPages.filter((p) => !ownSlugs.has(p.slug));

  return (
    <>
      <div
        className="row"
        style={{ justifyContent: 'space-between', alignItems: 'end', marginBottom: 24, gap: 24 }}
      >
        <div>
          <div className="breadcrumb">
            Admin · <span>Pages CMS</span>
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 3vw, 36px)', marginTop: 8 }}>
            Pages CMS · {pages.length}
          </h2>
        </div>
        <div className="row gap-2">
          <div className="row gap-2" style={{ alignItems: 'center' }}>
            {ALLOWED_LOCALES.map((loc) => (
              <Link
                key={loc}
                href={`/admin/cms?locale=${loc}`}
                className={'pill ' + (loc === locale ? 'pill-orange' : '')}
                style={{ textDecoration: 'none', textTransform: 'uppercase' }}
              >
                {loc}
              </Link>
            ))}
          </div>
          <CreatePageButton locale={locale} />
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
          <div>
            <label className="label" htmlFor="filter-status">Statut</label>
            <select id="filter-status" name="status" defaultValue={status} className="input">
              <option value="all">Tous</option>
              <option value="published">Publiées</option>
              <option value="draft">Brouillons</option>
            </select>
          </div>
          {locale ? <input type="hidden" name="locale" value={locale} /> : null}
          <button type="submit" className="btn btn-ghost btn-sm">Filtrer</button>
          {q || status !== 'all' ? <Link href={`/admin/cms?locale=${locale}`} className="btn-link fs-13">Réinitialiser</Link> : null}
        </div>
      </form>

      {missingFromCurrent.length > 0 ? (
        <div className="panel" style={{ marginBottom: 16 }}>
          <div className="panel-head">
            <h4>
              Pages présentes en {otherLocale.toUpperCase()} mais manquantes en{' '}
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
              {missingFromCurrent.map((p) => (
                <tr key={p.id}>
                  <td>{p.title}</td>
                  <td className="mono fs-13 text-soft">/p/{p.slug}</td>
                  <td>
                    {p.published ? (
                      <span className="pill pill-success">Publiée</span>
                    ) : (
                      <span className="pill">Brouillon</span>
                    )}
                  </td>
                  <td>
                    <ClonePageButton sourceId={p.id} targetLocale={locale} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="panel">
        {pages.length === 0 ? (
          <p className="text-soft" style={{ padding: 24 }}>
            Aucune page CMS pour le moment. Les pages publiées sont accessibles via{' '}
            <code className="mono fs-13">/p/&lt;slug&gt;</code>.
          </p>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Adresse</th>
                <th>Locale</th>
                <th>Mis à jour</th>
                <th>Publication</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pages.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link
                      href={`/admin/cms/${p.id}`}
                      style={{ color: 'inherit', textDecoration: 'none', fontWeight: 500 }}
                    >
                      {p.title}
                    </Link>
                  </td>
                  <td className="mono fs-13 text-soft">/p/{p.slug}</td>
                  <td className="mono fs-13 text-soft">{p.locale}</td>
                  <td className="mono fs-13 text-soft">{fmt.format(p.updatedAt)}</td>
                  <td>
                    {p.published ? (
                      <span className="pill pill-success">Publiée</span>
                    ) : (
                      <span className="pill">Brouillon</span>
                    )}
                  </td>
                  <td>
                    <div className="row gap-2" style={{ alignItems: 'center' }}>
                      <PagePublishToggle id={p.id} published={p.published} />
                      <Link href={`/admin/cms/${p.id}`} className="btn-link fs-13">
                        Éditer →
                      </Link>
                      {p.published ? (
                        <Link
                          href={`/p/${p.slug}`}
                          className="btn-link fs-13"
                          target="_blank"
                          rel="noreferrer"
                        >
                          ↗ voir
                        </Link>
                      ) : (
                        <Link
                          href={`/p/${p.slug}?preview=1`}
                          className="btn-link fs-13"
                          target="_blank"
                          rel="noreferrer"
                        >
                          ↗ aperçu
                        </Link>
                      )}
                      <PageDeleteButton id={p.id} title={p.title} />
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
