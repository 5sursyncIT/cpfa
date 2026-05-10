import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { searchSite } from '@/lib/site-search';
import { resolveLocale } from '@/i18n/request';
import { richTags } from '@/lib/i18n-tags';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const t = await getTranslations('search');
  return { title: t('metaTitle') };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const [{ q }, locale, t] = await Promise.all([
    searchParams,
    resolveLocale(),
    getTranslations('search'),
  ]);
  const hits = q ? await searchSite(q, locale) : [];

  const KIND_LABEL: Record<string, string> = {
    page: t('kindPage'),
    article: t('kindArticle'),
    course: t('kindCourse'),
    resource: t('kindResource'),
  };

  return (
    <div className="container" style={{ padding: '64px 0', maxWidth: 880 }}>
      <div className="breadcrumb">
        CPFA · <span>{t('title')}</span>
      </div>
      <h1 style={{ marginBottom: 8 }}>{t.rich('h1', richTags)}</h1>
      <p className="fs-15 text-mid" style={{ marginBottom: 24 }}>
        {t('intro')}
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
          placeholder={t('placeholder')}
          className="input"
          style={{ flex: 1 }}
          autoFocus
        />
        <button type="submit" className="btn btn-primary">
          {t('submitCta')}
        </button>
      </form>

      {!q ? null : hits.length === 0 ? (
        <p className="text-soft">
          {t.rich('noResults', {
            ...richTags,
            strong: (chunks) => <strong>{chunks}</strong>,
            q,
          })}
        </p>
      ) : (
        <ol className="col gap-3" style={{ listStyle: 'none', padding: 0 }}>
          {hits.map((h, i) => (
            <li key={`${h.kind}-${i}`} className="card" style={{ padding: 16 }}>
              <div
                className="row"
                style={{ alignItems: 'baseline', gap: 8, marginBottom: 4 }}
              >
                <span className="pill" style={{ fontSize: 11, padding: '2px 8px' }}>
                  {KIND_LABEL[h.kind] ?? h.kind}
                </span>
                {h.meta ? <span className="fs-13 text-soft">{h.meta}</span> : null}
              </div>
              <Link
                href={h.href}
                className="fs-17"
                style={{ fontWeight: 500, lineHeight: 1.3 }}
              >
                {h.title}
              </Link>
              {h.snippet ? (
                <p className="fs-14 text-mid" style={{ marginTop: 4, lineHeight: 1.5 }}>
                  {h.snippet.length > 220 ? `${h.snippet.slice(0, 220)}…` : h.snippet}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
