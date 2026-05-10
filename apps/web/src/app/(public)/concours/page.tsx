import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@cpfa/db';
import { Countdown } from '@/components/cpfa/countdown';
import { fmtXof } from '@/lib/cpfa-mappers';
import { resolveLocale } from '@/i18n/request';
import { richTags } from '@/lib/i18n-tags';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const t = await getTranslations('examsPage');
  return { title: t('metaTitle') };
}

export default async function ExamsIndexPage() {
  const now = new Date();
  const [exams, t, locale] = await Promise.all([
    prisma.exam.findMany({
      where: { published: true, closeAt: { gte: now } },
      orderBy: { closeAt: 'asc' },
      take: 50,
    }),
    getTranslations('examsPage'),
    resolveLocale(),
  ]);

  const fmtDate = new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'fr-FR', {
    dateStyle: 'long',
  });
  const fmtShortDate = new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'fr-FR', {
    day: '2-digit',
    month: 'short',
  });
  const fmtMonthShort = new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'fr-FR', {
    month: 'short',
  });

  const KIND_LABEL: Record<string, string> = {
    CONCOURS: t('kindConcours'),
    EXAM_BLANC: t('kindExamBlanc'),
    CERTIFICATION: t('kindCertification'),
  };

  const EPREUVES = [
    { num: '01', title: t('epreuve1Title'), desc: t('epreuve1Desc') },
    { num: '02', title: t('epreuve2Title'), desc: t('epreuve2Desc') },
    { num: '03', title: t('epreuve3Title'), desc: t('epreuve3Desc') },
    { num: '04', title: t('epreuve4Title'), desc: t('epreuve4Desc') },
  ];

  // Pick a featured exam (next-closing CONCOURS) for the headline countdown.
  const featured = exams.find((e) => e.kind === 'CONCOURS') ?? exams[0];
  const others = featured ? exams.filter((e) => e.id !== featured.id) : [];

  return (
    <div>
      <div className="container page-head">
        <div className="breadcrumb">
          CPFA · <span>{t('title')}</span>
        </div>
        <h1>{t.rich('h1', richTags)}</h1>
      </div>

      <div className="container" style={{ paddingBottom: 96 }}>
        {!featured ? (
          <p className="text-soft">{t('empty')}</p>
        ) : (
          <>
            <div className="concours-card" style={{ marginBottom: 48 }}>
              <div>
                <span className="eyebrow" style={{ marginBottom: 16 }}>
                  {t('deadlineEyebrow')}
                </span>
                <Countdown deadline={featured.closeAt} />
                <div className="row gap-3">
                  <Link href={`/concours/${featured.slug}`} className="btn btn-orange btn-lg">
                    {t('applyCta')} <span className="arrow">→</span>
                  </Link>
                  <button type="button" className="btn btn-ghost btn-lg">
                    {t('pastPapersCta')}
                  </button>
                </div>
                <p className="fs-13 text-soft" style={{ marginTop: 24 }}>
                  {KIND_LABEL[featured.kind] ?? featured.kind} ·{' '}
                  <strong>{featured.title}</strong> · {t('feeLabel')}{' '}
                  <span className="mono">{fmtXof(featured.feeXof)}</span>
                </p>
              </div>
              <div>
                <h3 style={{ marginBottom: 16 }}>{t.rich('tracksHeading', richTags)}</h3>
                <div className="col gap-4">
                  {EPREUVES.map((e) => (
                    <div
                      key={e.num}
                      className="row gap-4"
                      style={{ paddingTop: 16, borderTop: '1px solid var(--line)' }}
                    >
                      <span className="mono fs-13 text-soft" style={{ minWidth: 28 }}>
                        {e.num}
                      </span>
                      <div>
                        <div className="fs-15" style={{ fontWeight: 500, marginBottom: 4 }}>
                          {e.title}
                        </div>
                        <div className="fs-13 text-soft">{e.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="row gap-4" style={{ flexWrap: 'wrap' }}>
              <div className="card" style={{ flex: 1, minWidth: 220 }}>
                <div
                  className="serif"
                  style={{ fontSize: 36, lineHeight: 1, marginBottom: 8 }}
                >
                  {fmtShortDate.format(featured.closeAt)}
                </div>
                <div className="fs-14" style={{ fontWeight: 500, marginBottom: 4 }}>
                  {t('milestoneCloseLabel')}
                </div>
                <div className="fs-13 text-soft">{t('milestoneCloseSub')}</div>
              </div>
              {featured.examAt ? (
                <div className="card" style={{ flex: 1, minWidth: 220 }}>
                  <div
                    className="serif"
                    style={{ fontSize: 36, lineHeight: 1, marginBottom: 8 }}
                  >
                    {fmtShortDate.format(featured.examAt)}
                  </div>
                  <div className="fs-14" style={{ fontWeight: 500, marginBottom: 4 }}>
                    {t('milestoneWrittenLabel')}
                  </div>
                  <div className="fs-13 text-soft">{t('milestoneWrittenSub')}</div>
                </div>
              ) : null}
              <div className="card" style={{ flex: 1, minWidth: 220 }}>
                <div className="serif" style={{ fontSize: 36, lineHeight: 1, marginBottom: 8 }}>
                  {featured.examAt
                    ? fmtShortDate.format(
                        new Date(featured.examAt.getTime() + 8 * 24 * 60 * 60 * 1000),
                      )
                    : '—'}
                </div>
                <div className="fs-14" style={{ fontWeight: 500, marginBottom: 4 }}>
                  {t('milestoneInterviewsLabel')}
                </div>
                <div className="fs-13 text-soft">{t('milestoneInterviewsSub')}</div>
              </div>
              <div className="card" style={{ flex: 1, minWidth: 220 }}>
                <div className="serif" style={{ fontSize: 36, lineHeight: 1, marginBottom: 8 }}>
                  {featured.examAt
                    ? fmtShortDate.format(
                        new Date(featured.examAt.getTime() + 13 * 24 * 60 * 60 * 1000),
                      )
                    : '—'}
                </div>
                <div className="fs-14" style={{ fontWeight: 500, marginBottom: 4 }}>
                  {t('milestoneResultsLabel')}
                </div>
                <div className="fs-13 text-soft">{t('milestoneResultsSub')}</div>
              </div>
            </div>

            {others.length > 0 ? (
              <>
                <h3 style={{ marginTop: 64, marginBottom: 24 }}>
                  {t.rich('otherHeading', richTags)}
                </h3>
                <div className="event-list">
                  {others.map((e) => (
                    <Link key={e.id} href={`/concours/${e.slug}`} className="event">
                      <div className="event-date">
                        <div className="day">
                          {String(e.closeAt.getDate()).padStart(2, '0')}
                        </div>
                        <div className="month">
                          {fmtMonthShort.format(e.closeAt)}{' '}
                          {String(e.closeAt.getFullYear()).slice(2)}
                        </div>
                      </div>
                      <div>
                        <h4>{e.title}</h4>
                        <p className="event-desc fs-14 text-mid">
                          {t('otherClosesOn', {
                            kind: KIND_LABEL[e.kind] ?? e.kind,
                            date: fmtDate.format(e.closeAt),
                          })}
                        </p>
                      </div>
                      <div className="event-meta">
                        <span>{fmtXof(e.feeXof)}</span>
                      </div>
                      <span className="btn btn-ghost btn-sm">
                        {t('details')} <span className="arrow">→</span>
                      </span>
                    </Link>
                  ))}
                </div>
              </>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
