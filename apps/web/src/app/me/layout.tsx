import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { auth, signOut } from '@/lib/auth';
import { TopNav } from '@/components/cpfa/top-nav';
import { CpfaFooter } from '@/components/cpfa/footer';
import { MemberSideNav } from '@/components/cpfa/member-side-nav';
import { prisma } from '@cpfa/db';

export default async function MeLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/sign-in?callbackUrl=/me');

  const userId = session.user.id;
  const firstName = (session.user.name ?? '').split(' ')[0] || '';
  const fallbackName = session.user.name ?? session.user.email ?? 'Mon espace';
  const email = session.user.email ?? '';

  const [activeLoansCount, registrationsCount, subscription] = await Promise.all([
    prisma.loan.count({ where: { userId, status: 'ACTIVE' } }),
    prisma.registration.count({ where: { userId } }),
    prisma.subscription.findFirst({
      where: { userId, status: 'ACTIVE' },
      select: { expiresAt: true },
    }),
  ]);

  const fmtDate = new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <>
      <TopNav active="/me" />
      <div className="container">
        <div className="page-head" style={{ paddingBottom: 32 }}>
          <div className="breadcrumb">
            CPFA · <span>Espace abonné</span>
          </div>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'end' }}>
            <div>
              <h1 style={{ fontSize: 'clamp(40px, 5vw, 64px)' }}>
                Bienvenue,{' '}
                <em className="italic-emph">{firstName || fallbackName}</em>.
              </h1>
              <p className="fs-15 text-mid" style={{ marginTop: 12 }}>
                {email}
                {subscription?.expiresAt
                  ? ` · Abonné·e bibliothèque jusqu'au ${fmtDate.format(subscription.expiresAt)}`
                  : ''}
              </p>
            </div>
            <div className="row gap-2">
              <span className={'pill ' + (subscription ? 'pill-success' : '')}>
                <span className="dot"></span>
                {subscription ? 'Compte actif' : 'Sans abonnement'}
              </span>
            </div>
          </div>
        </div>

        <div className="member-shell">
          <aside className="side-nav">
            <MemberSideNav
              counts={{ loans: activeLoansCount, registrations: registrationsCount }}
            />
            <form
              action={async () => {
                'use server';
                await signOut({ redirectTo: '/' });
              }}
              style={{ marginTop: 8 }}
            >
              <button
                type="submit"
                className="item"
                style={{ color: 'var(--danger)', cursor: 'pointer' }}
              >
                Déconnexion
              </button>
            </form>
          </aside>

          <div>{children}</div>
        </div>
      </div>
      <CpfaFooter />
    </>
  );
}
