import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@cpfa/db';
import { MemberCard } from '@/components/cpfa/member-card';
import { LoanList } from '@/components/cpfa/loan-list';
import { pickCover } from '@/lib/cpfa-mappers';

export const dynamic = 'force-dynamic';

const fmtMonth = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' });
const fmtFull = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  year: '2-digit',
});

const STATUS_PILL: Record<string, string> = {
  DRAFT: '',
  SUBMITTED: '',
  PAID: 'pill-orange',
  VALIDATED: 'pill-success',
  REJECTED: 'pill-warning',
  CANCELLED: '',
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Brouillon',
  SUBMITTED: 'En attente',
  PAID: 'Payée',
  VALIDATED: 'Confirmée',
  REJECTED: 'Refusée',
  CANCELLED: 'Annulée',
};

export default async function MeDashboardPage() {
  const session = (await auth())!;
  const userId = session.user.id;

  const [activeLoans, subscription, registrations, nextSeminar] = await Promise.all([
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
  ]);

  const fullName =
    session.user.name ??
    session.user.email ??
    'Abonné·e CPFA';
  const cardNumber = subscription?.cardNumber ?? 'CPFA · — — —';
  const promotion = subscription?.startedAt
    ? `Promotion ${subscription.startedAt.getFullYear()}`
    : '—';
  const validUntil = subscription?.expiresAt
    ? fmtFull.format(subscription.expiresAt)
    : '—';

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
      <div
        className="row gap-5"
        style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr' }}
      >
        <MemberCard
          fullName={fullName}
          cardNumber={cardNumber}
          promotion={promotion}
          status={subscription ? 'Abonné·e' : 'Visiteur·euse'}
          validUntil={validUntil}
        />
        <div
          className="card"
          style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
        >
          {nextSeminar?.seminar ? (
            <>
              <div>
                <div className="label">Prochain rendez-vous</div>
                <div
                  className="serif"
                  style={{ fontSize: 32, lineHeight: 1.05, margin: '12px 0' }}
                >
                  {nextSeminar.seminar.title}
                </div>
                <div className="fs-13 text-soft">
                  {fmtMonth.format(nextSeminar.seminar.startsAt)}
                </div>
              </div>
              <div className="row gap-2" style={{ marginTop: 16 }}>
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
                <div className="label">Prochain rendez-vous</div>
                <div
                  className="serif"
                  style={{ fontSize: 32, lineHeight: 1.05, margin: '12px 0' }}
                >
                  Aucun séminaire
                  <br />à venir
                </div>
                <div className="fs-13 text-soft">
                  Consultez le calendrier des séminaires.
                </div>
              </div>
              <div className="row gap-2" style={{ marginTop: 16 }}>
                <Link href="/seminaires" className="btn btn-ghost btn-sm">
                  Voir les séminaires <span className="arrow">→</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      <div>
        <div
          className="row"
          style={{ justifyContent: 'space-between', alignItems: 'end', marginBottom: 16 }}
        >
          <h3>Prêts en cours</h3>
          <Link href="/me/bibliotheque" className="btn-link fs-13">
            Voir tout →
          </Link>
        </div>
        {loanItems.length === 0 ? (
          <p className="text-soft">
            Aucun prêt en cours. Demandez un emprunt à l&apos;accueil de la bibliothèque.
          </p>
        ) : (
          <LoanList items={loanItems} />
        )}
      </div>

      <div>
        <div
          className="row"
          style={{ justifyContent: 'space-between', alignItems: 'end', marginBottom: 16 }}
        >
          <h3>Mes inscriptions</h3>
          <Link href="/me/inscriptions" className="btn-link fs-13">
            Voir tout →
          </Link>
        </div>
        {registrations.length === 0 ? (
          <p className="text-soft">
            Aucune inscription pour le moment.{' '}
            <Link href="/formations" style={{ color: 'var(--ink)' }}>
              Parcourir les formations →
            </Link>
          </p>
        ) : (
          <div className="col gap-3">
            {registrations.map((r) => {
              const target =
                r.course?.title ?? r.seminar?.title ?? r.exam?.title ?? '—';
              const sessionLabel = r.seminar?.startsAt
                ? fmtMonth.format(r.seminar.startsAt)
                : r.course
                  ? 'Cursus'
                  : 'Concours';
              return (
                <Link
                  key={r.id}
                  href={`/me/inscriptions/${r.id}`}
                  className="card row gap-4"
                  style={{
                    alignItems: 'center',
                    padding: 18,
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div className="fs-15" style={{ fontWeight: 500 }}>
                      {target}
                    </div>
                    <div className="fs-13 text-soft" style={{ marginTop: 4 }}>
                      {sessionLabel}
                    </div>
                  </div>
                  <span className={'pill ' + (STATUS_PILL[r.status] ?? '')}>
                    <span className="dot"></span>
                    {STATUS_LABEL[r.status] ?? r.status}
                  </span>
                  <span className="btn btn-ghost btn-sm">
                    Détails <span className="arrow">→</span>
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
