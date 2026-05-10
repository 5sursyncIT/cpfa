import { fetchCmsPage } from '@/lib/cms-page';
import { BlockRenderer } from '@/components/cms/block-renderer';
import { resolveLocale } from '@/i18n/request';

export const dynamic = 'force-dynamic';

const STATIC_SLUG = 'mot-du-directeur';

export async function generateMetadata() {
  const cms = await fetchCmsPage(STATIC_SLUG, await resolveLocale());
  return {
    title: cms?.metaTitle ?? `${cms?.title ?? 'Mot du Directeur'} — CPFA`,
    description: cms?.metaDescription ?? undefined,
  };
}

export default async function DirectorWordPage() {
  const cms = await fetchCmsPage(STATIC_SLUG, await resolveLocale());

  if (cms) {
    return (
      <article className="container max-w-3xl py-16">
        <h1 className="text-4xl font-bold tracking-tight">{cms.title}</h1>
        <p className="mt-2 text-sm uppercase tracking-widest text-muted-foreground">
          Centre Professionnel de Formation à l’Assurance
        </p>
        <div className="prose prose-slate mt-8 max-w-none">
          <BlockRenderer content={cms.content} />
        </div>
      </article>
    );
  }

  // Fallback: shipped copy. Editors override via /admin/cms with slug
  // "mot-du-directeur" + locale "fr" + published.
  return (
    <article className="container max-w-3xl py-16">
      <h1 className="text-4xl font-bold tracking-tight">Mot du Directeur</h1>
      <p className="mt-2 text-sm uppercase tracking-widest text-muted-foreground">
        Centre Professionnel de Formation en Assurance — Unité décentralisée de l’IIA Yaoundé
      </p>
      <div className="prose prose-slate mt-8 max-w-none">
        <p>
          Bienvenue au Centre Professionnel de Formation en Assurance, unité décentralisée de
          l&apos;Institut International des Assurances (IIA) de Yaoundé. Notre mission : promouvoir
          la formation aux métiers de l&apos;assurance à grande échelle, au Sénégal et dans toute
          la zone CIMA.
        </p>
        <p>
          Reconnu par la Direction des Assurances, le CPFA forme depuis sa création des
          techniciens, cadres et dirigeants capables de répondre aux exigences techniques,
          juridiques et commerciales d&apos;un secteur en transformation rapide.
        </p>
        <p>
          Que vous soyez étudiant, professionnel en reconversion ou cadre confirmé, vous
          trouverez ici le parcours adapté à votre projet : DTA, BTS Assurance, certifications
          spécialisées, séminaires d&apos;actualité et accès à notre bibliothèque dédiée.
        </p>
        <p className="text-right">— El Hadji Cheikhou Oumar SECK, Directeur</p>
      </div>
    </article>
  );
}
