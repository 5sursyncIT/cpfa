import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { LogoMark } from './logo-mark';
import { LocaleSwitcher } from './locale-switcher';
import { MobileNav } from './mobile-nav';
import { DesktopSearch } from './desktop-search';

export async function TopNav({ active }: { active?: string }) {
  const [session, t, tCommon] = await Promise.all([
    auth(),
    getTranslations('nav'),
    getTranslations('common'),
  ]);
  const isMember = !!session?.user;

  // Top-nav reflète les onglets demandés par le Directeur (§1.1) :
  // Formations · Séminaires · Bibliothèque · Concours · Espace Apprenants ·
  // Actualités & médias · À propos. « Accueil » passe par le logo.
  const links = [
    { href: '/formations', label: t('courses') },
    { href: '/seminaires', label: t('seminars') },
    { href: '/bibliotheque', label: t('library') },
    { href: '/concours', label: t('exams') },
    { href: '/espace-apprenants', label: t('learners') },
    { href: '/blog', label: t('blog') },
    { href: '/a-propos', label: t('about') },
  ];
  // Mobile drawer ajoute juste « Accueil » en tête.
  const mobileLinks = [
    { href: '/', label: t('home') },
    ...links,
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
          <DesktopSearch
            placeholder={tCommon('search') + '…'}
            label={t('search')}
          />
          <LocaleSwitcher />
          {/* Staff gardent l'accès via l'URL directe /admin — pas de lien public,
              pour ne pas révéler la présence d'un compte staff dans la nav. */}
          <Link
            href={isMember ? '/me' : '/sign-in?callbackUrl=/me'}
            className="btn btn-ghost btn-sm desktop-only"
          >
            {tCommon('memberSpace')}
          </Link>
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
