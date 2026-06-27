'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

type Link = { href: string; label: string };

export function MobileNav({
  links,
  memberHref,
  memberLabel,
  catalogLabel,
  searchLabel,
  searchPlaceholder,
  active,
}: {
  links: Link[];
  memberHref: string;
  memberLabel: string;
  catalogLabel: string;
  searchLabel: string;
  searchPlaceholder: string;
  active?: string;
}) {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onResize = () => {
      if (window.innerWidth > 1100) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="mobile-nav-trigger"
        aria-label="Ouvrir le menu"
        aria-expanded={open}
        aria-controls="mobile-nav-drawer"
        onClick={() => setOpen(true)}
      >
        <span aria-hidden="true" />
        <span aria-hidden="true" />
        <span aria-hidden="true" />
      </button>

      <div
        id="mobile-nav-drawer"
        className={'mobile-nav-drawer' + (open ? ' is-open' : '')}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation principale"
        aria-hidden={!open}
      >
        <div className="mobile-nav-backdrop" onClick={() => setOpen(false)} />
        <div className="mobile-nav-panel">
          <div className="mobile-nav-head">
            <span className="eyebrow">Menu</span>
            <button
              ref={closeRef}
              type="button"
              className="mobile-nav-close"
              aria-label="Fermer le menu"
              onClick={() => setOpen(false)}
            >
              ✕
            </button>
          </div>
          <form method="get" action="/recherche" className="mobile-nav-search">
            <input
              type="search"
              name="q"
              aria-label={searchLabel}
              placeholder={searchPlaceholder}
              className="input"
            />
          </form>
          <nav className="mobile-nav-links">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={'mobile-nav-link' + (active === l.href ? ' is-active' : '')}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="mobile-nav-foot">
            <Link
              href={memberHref}
              onClick={() => setOpen(false)}
              className="btn btn-ghost btn-block"
            >
              {memberLabel}
            </Link>
            <Link
              href="/formations"
              onClick={() => setOpen(false)}
              className="btn btn-primary btn-block"
            >
              {catalogLabel} <span className="arrow">→</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
