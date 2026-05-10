import Link from 'next/link';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { fetchCmsPage } from '@/lib/cms-page';
import { BlockRenderer } from '@/components/cms/block-renderer';
import { getSetting } from '@/lib/site-settings/get';
import { resolveLocale } from '@/i18n/request';
import { Breadcrumb } from '@/components/cpfa/breadcrumb';
import { richTags } from '@/lib/i18n-tags';
import directorPhoto from '../mot-du-directeur/DG.jpg';

export const dynamic = 'force-dynamic';

const STATIC_SLUG = 'a-propos';

export async function generateMetadata() {
  const locale = await resolveLocale();
  const [cms, t] = await Promise.all([
    fetchCmsPage(STATIC_SLUG, locale),
    getTranslations('about'),
  ]);
  return {
    title: cms?.metaTitle ?? `${cms?.title ?? t('title')} — CPFA`,
    description: cms?.metaDescription ?? undefined,
  };
}

export default async function AboutPage() {
  const locale = await resolveLocale();
  const [cms, governance, partners, stats, t] = await Promise.all([
    fetchCmsPage(STATIC_SLUG, locale),
    getSetting('about.governance', locale),
    getSetting('about.partners', locale),
    getSetting('about.stats', locale),
    getTranslations('about'),
  ]);

  if (cms) {
    // Editor opted in to a fully CMS-driven page. The rich governance/stats
    // layout is sacrificed; if you want both, manage governance/stats via the
    // future SiteSetting model rather than overriding here.
    return (
      <article className="container max-w-3xl py-16">
        <h1 className="text-4xl font-bold tracking-tight">{cms.title}</h1>
        <div className="prose prose-slate mt-8 max-w-none">
          <BlockRenderer content={cms.content} />
        </div>
      </article>
    );
  }

  return (
    <div>
      <div className="container page-head">
        <Breadcrumb items={[{ href: '/', label: 'CPFA' }, { label: t('title') }]} />
        <h1 style={{ maxWidth: 1100, fontSize: 'clamp(56px, 6.5vw, 96px)' }}>
          {t.rich('h1', richTags)}
        </h1>
      </div>

      <div className="container">
        <section className="director-card" style={{ marginBottom: 96 }}>
          <div className="director-photo-frame">
            <div className="director-photo-stage" aria-hidden="true" />
            <div className="director-photo">
              <Image
                src={directorPhoto}
                alt={t('directorPhotoAlt')}
                placeholder="blur"
                sizes="(max-width: 1100px) 100vw, 480px"
              />
            </div>
            <div className="director-badge">
              <div className="director-badge-kicker">{t('directorBadge')}</div>
              <div className="director-badge-name">{t('directorBadgeShort')}</div>
            </div>
          </div>

          <div className="director-body">
            <span className="eyebrow" style={{ marginBottom: 16 }}>
              {t('directorEyebrow')}
            </span>
            <blockquote className="director-quote">
              {t.rich('directorQuote', richTags)}
            </blockquote>
            <div className="director-meta">
              <div className="director-name">{t('directorName')}</div>
              <div className="director-role">{t('directorRole')}</div>
            </div>
            <div className="row gap-3" style={{ marginTop: 24, flexWrap: 'wrap' }}>
              <Link href="/mot-du-directeur" className="btn btn-primary">
                {t('ctaReadFull')} <span className="arrow">→</span>
              </Link>
              <Link href="/contact" className="btn btn-ghost">
                {t('ctaBookMeeting')}
              </Link>
            </div>
          </div>
        </section>

        <div
          className="row gap-7"
          style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', marginBottom: 96 }}
        >
          <div className="col gap-5">
            <p className="fs-17 text-mid" style={{ lineHeight: 1.55 }}>
              {t.rich('intro1', richTags)}
            </p>
            <p className="fs-17 text-mid" style={{ lineHeight: 1.55 }}>
              {t('intro2')}
            </p>
            <div className="row gap-3">
              <button type="button" className="btn btn-primary">
                {t('ctaAnnualReport')}
              </button>
              <Link href="/contact" className="btn btn-ghost">
                {t('ctaWriteUs')}
              </Link>
            </div>
          </div>

          <div className="card" style={{ padding: 32 }}>
            <div className="label">{t('governanceLabel')}</div>
            <div className="col gap-4" style={{ marginTop: 16 }}>
              {governance.map((g, i) => (
                <div
                  key={g.role}
                  style={{
                    paddingTop: 16,
                    borderTop: i ? '1px solid var(--line)' : 'none',
                  }}
                >
                  <div className="label">{g.role}</div>
                  <div className="fs-15" style={{ fontWeight: 500, marginTop: 4 }}>
                    {g.name}
                  </div>
                  <div className="fs-13 text-soft" style={{ marginTop: 2 }}>
                    {g.note}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <h2 style={{ marginBottom: 32 }}>{t.rich('partnersHeading', richTags)}</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: 0,
            border: '1px solid var(--line)',
            borderRadius: 14,
            overflow: 'hidden',
            marginBottom: 96,
          }}
        >
          {partners.map((p, i) => (
            <div
              key={p}
              style={{
                padding: '32px 24px',
                borderRight: (i + 1) % 6 ? '1px solid var(--line)' : 'none',
                borderTop: i >= 6 ? '1px solid var(--line)' : 'none',
                textAlign: 'center',
              }}
            >
              <div className="serif" style={{ fontSize: 24, lineHeight: 1.1 }}>
                {p}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 96 }}>
          <h2 style={{ marginBottom: 32 }}>{t.rich('statsHeading', richTags)}</h2>
          <div className="stat-row">
            {stats.map((s) => (
              <div key={s.label} className="stat">
                <div className="stat-value">
                  {s.value}
                  {s.sup ? <sup>{s.sup}</sup> : null}
                </div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
