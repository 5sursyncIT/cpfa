import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/rbac';
import { LogoMark } from './logo-mark';
import { LocaleSwitcher } from './locale-switcher';
import { MobileNav } from './mobile-nav';

export async function TopNav({ active }: { active?: string }) {
  const [session, t, tCommon] = await Promise.all([
    auth(),
    getTranslations('nav'),
    getTranslations('common'),
  ]);
  const isMember = !!session?.user;
  const isStaff =
    !!session?.user &&
    (hasPermission(session.user.roles, 'admin:any') ||
      hasPermission(session.user.roles, 'library:manage'));

  // Top-nav reflète les onglets demandés par le Directeur (§1.1) :
  // Formations · Séminaires · Bibliothèque · Concours · Espace Apprenants ·
  // Actualités & médias. « Accueil » passe par le logo et « À propos » est
  // dans le footer pour limiter l'encombrement.
  const links = [
    { href: '/formations', label: t('courses') },
    { href: '/seminaires', label: t('seminars') },
    { href: '/bibliotheque', label: t('library') },
    { href: '/concours', label: t('exams') },
    { href: '/espace-apprenants', label: t('learners') },
    { href: '/blog', label: t('blog') },
  ];
  // Mobile drawer keeps the longer list — there's room for it there.
  const mobileLinks = [
    { href: '/', label: t('home') },
    ...links,
    { href: '/a-propos', label: t('about') },
  ];

  return (
    <nav className="topnav">
      <div className="container topnav-inner">
        <Link href="/" className="brand">
          <div className="brand-mark">
            <LogoMark size={38} />
          </div>
          <div className="brand-text">
            <span className="brand-name">{tCommon('appName')}</span>
            <span className="brand-tag">{tCommon('tagline')}</span>
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

        <div className="nav-actions">
          <form
            method="get"
            action="/recherche"
            className="nav-search"
          >
            <input
              type="search"
              name="q"
              placeholder={tCommon('search') + '…'}
              aria-label={t('search')}
              className="input"
            />
          </form>
          <LocaleSwitcher />
          {isStaff ? (
            <Link href="/admin" className="btn btn-orange btn-sm desktop-only">
              Backoffice <span className="arrow">→</span>
            </Link>
          ) : (
            <Link
              href={isMember ? '/me' : '/sign-in?callbackUrl=/me'}
              className="btn btn-ghost btn-sm desktop-only"
            >
              {tCommon('memberSpace')}
            </Link>
          )}
          <MobileNav
            links={mobileLinks}
            memberHref={isMember ? '/me' : '/sign-in?callbackUrl=/me'}
            memberLabel={tCommon('memberSpace')}
            catalogLabel={t('courses')}
            searchLabel={t('search')}
            searchPlaceholder={tCommon('search') + '…'}
            active={active}
          />
        </div>
      </div>
    </nav>
  );
}
