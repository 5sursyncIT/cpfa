import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@cpfa/db';

export const dynamic = 'force-dynamic';

const fmtDate = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' });

const STATUS_PILL: Record<string, { label: string; className: string }> = {
  DRAFT: { label: 'Brouillon', className: '' },
  SUBMITTED: { label: 'En attente', className: '' },
  PAID: { label: 'Payée', className: 'pill-orange' },
  VALIDATED: { label: 'Confirmée', className: 'pill-success' },
  REJECTED: { label: 'Refusée', className: 'pill-warning' },
  CANCELLED: { label: 'Annulée', className: '' },
};

export default async function MyRegistrationsPage() {
  const session = (await auth())!;

  const registrations = await prisma.registration.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      course: { select: { title: true, priceXof: true } },
      seminar: { select: { title: true, startsAt: true, priceXof: true } },
      exam: { select: { title: true, examAt: true, feeXof: true } },
      payment: { select: { status: true, amountXof: true } },
    },
  });

  return (
    <div className="col gap-5">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'end' }}>
        <h3>Mes inscriptions &amp; candidatures</h3>
        <Link href="/formations" className="btn btn-primary btn-sm">
          Nouvelle inscription <span className="arrow">→</span>
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
        registrations.map((r) => {
          const target =
            r.course?.title ?? r.seminar?.title ?? r.exam?.title ?? '—';
          const session = r.course
            ? 'Cursus diplômant'
            : r.seminar?.startsAt
              ? `Séminaire · ${fmtDate.format(r.seminar.startsAt)}`
              : r.exam?.examAt
                ? `Concours · ${fmtDate.format(r.exam.examAt)}`
                : 'Concours d’entrée';
          const total =
            r.course?.priceXof ??
            r.seminar?.priceXof ??
            r.exam?.feeXof ??
            r.payment?.amountXof ??
            0;
          const paid = r.payment?.status === 'CONFIRMED' ? r.payment.amountXof : 0;
          const status = STATUS_PILL[r.status] ?? { label: r.status, className: '' };

          return (
            <div key={r.id} className="card" style={{ padding: 24 }}>
              <div
                className="row"
                style={{ justifyContent: 'space-between', alignItems: 'start', marginBottom: 16 }}
              >
                <div>
                  <div className="serif" style={{ fontSize: 28, lineHeight: 1.1, marginBottom: 6 }}>
                    {target}
                  </div>
                  <div className="fs-13 text-soft">{session}</div>
                </div>
                <span className={'pill ' + status.className}>
                  <span className="dot"></span>
                  {status.label}
                </span>
              </div>
              <div className="divider" style={{ margin: '16px 0' }}></div>
              <div
                className="row"
                style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}
              >
                <div className="row gap-6" style={{ flexWrap: 'wrap' }}>
                  <div>
                    <div className="label">Total</div>
                    <div className="fs-15" style={{ fontWeight: 500, marginTop: 4 }}>
                      {total.toLocaleString('fr-FR')} FCFA
                    </div>
                  </div>
                  <div>
                    <div className="label">Réglé</div>
                    <div className="fs-15" style={{ fontWeight: 500, marginTop: 4 }}>
                      {paid.toLocaleString('fr-FR')} FCFA
                    </div>
                  </div>
                  <div>
                    <div className="label">Référence</div>
                    <div className="fs-15 mono" style={{ marginTop: 4 }}>
                      {r.id.slice(0, 16).toUpperCase()}
                    </div>
                  </div>
                </div>
                <Link
                  href={`/me/inscriptions/${r.id}`}
                  className={
                    'btn ' +
                    (r.status === 'PAID' ? 'btn-orange' : 'btn-ghost')
                  }
                >
                  {r.status === 'PAID' ? 'Confirmer ma place' : 'Voir détails'}{' '}
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
