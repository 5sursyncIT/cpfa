import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@cpfa/db';
import { Book } from '@/components/cpfa/book';
import { Countdown } from '@/components/cpfa/countdown';
import { FormationCard } from '@/components/cpfa/formation-card';
import { Marquee } from '@/components/cpfa/marquee';
import { EmptyState } from '@/components/cpfa/empty-state';
import { courseToCard, resourceToBook } from '@/lib/cpfa-mappers';
import { getSetting } from '@/lib/site-settings/get';
import { getKeyFigures, getHomeTestimonials } from '@/lib/content-blocks';
import { applyFigures, getSiteFigures } from '@/lib/site-figures';
import { intlLocale, resolveLocale, type Locale } from '@/i18n/request';
import { HomeBlocksSection } from '@/components/cpfa/home-blocks-section';
import { renderEmph } from '@/lib/render-emph';
import heroPhoto from './hero/hero_cpafa_v2.jpg';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const locale = await resolveLocale();
  const [hero, t] = await Promise.all([getSetting('home.hero', locale), getTranslations('home')]);

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
              <div className="row hero-ctas gap-3">
                <Link href="/formations" className="btn btn-primary btn-lg">
                  {t('heroCtaPrimary')} <span className="arrow">→</span>
                </Link>
                <Link href="/a-propos" className="btn btn-ghost btn-lg">
                  {t('heroCtaSecondary')}
                </Link>
              </div>
            </div>
            <div className="hero-visual">
              <div className="hero-photo-frame">
                <div className="hero-photo-stage" aria-hidden="true" />
                <div className="hero-photo">
                  <Image
                    src={heroPhoto}
                    alt={t('heroPhotoAlt')}
                    placeholder="blur"
                    priority
                    sizes="(max-width: 1100px) 100vw, 560px"
                  />
                  <div className="hero-photo-shade" aria-hidden="true" />
                </div>
                <div className="hero-photo-tag hero-photo-tag--top">
                  <span className="hero-photo-tag-dot" aria-hidden="true" />
                  <div>
                    <div className="hero-photo-tag-kicker">{t('heroTagRecognition')}</div>
                    <div className="hero-photo-tag-value">{t('heroTagRecognitionValue')}</div>
                  </div>
                </div>
                <div className="hero-photo-tag hero-photo-tag--bottom">
                  <div>
                    <div className="hero-photo-tag-kicker">{t('heroTagAffiliation')}</div>
                    <div className="hero-photo-tag-value">{t('heroTagAffiliationValue')}</div>
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
        <FeaturedFormationsSection locale={locale} />
      </Suspense>

      <Suspense fallback={<BooksSkeleton />}>
        <BooksSection locale={locale} />
      </Suspense>

      <Suspense fallback={<TestimonialsSkeleton />}>
        <TestimonialsSection locale={locale} />
      </Suspense>

      <ConcoursSection locale={locale} />
    </>
  );
}

