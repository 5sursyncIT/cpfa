import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/rbac';
import { prisma } from '@cpfa/db';
import { LIBRARY_TIERS, type SubscriptionTier } from '@/lib/library-rules';
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

// Libellés lus depuis LIBRARY_TIERS : l'ancienne copie locale disait encore
// « Accès étendu » là où la procédure parle d'emprunt à domicile.
const tierLabel = (tier: string) => LIBRARY_TIERS[tier as SubscriptionTier]?.label ?? tier;

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
      payments: { orderBy: { createdAt: 'desc' }, take: 20 },
    },
  });
  if (!sub) notFound();

  const fullName =
    [sub.user.firstName, sub.user.lastName].filter(Boolean).join(' ') || sub.user.email;
  const pill = STATUS_PILL[sub.status] ?? { label: sub.status, className: '' };
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
          <div className="value mono" style={{ fontSize: 22 }}>
            {sub.cardNumber}
          </div>
          <div className="delta up">{tierLabel(sub.tier)}</div>
        </div>
        <div className="kpi">
          <div className="label">Échéance</div>
          <div
            className="value"
            style={{ fontSize: 22, color: expired ? 'var(--danger)' : undefined }}
          >
            {sub.expiresAt ? fmtDate.format(sub.expiresAt) : '—'}
          </div>
          <div className="delta up">
            {sub.startedAt ? `Depuis ${fmtDate.format(sub.startedAt)}` : 'Pas encore activé'}
          </div>
        </div>
      </div>

      <div className="row gap-3" style={{ marginTop: 24, flexWrap: 'wrap' }}>
        <a
          href={`/api/admin/subscriptions/${sub.id}/contrat`}
          className="btn btn-ghost"
          title="Exemplaire à imprimer et à faire signer à l'accueil"
        >
          📄 Contrat d&apos;abonnement
        </a>
      </div>

      <SubscriberActions subscriptionId={sub.id} status={sub.status} />

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
                        (p.status === 'CONFIRMED'
                          ? 'pill-success'
                          : p.status === 'FAILED'
                            ? ''
                            : 'pill-warning')
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
