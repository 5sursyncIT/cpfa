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
      <div className="admin-side-brand">
        <Link
          href="/admin"
          className="admin-side-brand-link"
        >
          <LogoMark size={28} />
          <div>
            <div className="admin-side-title">CPFA Admin</div>
            <div className="admin-side-version">
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
