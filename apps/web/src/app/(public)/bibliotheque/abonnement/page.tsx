import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Breadcrumb } from '@/components/cpfa/breadcrumb';
import { resolveLocale } from '@/i18n/request';
import { richTags } from '@/lib/i18n-tags';
import {
  LIBRARY_LOAN_DAYS,
  LIBRARY_OPENING_HOURS,
  type SubscriptionTier,
} from '@/lib/library-rules';
import { getLibraryTiers } from '@/lib/library-pricing';
import {
  getSubscriptionProcedure,
  type ProcedureBlock,
  type SubscriptionProcedure,
} from '@/lib/subscription-procedure';

export const dynamic = 'force-dynamic';

const TIER_ORDER: SubscriptionTier[] = ['STUDENT', 'PROFESSIONAL', 'HOME_LOAN'];
const TIER_LABEL_KEY = {
  STUDENT: 'tierStudent',
  PROFESSIONAL: 'tierProfessional',
  HOME_LOAN: 'tierHomeLoan',
} as const;

export async function generateMetadata() {
  const t = await getTranslations('libraryProcedure');
  return { title: t('metaTitle'), description: t('metaDescription') };
}

export default async function SubscriptionProcedurePage() {
  const locale = await resolveLocale();
  const [t, tLibrary, tiers] = await Promise.all([
    getTranslations('libraryProcedure'),
    getTranslations('library'),
    getLibraryTiers(locale),
  ]);
  const doc = getSubscriptionProcedure(locale, tiers);
  const money = (xof: number) =>
    `${xof.toString().replace(/\B(?=(\d{3})+(?!\d))/g, locale === 'en' ? ',' : ' ')} FCFA`;
  // « 08h00 » se lit « 08:00 » en anglais.
  const hour = (value: string) => (locale === 'en' ? value.replace('h', ':') : value);

  return (
    <div>
      <div className="page-head container">
        <Breadcrumb
          items={[
            { href: '/', label: 'CPFA' },
            { href: '/bibliotheque', label: tLibrary('title') },
            { label: t('breadcrumb') },
          ]}
        />
        <h1 style={{ maxWidth: 900 }}>{t.rich('h1', richTags)}</h1>
        <p className="fs-17 text-mid" style={{ maxWidth: 620, marginTop: 16, lineHeight: 1.55 }}>
          {doc.intro}
        </p>
        <div className="row gap-3" style={{ marginTop: 24, flexWrap: 'wrap' }}>
          <a className="btn btn-primary" href="/bibliotheque/abonnement/procedure.pdf">
            {t('download')} <span className="arrow">↓</span>
          </a>
          <Link className="btn btn-ghost" href="/me/abonnement">
            {t('ctaSubscribe')}
          </Link>
        </div>
      </div>

      <div className="container">
        {/* Les trois formules, alimentées par LIBRARY_TIERS : les montants
            affichés ici sont ceux que la caisse encaisse réellement. */}
        <section style={{ marginBottom: 64 }}>
          <h2 style={{ marginBottom: 24 }}>{t.rich('tiersHeading', richTags)}</h2>
          <div className="tier-grid">
            {TIER_ORDER.map((key) => {
              const tier = tiers[key];
              return (
                <div key={key} className="card tier-card">
                  <div className="label">{t(TIER_LABEL_KEY[key])}</div>
                  <p className="serif tier-price">{money(tier.priceXof)}</p>
                  <p className="fs-13 text-soft">{t('perYear')}</p>
                  <p className="fs-14 text-mid" style={{ marginTop: 16, lineHeight: 1.5 }}>
                    {tier.homeLoan ? t('tierHomeLoanDesc') : t('tierOnSiteDesc')}
                  </p>
                  {tier.depositXof > 0 ? (
                    <p className="fs-13 text-soft" style={{ marginTop: 12 }}>
                      {t('depositBreakdown', {
                        fee: money(tier.feeXof),
                        deposit: money(tier.depositXof),
                      })}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        <section className="panel" style={{ padding: 32, marginBottom: 64 }}>
          <h4 style={{ marginBottom: 20 }}>{t('essentialsHeading')}</h4>
          <div className="essentials-grid">
            <Fact
              label={t('factHours')}
              value={t('factHoursValue', {
                opensAt: hour(LIBRARY_OPENING_HOURS.opensAt),
                closesAt: hour(LIBRARY_OPENING_HOURS.closesAt),
              })}
            />
            <Fact label={t('factDocuments')} value={t('factDocumentsValue')} />
            <Fact label={t('factLoan')} value={t('factLoanValue', { days: LIBRARY_LOAN_DAYS })} />
            <Fact label={t('factPayment')} value={t('factPaymentValue')} />
          </div>
        </section>

        <article className="procedure-doc">
          {doc.sections.map((section) => (
            <section key={section.number} style={{ marginBottom: 48 }}>
              <h3 className="procedure-heading">
                <span className="procedure-number">{section.number}</span>
                {section.title}
              </h3>
              <Blocks blocks={section.blocks} />
              {section.subsections.map((sub) => (
                <div key={sub.number} className="procedure-subsection">
                  <h4>
                    {sub.number}. {sub.title}
                  </h4>
                  <Blocks blocks={sub.blocks} />
                </div>
              ))}
            </section>
          ))}

          <Closing doc={doc} />
        </article>

        <div className="row gap-3" style={{ margin: '48px 0 96px', flexWrap: 'wrap' }}>
          <Link className="btn btn-primary" href="/me/abonnement">
            {t('ctaSubscribe')} <span className="arrow">→</span>
          </Link>
          <a className="btn btn-ghost" href="/bibliotheque/abonnement/procedure.pdf">
            {t('download')}
          </a>
          <Link className="btn btn-ghost" href="/contact">
            {t('ctaContact')}
          </Link>
        </div>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="label">{label}</div>
      <div className="fs-15" style={{ marginTop: 6, lineHeight: 1.5 }}>
        {value}
      </div>
    </div>
  );
}

function Blocks({ blocks }: { blocks: ProcedureBlock[] }) {
  return (
    <>
      {blocks.map((block, i) =>
        block.kind === 'paragraph' ? (
          <p key={i} className="procedure-paragraph">
            {block.text}
          </p>
        ) : (
          <ul key={i} className="procedure-list">
            {block.items.map((item) => (
              <li key={item.text}>
                {item.text}
                {item.children?.length ? (
                  <ul>
                    {item.children.map((child) => (
                      <li key={child}>{child}</li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        ),
      )}
    </>
  );
}

function Closing({ doc }: { doc: SubscriptionProcedure }) {
  return (
    <section className="procedure-closing">
      {doc.closing.map((text) => (
        <p key={text} className="procedure-paragraph">
          {text}
        </p>
      ))}
      <p className="procedure-tagline">{doc.tagline}</p>
      <p className="procedure-signature">{doc.signature}</p>
    </section>
  );
}
