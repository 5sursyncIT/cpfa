import Link from 'next/link';
import { fetchCmsPage } from '@/lib/cms-page';
import { BlockRenderer } from '@/components/cms/block-renderer';
import { getSetting } from '@/lib/site-settings/get';
import { resolveLocale } from '@/i18n/request';

export const dynamic = 'force-dynamic';

const STATIC_SLUG = 'a-propos';

export async function generateMetadata() {
  const cms = await fetchCmsPage(STATIC_SLUG, await resolveLocale());
  return {
    title: cms?.metaTitle ?? `${cms?.title ?? 'À propos'} — CPFA`,
    description: cms?.metaDescription ?? undefined,
  };
}

export default async function AboutPage() {
  const locale = await resolveLocale();
  const [cms, governance, partners, stats] = await Promise.all([
    fetchCmsPage(STATIC_SLUG, locale),
    getSetting('about.governance', locale),
    getSetting('about.partners', locale),
    getSetting('about.stats', locale),
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
        <div className="breadcrumb">
          CPFA · <span>À propos</span>
        </div>
        <h1 style={{ maxWidth: 1100, fontSize: 'clamp(56px, 6.5vw, 96px)' }}>
          Trente ans à former l&apos;<em className="italic-emph">orbite</em> de l&apos;assurance
          ouest-africaine.
        </h1>
      </div>

      <div className="container">
        <div
          className="row gap-7"
          style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', marginBottom: 96 }}
        >
          <div className="col gap-5">
            <p className="fs-17 text-mid" style={{ lineHeight: 1.55 }}>
              Fondé en 1996 sous l&apos;impulsion conjointe du Ministère des Finances et de la
              Fédération Sénégalaise des Sociétés d&apos;Assurances, le CPFA est devenu en trois
              décennies <em className="italic-emph">la référence académique régionale</em> pour
              les métiers techniques et managériaux de l&apos;assurance.
            </p>
            <p className="fs-17 text-mid" style={{ lineHeight: 1.55 }}>
              Plus de 4 200 diplômés exercent aujourd&apos;hui dans les compagnies de la zone
              CIMA, à la Direction des Assurances, dans les cabinets de courtage, et jusqu&apos;aux
              institutions panafricaines comme la CICA-Re et Africa-Re.
            </p>
            <div className="row gap-3">
              <button type="button" className="btn btn-primary">
                Rapport annuel 2025 (PDF)
              </button>
              <Link href="/contact" className="btn btn-ghost">
                Nous écrire
              </Link>
            </div>
          </div>

          <div className="card" style={{ padding: 32 }}>
            <div className="label">Gouvernance</div>
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

        <h2 style={{ marginBottom: 32 }}>
          Partenaires <em className="italic-emph">institutionnels</em>.
        </h2>
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
          <h2 style={{ marginBottom: 32 }}>
            Trois décennies, <em className="italic-emph">en chiffres</em>.
          </h2>
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
