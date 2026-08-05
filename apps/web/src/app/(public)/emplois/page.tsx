import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@cpfa/db';
import { resolveLocale } from '@/i18n/request';
import { richTags } from '@/lib/i18n-tags';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const t = await getTranslations('jobs');
  return { title: t('metaTitle') };
}

export default async function JobsListPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; level?: string; location?: string; q?: string }>;
}) {
  const [{ type, level, location, q }, t, locale] = await Promise.all([
    searchParams,
    getTranslations('jobs'),
    resolveLocale(),
  ]);
  const now = new Date();

  const TYPE_LABEL: Record<string, string> = {
    CDI: t('typeCDI'),
    CDD: t('typeCDD'),
    STAGE: t('typeSTAGE'),
    FREELANCE: t('typeFREELANCE'),
    ALTERNANCE: t('typeALTERNANCE'),
  };
  const LEVEL_LABEL: Record<string, string> = {
    JUNIOR: t('levelJUNIOR'),
    INTERMEDIAIRE: t('levelINTERMEDIAIRE'),
    SENIOR: t('levelSENIOR'),
    EXECUTIVE: t('levelEXECUTIVE'),
  };

  const fmt = new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'fr-FR', {
    dateStyle: 'medium',
  });

  const jobs = await prisma.jobPosting.findMany({
    where: {
      status: 'PUBLISHED',
      // Both conditions live under AND: a bare `OR` key here would be
      // overwritten by the search-term `OR` below, silently resurfacing
      // offers past their closing date (§3.2.a du Directeur).
      AND: [
        { OR: [{ closesAt: null }, { closesAt: { gte: now } }] },
        ...(q
          ? [
              {
                OR: [
                  { title: { contains: q, mode: 'insensitive' as const } },
                  { companyName: { contains: q, mode: 'insensitive' as const } },
                  { description: { contains: q, mode: 'insensitive' as const } },
                ],
              },
            ]
          : []),
      ],
      ...(type && type in TYPE_LABEL
        ? { type: type as 'CDI' | 'CDD' | 'STAGE' | 'FREELANCE' | 'ALTERNANCE' }
        : {}),
      ...(level && level in LEVEL_LABEL
        ? { level: level as 'JUNIOR' | 'INTERMEDIAIRE' | 'SENIOR' | 'EXECUTIVE' }
        : {}),
      ...(location ? { location: { contains: location, mode: 'insensitive' as const } } : {}),
    },
    take: 60,
    orderBy: [{ urgent: 'desc' }, { publishedAt: 'desc' }],
    select: {
      id: true,
      title: true,
      companyName: true,
      type: true,
      level: true,
      location: true,
      urgent: true,
      publishedAt: true,
    },
  });

  return (
    <div className="container" style={{ padding: '64px 0' }}>
      <div className="breadcrumb">
        CPFA · <span>{t('breadcrumb')}</span>
      </div>

      <div
        className="row"
        style={{ justifyContent: 'space-between', alignItems: 'end', gap: 32, marginBottom: 32 }}
      >
        <h1 style={{ fontSize: 'clamp(40px, 5vw, 64px)' }}>{t.rich('h1', richTags)}</h1>
        <Link href="/emplois/recruteur" className="btn btn-ghost">
          {t('publishCta')} →
        </Link>
      </div>

      <p className="fs-15 text-mid" style={{ maxWidth: 720, marginBottom: 32 }}>
        {t('intro')}
      </p>

      <form
        method="get"
        action="/emplois"
        className="row gap-2"
        style={{ marginBottom: 24, flexWrap: 'wrap' }}
      >
        <input
          name="q"
          defaultValue={q ?? ''}
          placeholder={t('filterPlaceholder')}
          className="input"
          style={{ flex: '1 1 200px' }}
        />
        <select name="type" defaultValue={type ?? ''} className="select">
          <option value="">{t('filterAllTypes')}</option>
          {Object.entries(TYPE_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select name="level" defaultValue={level ?? ''} className="select">
          <option value="">{t('filterAllLevels')}</option>
          {Object.entries(LEVEL_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <input
          name="location"
          defaultValue={location ?? ''}
          placeholder={t('filterLocationPlaceholder')}
          className="input"
          style={{ flex: '0 1 180px' }}
        />
        <button type="submit" className="btn btn-primary">
          {t('filterCta')}
        </button>
      </form>

      {jobs.length === 0 ? (
        <p className="text-soft" style={{ padding: '48px 0' }}>
          {t('empty')}
        </p>
      ) : (
        <ul style={{ display: 'grid', gap: 12, listStyle: 'none', padding: 0 }}>
          {jobs.map((j) => (
            <li key={j.id} className="card" style={{ padding: 20 }}>
              <Link href={`/emplois/${j.id}`} style={{ display: 'block' }}>
                <div className="row" style={{ alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                  <span className="pill" style={{ fontSize: 11, padding: '2px 8px' }}>
                    {TYPE_LABEL[j.type]}
                  </span>
                  <span className="pill" style={{ fontSize: 11, padding: '2px 8px' }}>
                    {LEVEL_LABEL[j.level]}
                  </span>
                  {j.urgent ? (
                    <span
                      className="pill"
                      style={{
                        fontSize: 11,
                        padding: '2px 8px',
                        background: 'var(--orange-soft, #fff7ed)',
                        color: 'var(--orange-deep, #c2410c)',
                      }}
                    >
                      {t('urgent')}
                    </span>
                  ) : null}
                  {j.publishedAt && Date.now() - j.publishedAt.getTime() < 7 * 24 * 3600 * 1000 ? (
                    <span className="fs-13 text-soft">{t('recent')}</span>
                  ) : null}
                </div>
                <h3 style={{ fontSize: 18, marginBottom: 4 }}>{j.title}</h3>
                <div className="fs-13 text-soft">
                  {j.companyName}
                  {j.location ? ` · ${j.location}` : ''}
                  {j.publishedAt
                    ? ` · ${t('publishedOn', { date: fmt.format(j.publishedAt) })}`
                    : ''}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
