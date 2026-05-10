import { fetchCmsPage } from '@/lib/cms-page';
import { BlockRenderer } from '@/components/cms/block-renderer';
import { resolveLocale } from '@/i18n/request';

export const dynamic = 'force-dynamic';

const STATIC_SLUG = 'partenaires';

const partnerCategories = [
  {
    title: 'Compagnies d’assurance',
    items: ['Partenaire 1', 'Partenaire 2', 'Partenaire 3'],
  },
  {
    title: 'Institutions académiques',
    items: ['Partenaire 4', 'Partenaire 5'],
  },
  {
    title: 'Régulateurs et fédérations',
    items: ['Partenaire 6', 'Partenaire 7'],
  },
];

export async function generateMetadata() {
  const cms = await fetchCmsPage(STATIC_SLUG, await resolveLocale());
  return {
    title: cms?.metaTitle ?? `${cms?.title ?? 'Partenaires'} — CPFA`,
    description: cms?.metaDescription ?? undefined,
  };
}

export default async function PartnersPage() {
  const cms = await fetchCmsPage(STATIC_SLUG, await resolveLocale());

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

  return (
    <section className="container py-16">
      <h1 className="text-4xl font-bold tracking-tight">Partenaires</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Le CPFA s’appuie sur un réseau de partenaires nationaux et internationaux qui contribuent
        au rayonnement de la formation en assurance.
      </p>
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
