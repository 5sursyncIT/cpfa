import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { auth, signOut } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/rbac';
import { prisma } from '@cpfa/db';
import { AdminSideNav } from '@/components/cpfa/admin-side-nav';

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
    activeLoansCount,
    overdueLoansCount,
    catalogCount,
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
    prisma.loan.count({ where: { status: 'ACTIVE' } }),
    prisma.loan.count({ where: { status: 'ACTIVE', dueAt: { lt: new Date() } } }),
    prisma.resource.count(),
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
      title: 'Gestion',
      items: [
        { href: '/admin/registrations', label: 'Inscriptions', count: submittedRegs },
        { href: '/admin/exams', label: 'Candidatures', count: pendingApplicants },
        { href: '/admin/articles', label: 'Actualités' },
        { href: '/admin/cms', label: 'Pages CMS' },
      ],
    },
    {
      title: 'Bibliothèque',
      items: [
        { href: '/admin/loans', label: 'Prêts en cours', count: activeLoansCount },
        { href: '/admin/loans?overdue=1', label: 'Retards', count: overdueLoansCount },
        { href: '/bibliotheque', label: 'Catalogue', count: catalogCount },
      ],
    },
    {
      title: 'Système',
      items: [
        { href: '/admin/users', label: 'Utilisateurs' },
        { href: '/admin/payments', label: 'Paiements' },
      ],
    },
  ];

  return (
    <div>
      <div style={{ background: 'var(--ink)', color: 'var(--bg)', padding: '12px 0' }}>
        <div
          className="container row"
          style={{ justifyContent: 'space-between', alignItems: 'center' }}
        >
          <span
            className="mono"
            style={{
              fontSize: 11,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              opacity: 0.7,
            }}
          >
            ⚙ Espace administrateur
          </span>
          <div className="row gap-2">
            <Link
              href="/"
              className="btn btn-ghost btn-sm"
              style={{ color: 'var(--bg)', borderColor: 'rgba(255,255,255,0.2)' }}
            >
              ← Retour au site public
            </Link>
            <form
              action={async () => {
                'use server';
                await signOut({ redirectTo: '/' });
              }}
            >
              <button
                type="submit"
                className="btn btn-ghost btn-sm"
                style={{ color: 'var(--bg)', borderColor: 'rgba(255,255,255,0.2)' }}
              >
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      </div>
      <div className="admin-shell">
        <AdminSideNav sections={sections} />
        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}
