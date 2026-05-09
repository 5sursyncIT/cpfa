import Link from 'next/link';

export type FormationCover = 'navy' | 'orange' | 'cream' | 'ink';

export type FormationCardData = {
  slug: string;
  title: string;
  category: string;
  description?: string | null;
  duration: string;
  level: string;
  priceLabel: string;
  cover: FormationCover;
};

export function FormationCard({ f }: { f: FormationCardData }) {
  return (
    <Link href={`/formations/${f.slug}`} className="formation-card">
      <div className={`formation-cover formation-cover-${f.cover}`}>
        <span className="pill">{f.category}</span>
      </div>
      <h4>{f.title}</h4>
      {f.description ? (
        <p className="fs-14 text-mid" style={{ lineHeight: 1.45 }}>
          {f.description}
        </p>
      ) : null}
      <div className="meta">
        <span>
          {f.duration} · {f.level}
        </span>
        <span>{f.priceLabel}</span>
      </div>
    </Link>
  );
}
