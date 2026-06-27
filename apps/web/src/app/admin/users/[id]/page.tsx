import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/rbac';
import { prisma } from '@cpfa/db';
import { roleLabel } from '@/lib/labels';
import { UserAdminActions } from './user-admin-actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Utilisateur — Admin CPFA' };

const fmtDate = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' });
const fmtXof = (n: number) => `${n.toLocaleString('fr-FR')} FCFA`;

const STATUS_PILL: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'En attente', className: 'pill-warning' },
  ACTIVE: { label: 'Actif', className: 'pill-success' },
  EXPIRED: { label: 'Expiré', className: '' },
  CANCELLED: { label: 'Annulé', className: '' },
  DRAFT: { label: 'Brouillon', className: '' },
  SUBMITTED: { label: 'Soumise', className: 'pill-warning' },
  PAID: { label: 'Réglée', className: 'pill-orange' },
  VALIDATED: { label: 'Validée', className: 'pill-success' },
  REJECTED: { label: 'Refusée', className: '' },
  CONFIRMED: { label: 'Confirmé', className: 'pill-success' },
  FAILED: { label: 'Échoué', className: '' },
  REFUNDED: { label: 'Remboursé', className: 'pill-warning' },
  RETURNED: { label: 'Rendu', className: 'pill-success' },
  LOST: { label: 'Perdu', className: 'pill-warning' },
};

const TIER_LABEL: Record<string, string> = {
  STUDENT: 'Étudiant',
  PROFESSIONAL: 'Professionnel',
  HOME_LOAN: 'Domicile',
};

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect('/sign-in?callbackUrl=/admin/users');
  if (!hasPermission(session.user.roles, 'admin:any')) redirect('/admin');

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      subscriptions: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
      registrations: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          course: { select: { title: true } },
          seminar: { select: { title: true } },
          exam: { select: { title: true } },
        },
      },
      payments: { orderBy: { createdAt: 'desc' }, take: 10 },
    },
  });
  if (!user) notFound();

  const fullName =
    [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;
  const callerIsSuperAdmin = (session.user.roles as string[]).includes('SUPER_ADMIN');
  const isSelf = user.id === session.user.id;

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <div className="breadcrumb">
          Admin · <Link href="/admin/users">Utilisateurs</Link> · <span>{fullName}</span>
        </div>
        <h2 style={{ fontSize: 'clamp(28px, 3vw, 36px)', marginTop: 8 }}>{fullName}</h2>
        <div className="fs-15 text-soft" style={{ marginTop: 4 }}>
          {user.email}
          {user.phone ? <> · {user.phone}</> : null}
          {' · '} membre depuis {fmtDate.format(user.createdAt)}
        </div>
        <div className="row gap-2" style={{ marginTop: 12, flexWrap: 'wrap' }}>
          {user.roles.map((r) => (
            <span key={r} className="pill fs-13">{roleLabel(r)}</span>
          ))}
          {user.twoFactorEnabled ? (
            <span className="pill pill-success">2FA activé</span>
          ) : (
            <span className="pill text-soft">2FA désactivé</span>
          )}
          {user.passwordHash ? null : (
            <span className="pill pill-warning">Pas de mot de passe</span>
          )}
        </div>
      </div>

      <UserAdminActions
        userId={user.id}
        canRevokePrivileged={callerIsSuperAdmin}
        isSelf={isSelf}
        initial={{
          firstName: user.firstName ?? '',
          lastName: user.lastName ?? '',
          phone: user.phone ?? '',
          locale: user.locale,
        }}
        twoFactorEnabled={user.twoFactorEnabled}
        hasPassword={!!user.passwordHash}
      />

      {user.subscriptions.length > 0 ? (
        <div className="panel" style={{ marginTop: 32 }}>
          <div className="panel-head">
            <h4>Abonnements bibliothèque</h4>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Carte</th>
                <th>Formule</th>
                <th>Statut</th>
                <th>Échéance</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {user.subscriptions.map((s) => {
                const pill = STATUS_PILL[s.status] ?? { label: s.status, className: '' };
                return (
                  <tr key={s.id}>
                    <td className="mono fs-13">{s.cardNumber}</td>
                    <td className="fs-13">{TIER_LABEL[s.tier] ?? s.tier}</td>
                    <td><span className={'pill ' + pill.className}>{pill.label}</span></td>
                    <td className="mono fs-13">{s.expiresAt ? fmtDate.format(s.expiresAt) : '—'}</td>
                    <td>
                      <Link
                        href={`/admin/library/subscribers/${s.id}`}
                        className="btn-link fs-13"
                      >
                        Détail →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      {user.registrations.length > 0 ? (
        <div className="panel" style={{ marginTop: 32 }}>
          <div className="panel-head">
            <h4>Inscriptions</h4>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Programme</th>
                <th>Type</th>
                <th>Statut</th>
                <th>Soumise</th>
              </tr>
            </thead>
            <tbody>
              {user.registrations.map((r) => {
                const target = r.course?.title ?? r.seminar?.title ?? r.exam?.title ?? '—';
                const kind = r.course ? 'Formation' : r.seminar ? 'Séminaire' : r.exam ? 'Concours' : '—';
                const pill = STATUS_PILL[r.status] ?? { label: r.status, className: '' };
                return (
                  <tr key={r.id}>
                    <td>{target}</td>
                    <td className="fs-13 text-soft">{kind}</td>
                    <td><span className={'pill ' + pill.className}>{pill.label}</span></td>
                    <td className="mono fs-13 text-soft">{fmtDate.format(r.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      {user.payments.length > 0 ? (
        <div className="panel" style={{ marginTop: 32 }}>
          <div className="panel-head">
            <h4>Paiements</h4>
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
              {user.payments.map((p) => {
                const pill = STATUS_PILL[p.status] ?? { label: p.status, className: '' };
                return (
                  <tr key={p.id}>
                    <td className="mono fs-13 text-soft">{fmtDate.format(p.createdAt)}</td>
                    <td className="fs-13">{p.purpose}</td>
                    <td className="fs-13 mono">{p.provider}</td>
                    <td><span className={'pill ' + pill.className}>{pill.label}</span></td>
                    <td className="mono">{fmtXof(p.amountXof)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </>
  );
}
