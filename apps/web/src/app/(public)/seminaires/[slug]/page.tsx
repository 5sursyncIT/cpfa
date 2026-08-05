import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@cpfa/db';
import { formatDateTime, formatNumber, formatXof } from '@cpfa/lib/i18n';
import { RegisterSeminarButton } from '@/components/training/register-seminar-button';
import { resolveLocale } from '@/i18n/request';
import { richTags } from '@/lib/i18n-tags';
import { mediaUrl } from '@/lib/media';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, t] = await Promise.all([params, getTranslations('seminarDetail')]);
  const seminar = await prisma.seminar.findUnique({ where: { slug }, select: { title: true } });
  return { title: seminar ? `${seminar.title} — CPFA` : t('notFound') };
}

export default async function SeminarPage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, t, locale] = await Promise.all([
    params,
    getTranslations('seminarDetail'),
    resolveLocale(),
  ]);
  const seminar = await prisma.seminar.findUnique({
    where: { slug },
    include: { speakers: true },
  });
  if (!seminar || !seminar.published) notFound();

  const taken = await prisma.registration.count({
    where: { seminarId: seminar.id, status: { in: ['SUBMITTED', 'PAID', 'VALIDATED'] } },
  });
  const seatsLeft = Math.max(0, seminar.capacity - taken);
  // Brochure du séminaire (§1.3) — téléversée depuis /admin/seminars.
  const brochureUrl = mediaUrl(seminar.brochureKey);

  return (
    <div>
      <div className="container">
        <div className="page-head" style={{ paddingBottom: 0 }}>
          <div className="breadcrumb">
            CPFA · {t('breadcrumb')} · <span>{seminar.title}</span>
          </div>
          <div className="detail-hero">
            <div>
              <span
                className="pill"
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  color: 'white',
                  borderColor: 'transparent',
                  marginBottom: 16,
                }}
              >
                {t('pillPrefix')} · {formatDateTime(seminar.startsAt, locale)}
              </span>
              <h1>{seminar.title}</h1>
            </div>
          </div>
        </div>

        <div className="detail-grid">
          <div>
            {seminar.description ? (
              <p
                className="fs-17 text-mid"
                style={{ lineHeight: 1.55, marginBottom: 32, maxWidth: 720 }}
              >
                {seminar.description}
              </p>
            ) : null}

            {seminar.speakers.length > 0 ? (
              <>
                <h3 style={{ marginBottom: 24 }}>{t.rich('speakersHeading', richTags)}</h3>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: 16,
                  }}
                >
                  {seminar.speakers.map((sp) => (
                    <div key={sp.id} className="card">
                      <h4 style={{ fontSize: 18 }}>{sp.fullName}</h4>
                      {sp.title ? (
                        <p className="fs-13 text-soft" style={{ marginTop: 4 }}>
                          {sp.title}
                        </p>
                      ) : null}
                      {sp.bio ? (
                        <p className="fs-14 text-mid" style={{ marginTop: 12, lineHeight: 1.5 }}>
                          {sp.bio}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </div>

          <aside className="enroll-card">
            <div>
              <div className="label">{t('feeLabel')}</div>
              <div className="enroll-price">
                {seminar.priceXof === 0
                  ? formatXof(0, locale)
                  : formatNumber(seminar.priceXof, locale)}{' '}
                {seminar.priceXof === 0 ? null : <small>FCFA</small>}
              </div>
            </div>
            <div className="enroll-stat-row">
              <span className="label">{t('whenLabel')}</span>
              <span className="value">{formatDateTime(seminar.startsAt, locale)}</span>
            </div>
            {seminar.location ? (
              <div className="enroll-stat-row">
                <span className="label">{t('placeLabel')}</span>
                <span className="value">{seminar.location}</span>
              </div>
            ) : null}
            <div className="enroll-stat-row" style={{ borderBottom: '1px solid var(--line-soft)' }}>
              <span className="label">{t('availabilityLabel')}</span>
              <span className="value">
                {seatsLeft > 0 ? t('seatsLeft', { count: seatsLeft }) : t('soldOut')}
              </span>
            </div>
            <RegisterSeminarButton seminarId={seminar.id} disabled={seatsLeft === 0} />
            {brochureUrl ? (
              <a className="btn btn-ghost" href={brochureUrl} target="_blank" rel="noreferrer">
                {t('brochureCta')}
              </a>
            ) : null}
            <p className="fs-13 text-soft" style={{ lineHeight: 1.4 }}>
              {t.rich('discountNote', {
                ...richTags,
                price: formatXof(seminar.priceXof, locale),
              })}
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
