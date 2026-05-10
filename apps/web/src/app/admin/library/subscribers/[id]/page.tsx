import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/rbac';
import { prisma } from '@cpfa/db';
import { SubscriberActions } from './subscriber-actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Abonné — Admin CPFA' };

const fmtXof = (n: number) => `${n.toLocaleString('fr-FR')} FCFA`;
const fmtDate = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' });

const STATUS_PILL: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'En attente', className: 'pill-warning' },
  ACTIVE: { label: 'Actif', className: 'pill-success' },
  EXPIRED: { label: 'Expiré', className: '' },
  CANCELLED: { label: 'Annulé', className: '' },
};

const LOAN_PILL: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: 'En cours', className: 'pill-orange' },
  RETURNED: { label: 'Rendu', className: 'pill-success' },
  OVERDUE: { label: 'En retard', className: 'pill-warning' },
  LOST: { label: 'Perdu', className: 'pill-warning' },
};

const TIER_LABEL: Record<string, string> = {
  STUDENT: 'Étudiant',
  PROFESSIONAL: 'Professionnel',
  HOME_LOAN: 'Domicile',
};

export default async function SubscriberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect('/sign-in?callbackUrl=/admin/library/subscribers');
  if (!hasPermission(session.user.roles, 'library:manage')) redirect('/admin');

  const { id } = await params;
  const sub = await prisma.subscription.findUnique({
    where: { id },
    include: {
      user: true,
      loans: {
        orderBy: { borrowedAt: 'desc' },
        take: 100,
        include: { resource: { select: { id: true, title: true, authors: true } } },
      },
      payments: { orderBy: { createdAt: 'desc' }, take: 20 },
    },
  });
  if (!sub) notFound();

  const fullName =
    [sub.user.firstName, sub.user.lastName].filter(Boolean).join(' ') || sub.user.email;
  const pill = STATUS_PILL[sub.status] ?? { label: sub.status, className: '' };
  const activeLoans = sub.loans.filter((l) => l.status === 'ACTIVE');
  const overdueLoans = activeLoans.filter((l) => l.dueAt.getTime() < Date.now());
  const totalPenalties = sub.loans.reduce((acc, l) => acc + (l.penaltyAmount ?? 0), 0);
  const expired = sub.expiresAt && sub.expiresAt.getTime() < Date.now();

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <div className="breadcrumb">
          Admin · <Link href="/admin/library">Bibliothèque</Link> ·{' '}
          <Link href="/admin/library/subscribers">Abonnés</Link> · <span>{fullName}</span>
        </div>
        <div
          className="row"
          style={{ justifyContent: 'space-between', alignItems: 'end', gap: 24, marginTop: 8 }}
        >
          <div>
            <h2 style={{ fontSize: 'clamp(28px, 3vw, 36px)' }}>{fullName}</h2>
            <div className="fs-15 text-soft" style={{ marginTop: 4 }}>
              {sub.user.email}
              {sub.user.phone ? <> · {sub.user.phone}</> : null}
            </div>
          </div>
          <span className={'pill ' + pill.className}>{pill.label}</span>
        </div>
      </div>

      <div className="kpi-row">
        <div className="kpi">
          <div className="label">Carte</div>
          <div className="value mono" style={{ fontSize: 22 }}>{sub.cardNumber}</div>
          <div className="delta up">{TIER_LABEL[sub.tier] ?? sub.tier}</div>
        </div>
        <div className="kpi">
          <div className="label">Échéance</div>
          <div className="value" style={{ fontSize: 22, color: expired ? 'var(--danger)' : undefined }}>
            {sub.expiresAt ? fmtDate.format(sub.expiresAt) : '—'}
          </div>
          <div className="delta up">
            {sub.startedAt ? `Depuis ${fmtDate.format(sub.startedAt)}` : 'Pas encore activé'}
          </div>
        </div>
        <div className="kpi">
          <div className="label">Prêts actifs</div>
          <div className="value">{activeLoans.length}</div>
          <div className="delta up">
            <span style={{ color: overdueLoans.length > 0 ? 'var(--danger)' : undefined }}>
              {overdueLoans.length} en retard
            </span>
          </div>
        </div>
        <div className="kpi">
          <div className="label">Pénalités cumulées</div>
          <div className="value">{(totalPenalties / 1000).toFixed(0)}k</div>
          <div className="delta up">FCFA · {fmtXof(totalPenalties)}</div>
        </div>
      </div>

      <SubscriberActions
        subscriptionId={sub.id}
        status={sub.status}
        activeLoansCount={activeLoans.length}
      />

      <div className="panel" style={{ marginTop: 32 }}>
        <div className="panel-head">
          <h4>Historique des prêts</h4>
          <span className="fs-13 text-soft">{sub.loans.length} entrée(s)</span>
        </div>
        {sub.loans.length === 0 ? (
          <p className="text-soft" style={{ padding: 24 }}>Aucun prêt enregistré.</p>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Ouvrage</th>
                <th>Emprunt</th>
                <th>Échéance</th>
                <th>Retour</th>
                <th>Statut</th>
                <th>Pénalité</th>
              </tr>
            </thead>
            <tbody>
              {sub.loans.map((l) => {
                const overdue = l.status === 'ACTIVE' && l.dueAt.getTime() < Date.now();
                const lp = LOAN_PILL[l.status] ?? { label: l.status, className: '' };
                return (
                  <tr key={l.id}>
                    <td>{l.resource.title}</td>
                    <td className="mono fs-13 text-soft">{fmtDate.format(l.borrowedAt)}</td>
                    <td className="mono fs-13" style={{ color: overdue ? 'var(--danger)' : undefined }}>
                      {fmtDate.format(l.dueAt)}
                    </td>
                    <td className="mono fs-13 text-soft">
                      {l.returnedAt ? fmtDate.format(l.returnedAt) : '—'}
                    </td>
                    <td><span className={'pill ' + lp.className}>{lp.label}</span></td>
                    <td className="mono fs-13">
                      {l.penaltyAmount > 0 ? (
                        <span style={{ color: 'var(--orange-deep)' }}>
                          {fmtXof(l.penaltyAmount)}
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {sub.payments.length > 0 ? (
        <div className="panel" style={{ marginTop: 32 }}>
          <div className="panel-head">
            <h4>Paiements liés</h4>
            <span className="fs-13 text-soft">{sub.payments.length} paiement(s)</span>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Date</th>
                <th>Objet</th>
                <th>Provider</th>
                <th>Statut</th>
                <th>Montant</th>
              </tr>
            </thead>
            <tbody>
              {sub.payments.map((p) => (
                <tr key={p.id}>
                  <td className="mono fs-13 text-soft">{fmtDate.format(p.createdAt)}</td>
                  <td className="fs-13">{p.purpose}</td>
                  <td className="fs-13">{p.provider}</td>
                  <td>
                    <span
                      className={
                        'pill ' +
                        (p.status === 'CONFIRMED' ? 'pill-success' : p.status === 'FAILED' ? '' : 'pill-warning')
                      }
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="mono">{fmtXof(p.amountXof)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </>
  );
}
