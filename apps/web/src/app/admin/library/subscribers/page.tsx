import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/rbac';
import { prisma } from '@cpfa/db';
import type { Prisma } from '@cpfa/db';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Abonnés bibliothèque — Admin CPFA' };

const fmtDate = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short' });

const STATUS_PILL: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'En attente', className: 'pill-warning' },
  ACTIVE: { label: 'Actif', className: 'pill-success' },
  EXPIRED: { label: 'Expiré', className: '' },
  CANCELLED: { label: 'Annulé', className: '' },
};

const TIER_LABEL: Record<string, string> = {
  STUDENT: 'Étudiant',
  PROFESSIONAL: 'Professionnel',
  HOME_LOAN: 'Domicile',
};

export default async function AdminSubscribersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect('/sign-in?callbackUrl=/admin/library/subscribers');
  if (!hasPermission(session.user.roles, 'library:manage')) redirect('/admin');

  const { q, status } = await searchParams;
  const where: Prisma.SubscriptionWhereInput = {
    ...(status && STATUS_PILL[status]
      ? { status: status as Prisma.SubscriptionWhereInput['status'] }
      : {}),
    ...(q
      ? {
          OR: [
            { cardNumber: { contains: q, mode: 'insensitive' } },
            { user: { email: { contains: q, mode: 'insensitive' } } },
            { user: { firstName: { contains: q, mode: 'insensitive' } } },
            { user: { lastName: { contains: q, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };

  const subscriptions = await prisma.subscription.findMany({
    where,
    orderBy: [{ createdAt: 'desc' }],
    take: 100,
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
    },
  });

  return (
    <>
      <div
        className="row"
        style={{ justifyContent: 'space-between', alignItems: 'end', marginBottom: 24, gap: 24 }}
      >
        <div>
          <div className="breadcrumb">
            Admin · <Link href="/admin/library">Bibliothèque</Link> · <span>Abonnés</span>
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 3vw, 36px)', marginTop: 8 }}>
            Abonnés · {subscriptions.length}
          </h2>
        </div>
        <a href="/api/admin/exports/subscriptions.csv" className="btn btn-ghost">
          Export CSV
        </a>
      </div>

      <form className="panel" style={{ padding: 16, marginBottom: 24 }}>
        <div className="row gap-3" style={{ flexWrap: 'wrap', alignItems: 'end' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label className="label" htmlFor="filter-q">Recherche</label>
            <input
              id="filter-q"
              name="q"
              defaultValue={q ?? ''}
              placeholder="Nom, email, n° de carte"
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="filter-status">Statut</label>
            <select id="filter-status" name="status" defaultValue={status ?? ''} className="select">
              <option value="">Tous</option>
              {Object.entries(STATUS_PILL).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-ghost btn-sm">Filtrer</button>
          {(q || status) ? (
            <Link href="/admin/library/subscribers" className="btn-link fs-13">Réinitialiser</Link>
          ) : null}
        </div>
      </form>

      <div className="panel">
        {subscriptions.length === 0 ? (
          <p className="text-soft" style={{ padding: 24 }}>
            Aucun abonné ne correspond. Crée des abonnements depuis la fiche d&apos;un utilisateur
            via <Link href="/admin/users">/admin/users</Link>.
          </p>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Carte</th>
                <th>Abonné</th>
                <th>Formule</th>
                <th>Statut</th>
                <th>Échéance</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((s) => {
                const fullName =
                  [s.user.firstName, s.user.lastName].filter(Boolean).join(' ') || s.user.email;
                const pill = STATUS_PILL[s.status] ?? { label: s.status, className: '' };
                const expired = s.expiresAt && s.expiresAt.getTime() < Date.now();
                return (
                  <tr key={s.id}>
                    <td className="mono fs-13">{s.cardNumber}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{fullName}</div>
                      <div className="fs-13 text-soft">{s.user.email}</div>
                    </td>
                    <td className="fs-13">{TIER_LABEL[s.tier] ?? s.tier}</td>
                    <td><span className={'pill ' + pill.className}>{pill.label}</span></td>
                    <td className="mono fs-13" style={{ color: expired ? 'var(--danger)' : undefined }}>
                      {s.expiresAt ? fmtDate.format(s.expiresAt) : '—'}
                    </td>
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
        )}
      </div>
    </>
  );
}
