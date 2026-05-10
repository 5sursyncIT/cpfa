import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { prisma } from '@cpfa/db';
import { resolveLocale } from '@/i18n/request';

export const dynamic = 'force-dynamic';

const STATUS_PILL: Record<string, string> = {
  DRAFT: '',
  SUBMITTED: '',
  PAID: 'pill-orange',
  VALIDATED: 'pill-success',
  REJECTED: 'pill-warning',
  CANCELLED: '',
};

export default async function MyRegistrationsPage() {
  const session = (await auth())!;

  const [registrations, t, tStatus, locale] = await Promise.all([
    prisma.registration.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        course: { select: { title: true, priceXof: true } },
        seminar: { select: { title: true, startsAt: true, priceXof: true } },
        exam: { select: { title: true, examAt: true, feeXof: true } },
        payment: { select: { status: true, amountXof: true } },
      },
    }),
    getTranslations('meInscriptions'),
    getTranslations('regStatus'),
    resolveLocale(),
  ]);

  const fmtDate = new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'fr-FR', {
    dateStyle: 'medium',
  });

  return (
    <div className="col gap-5">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'end' }}>
        <h3>{t('h3')}</h3>
        <Link href="/formations" className="btn btn-primary btn-sm">
          {t('newCta')} <span className="arrow">→</span>
        </Link>
      </div>

      {registrations.length === 0 ? (
        <p className="text-soft">
          {t('empty')}{' '}
          <Link href="/formations" style={{ color: 'var(--ink)' }}>
            {t('browse')} →
          </Link>
        </p>
      ) : (
        registrations.map((r) => {
          const target = r.course?.title ?? r.seminar?.title ?? r.exam?.title ?? '—';
          const sessionLabel = r.course
            ? t('kindCourse')
            : r.seminar?.startsAt
              ? t('kindSeminar', { date: fmtDate.format(r.seminar.startsAt) })
              : r.exam?.examAt
                ? t('kindExam', { date: fmtDate.format(r.exam.examAt) })
                : t('kindExamFallback');
          const total =
            r.course?.priceXof ??
            r.seminar?.priceXof ??
            r.exam?.feeXof ??
            r.payment?.amountXof ??
            0;
          const paid = r.payment?.status === 'CONFIRMED' ? r.payment.amountXof : 0;
          const statusClass = STATUS_PILL[r.status] ?? '';

          return (
            <div key={r.id} className="card" style={{ padding: 24 }}>
              <div
                className="row"
                style={{
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  marginBottom: 16,
                }}
              >
                <div>
                  <div
                    className="serif"
                    style={{ fontSize: 28, lineHeight: 1.1, marginBottom: 6 }}
                  >
                    {target}
                  </div>
                  <div className="fs-13 text-soft">{sessionLabel}</div>
                </div>
                <span className={'pill ' + statusClass}>
                  <span className="dot"></span>
                  {tStatus(
                    r.status as
                      | 'DRAFT'
                      | 'SUBMITTED'
                      | 'PAID'
                      | 'VALIDATED'
                      | 'REJECTED'
                      | 'CANCELLED',
                  )}
                </span>
              </div>
              <div className="divider" style={{ margin: '16px 0' }}></div>
              <div
                className="row"
                style={{
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 16,
                }}
              >
                <div className="row gap-6" style={{ flexWrap: 'wrap' }}>
                  <div>
                    <div className="label">{t('totalLabel')}</div>
                    <div className="fs-15" style={{ fontWeight: 500, marginTop: 4 }}>
                      {total.toLocaleString('fr-FR')} FCFA
                    </div>
                  </div>
                  <div>
                    <div className="label">{t('paidLabel')}</div>
                    <div className="fs-15" style={{ fontWeight: 500, marginTop: 4 }}>
                      {paid.toLocaleString('fr-FR')} FCFA
                    </div>
                  </div>
                  <div>
                    <div className="label">{t('refLabel')}</div>
                    <div className="fs-15 mono" style={{ marginTop: 4 }}>
                      {r.id.slice(0, 16).toUpperCase()}
                    </div>
                  </div>
                </div>
                <Link
                  href={`/me/inscriptions/${r.id}`}
                  className={'btn ' + (r.status === 'PAID' ? 'btn-orange' : 'btn-ghost')}
                >
                  {r.status === 'PAID' ? t('confirmCta') : t('viewCta')}{' '}
                  <span className="arrow">→</span>
                </Link>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
