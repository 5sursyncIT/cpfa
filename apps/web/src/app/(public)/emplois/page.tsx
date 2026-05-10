import Link from 'next/link';
import { prisma } from '@cpfa/db';

export const metadata = { title: 'Offres d’emploi — CPFA' };
export const dynamic = 'force-dynamic';

const TYPE_LABEL: Record<string, string> = {
  CDI: 'CDI',
  CDD: 'CDD',
  STAGE: 'Stage',
  FREELANCE: 'Freelance',
  ALTERNANCE: 'Alternance',
};
const LEVEL_LABEL: Record<string, string> = {
  JUNIOR: 'Junior',
  INTERMEDIAIRE: 'Intermédiaire',
  SENIOR: 'Senior',
  EXECUTIVE: 'Cadre dirigeant',
};

const fmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' });

export default async function JobsListPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; level?: string; q?: string }>;
}) {
  const { type, level, q } = await searchParams;
  const now = new Date();

  const jobs = await prisma.jobPosting.findMany({
    where: {
      status: 'PUBLISHED',
      OR: [{ closesAt: null }, { closesAt: { gte: now } }],
      ...(type && type in TYPE_LABEL
        ? { type: type as 'CDI' | 'CDD' | 'STAGE' | 'FREELANCE' | 'ALTERNANCE' }
        : {}),
      ...(level && level in LEVEL_LABEL
        ? { level: level as 'JUNIOR' | 'INTERMEDIAIRE' | 'SENIOR' | 'EXECUTIVE' }
        : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: 'insensitive' as const } },
              { companyName: { contains: q, mode: 'insensitive' as const } },
              { description: { contains: q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    },
    take: 60,
    orderBy: [{ urgent: 'desc' }, { publishedAt: 'desc' }],
    select: {
      id: true,
      title: true,
      companyName: true,
      type: true,
      level: true,
      location: true,
      urgent: true,
      publishedAt: true,
    },
  });

  return (
    <div className="container" style={{ padding: '64px 0' }}>
      <div className="breadcrumb">
        CPFA · <span>Espaces Apprenants · Offres d’emploi</span>
      </div>

      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'end', gap: 32, marginBottom: 32 }}>
        <h1 style={{ fontSize: 'clamp(40px, 5vw, 64px)' }}>
          Opportunités <em className="italic-emph">professionnelles</em>.
        </h1>
        <Link href="/emplois/recruteur" className="btn btn-ghost">
          Vous recrutez ? Publier une offre →
        </Link>
      </div>

      <p className="fs-15 text-mid" style={{ maxWidth: 720, marginBottom: 32 }}>
        Consultez les opportunités proposées par nos entreprises partenaires et postulez
        directement en ligne. Les offres récentes apparaissent en premier ; les annonces marquées
        « Urgent » sont mises en avant.
      </p>

      <form
        method="get"
        action="/emplois"
        className="row gap-2"
        style={{ marginBottom: 24, flexWrap: 'wrap' }}
      >
        <input
          name="q"
          defaultValue={q ?? ''}
          placeholder="Mot-clé"
          className="input"
          style={{ flex: '1 1 200px' }}
        />
        <select name="type" defaultValue={type ?? ''} className="select">
          <option value="">Tous les types</option>
          {Object.entries(TYPE_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select name="level" defaultValue={level ?? ''} className="select">
          <option value="">Tous niveaux</option>
          {Object.entries(LEVEL_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn-primary">
          Filtrer
        </button>
      </form>

      {jobs.length === 0 ? (
        <p className="text-soft" style={{ padding: '48px 0' }}>
          Aucune offre ne correspond à vos critères pour le moment. Revenez régulièrement — de
          nouvelles annonces sont publiées chaque semaine.
        </p>
      ) : (
        <ul style={{ display: 'grid', gap: 12, listStyle: 'none', padding: 0 }}>
          {jobs.map((j) => (
            <li
              key={j.id}
              className="card"
              style={{ padding: 20 }}
            >
              <Link href={`/emplois/${j.id}`} style={{ display: 'block' }}>
                <div className="row" style={{ alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                  <span className="pill" style={{ fontSize: 11, padding: '2px 8px' }}>
                    {TYPE_LABEL[j.type]}
                  </span>
                  <span className="pill" style={{ fontSize: 11, padding: '2px 8px' }}>
                    {LEVEL_LABEL[j.level]}
                  </span>
                  {j.urgent ? (
                    <span
                      className="pill"
                      style={{
                        fontSize: 11,
                        padding: '2px 8px',
                        background: 'var(--orange-soft, #fff7ed)',
                        color: 'var(--orange-deep, #c2410c)',
                      }}
                    >
                      Urgent
                    </span>
                  ) : null}
                  {j.publishedAt && Date.now() - j.publishedAt.getTime() < 7 * 24 * 3600 * 1000 ? (
                    <span className="fs-13 text-soft">Récente</span>
                  ) : null}
                </div>
                <h3 style={{ fontSize: 18, marginBottom: 4 }}>{j.title}</h3>
                <div className="fs-13 text-soft">
                  {j.companyName}
                  {j.location ? ` · ${j.location}` : ''}
                  {j.publishedAt ? ` · publiée le ${fmt.format(j.publishedAt)}` : ''}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
