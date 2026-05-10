'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

export function MemberSideNav({
  counts,
  isTrainer,
}: {
  counts: { loans: number; registrations: number };
  isTrainer?: boolean;
}) {
  const path = usePathname() ?? '/me';
  const t = useTranslations('meSideNav');

  const PRIMARY = [
    { href: '/me', label: t('dashboard') },
    { href: '/me/abonnement', label: t('card') },
    { href: '/me/bibliotheque', label: t('loans'), countKey: 'loans' as const },
    { href: '/me/inscriptions', label: t('registrations'), countKey: 'registrations' as const },
  ];

  return (
    <>
      <div className="side-nav-title">{t('myAreaTitle')}</div>
      {PRIMARY.map((item) => {
        const isActive =
          item.href === '/me' ? path === '/me' : path.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={'item' + (isActive ? ' active' : '')}
          >
            <span>{item.label}</span>
            {'countKey' in item && item.countKey ? (
              <span className="count">{counts[item.countKey]}</span>
            ) : null}
          </Link>
        );
      })}

      {isTrainer ? (
        <>
          <div className="side-nav-title">{t('trainerTitle')}</div>
          <Link
            href="/me/formateur"
            className={'item' + (path.startsWith('/me/formateur') ? ' active' : '')}
          >
            <span>{t('trainerLink')}</span>
          </Link>
        </>
      ) : null}

      <div className="side-nav-title">{t('reservationsTitle')}</div>
      <span className="item">
        <span>{t('queues')}</span>
        <span className="count">0</span>
      </span>
      <span className="item">{t('upcomingReservations')}</span>

      <div className="side-nav-title">{t('accountTitle')}</div>
      <span className="item">{t('settings')}</span>
      <span className="item">{t('billing')}</span>
    </>
  );
}
