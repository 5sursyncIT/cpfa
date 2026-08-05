import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { auth, signOut } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/rbac';
import { Prisma, prisma } from '@cpfa/db';
import { AdminSideNav } from '@/components/cpfa/admin-side-nav';
import { AdminUiProvider } from '@/components/cpfa/admin-ui';
import { getMaintenanceSettings } from '@/lib/maintenance/guard';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/sign-in?callbackUrl=/admin');
  if (
    !hasPermission(session.user.roles, 'admin:any') &&
    !hasPermission(session.user.roles, 'library:manage')
  ) {
    redirect('/');
  }

  const [
    submittedRegs,
    pendingApplicants,
    pendingTrainers,
    pendingJobOffers,
    catalogCount,
    activeSubsCount,
    declaredPayments,
  ] = await Promise.all([
    prisma.registration.count({
      where: {
        status: { in: ['SUBMITTED', 'PAID'] },
        OR: [{ courseId: { not: null } }, { seminarId: { not: null } }],
      },
    }),
    prisma.registration.count({
      where: { status: { in: ['SUBMITTED', 'PAID'] }, examId: { not: null } },
    }),
    prisma.trainerProfile.count({ where: { status: 'PENDING' } }),
    prisma.jobPosting.count({ where: { status: 'DRAFT' } }),
    prisma.resource.count(),
    prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    // Paiements déclarés par un abonné (Wave / Orange Money) et pas encore
    // vérifiés : c'est la file d'attente de la comptabilité.
    prisma.payment.count({
      where: { status: 'PENDING', metadata: { path: ['declaration'], not: Prisma.DbNull } },
    }),
  ]);

  const sections = [
    {
      title: 'Pilotage',
      items: [
        { href: '/admin', label: "Vue d'ensemble" },
        { href: '/admin/audit', label: 'Audit' },
      ],
    },
    {
      title: 'Académique',
      items: [
        { href: '/admin/registrations', label: 'Inscriptions', count: submittedRegs },
        { href: '/admin/courses', label: 'Formations' },
        { href: '/admin/seminars', label: 'Séminaires' },
        { href: '/admin/exams', label: 'Concours', count: pendingApplicants },
        { href: '/admin/trainers', label: 'Formateurs', count: pendingTrainers },
        { href: '/admin/jobs', label: 'Job board', count: pendingJobOffers },
      ],
    },
    {
      title: 'Contenu',
      items: [
        { href: '/admin/articles', label: 'Actualités' },
        { href: '/admin/testimonials', label: 'Témoignages' },
        { href: '/admin/key-figures', label: 'Chiffres-clés' },
        { href: '/admin/partners', label: 'Partenaires' },
        { href: '/admin/governance', label: 'Gouvernance' },
        { href: '/admin/cms', label: 'Pages CMS' },
        { href: '/admin/media', label: 'Médias' },
        { href: '/admin/settings', label: 'Paramètres du site' },
      ],
    },
    {
      title: 'Bibliothèque',
      items: [
        { href: '/admin/library', label: "Vue d'ensemble" },
        { href: '/admin/library/resources', label: 'Catalogue', count: catalogCount },
        { href: '/admin/library/categories', label: 'Catégories' },
        { href: '/admin/library/subscribers', label: 'Abonnés', count: activeSubsCount },
      ],
    },
    {
      title: 'Système',
      items: [
        { href: '/admin/users', label: 'Utilisateurs' },
        { href: '/admin/payments', label: 'Paiements', count: declaredPayments },
        { href: '/admin/maintenance', label: 'Mode maintenance' },
      ],
    },
  ];

  const maintenance = await getMaintenanceSettings();

  return (
    <div>
      {maintenance.enabled ? (
        <div
          style={{
            background: 'var(--warning)',
            color: 'var(--navy-deep)',
            padding: '10px 24px',
            textAlign: 'center',
            fontSize: 14,
          }}
        >
          <strong>Le site public est en maintenance.</strong> Les visiteurs voient la page
          d&apos;attente.{' '}
          <Link href="/admin/maintenance" style={{ color: 'inherit', textDecoration: 'underline' }}>
            Remettre le site en ligne
          </Link>
        </div>
      ) : null}
      <div className="admin-topbar">
        <div className="admin-topbar-inner container">
          <span className="admin-topbar-kicker">Espace administrateur</span>
          <div className="admin-topbar-actions">
            <Link href="/" className="btn btn-ghost btn-sm admin-topbar-button">
              ← Retour au site public
            </Link>
            <form
              action={async () => {
                'use server';
                await signOut({ redirectTo: '/' });
              }}
            >
              <button type="submit" className="btn btn-ghost btn-sm admin-topbar-button">
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      </div>
      <div className="admin-shell">
        <AdminSideNav sections={sections} />
        <main id="main-content" tabIndex={-1} className="admin-main">
          <AdminUiProvider>{children}</AdminUiProvider>
        </main>
      </div>
    </div>
  );
}
