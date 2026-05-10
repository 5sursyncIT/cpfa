import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { auth, signOut } from '@/lib/auth';
import { TopNav } from '@/components/cpfa/top-nav';
import { CpfaFooter } from '@/components/cpfa/footer';
import { MemberSideNav } from '@/components/cpfa/member-side-nav';
import { prisma } from '@cpfa/db';
import { resolveLocale } from '@/i18n/request';
import { richTags } from '@/lib/i18n-tags';

export default async function MeLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/sign-in?callbackUrl=/me');

  const userId = session.user.id;
  const t = await getTranslations('me');
  const firstName = (session.user.name ?? '').split(' ')[0] || '';
  const fallbackName = session.user.name ?? session.user.email ?? t('fallbackName');
  const email = session.user.email ?? '';

  const [activeLoansCount, registrationsCount, subscription, locale] = await Promise.all([
    prisma.loan.count({ where: { userId, status: 'ACTIVE' } }),
    prisma.registration.count({ where: { userId } }),
    prisma.subscription.findFirst({
      where: { userId, status: 'ACTIVE' },
      select: { expiresAt: true },
    }),
    resolveLocale(),
  ]);

  const isTrainer = session.user.roles.includes('FORMATEUR');

  const fmtDate = new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <>
      <TopNav active="/me" />
      <div className="container">
        <div className="page-head member-page-head">
          <div className="breadcrumb">
            CPFA · <span>{t('breadcrumb')}</span>
          </div>
          <div className="member-page-title">
            <div>
              <h1 className="member-page-heading">
                {t.rich('welcome', { ...richTags, name: firstName || fallbackName })}
              </h1>
              <p className="member-page-subtitle">
                {email}
                {subscription?.expiresAt
                  ? t('subscribedUntil', { date: fmtDate.format(subscription.expiresAt) })
                  : ''}
              </p>
            </div>
            <div className="member-page-status">
              <span className={'pill ' + (subscription ? 'pill-success' : '')}>
                <span className="dot"></span>
                {subscription ? t('statusActive') : t('statusNoSub')}
              </span>
            </div>
          </div>
        </div>

        <div className="member-shell">
          <aside className="side-nav">
            <MemberSideNav
              counts={{ loans: activeLoansCount, registrations: registrationsCount }}
              isTrainer={isTrainer}
            />
            <form
              action={async () => {
                'use server';
                await signOut({ redirectTo: '/' });
              }}
              className="side-nav-signout"
            >
              <button type="submit" className="item side-nav-danger">
                {t('signOut')}
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