async function ConcoursSection({ locale }: { locale: Locale }) {
  // Dates, frais et description viennent du concours publié : le compte à
  // rebours et les faits affichés à côté ne peuvent plus se contredire.
  const [section, nextExam] = await Promise.all([
    getSetting('home.concours', locale),
    prisma.exam.findFirst({
      where: { published: true, closeAt: { gt: new Date() } },
      orderBy: { closeAt: 'asc' },
      select: {
        slug: true,
        title: true,
        description: true,
        closeAt: true,
        examAt: true,
        feeXof: true,
      },
    }),
  ]);

  const fmtDay = new Intl.DateTimeFormat(intlLocale(locale), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const facts: Array<[string, string]> = nextExam
    ? [
        [section.labelDeposit, `jusqu'au ${fmtDay.format(nextExam.closeAt)}`],
        ...(nextExam.examAt
          ? ([[section.labelWritten, fmtDay.format(nextExam.examAt)]] as Array<[string, string]>)
          : []),
        [section.labelFee, `${nextExam.feeXof.toLocaleString('fr-FR')} FCFA`],
      ]
    : [];

  return (
    <section className="section" style={{ paddingBottom: 0, borderTop: 'none' }}>
      <div className="container">
        <div className="concours-card">
          <div>
            <span className="eyebrow" style={{ marginBottom: 16 }}>
              {section.eyebrow}
            </span>
            <div className="concours-headline">{renderEmph(section.headline)}</div>
            {nextExam ? <Countdown deadline={nextExam.closeAt} /> : null}
            <div className="row gap-3">
              <Link href="/concours" className="btn btn-orange btn-lg">
                {section.ctaPrimary} <span className="arrow">→</span>
              </Link>
              <Link href="/concours" className="btn btn-ghost btn-lg">
                {section.ctaSecondary}
              </Link>
            </div>
          </div>
          <div>
            <p className="fs-17 text-mid" style={{ lineHeight: 1.5 }}>
              {nextExam?.description || section.fallbackDescription}
            </p>
            <div className="divider" style={{ margin: '24px 0' }}></div>
            {facts.length > 0 ? (
              <div className="col gap-3">
                {facts.map(([k, v]) => (
                  <div key={k} className="row" style={{ justifyContent: 'space-between' }}>
                    <span className="text-soft fs-13">{k}</span>
                    <span className="mono fs-13">{v}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="fs-14 text-soft">{section.emptyMessage}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

async function StatsSection({ locale }: { locale: Locale }) {
  const homeStats = await getKeyFigures('HOME', locale);
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

async function FeaturedFormationsSection({ locale }: { locale: Locale }) {
  const [featured, section, figures] = await Promise.all([
    prisma.course.findMany({
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
    }),
    getSetting('home.featured', locale),
    getSiteFigures(),
  ]);
  return (
    <section className="section">
      <div className="container">
        <div className="section-header">
          <div>
            <span className="eyebrow" style={{ marginBottom: 16 }}>
              {section.eyebrow}
            </span>
            <h2>{renderEmph(applyFigures(section.headline, figures))}</h2>
          </div>
          <Link href="/formations" className="btn btn-ghost">
            {section.cta} <span className="arrow">→</span>
          </Link>
        </div>
        {featured.length === 0 ? (
          <EmptyState
            title={section.emptyTitle}
            description={section.emptyDescription}
            action={{ href: '/contact', label: section.emptyAction }}
          />
        ) : (
          <div className="formations-grid">
            {featured.map((c) => (
              <FormationCard key={c.slug} f={courseToCard(c, locale)} />
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

async function BooksSection({ locale }: { locale: Locale }) {
  const [books, section, figures] = await Promise.all([
    prisma.resource.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, title: true, authors: true, totalCopies: true },
    }),
    getSetting('home.books', locale),
    getSiteFigures(),
  ]);
  return (
    <section className="section">
      <div className="container">
        <div className="section-header">
          <div>
            <span className="eyebrow" style={{ marginBottom: 16 }}>
              {section.eyebrow}
            </span>
            <h2>{renderEmph(applyFigures(section.headline, figures))}</h2>
          </div>
          <Link href="/bibliotheque" className="btn btn-ghost">
            {section.cta} <span className="arrow">→</span>
          </Link>
        </div>
        {books.length === 0 ? (
          <EmptyState
            title={section.emptyTitle}
            description={section.emptyDescription}
            action={{ href: '/bibliotheque', label: section.emptyAction }}
          />
        ) : (
          <div className="book-grid">
            {books.map((r) => (
              <Book key={r.id} b={resourceToBook(r, locale)} href={`/bibliotheque/${r.id}`} />
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
  // Habillage éditable dans /admin/settings ; témoignages dans
  // /admin/testimonials. Aucun texte de cette section ne vit plus dans le code.
  const [testimonials, section] = await Promise.all([
    getHomeTestimonials(locale),
    getSetting('home.testimonialsSection', locale),
  ]);

  return (
    <section className="section">
      <div className="container">
        <div className="section-header">
          <div>
            <span className="eyebrow" style={{ marginBottom: 16 }}>
              {renderEmph(section.eyebrow)}
            </span>
            <h2>{renderEmph(section.headline)}</h2>
          </div>
        </div>
        {testimonials.length === 0 ? (
          <EmptyState title={section.emptyTitle} description={section.emptyDescription} />
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
