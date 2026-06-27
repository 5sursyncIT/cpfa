import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { LogoMark } from './logo-mark';
import { LocaleSwitcher } from './locale-switcher';
import { MobileNav } from './mobile-nav';
import { DesktopSearch } from './desktop-search';
import { NavMore } from './nav-more';

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
  //
  // Pour désencombrer la barre, on n'affiche que les 5 onglets principaux ;
  // les 3 secondaires (Enseigner · Actualités · À propos) passent dans un
  // menu « Plus ». Tous restent accessibles — et à plat dans le drawer mobile.
  const primaryLinks = [
    { href: '/formations', label: t('courses') },
    { href: '/seminaires', label: t('seminars') },
    { href: '/bibliotheque', label: t('library') },
    { href: '/concours', label: t('exams') },
    { href: '/espace-apprenants', label: t('learners') },
  ];
  const moreLinks = [
    { href: '/devenir-formateur', label: t('teach') },
    { href: '/blog', label: t('blog') },
    { href: '/a-propos', label: t('about') },
  ];
  // Mobile drawer ajoute « Accueil » en tête, puis tous les onglets à plat.
  const mobileLinks = [{ href: '/', label: t('home') }, ...primaryLinks, ...moreLinks];

  return (
    <nav className="topnav">
      <div className="topnav-inner container">
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
          {primaryLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={'nav-link' + (active === l.href ? ' active' : '')}
            >
              {l.label}
            </Link>
          ))}
          <NavMore label={t('more')} items={moreLinks} active={active} />
        </div>

        <div className="nav-actions">
          <DesktopSearch placeholder={tCommon('search') + '…'} label={t('search')} />
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
