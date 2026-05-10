// Quatre blocs sur la page d'accueil, juste après le hero.
// Demande Directeur §1.3 :
//   a) « Qui sommes-nous »  — brochure CPFA + mot du Directeur
//   b) « Formation »         — 3 colonnes (Certifications / Diplômes / Séminaires & concours)
//   c) « À venir »           — sessions/séminaires/concours triés par date
//   d) « Découvrez la biblio » — accès au catalogue

import Link from 'next/link';
import { prisma } from '@cpfa/db';
import { getSetting } from '@/lib/site-settings/get';
import { mediaUrl } from '@/lib/media';
import { applicationStatusAt } from '@/lib/course-rules';
import { type Locale } from '@/i18n/request';

type Upcoming = {
  kind: 'session' | 'seminar' | 'exam';
  href: string;
  title: string;
  startsAt: Date;
  meta?: string;
};

const fmtDate = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

export async function HomeBlocksSection({ locale }: { locale: Locale }) {
  const now = new Date();

  // Counts pour les colonnes Formation
  const [certifsCount, diplomesCount, seminarsCount, examsCount] = await Promise.all([
    prisma.course.count({ where: { published: true, kind: 'CERTIFIANT' } }),
    prisma.course.count({ where: { published: true, kind: 'DIPLOMANT' } }),
    prisma.seminar.count({ where: { published: true, startsAt: { gte: now } } }),
    prisma.exam.count({ where: { published: true, examAt: { gte: now } } }),
  ]);

  // Bloc « À venir » — fusion sessions cours + séminaires + concours
  const [upcomingSessions, upcomingSeminars, upcomingExams] = await Promise.all([
    prisma.courseSession.findMany({
      where: { startsAt: { gte: now }, course: { published: true } },
      orderBy: { startsAt: 'asc' },
      take: 4,
      select: {
        id: true,
        startsAt: true,
        location: true,
        course: { select: { title: true, slug: true } },
      },
    }),
    prisma.seminar.findMany({
      where: { published: true, startsAt: { gte: now } },
      orderBy: { startsAt: 'asc' },
      take: 4,
      select: { id: true, slug: true, title: true, startsAt: true, location: true },
    }),
    prisma.exam.findMany({
      where: {
        published: true,
        OR: [{ examAt: { gte: now } }, { AND: [{ examAt: null }, { closeAt: { gte: now } }] }],
      },
      orderBy: { closeAt: 'asc' },
      take: 4,
      select: { id: true, slug: true, title: true, examAt: true, closeAt: true },
    }),
  ]);

  const upcoming: Upcoming[] = [
    ...upcomingSessions.map((s) => ({
      kind: 'session' as const,
      href: `/formations/${s.course.slug}`,
      title: s.course.title,
      startsAt: s.startsAt,
      meta: s.location ?? 'Session',
    })),
    ...upcomingSeminars.map((s) => ({
      kind: 'seminar' as const,
      href: `/seminaires/${s.slug}`,
      title: s.title,
      startsAt: s.startsAt,
      meta: s.location ?? 'Séminaire',
    })),
    ...upcomingExams.map((e) => ({
      kind: 'exam' as const,
      href: `/concours/${e.slug}`,
      title: e.title,
      // Concours sans date d'épreuve fixée : on retombe sur la clôture des
      // inscriptions pour rester ordonnable sur le bandeau « À venir ».
      startsAt: e.examAt ?? e.closeAt,
      meta: e.examAt ? 'Concours' : 'Clôture des inscriptions',
    })),
  ]
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
    .slice(0, 6);

  // Featured cards de la 1re col Diplômes — si une formation diplômante a une fenêtre
  // d'inscription ouverte, on en parle. Sinon, message générique.
  const openDiplomas = await prisma.course.findMany({
    where: { published: true, kind: 'DIPLOMANT' },
    take: 3,
    select: {
      id: true,
      slug: true,
      title: true,
      applicationsOpenAt: true,
      applicationsCloseAt: true,
    },
  });
  const diplomaWindowMessage = (() => {
    const open = openDiplomas.find(
      (c) => applicationStatusAt(c).state === 'open',
    );
    if (open) return 'Inscriptions ouvertes';
    const next = openDiplomas
      .map((c) => applicationStatusAt(c))
      .filter((s): s is { state: 'before'; opensAt: Date } => s.state === 'before')
      .sort((a, b) => a.opensAt.getTime() - b.opensAt.getTime())[0];
    if (next) return `Réouverture le ${fmtDate.format(next.opensAt)}`;
    return 'Sur concours d’entrée';
  })();

  // Brochure CPFA (settings) — si pas configurée, on lie vers /a-propos
  const brochure = await getSetting('site.brochureKey', locale);
  const brochureHref = brochure.key ? mediaUrl(brochure.key) : '/a-propos';

  return (
    <section className="section">
      <div className="container">
        <div
          style={{
            display: 'grid',
            gap: 16,
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          }}
        >
          {/* a) Qui sommes-nous */}
          <article
            className="card"
            style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            <span className="eyebrow">Qui sommes-nous</span>
            <h3 style={{ fontSize: 22, lineHeight: 1.2 }}>
              Le CPFA, <em className="italic-emph">une référence</em> régionale.
            </h3>
            <p className="fs-14 text-mid" style={{ lineHeight: 1.5 }}>
              Unité décentralisée de l&apos;IIA Yaoundé, reconnue par la Direction des Assurances.
              Découvrez notre mission, notre gouvernance et nos partenaires.
            </p>
            <div className="row gap-2" style={{ marginTop: 'auto', flexWrap: 'wrap' }}>
              {brochureHref ? (
                <a
                  className="btn btn-primary btn-sm"
                  href={brochureHref}
                  target={brochure.key ? '_blank' : undefined}
                  rel={brochure.key ? 'noreferrer' : undefined}
                >
                  Brochure CPFA <span className="arrow">→</span>
                </a>
              ) : null}
              <Link className="btn btn-ghost btn-sm" href="/mot-du-directeur">
                Mot du Directeur
              </Link>
            </div>
          </article>

          {/* b) Formation — 3 colonnes */}
          <article
            className="card"
            style={{
              padding: 28,
              gridColumn: 'span 2',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <span className="eyebrow">Formation</span>
            <h3 style={{ fontSize: 22, lineHeight: 1.2 }}>
              Trois voies, <em className="italic-emph">une exigence</em>.
            </h3>
            <div
              style={{
                display: 'grid',
                gap: 12,
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              }}
            >
              <FormationColumn
                title="Certifications"
                count={certifsCount}
                description="Spécialisations courtes, certifiantes."
                href="/formations?cat=Certification"
              />
              <FormationColumn
                title="Diplômes"
                count={diplomesCount}
                description={diplomaWindowMessage}
                href="/formations?cat=Cursus%20dipl%C3%B4mant"
              />
              <FormationColumn
                title="Séminaires & concours"
                count={seminarsCount + examsCount}
                description="Sessions courtes & concours d’entrée."
                href="/seminaires"
              />
            </div>
          </article>

          {/* c) À venir */}
          <article
            className="card"
            style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            <span className="eyebrow">À venir</span>
            <h3 style={{ fontSize: 22, lineHeight: 1.2 }}>
              Prochaines <em className="italic-emph">échéances</em>.
            </h3>
            {upcoming.length === 0 ? (
              <p className="fs-14 text-soft" style={{ marginTop: 4 }}>
                Aucune session ou concours programmé pour le moment.
              </p>
            ) : (
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {upcoming.map((u, i) => (
                  <li
                    key={`${u.kind}-${i}`}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '64px 1fr',
                      alignItems: 'baseline',
                      gap: 12,
                      borderTop: i ? '1px solid var(--line-soft)' : 'none',
                      paddingTop: i ? 8 : 0,
                    }}
                  >
                    <span className="mono fs-13 text-soft">
                      {fmtDate.format(u.startsAt)}
                    </span>
                    <Link
                      href={u.href}
                      className="fs-14"
                      style={{ fontWeight: 500, lineHeight: 1.3 }}
                    >
                      {u.title}
                      <span
                        className="fs-13 text-soft"
                        style={{ display: 'block', fontWeight: 400 }}
                      >
                        {u.meta}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </article>

          {/* d) Découvrez la bibliothèque */}
          <article
            className="card"
            style={{
              padding: 28,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              gridColumn: 'span 2',
              background: 'linear-gradient(135deg, var(--orange-soft, #fff7ed), white)',
            }}
          >
            <span className="eyebrow">Bibliothèque</span>
            <h3 style={{ fontSize: 22, lineHeight: 1.2 }}>
              Découvrez la <em className="italic-emph">bibliothèque</em>.
            </h3>
            <p className="fs-14 text-mid" style={{ lineHeight: 1.5 }}>
              Plus de 25 domaines spécialisés en assurance, actuariat, transport et risques. Trois
              formules d&apos;abonnement (étudiant 10 000 · pro 15 000 · emprunt domicile 50 000
              FCFA/an), carte d&apos;abonné PDF, règlement intérieur téléchargeable.
            </p>
            <div className="row gap-2" style={{ marginTop: 'auto', flexWrap: 'wrap' }}>
              <Link className="btn btn-primary btn-sm" href="/bibliotheque">
                Explorer le catalogue <span className="arrow">→</span>
              </Link>
              <Link className="btn btn-ghost btn-sm" href="/me/abonnement">
                S’abonner
              </Link>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

function FormationColumn({
  title,
  count,
  description,
  href,
}: {
  title: string;
  count: number;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="card"
      style={{
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        background: 'var(--bg-soft, #f8fafc)',
        textDecoration: 'none',
      }}
    >
      <div className="mono fs-13 text-soft">{count} programme(s)</div>
      <div className="fs-15" style={{ fontWeight: 600 }}>
        {title}
      </div>
      <div className="fs-13 text-mid" style={{ lineHeight: 1.45 }}>
        {description}
      </div>
      <div className="fs-13" style={{ marginTop: 'auto', color: 'var(--orange-deep)' }}>
        En savoir plus →
      </div>
    </Link>
  );
}
