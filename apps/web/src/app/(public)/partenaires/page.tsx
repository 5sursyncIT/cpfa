import { getTranslations } from 'next-intl/server';
import { fetchCmsPage } from '@/lib/cms-page';
import { BlockRenderer } from '@/components/cms/block-renderer';
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

  const partnerCategories = [
    {
      title: t('categoryInsurers'),
      items: ['Partenaire 1', 'Partenaire 2', 'Partenaire 3'],
    },
    {
      title: t('categoryAcademic'),
      items: ['Partenaire 4', 'Partenaire 5'],
    },
    {
      title: t('categoryRegulators'),
      items: ['Partenaire 6', 'Partenaire 7'],
    },
  ];

  return (
    <section className="container py-16">
      <h1 className="text-4xl font-bold tracking-tight">{t('title')}</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">{t('intro')}</p>
      <div className="mt-10 grid gap-8 md:grid-cols-3">
        {partnerCategories.map((cat) => (
          <div key={cat.title}>
            <h2 className="text-lg font-semibold">{cat.title}</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {cat.items.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
