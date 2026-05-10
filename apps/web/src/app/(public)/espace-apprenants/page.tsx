// Espace Apprenants (§3 du doc Directeur).
// Remplace l'ancien onglet « Centre Ressources » par une landing à 2 blogs :
//   - Témoignages (multi-scope: étudiants / profs / pros / partenaires)
//   - Recrutement (pointe vers Espace Recruteur + Offres d'emploi)

import Link from 'next/link';
import { prisma } from '@cpfa/db';
import { resolveLocale } from '@/i18n/request';
import { mediaUrl } from '@/lib/media';

export const metadata = { title: 'Espaces Apprenants — CPFA' };
export const dynamic = 'force-dynamic';

const SCOPE_LABEL: Record<string, string> = {
  STUDENT: 'Étudiant·e',
  TEACHER: 'Enseignant·e',
  PROFESSIONAL: 'Professionnel·le',
  PARTNER: 'Partenaire',
};

export default async function EspaceApprenantsPage() {
  const locale = await resolveLocale();
  const now = new Date();

  const [testimonials, jobsCount, recentJobs] = await Promise.all([
    prisma.testimonial.findMany({
      where: { published: true, locale },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      take: 8,
    }),
    prisma.jobPosting.count({
      where: {
        status: 'PUBLISHED',
        OR: [{ closesAt: null }, { closesAt: { gte: now } }],
      },
    }),
    prisma.jobPosting.findMany({
      where: {
        status: 'PUBLISHED',
        OR: [{ closesAt: null }, { closesAt: { gte: now } }],
      },
      orderBy: [{ urgent: 'desc' }, { publishedAt: 'desc' }],
      take: 4,
      select: {
        id: true,
        title: true,
        companyName: true,
        type: true,
        location: true,
        urgent: true,
      },
    }),
  ]);

  return (
    <div className="container" style={{ padding: '64px 0' }}>
      <div className="breadcrumb">
        CPFA · <span>Espaces Apprenants</span>
      </div>
      <h1 style={{ fontSize: 'clamp(48px, 6vw, 84px)' }}>
        L&apos;<em className="italic-emph">espace</em> des apprenants.
      </h1>
      <p className="fs-17 text-mid" style={{ maxWidth: 720, marginBottom: 64, lineHeight: 1.55 }}>
        Témoignages des parties prenantes du CPFA — étudiants, enseignants, professionnels en
        exercice et partenaires — et opportunités d&apos;emploi proposées par notre réseau
        d&apos;entreprises.
      </p>

      {/* Blog Témoignages */}
      <section style={{ marginBottom: 96 }}>
        <div className="row" style={{ alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2>
            Témoignages <em className="italic-emph">multi-voix</em>
          </h2>
          <span className="fs-13 text-soft">{testimonials.length} contribution(s)</span>
        </div>
        {testimonials.length === 0 ? (
          <p className="text-soft">Les premiers témoignages seront publiés très prochainement.</p>
        ) : (
          <div
            style={{
              display: 'grid',
              gap: 16,
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            }}
          >
            {testimonials.map((t) => {
              const photo = mediaUrl(t.authorPhotoKey);
              return (
                <article key={t.id} className="card" style={{ padding: 20 }}>
                  <div className="row" style={{ alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    {photo ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={photo}
                        alt={t.authorName}
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : null}
                    <div>
                      <div className="fs-15" style={{ fontWeight: 600 }}>
                        {t.authorName}
                      </div>
                      <div className="fs-13 text-soft">
                        {SCOPE_LABEL[t.scope]}
                        {t.authorRole ? ` · ${t.authorRole}` : ''}
                      </div>
                    </div>
                  </div>
                  <blockquote style={{ fontStyle: 'italic', lineHeight: 1.55 }}>
                    « {t.quote} »
                  </blockquote>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Blog Recrutement */}
      <section>
        <h2 style={{ marginBottom: 24 }}>
          <em className="italic-emph">Recrutement</em> — entreprises &amp; talents.
        </h2>

        <div
          style={{
            display: 'grid',
            gap: 16,
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            marginBottom: 24,
          }}
        >
          {/* Espace Recruteur */}
          <article
            className="card"
            style={{
              padding: 28,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              background: 'var(--bg-soft, #f8fafc)',
            }}
          >
            <span className="eyebrow">Espace Recruteur</span>
            <h3 style={{ fontSize: 20, lineHeight: 1.3 }}>
              Vous recrutez ? <em className="italic-emph">Publiez votre offre.</em>
            </h3>
            <p className="fs-14 text-mid" style={{ lineHeight: 1.5 }}>
              Vous êtes une entreprise à la recherche de talents qualifiés dans les métiers de
              l&apos;assurance ? Le CPFA vous offre la possibilité de publier vos offres et de
              recevoir directement des candidatures ciblées.
            </p>
            <Link href="/emplois/recruteur" className="btn btn-primary" style={{ marginTop: 'auto' }}>
              Déposer une offre →
            </Link>
          </article>

          {/* Offres d'emploi */}
          <article
            className="card"
            style={{
              padding: 28,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              background: 'linear-gradient(135deg, var(--orange-soft, #fff7ed), white)',
            }}
          >
            <span className="eyebrow">Offres d&apos;emploi</span>
            <h3 style={{ fontSize: 20, lineHeight: 1.3 }}>
              {jobsCount} <em className="italic-emph">opportunités</em> en ligne.
            </h3>
            <p className="fs-14 text-mid" style={{ lineHeight: 1.5 }}>
              Consultez les opportunités proposées par nos entreprises partenaires et postulez
              directement en ligne — CV joint, motivation, suivi par email.
            </p>
            <Link href="/emplois" className="btn btn-primary" style={{ marginTop: 'auto' }}>
              Voir les offres →
            </Link>
          </article>
        </div>

        {recentJobs.length > 0 ? (
          <div>
            <h3 style={{ fontSize: 16, marginBottom: 12 }}>Annonces récentes</h3>
            <ul style={{ display: 'grid', gap: 8, listStyle: 'none', padding: 0 }}>
              {recentJobs.map((j) => (
                <li key={j.id}>
                  <Link
                    href={`/emplois/${j.id}`}
                    className="row"
                    style={{
                      padding: '10px 14px',
                      border: '1px solid var(--line)',
                      borderRadius: 8,
                      alignItems: 'baseline',
                      gap: 12,
                    }}
                  >
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
                    <span className="fs-15" style={{ fontWeight: 500, flex: 1 }}>
                      {j.title}
                    </span>
                    <span className="fs-13 text-soft">
                      {j.companyName}
                      {j.location ? ` · ${j.location}` : ''} · {j.type}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    </div>
  );
}
