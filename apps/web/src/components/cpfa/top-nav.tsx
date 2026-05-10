import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { LogoMark } from './logo-mark';
import { LocaleSwitcher } from './locale-switcher';

export async function TopNav({ active }: { active?: string }) {
  const [session, t, tCommon] = await Promise.all([
    auth(),
    getTranslations('nav'),
    getTranslations('common'),
  ]);
  const isMember = !!session?.user;

  const links = [
    { href: '/', label: t('home') },
    { href: '/formations', label: t('courses') },
    { href: '/seminaires', label: t('seminars') },
    { href: '/bibliotheque', label: t('library') },
    { href: '/concours', label: t('exams') },
    { href: '/espace-apprenants', label: t('learners') },
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

        <div className="row gap-2" style={{ alignItems: 'center' }}>
          <form
            method="get"
            action="/recherche"
            className="row gap-1"
            style={{ alignItems: 'center' }}
          >
            <input
              type="search"
              name="q"
              placeholder={tCommon('search') + '…'}
              aria-label={t('search')}
              className="input"
              style={{ width: 160, fontSize: 13, padding: '6px 10px' }}
            />
          </form>
          <LocaleSwitcher />
          <Link href={isMember ? '/me' : '/sign-in?callbackUrl=/me'} className="btn btn-ghost btn-sm">
            {tCommon('memberSpace')}
          </Link>
          <Link href="/formations" className="btn btn-primary btn-sm">
            {t('courses')} <span className="arrow">→</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
