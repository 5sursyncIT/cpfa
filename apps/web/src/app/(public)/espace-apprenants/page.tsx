// Espace Apprenants (§3 du doc Directeur).
// Remplace l'ancien onglet « Centre Ressources » par une landing à 2 blogs :
//   - Témoignages (multi-scope: étudiants / profs / pros / partenaires)
//   - Recrutement (pointe vers Espace Recruteur + Offres d'emploi)

import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@cpfa/db';
import { resolveLocale } from '@/i18n/request';
import { mediaUrl } from '@/lib/media';
import { richTags } from '@/lib/i18n-tags';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const t = await getTranslations('learners');
  return { title: t('metaTitle') };
}

export default async function EspaceApprenantsPage() {
  const locale = await resolveLocale();
  const now = new Date();

  const [testimonials, jobsCount, recentJobs, t] = await Promise.all([
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
    getTranslations('learners'),
  ]);

  const SCOPE_LABEL: Record<string, string> = {
    STUDENT: t('scopeStudent'),
    TEACHER: t('scopeTeacher'),
    PROFESSIONAL: t('scopeProfessional'),
    PARTNER: t('scopePartner'),
  };

  return (
    <div className="container" style={{ padding: '64px 0' }}>
      <div className="breadcrumb">
        CPFA · <span>{t('title')}</span>
      </div>
      <h1 style={{ fontSize: 'clamp(48px, 6vw, 84px)' }}>{t.rich('h1', richTags)}</h1>
      <p className="fs-17 text-mid" style={{ maxWidth: 720, marginBottom: 64, lineHeight: 1.55 }}>
        {t('intro')}
      </p>

      {/* Blog Témoignages */}
      <section style={{ marginBottom: 96 }}>
        <div
          className="row"
          style={{ alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24 }}
        >
          <h2>{t.rich('testimonialsHeading', richTags)}</h2>
          <span className="fs-13 text-soft">
            {t('contributionsCount', { count: testimonials.length })}
          </span>
        </div>
        {testimonials.length === 0 ? (
          <p className="text-soft">{t('testimonialsEmpty')}</p>
        ) : (
          <div
            style={{
              display: 'grid',
              gap: 16,
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            }}
          >
            {testimonials.map((tm) => {
              const photo = mediaUrl(tm.authorPhotoKey);
              return (
                <article key={tm.id} className="card" style={{ padding: 20 }}>
                  <div
                    className="row"
                    style={{ alignItems: 'center', gap: 12, marginBottom: 12 }}
                  >
                    {photo ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={photo}
                        alt={tm.authorName}
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
                        {tm.authorName}
                      </div>
                      <div className="fs-13 text-soft">
                        {SCOPE_LABEL[tm.scope]}
                        {tm.authorRole ? ` · ${tm.authorRole}` : ''}
                      </div>
                    </div>
                  </div>
                  <blockquote style={{ fontStyle: 'italic', lineHeight: 1.55 }}>
                    « {tm.quote} »
                  </blockquote>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Blog Recrutement */}
      <section>
        <h2 style={{ marginBottom: 24 }}>{t.rich('recruitmentHeading', richTags)}</h2>

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
            <span className="eyebrow">{t('recruiterEyebrow')}</span>
            <h3 style={{ fontSize: 20, lineHeight: 1.3 }}>
              {t.rich('recruiterHeading', richTags)}
            </h3>
            <p className="fs-14 text-mid" style={{ lineHeight: 1.5 }}>
              {t('recruiterDesc')}
            </p>
            <Link
              href="/emplois/recruteur"
              className="btn btn-primary"
              style={{ marginTop: 'auto' }}
            >
              {t('recruiterCta')} →
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
            <span className="eyebrow">{t('jobsEyebrow')}</span>
            <h3 style={{ fontSize: 20, lineHeight: 1.3 }}>
              {t.rich('jobsHeading', { ...richTags, count: jobsCount })}
            </h3>
            <p className="fs-14 text-mid" style={{ lineHeight: 1.5 }}>
              {t('jobsDesc')}
            </p>
            <Link href="/emplois" className="btn btn-primary" style={{ marginTop: 'auto' }}>
              {t('jobsCta')} →
            </Link>
          </article>
        </div>

        {recentJobs.length > 0 ? (
          <div>
            <h3 style={{ fontSize: 16, marginBottom: 12 }}>{t('recentHeading')}</h3>
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
                        {t('urgent')}
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
