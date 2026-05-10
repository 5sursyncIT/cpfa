'use client';

import { useEffect, useRef, useState } from 'react';

// Inline search trigger for the desktop top-nav. Collapsed: a 36×36 icon button.
// Expanded: a 220px input that takes focus; closes on Esc, blur, or submit.
// Saves ~100px in the nav row vs. the always-visible input.

export function DesktopSearch({ placeholder, label }: { placeholder: string; label: string }) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
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

  return (
    <div ref={wrapRef} className={'nav-search-toggle' + (open ? ' is-open' : '')}>
      {open ? (
        <form method="get" action="/recherche" className="nav-search-form">
          <input
            ref={inputRef}
            type="search"
            name="q"
            placeholder={placeholder}
            aria-label={label}
            className="input"
            onBlur={(e) => {
              // keep open if focus moved to a child (submit button); close otherwise
              if (!wrapRef.current?.contains(e.relatedTarget as Node)) {
                // small delay so submit can fire
                setTimeout(() => setOpen(false), 100);
              }
            }}
          />
        </form>
      ) : (
        <button
          type="button"
          className="nav-search-icon"
          aria-label={label}
          onClick={() => setOpen(true)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}
