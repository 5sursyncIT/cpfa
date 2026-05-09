import Link from 'next/link';
import { auth } from '@/lib/auth';
import { LogoMark } from './logo-mark';

const links = [
  { href: '/', label: 'Accueil' },
  { href: '/formations', label: 'Formations' },
  { href: '/seminaires', label: 'Séminaires' },
  { href: '/bibliotheque', label: 'Bibliothèque' },
  { href: '/concours', label: 'Concours' },
  { href: '/a-propos', label: 'À propos' },
] as const;

export async function TopNav({ active }: { active?: string }) {
  const session = await auth();
  const isMember = !!session?.user;

  return (
    <nav className="topnav">
      <div className="container topnav-inner">
        <Link href="/" className="brand">
          <div className="brand-mark">
            <LogoMark size={38} />
          </div>
          <div className="brand-text">
            <span className="brand-name">CPFA</span>
            <span className="brand-tag">Centre de Formation · Assurance</span>
          </div>
        </Link>

        <div className="nav-links">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={'nav-link' + (active === l.href ? ' active' : '')}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="row gap-2">
          <Link href={isMember ? '/me' : '/sign-in?callbackUrl=/me'} className="btn btn-ghost btn-sm">
            Espace abonné
          </Link>
          <Link href="/formations" className="btn btn-primary btn-sm">
            S&apos;inscrire <span className="arrow">→</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
