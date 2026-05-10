import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/rbac';
import { prisma } from '@cpfa/db';
import { MemberCard } from '@/components/cpfa/member-card';
import { LoanList } from '@/components/cpfa/loan-list';
import { pickCover } from '@/lib/cpfa-mappers';
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

export default async function MeDashboardPage() {
  const session = (await auth())!;
  const userId = session.user.id;
  const isStaff =
    hasPermission(session.user.roles, 'admin:any') ||
    hasPermission(session.user.roles, 'library:manage');

  const [activeLoans, subscription, registrations, nextSeminar, t, tStatus, locale] =
    await Promise.all([
      prisma.loan.findMany({
        where: { userId, status: 'ACTIVE' },
        orderBy: { dueAt: 'asc' },
        take: 3,
        include: { resource: { select: { id: true, title: true, authors: true } } },
      }),
      prisma.subscription.findFirst({
        where: { userId, status: 'ACTIVE' },
        select: { cardNumber: true, expiresAt: true, startedAt: true },
      }),
      prisma.registration.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: {
          course: { select: { title: true } },
          seminar: { select: { title: true, startsAt: true, location: true } },
          exam: { select: { title: true } },
        },
      }),
      prisma.registration.findFirst({
        where: {
          userId,
          seminarId: { not: null },
          status: { in: ['PAID', 'VALIDATED'] },
          seminar: { startsAt: { gte: new Date() } },
        },
        orderBy: { seminar: { startsAt: 'asc' } },
        include: {
          seminar: { select: { title: true, startsAt: true, location: true } },
        },
      }),
      getTranslations('me'),
      getTranslations('regStatus'),
      resolveLocale(),
    ]);

  const fmtMonth = new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'fr-FR', {
    day: '2-digit',
    month: 'short',
  });
  const fmtFull = new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });

  const fullName = session.user.name ?? session.user.email ?? t('fallbackCardholder');
  const cardNumber = subscription?.cardNumber ?? t('fallbackCardNumber');
  const promotion = subscription?.startedAt
    ? t('promotion', { year: subscription.startedAt.getFullYear() })
    : '—';
  const validUntil = subscription?.expiresAt ? fmtFull.format(subscription.expiresAt) : '—';

  const loanItems = activeLoans.map((l) => ({
    id: l.id,
    title: l.resource.title,
    author: (l.resource.authors[0] ?? '').toUpperCase(),
    due: fmtMonth.format(l.dueAt),
    late: l.dueAt.getTime() < Date.now(),
    cover: pickCover<'navy' | 'orange' | 'ink' | 'cream' | 'olive'>(l.resource.id, [
      'navy',
      'orange',
      'ink',
      'cream',
      'olive',
    ]),
  }));

  return (
    <div className="col gap-6">
      {isStaff ? (
        <Link href="/admin" className="staff-banner">
          <div>
            <div className="staff-banner-kicker">{t('staffKicker')}</div>
            <div className="staff-banner-title">{t('staffTitle')}</div>
          </div>
          <span className="btn btn-orange btn-sm">
            {t('staffCta')} <span className="arrow">→</span>
          </span>
        </Link>
      ) : null}

      <div className="member-dashboard-grid">
        <MemberCard
          fullName={fullName}
          cardNumber={cardNumber}
          promotion={promotion}
          status={subscription ? t('memberStatusSubscriber') : t('memberStatusVisitor')}
          validUntil={validUntil}
        />
        <div className="card member-next-card">
          {nextSeminar?.seminar ? (
            <>
              <div>
                <div className="label">{t('nextEventLabel')}</div>
                <div className="member-next-title">{nextSeminar.seminar.title}</div>
                <div className="fs-13 text-soft">
                  {fmtMonth.format(nextSeminar.seminar.startsAt)}
                </div>
              </div>
              <div className="member-pill-row">
                <span className="pill pill-orange">
                  {fmtMonth.format(nextSeminar.seminar.startsAt)}
                </span>
                {nextSeminar.seminar.location ? (
                  <span className="pill">{nextSeminar.seminar.location}</span>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <div>
                <div className="label">{t('nextEventLabel')}</div>
                <div className="member-next-title">{t('noUpcomingSeminar')}</div>
                <div className="fs-13 text-soft">{t('noUpcomingSeminarDesc')}</div>
              </div>
              <div className="member-pill-row">
                <Link href="/seminaires" className="btn btn-ghost btn-sm">
                  {t('viewSeminars')} <span className="arrow">→</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      <div>
        <div className="section-title-row">
          <h3>{t('activeLoansHeading')}</h3>
          <Link href="/me/bibliotheque" className="btn-link fs-13">
            {t('viewAll')} →
          </Link>
        </div>
        {loanItems.length === 0 ? (
          <p className="text-soft">{t('noActiveLoans')}</p>
        ) : (
          <LoanList items={loanItems} />
        )}
      </div>

      <div>
        <div className="section-title-row">
          <h3>{t('registrationsHeading')}</h3>
          <Link href="/me/inscriptions" className="btn-link fs-13">
            {t('viewAll')} →
          </Link>
        </div>
        {registrations.length === 0 ? (
          <p className="text-soft">
            {t('noRegistrations')}{' '}
            <Link href="/formations" style={{ color: 'var(--ink)' }}>
              {t('browseCourses')} →
            </Link>
          </p>
        ) : (
          <div className="col gap-3">
            {registrations.map((r) => {
              const target = r.course?.title ?? r.seminar?.title ?? r.exam?.title ?? '—';
              const sessionLabel = r.seminar?.startsAt
                ? fmtMonth.format(r.seminar.startsAt)
                : r.course
                  ? t('regKindCourse')
                  : t('regKindExam');
              return (
                <Link
                  key={r.id}
                  href={`/me/inscriptions/${r.id}`}
                  className="card member-registration-card"
                >
                  <div className="member-registration-main">
                    <div className="member-registration-title">{target}</div>
                    <div className="member-registration-meta">{sessionLabel}</div>
                  </div>
                  <span className={'pill ' + (STATUS_PILL[r.status] ?? '')}>
                    <span className="dot"></span>
                    {tStatus(r.status as 'DRAFT' | 'SUBMITTED' | 'PAID' | 'VALIDATED' | 'REJECTED' | 'CANCELLED')}
                  </span>
                  <span className="btn btn-ghost btn-sm">
                    {t('details')} <span className="arrow">→</span>
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
