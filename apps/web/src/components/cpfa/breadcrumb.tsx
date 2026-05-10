import Link from 'next/link';
import { Fragment } from 'react';

export type Crumb = { href?: string; label: string };

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav className="breadcrumb-nav" aria-label="Fil d'Ariane">
      <ol>
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <Fragment key={i}>
              <li>
                {c.href && !last ? (
                  <Link href={c.href}>{c.label}</Link>
                ) : (
                  <span aria-current={last ? 'page' : undefined}>{c.label}</span>
                )}
              </li>
              {!last ? (
                <li className="breadcrumb-sep" aria-hidden="true">
                  ·
                </li>
              ) : null}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
