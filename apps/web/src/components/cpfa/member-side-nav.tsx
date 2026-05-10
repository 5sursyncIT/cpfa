'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const PRIMARY = [
  { href: '/me', label: 'Tableau de bord' },
  { href: '/me/abonnement', label: 'Ma carte' },
  { href: '/me/bibliotheque', label: 'Mes prêts', countKey: 'loans' },
  { href: '/me/inscriptions', label: 'Mes inscriptions', countKey: 'registrations' },
] as const;

export function MemberSideNav({
  counts,
  isTrainer,
}: {
  counts: { loans: number; registrations: number };
  isTrainer?: boolean;
}) {
  const path = usePathname() ?? '/me';

  return (
    <>
      <div className="side-nav-title">Mon espace</div>
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
            {'countKey' in item ? (
              <span className="count">{counts[item.countKey]}</span>
            ) : null}
          </Link>
        );
      })}

      {isTrainer ? (
        <>
          <div className="side-nav-title">Espace formateur</div>
          <Link
            href="/me/formateur"
            className={'item' + (path.startsWith('/me/formateur') ? ' active' : '')}
          >
            <span>Mon espace formateur</span>
          </Link>
        </>
      ) : null}

      <div className="side-nav-title">Réservations</div>
      <span className="item">
        <span>Files d&apos;attente</span>
        <span className="count">0</span>
      </span>
      <span className="item">Réservations à venir</span>

      <div className="side-nav-title">Compte</div>
      <span className="item">Paramètres</span>
      <span className="item">Facturation</span>
    </>
  );
}
