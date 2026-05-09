'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoMark } from './logo-mark';

type Item = { href: string; label: string; count?: number };
type Section = { title: string; items: Item[] };

export function AdminSideNav({ sections }: { sections: Section[] }) {
  const path = usePathname() ?? '/admin';
  return (
    <aside className="admin-side">
      <div
        style={{
          padding: '8px 12px 16px',
          borderBottom: '1px solid oklch(28% 0.06 258)',
          marginBottom: 8,
        }}
      >
        <Link
          href="/admin"
          className="row gap-3"
          style={{ alignItems: 'center', textDecoration: 'none' }}
        >
          <LogoMark size={28} />
          <div>
            <div className="fs-13" style={{ color: 'white', fontWeight: 500 }}>
              CPFA Admin
            </div>
            <div
              className="mono"
              style={{
                fontSize: 9,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'oklch(60% 0.02 258)',
              }}
            >
              v2.4 · staging
            </div>
          </div>
        </Link>
      </div>
      {sections.map((section) => (
        <div key={section.title}>
          <h5>{section.title}</h5>
          {section.items.map((item) => {
            const isActive =
              item.href === '/admin' ? path === '/admin' : path.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={'item' + (isActive ? ' active' : '')}
              >
                <span>{item.label}</span>
                {item.count != null ? <span className="count">{item.count}</span> : null}
              </Link>
            );
          })}
        </div>
      ))}
    </aside>
  );
}
