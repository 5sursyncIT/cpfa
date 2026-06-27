import { getTranslations } from 'next-intl/server';
import { fetchCmsPage } from '@/lib/cms-page';
import { BlockRenderer } from '@/components/cms/block-renderer';
import { getPartners } from '@/lib/content-blocks';
import { mediaUrl } from '@/lib/media';
import { resolveLocale } from '@/i18n/request';

export const dynamic = 'force-dynamic';

const STATIC_SLUG = 'partenaires';

export async function generateMetadata() {
  const locale = await resolveLocale();
  const [cms, t] = await Promise.all([
    fetchCmsPage(STATIC_SLUG, locale),
    getTranslations('partnersPage'),
  ]);
  return {
    title: cms?.metaTitle ?? `${cms?.title ?? t('title')} — CPFA`,
    description: cms?.metaDescription ?? undefined,
  };
}

export default async function PartnersPage() {
  const locale = await resolveLocale();
  const [cms, t] = await Promise.all([
    fetchCmsPage(STATIC_SLUG, locale),
    getTranslations('partnersPage'),
  ]);

  if (cms) {
    return (
      <article className="container max-w-3xl py-16">
        <h1 className="text-4xl font-bold tracking-tight">{cms.title}</h1>
        <div className="prose prose-slate mt-8 max-w-none">
          <BlockRenderer content={cms.content} />
        </div>
      </article>
    );
  }

  // Managed partners (admin → Contenu → Partenaires). No fake placeholders.
  const partners = await getPartners(locale);

  return (
    <section className="container py-16">
      <h1 className="text-4xl font-bold tracking-tight">{t('title')}</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">{t('intro')}</p>
      {partners.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">{t('empty')}</p>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
          {partners.map((p) => {
            const logo = mediaUrl(p.logoKey);
            const card = (
              <div className="flex h-28 items-center justify-center rounded-lg border bg-card p-4 text-center">
                {logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logo}
                    alt={p.name}
                    className="max-h-16 max-w-full object-contain"
                  />
                ) : (
                  <span className="text-sm font-medium">{p.name}</span>
                )}
              </div>
            );
            return p.url ? (
              <a
                key={p.name}
                href={p.url}
                target="_blank"
                rel="noreferrer"
                title={p.name}
                className="transition hover:opacity-80"
              >
                {card}
              </a>
            ) : (
              <div key={p.name} title={p.name}>
                {card}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
