import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';
import { prisma } from '@cpfa/db';
import { Book } from '@/components/cpfa/book';
import { Countdown } from '@/components/cpfa/countdown';
import { FormationCard } from '@/components/cpfa/formation-card';
import { Marquee } from '@/components/cpfa/marquee';
import { EmptyState } from '@/components/cpfa/empty-state';
import { courseToCard, resourceToBook } from '@/lib/cpfa-mappers';
import { getSetting } from '@/lib/site-settings/get';
import { resolveLocale, type Locale } from '@/i18n/request';
import { HomeBlocksSection } from '@/components/cpfa/home-blocks-section';
import { renderEmph } from '@/lib/render-emph';
import heroPhoto from './hero/hero_cpafa_v2.jpg';

export const dynamic = 'force-dynamic';

const concoursDeadline = new Date('2026-08-30T23:59:59.000Z');

export default async function HomePage() {
  const locale = await resolveLocale();
  const hero = await getSetting('home.hero', locale);

  return (
    <>
      <section className="hero hero--full">
        <div className="hero-bg-grad" aria-hidden="true" />
        <div className="hero-inner">
          <div className="hero-grid">
            <div className="hero-text">
              <span className="eyebrow" style={{ marginBottom: 24, display: 'inline-flex' }}>
                {renderEmph(hero.eyebrow)}
              </span>
              <h1 className="hero-headline">{renderEmph(hero.headline)}</h1>
              <p className="hero-lede">{hero.description}</p>
              <div className="row gap-3 hero-ctas">
                <Link href="/formations" className="btn btn-primary btn-lg">
                  Catalogue des formations <span className="arrow">→</span>
                </Link>
                <Link href="/a-propos" className="btn btn-ghost btn-lg">
                  Découvrir l&apos;institut
                </Link>
              </div>
            </div>
            <div className="hero-visual">
              <div className="hero-photo-frame">
                <div className="hero-photo-stage" aria-hidden="true" />
                <div className="hero-photo">
                  <Image
                    src={heroPhoto}
                    alt="Pile de trois ouvrages d'assurance protégée par un parapluie orange, entourée d'icônes de toque, diplôme, livre ouvert et bouclier — métaphore visuelle du CPFA : la formation comme protection."
                    placeholder="blur"
                    priority
                    sizes="(max-width: 1100px) 100vw, 560px"
                  />
                  <div className="hero-photo-shade" aria-hidden="true" />
                </div>
                <div className="hero-photo-tag hero-photo-tag--top">
                  <span className="hero-photo-tag-dot" aria-hidden="true" />
                  <div>
                    <div className="hero-photo-tag-kicker">Reconnaissance</div>
                    <div className="hero-photo-tag-value">Direction des Assurances</div>
                  </div>
                </div>
                <div className="hero-photo-tag hero-photo-tag--bottom">
                  <div>
                    <div className="hero-photo-tag-kicker">Affiliation</div>
                    <div className="hero-photo-tag-value">IIA Yaoundé · Zone CIMA</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <HomeBlocksSection locale={locale} />

      <Marquee />

      <Suspense fallback={<StatsSkeleton />}>
        <StatsSection locale={locale} />
      </Suspense>

      <Suspense fallback={<FeaturedSkeleton />}>
        <FeaturedFormationsSection />
      </Suspense>

      <Suspense fallback={<BooksSkeleton />}>
        <BooksSection />
      </Suspense>

      <Suspense fallback={<TestimonialsSkeleton />}>
        <TestimonialsSection locale={locale} />
      </Suspense>

      <section className="section" style={{ paddingBottom: 0, borderTop: 'none' }}>
        <div className="container">
          <div className="concours-card">
            <div>
              <span className="eyebrow" style={{ marginBottom: 16 }}>
                Concours d&apos;entrée 2026
              </span>
              <div className="concours-headline">
                Le concours
                <br />
                <em className="italic-emph">ferme dans</em>
              </div>
              <Countdown deadline={concoursDeadline} />
              <div className="row gap-3">
                <Link href="/concours" className="btn btn-orange btn-lg">
                  Préparer mon dossier <span className="arrow">→</span>
                </Link>
                <Link href="/concours" className="btn btn-ghost btn-lg">
                  Télécharger les annales
                </Link>
              </div>
            </div>
            <div>
              <p className="fs-17 text-mid" style={{ lineHeight: 1.5 }}>
                Le concours d&apos;entrée au MBA et à la Licence Professionnelle est ouvert aux
                titulaires d&apos;un diplôme reconnu par le CAMES. Quatre épreuves : culture
                économique, mathématiques financières, anglais des affaires et entretien de
                motivation.
              </p>
              <div className="divider" style={{ margin: '24px 0' }}></div>
              <div className="col gap-3">
                {[
                  ['Dépôt en ligne', "jusqu'au 30 août 2026"],
                  ['Épreuves écrites', '12 septembre 2026'],
                  ['Résultats', '25 septembre 2026'],
                  ['Frais de dossier', '25 000 FCFA'],
                ].map(([k, v]) => (
                  <div key={k} className="row" style={{ justifyContent: 'space-between' }}>
                    <span className="text-soft fs-13">{k}</span>
                    <span className="mono fs-13">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

async function StatsSection({ locale }: { locale: Locale }) {
  const homeStats = await getSetting('home.stats', locale);
  return (
    <div className="container">
      <div className="stat-row">
        {homeStats.map((s, i) => (
          <div key={i} className="stat">
            <div className="stat-value">
              {s.value}
              {s.sup ? <sup>{s.sup}</sup> : null}
            </div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="container" aria-hidden="true">
      <div className="stat-row">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="stat">
            <div className="skeleton" style={{ height: 36, width: '60%', marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 12, width: '80%' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

async function FeaturedFormationsSection() {
  const featured = await prisma.course.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' },
    take: 3,
    select: {
      slug: true,
      title: true,
      kind: true,
      level: true,
      durationHours: true,
      priceXof: true,
      description: true,
      coverImageKey: true,
    },
  });
  return (
    <section className="section">
      <div className="container">
        <div className="section-header">
          <div>
            <span className="eyebrow" style={{ marginBottom: 16 }}>
              Programmes phares
            </span>
            <h2>
              Six cursus pour <em className="italic-emph">six trajectoires</em>
              <br />
              de carrière dans l&apos;assurance.
            </h2>
          </div>
          <Link href="/formations" className="btn btn-ghost">
            Voir le catalogue complet <span className="arrow">→</span>
          </Link>
        </div>
        {featured.length === 0 ? (
          <EmptyState
            title="Le catalogue se prépare"
            description="Aucune formation n'est encore publiée. Revenez très bientôt — la session 2026 ouvre dans quelques jours."
            action={{ href: '/contact', label: 'Être informé du lancement' }}
          />
        ) : (
          <div className="formations-grid">
            {featured.map((c) => (
              <FormationCard key={c.slug} f={courseToCard(c)} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function FeaturedSkeleton() {
  return (
    <section className="section" aria-hidden="true">
      <div className="container">
        <div className="skeleton" style={{ height: 24, width: 220, marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 56, width: '60%', marginBottom: 32 }} />
        <div className="formations-grid">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              <div className="skeleton" style={{ aspectRatio: '4/3', width: '100%' }} />
              <div className="skeleton" style={{ height: 22, width: '80%', marginTop: 12 }} />
              <div className="skeleton" style={{ height: 14, width: '60%', marginTop: 8 }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

async function BooksSection() {
  const books = await prisma.resource.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { id: true, title: true, authors: true, totalCopies: true },
  });
  return (
    <section className="section">
      <div className="container">
        <div className="section-header">
          <div>
            <span className="eyebrow" style={{ marginBottom: 16 }}>
              Bibliothèque spécialisée
            </span>
            <h2>
              3 200 ouvrages, mémoires et
              <br />
              études — accès aux abonnés.
            </h2>
          </div>
          <Link href="/bibliotheque" className="btn btn-ghost">
            Explorer le fonds <span className="arrow">→</span>
          </Link>
        </div>
        {books.length === 0 ? (
          <EmptyState
            title="Le fonds se constitue"
            description="Les premières références arrivent au catalogue. La bibliothèque sera consultable dès l'ouverture des abonnements."
            action={{ href: '/bibliotheque', label: 'Voir les conditions d’accès' }}
          />
        ) : (
          <div className="book-grid">
            {books.map((r) => (
              <Book key={r.id} b={resourceToBook(r)} href={`/bibliotheque/${r.id}`} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function BooksSkeleton() {
  return (
    <section className="section" aria-hidden="true">
      <div className="container">
        <div className="skeleton" style={{ height: 24, width: 240, marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 56, width: '55%', marginBottom: 32 }} />
        <div className="book-grid">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i}>
              <div className="skeleton" style={{ aspectRatio: '2/3', width: '100%' }} />
              <div className="skeleton" style={{ height: 16, width: '90%', marginTop: 10 }} />
              <div className="skeleton" style={{ height: 12, width: '70%', marginTop: 6 }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

async function TestimonialsSection({ locale }: { locale: Locale }) {
  const [rows, fallback] = await Promise.all([
    prisma.testimonial.findMany({
      where: { published: true, locale },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      take: 6,
    }),
    getSetting('home.testimonials', locale),
  ]);
  const testimonials =
    rows.length > 0
      ? rows.map((t) => ({ quote: t.quote, name: t.authorName, role: t.authorRole ?? '' }))
      : fallback;

  return (
    <section className="section">
      <div className="container">
        <div className="section-header">
          <div>
            <span className="eyebrow" style={{ marginBottom: 16 }}>
              Voix d&apos;alumni
            </span>
            <h2>
              Ils ont étudié au CPFA
              <br />
              <em className="italic-emph">— et l&apos;ont prouvé.</em>
            </h2>
          </div>
        </div>
        {testimonials.length === 0 ? (
          <EmptyState
            title="Les premiers retours arrivent"
            description="Les diplômés de la promotion 2026 partageront leurs parcours dès la fin du cursus."
          />
        ) : (
          <div className="quote-grid">
            {testimonials.map((t, i) => (
              <figure key={i} className="quote-card">
                <blockquote className="quote-text">{t.quote}</blockquote>
                <figcaption className="quote-author">
                  <div className="quote-avatar" aria-hidden="true">
                    {t.name
                      .split(' ')
                      .map((p) => p[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                  <div>
                    <div className="quote-name">{t.name}</div>
                    <div className="quote-role">{t.role}</div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function TestimonialsSkeleton() {
  return (
    <section className="section" aria-hidden="true">
      <div className="container">
        <div className="skeleton" style={{ height: 24, width: 180, marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 56, width: '50%', marginBottom: 32 }} />
        <div className="quote-grid">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="quote-card">
              <div className="skeleton" style={{ height: 14, width: '95%', marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 14, width: '85%', marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 14, width: '70%' }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
