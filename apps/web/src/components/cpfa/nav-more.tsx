'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

type NavItem = { href: string; label: string };

// Desktop-only « Plus » dropdown that holds the secondary nav entries
// (Enseigner au CPFA · Actualités · À propos) so the top row stays uncluttered.
// All links remain reachable — they're just one click away. Mobile keeps them
// flat in the drawer (see MobileNav), so this never hides anything on small screens.
export function NavMore({
  label,
  items,
  active,
}: {
  label: string;
  items: NavItem[];
  active?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  const hasActive = items.some((i) => i.href === active);

  return (
    <div ref={wrapRef} className={'nav-more' + (open ? ' is-open' : '')}>
      <button
        type="button"
        className={'nav-link nav-more-trigger' + (hasActive ? ' active' : '')}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {label}
        <svg
          className="nav-more-chevron"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="m6 9 6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && (
        <div className="nav-more-menu" role="menu">
          {items.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              role="menuitem"
              className={'nav-more-item' + (i.href === active ? ' is-active' : '')}
              onClick={() => setOpen(false)}
            >
              {i.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
