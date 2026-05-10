import Link from 'next/link';
import { searchSite } from '@/lib/site-search';
import { resolveLocale } from '@/i18n/request';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Recherche — CPFA' };

const KIND_LABEL: Record<string, string> = {
  page: 'Page',
  article: 'Actualité',
  course: 'Formation',
  resource: 'Ouvrage',
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const locale = await resolveLocale();
  const hits = q ? await searchSite(q, locale) : [];

  return (
    <div className="container" style={{ padding: '64px 0', maxWidth: 880 }}>
      <div className="breadcrumb">
        CPFA · <span>Recherche</span>
      </div>
      <h1 style={{ marginBottom: 8 }}>
        Que <em className="italic-emph">cherchez-vous</em> ?
      </h1>
      <p className="fs-15 text-mid" style={{ marginBottom: 24 }}>
        Pages institutionnelles, formations, actualités, livres de la bibliothèque.
      </p>

      <form
        method="get"
        action="/recherche"
        className="row gap-2"
        style={{ marginBottom: 32, alignItems: 'center' }}
      >
        <input
          name="q"
          defaultValue={q ?? ''}
          placeholder="Tapez un mot-clé (ex: CIMA, BTS, actuariat)…"
          className="input"
          style={{ flex: 1 }}
          autoFocus
        />
        <button type="submit" className="btn btn-primary">
          Rechercher
        </button>
      </form>

      {!q ? null : hits.length === 0 ? (
        <p className="text-soft">
          Aucun résultat pour <strong>« {q} »</strong>. Essayez un autre terme.
        </p>
      ) : (
        <ol className="col gap-3" style={{ listStyle: 'none', padding: 0 }}>
          {hits.map((h, i) => (
            <li
              key={`${h.kind}-${i}`}
              className="card"
              style={{ padding: 16 }}
            >
              <div
                className="row"
                style={{ alignItems: 'baseline', gap: 8, marginBottom: 4 }}
              >
                <span
                  className="pill"
                  style={{ fontSize: 11, padding: '2px 8px' }}
                >
                  {KIND_LABEL[h.kind] ?? h.kind}
                </span>
                {h.meta ? (
                  <span className="fs-13 text-soft">{h.meta}</span>
                ) : null}
              </div>
              <Link
                href={h.href}
                className="fs-17"
                style={{ fontWeight: 500, lineHeight: 1.3 }}
              >
                {h.title}
              </Link>
              {h.snippet ? (
                <p
                  className="fs-14 text-mid"
                  style={{ marginTop: 4, lineHeight: 1.5 }}
                >
                  {h.snippet.length > 220
                    ? `${h.snippet.slice(0, 220)}…`
                    : h.snippet}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
