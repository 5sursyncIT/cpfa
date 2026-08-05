import Link from 'next/link';

export type BookCover = 'navy' | 'orange' | 'ink' | 'cream' | 'olive';

export type BookData = {
  id?: string;
  title: string;
  author: string;
  status: 'dispo' | 'emprunte';
  /** Already localised by `resourceToBook` — the badge is pure presentation. */
  statusLabel: string;
  cover: BookCover;
};

export function Book({ b, href }: { b: BookData; href?: string }) {
  const Inner = (
    <>
      <div className={`book-cover ${b.cover}`}>
        <div className="book-author-on-cover">{b.author}</div>
        <div className="book-title-on-cover">{b.title}</div>
      </div>
      <div className="book-meta">
        <span className="title fs-13" style={{ flex: 1, lineHeight: 1.3 }}>
          {b.title}
        </span>
        <span className={'status ' + b.status}>{b.statusLabel}</span>
      </div>
    </>
  );
  if (href) {
    return (
      <Link href={href} className="book">
        {Inner}
      </Link>
    );
  }
  return <div className="book">{Inner}</div>;
}
