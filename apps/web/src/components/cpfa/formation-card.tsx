import Link from 'next/link';
import { mediaUrl } from '@/lib/media';

export type FormationCover = 'navy' | 'orange' | 'cream' | 'ink';

export type FormationCardData = {
  slug: string;
  title: string;
  /** `CourseKind` brut — c'est lui que filtre le catalogue, pas `category`. */
  kind: string;
  category: string;
  description?: string | null;
  duration: string;
  level: string;
  priceLabel: string;
  cover: FormationCover;
  coverImageKey?: string | null;
};

export function FormationCard({ f }: { f: FormationCardData }) {
  const coverUrl = mediaUrl(f.coverImageKey);
  return (
    <Link href={`/formations/${f.slug}`} className="formation-card">
      <div className={`formation-cover formation-cover-${f.cover}`}>
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt="" className="formation-cover-img" />
        ) : null}
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
