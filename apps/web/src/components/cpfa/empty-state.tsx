import Link from 'next/link';
import type { ReactNode } from 'react';

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="empty-state" role="status">
      <div className="empty-state-icon" aria-hidden="true">
        {icon ?? '✦'}
      </div>
      <div className="empty-state-title">{title}</div>
      {description ? <p className="empty-state-desc">{description}</p> : null}
      {action ? (
        <Link href={action.href} className="btn btn-ghost btn-sm">
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
