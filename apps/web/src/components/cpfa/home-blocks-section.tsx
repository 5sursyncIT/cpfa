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
import { getTranslations } from 'next-intl/server';
import { intlLocale, type Locale } from '@/i18n/request';
import { renderEmph } from '@/lib/render-emph';
import { applyFigures, getSiteFigures } from '@/lib/site-figures';
import { getLibraryTiers } from '@/lib/library-pricing';
import { formatXof } from '@/lib/library-rules';

type Upcoming = {
  kind: 'session' | 'seminar' | 'exam';
  href: string;
  title: string;
  startsAt: Date;
  meta?: string;
};

export async function HomeBlocksSection({ locale }: { locale: Locale }) {
  const now = new Date();
  const t = await getTranslations('homeBlocks');
  const fmtDate = new Intl.DateTimeFormat(intlLocale(locale), {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

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
      meta: s.location ?? t('metaSession'),
    })),
    ...upcomingSeminars.map((s) => ({
      kind: 'seminar' as const,
      href: `/seminaires/${s.slug}`,
      title: s.title,
      startsAt: s.startsAt,
      meta: s.location ?? t('metaSeminar'),
    })),
    ...upcomingExams.map((e) => ({
      kind: 'exam' as const,
      href: `/concours/${e.slug}`,
      title: e.title,
      // Concours sans date d'épreuve fixée : on retombe sur la clôture des
      // inscriptions pour rester ordonnable sur le bandeau « À venir ».
      startsAt: e.examAt ?? e.closeAt,
      meta: e.examAt ? t('metaExam') : t('metaExamClosing'),
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
  // Fenêtre d'inscription réelle si elle existe ; sinon le texte réglé dans
  // /admin/settings (aucune phrase inventée dans le code).
  const diplomaWindowMessage = (() => {
    const open = openDiplomas.find((c) => applicationStatusAt(c).state === 'open');
    if (open) return t('applicationsOpen');
    const next = openDiplomas
      .map((c) => applicationStatusAt(c))
      .filter((s): s is { state: 'before'; opensAt: Date } => s.state === 'before')
      .sort((a, b) => a.opensAt.getTime() - b.opensAt.getTime())[0];
    if (next) return t('reopensOn', { date: fmtDate.format(next.opensAt) });
    return null;
  })();

  // Brochure CPFA (settings) — si pas configurée, on lie vers /a-propos
  const brochure = await getSetting('site.brochureKey', locale);
  const brochureHref = brochure.key ? mediaUrl(brochure.key) : '/a-propos';

  // Photos de fond des colonnes Formation (§1.3 b), pilotées depuis
  // /admin/settings. Clés vides = colonnes en fond uni.
  const columnImages = await getSetting('home.formationColumns', locale);

  // Textes des quatre encarts + chiffres et tarifs réels. Les jetons du réglage
  // ({ouvrages}, {tarifEtudiant}, …) sont remplacés ici : l'administration
  // écrit une phrase, le système garantit les nombres.
  const [blocks, figures, tiers] = await Promise.all([
    getSetting('home.blocks', locale),
    getSiteFigures(now),
    getLibraryTiers(locale),
  ]);
  const withValues = (text: string) =>
    applyFigures(text, figures)
      .replace('{tarifEtudiant}', formatXof(tiers.STUDENT.priceXof))
      .replace('{tarifPro}', formatXof(tiers.PROFESSIONAL.priceXof))
      .replace('{tarifEmprunt}', formatXof(tiers.HOME_LOAN.priceXof));

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
            <span className="eyebrow">{blocks.aboutEyebrow}</span>
            <h3 style={{ fontSize: 22, lineHeight: 1.2 }}>{renderEmph(blocks.aboutTitle)}</h3>
            <p className="fs-14 text-mid" style={{ lineHeight: 1.5 }}>
              {withValues(blocks.aboutText)}
            </p>
            <div className="row gap-2" style={{ marginTop: 'auto', flexWrap: 'wrap' }}>
              {brochureHref ? (
                <a
                  className="btn btn-primary btn-sm"
                  href={brochureHref}
                  target={brochure.key ? '_blank' : undefined}
                  rel={brochure.key ? 'noreferrer' : undefined}
                >
                  {blocks.aboutBrochureCta} <span className="arrow">→</span>
                </a>
              ) : null}
              <Link className="btn btn-ghost btn-sm" href="/mot-du-directeur">
                {blocks.aboutDirectorCta}
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
            <span className="eyebrow">{blocks.formationEyebrow}</span>
            <h3 style={{ fontSize: 22, lineHeight: 1.2 }}>{renderEmph(blocks.formationTitle)}</h3>
            <div
              style={{
                display: 'grid',
                gap: 12,
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              }}
            >
              <FormationColumn
                title={t('colCertifications')}
                count={certifsCount}
                description={withValues(blocks.formationColCertifications)}
                href="/formations?cat=CERTIFIANT"
                imageKey={columnImages.certificationsImageKey}
              />
              <FormationColumn
                title={t('colDiplomas')}
                count={diplomesCount}
                description={diplomaWindowMessage ?? withValues(blocks.formationColDiplomas)}
                href="/formations?cat=DIPLOMANT"
                imageKey={columnImages.diplomasImageKey}
              />
              <FormationColumn
                title={t('colSeminars')}
                count={seminarsCount + examsCount}
                description={withValues(blocks.formationColSeminars)}
                href="/seminaires"
                imageKey={columnImages.seminarsImageKey}
              />
            </div>
          </article>

          {/* c) À venir */}
          <article
            className="card"
            style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            <span className="eyebrow">{blocks.upcomingEyebrow}</span>
            <h3 style={{ fontSize: 22, lineHeight: 1.2 }}>{renderEmph(blocks.upcomingTitle)}</h3>
            {upcoming.length === 0 ? (
              <p className="fs-14 text-soft" style={{ marginTop: 4 }}>
                {blocks.upcomingEmpty}
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
                    <span className="mono fs-13 text-soft">{fmtDate.format(u.startsAt)}</span>
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
            <span className="eyebrow">{blocks.libraryEyebrow}</span>
            <h3 style={{ fontSize: 22, lineHeight: 1.2 }}>{renderEmph(blocks.libraryTitle)}</h3>
            <p className="fs-14 text-mid" style={{ lineHeight: 1.5 }}>
              {withValues(blocks.libraryText)}
            </p>
            {/* « En savoir + » ouvre la bibliothèque dans une nouvelle fenêtre
                (§1.3 d) — l'espace bibliothèque se consulte en parallèle du
                site, sans faire perdre au visiteur sa navigation en cours. */}
            <div className="row gap-2" style={{ marginTop: 'auto', flexWrap: 'wrap' }}>
              <a
                className="btn btn-primary btn-sm"
                href="/bibliotheque"
                target="_blank"
                rel="noreferrer"
              >
                {blocks.libraryCatalogCta} <span className="arrow">→</span>
              </a>
              <Link className="btn btn-ghost btn-sm" href="/me/abonnement">
                {blocks.librarySubscribeCta}
              </Link>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

// Une colonne du bloc « Formation ». Avec photo de fond, le texte passe en
// blanc sur un voile sombre pour rester lisible quelle que soit l'image
// téléversée ; sans photo, on garde le fond uni d'origine.
function FormationColumn({
  title,
  count,
  description,
  href,
  imageKey,
}: {
  title: string;
  count: number;
  description: string;
  href: string;
  imageKey?: string;
}) {
  const imageSrc = mediaUrl(imageKey || null);

  return (
    <Link
      href={href}
      className="card"
      style={{
        position: 'relative',
        overflow: 'hidden',
        padding: 16,
        minHeight: imageSrc ? 168 : undefined,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        background: imageSrc
          ? `linear-gradient(to top, oklch(18% 0.06 258 / 0.92), oklch(18% 0.06 258 / 0.55)), url("${imageSrc}") center / cover no-repeat`
          : 'var(--bg-soft, #f8fafc)',
        textDecoration: 'none',
      }}
    >
      <div
        className="mono fs-13"
        style={{ color: imageSrc ? 'oklch(85% 0.02 80)' : 'var(--ink-soft)' }}
      >
        {count} programme(s)
      </div>
      <div className="fs-15" style={{ fontWeight: 600, color: imageSrc ? 'white' : undefined }}>
        {title}
      </div>
      <div
        className="fs-13"
        style={{ lineHeight: 1.45, color: imageSrc ? 'oklch(88% 0.01 80)' : 'var(--ink-mid)' }}
      >
        {description}
      </div>
      <div
        className="fs-13"
        style={{
          marginTop: 'auto',
          paddingTop: 8,
          color: imageSrc ? 'oklch(85% 0.08 60)' : 'var(--orange-deep)',
        }}
      >
        En savoir plus →
      </div>
    </Link>
  );
}
