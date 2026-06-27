import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/rbac';
import { prisma } from '@cpfa/db';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Bibliothèque — Admin CPFA' };

export default async function AdminLibraryDashboard() {
  const session = await auth();
  if (!session?.user) redirect('/sign-in?callbackUrl=/admin/library');
  if (!hasPermission(session.user.roles, 'library:manage')) redirect('/admin');

  const [resourcesCount, categoriesCount, activeSubsCount, pendingSubsCount, expiredSubsCount] =
    await Promise.all([
      prisma.resource.count(),
      prisma.category.count(),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      prisma.subscription.count({ where: { status: 'PENDING' } }),
      prisma.subscription.count({ where: { status: 'EXPIRED' } }),
    ]);

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
          <p className="fs-13 text-soft" style={{ marginTop: 8 }}>
            Catalogue de consultation sur place — les abonnements servent de pass d&apos;accès.
          </p>
        </div>
        <div className="row gap-2">
          <Link href="/admin/library/resources/new" className="btn btn-primary">
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
          <div className="label">Catégories</div>
          <div className="value">{categoriesCount}</div>
          <div className="delta up">
            <Link href="/admin/library/categories">Gérer les catégories →</Link>
          </div>
        </div>
        <div className="kpi">
          <div className="label">Abonnés actifs</div>
          <div className="value">{activeSubsCount}</div>
          <div className="delta up">
            {pendingSubsCount} en attente · {expiredSubsCount} expirés
          </div>
        </div>
      </div>

      <div className="admin-grid-2" style={{ marginTop: 32 }}>
        <Link
          href="/admin/library/resources"
          className="panel"
          style={{ padding: 24, textDecoration: 'none', color: 'inherit' }}
        >
          <div className="label">Catalogue</div>
          <h4 style={{ marginTop: 8 }}>Gérer les ressources</h4>
          <p className="fs-13 text-soft" style={{ marginTop: 8 }}>
            Livres, revues, mémoires, multimédia — titre, auteur, cote, catégorie et mots-clés.
          </p>
          <span className="btn-link fs-13" style={{ marginTop: 16, display: 'inline-block' }}>
            Ouvrir le catalogue →
          </span>
        </Link>

        <Link
          href="/admin/library/subscribers"
          className="panel"
          style={{ padding: 24, textDecoration: 'none', color: 'inherit' }}
        >
          <div className="label">Abonnés</div>
          <h4 style={{ marginTop: 8 }}>Gérer les cartes d&apos;accès</h4>
          <p className="fs-13 text-soft" style={{ marginTop: 8 }}>
            Abonnements payants (pass d&apos;accès à la salle de consultation), prolongation,
            suspension, carte de membre PDF.
          </p>
          <span className="btn-link fs-13" style={{ marginTop: 16, display: 'inline-block' }}>
            Ouvrir les abonnés →
          </span>
        </Link>
      </div>
    </>
  );
}
