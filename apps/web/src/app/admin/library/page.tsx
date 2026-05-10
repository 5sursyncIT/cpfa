import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/rbac';
import { prisma } from '@cpfa/db';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Bibliothèque — Admin CPFA' };

const fmtXof = (n: number) => `${n.toLocaleString('fr-FR')} FCFA`;
const fmtDate = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' });

export default async function AdminLibraryDashboard() {
  const session = await auth();
  if (!session?.user) redirect('/sign-in?callbackUrl=/admin/library');
  if (!hasPermission(session.user.roles, 'library:manage')) redirect('/admin');

  const [
    resourcesCount,
    activeSubsCount,
    pendingSubsCount,
    expiredSubsCount,
    activeLoans,
    overdueLoans,
    lostCount,
    pendingPenaltyAgg,
    last30Loans,
    recentReturns,
  ] = await Promise.all([
    prisma.resource.count(),
    prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    prisma.subscription.count({ where: { status: 'PENDING' } }),
    prisma.subscription.count({ where: { status: 'EXPIRED' } }),
    prisma.loan.count({ where: { status: 'ACTIVE' } }),
    prisma.loan.count({
      where: { status: 'ACTIVE', dueAt: { lt: new Date() } },
    }),
    prisma.loan.count({ where: { status: 'LOST' } }),
    prisma.loan.aggregate({
      _sum: { penaltyAmount: true },
      where: {
        status: { in: ['RETURNED', 'LOST'] },
        penaltyAmount: { gt: 0 },
      },
    }),
    prisma.loan.findMany({
      where: {
        borrowedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { borrowedAt: 'desc' },
      take: 8,
      include: {
        resource: { select: { title: true } },
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    }),
    prisma.loan.findMany({
      where: { status: { in: ['RETURNED', 'LOST'] } },
      orderBy: { returnedAt: 'desc' },
      take: 8,
      include: {
        resource: { select: { title: true } },
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    }),
  ]);

  const pendingPenaltyXof = pendingPenaltyAgg._sum.penaltyAmount ?? 0;

  return (
    <>
      <div
        className="row"
        style={{ justifyContent: 'space-between', alignItems: 'end', marginBottom: 32, gap: 24 }}
      >
        <div>
          <div className="breadcrumb">
            Admin · <span>Bibliothèque</span>
          </div>
          <h2 style={{ fontSize: 'clamp(32px, 3.5vw, 44px)', marginTop: 8 }}>
            Gestion <em className="italic-emph">de la bibliothèque</em>
          </h2>
        </div>
        <div className="row gap-2">
          <Link href="/admin/library/borrow" className="btn btn-primary">
            + Prêter un ouvrage
          </Link>
          <Link href="/admin/library/resources/new" className="btn btn-ghost">
            + Ajouter une ressource
          </Link>
        </div>
      </div>

      <div className="kpi-row">
        <div className="kpi">
          <div className="label">Ressources</div>
          <div className="value">{resourcesCount}</div>
          <div className="delta up">
            <Link href="/admin/library/resources">Gérer le catalogue →</Link>
          </div>
        </div>
        <div className="kpi">
          <div className="label">Abonnés actifs</div>
          <div className="value">{activeSubsCount}</div>
          <div className="delta up">
            {pendingSubsCount} en attente · {expiredSubsCount} expirés
          </div>
        </div>
        <div className="kpi">
          <div className="label">Prêts en cours</div>
          <div className="value">{activeLoans}</div>
          <div className="delta up">
            <span style={{ color: overdueLoans > 0 ? 'var(--danger)' : undefined }}>
              {overdueLoans} en retard
            </span>
          </div>
        </div>
        <div className="kpi">
          <div className="label">Pénalités cumulées</div>
          <div className="value">{(pendingPenaltyXof / 1000).toFixed(0)}k</div>
          <div className="delta up">FCFA · {fmtXof(pendingPenaltyXof)} · {lostCount} perdus</div>
        </div>
      </div>

      <div className="admin-grid-2" style={{ marginTop: 32 }}>
        <div className="panel">
          <div className="panel-head">
            <h4>Prêts récents (30j)</h4>
            <Link href="/admin/loans" className="btn btn-ghost btn-sm">
              Tout voir
            </Link>
          </div>
          {last30Loans.length === 0 ? (
            <p className="text-soft" style={{ padding: 24 }}>
              Aucun prêt enregistré ces 30 derniers jours.
            </p>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Ouvrage</th>
                  <th>Abonné</th>
                  <th>Échéance</th>
                </tr>
              </thead>
              <tbody>
                {last30Loans.map((l) => {
                  const overdue =
                    l.status === 'ACTIVE' && l.dueAt.getTime() < Date.now();
                  const fullName =
                    [l.user.firstName, l.user.lastName].filter(Boolean).join(' ') ||
                    l.user.email;
                  return (
                    <tr key={l.id}>
                      <td>{l.resource.title}</td>
                      <td className="text-soft">{fullName}</td>
                      <td className={overdue ? 'mono' : 'mono text-soft'} style={{ color: overdue ? 'var(--danger)' : undefined }}>
                        {fmtDate.format(l.dueAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="panel">
          <div className="panel-head">
            <h4>Retours récents</h4>
            <Link href="/admin/loans?status=RETURNED" className="btn btn-ghost btn-sm">
              Historique
            </Link>
          </div>
          {recentReturns.length === 0 ? (
            <p className="text-soft" style={{ padding: 24 }}>
              Aucun retour enregistré.
            </p>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Ouvrage</th>
                  <th>Abonné</th>
                  <th>Pénalité</th>
                </tr>
              </thead>
              <tbody>
                {recentReturns.map((l) => {
                  const fullName =
                    [l.user.firstName, l.user.lastName].filter(Boolean).join(' ') ||
                    l.user.email;
                  return (
                    <tr key={l.id}>
                      <td>{l.resource.title}</td>
                      <td className="text-soft">{fullName}</td>
                      <td className="mono">
                        {l.status === 'LOST' ? (
                          <span className="pill pill-warning">Perdu · {fmtXof(l.penaltyAmount)}</span>
                        ) : l.penaltyAmount > 0 ? (
                          <span style={{ color: 'var(--orange-deep)' }}>{fmtXof(l.penaltyAmount)}</span>
                        ) : (
                          <span className="text-soft">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="admin-grid-2" style={{ marginTop: 32 }}>
        <Link href="/admin/library/resources" className="panel" style={{ padding: 24, textDecoration: 'none', color: 'inherit' }}>
          <div className="label">Catalogue</div>
          <h4 style={{ marginTop: 8 }}>Gérer les ressources</h4>
          <p className="fs-13 text-soft" style={{ marginTop: 8 }}>
            Livres, revues, mémoires, multimédia. CRUD complet, catégories, exemplaires.
          </p>
          <span className="btn-link fs-13" style={{ marginTop: 16, display: 'inline-block' }}>
            Ouvrir le catalogue →
          </span>
        </Link>

        <Link href="/admin/library/subscribers" className="panel" style={{ padding: 24, textDecoration: 'none', color: 'inherit' }}>
          <div className="label">Abonnés</div>
          <h4 style={{ marginTop: 8 }}>Gérer les cartes</h4>
          <p className="fs-13 text-soft" style={{ marginTop: 8 }}>
            Liste des abonnements, prolongation, suspension, encaissement des pénalités.
          </p>
          <span className="btn-link fs-13" style={{ marginTop: 16, display: 'inline-block' }}>
            Ouvrir les abonnés →
          </span>
        </Link>
      </div>
    </>
  );
}
