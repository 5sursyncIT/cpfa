import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { fetchCmsPage } from '@/lib/cms-page';
import { BlockRenderer } from '@/components/cms/block-renderer';
import { resolveLocale } from '@/i18n/request';
import { directorPhoto, DIRECTOR_NAME } from '@/lib/director-photo';

// Portrait qui accompagne le mot du Directeur (§1.2 du Directeur).
function DirectorPortrait({ role }: { role: string }) {
  return (
    <figure className="shrink-0 text-center">
      <Image
        src={directorPhoto}
        alt={`Portrait de ${DIRECTOR_NAME}, Directeur du CPFA`}
        placeholder="blur"
        priority
        sizes="200px"
        className="mx-auto h-[200px] w-[164px] rounded-lg object-cover shadow-sm"
      />
      <figcaption className="mt-3 text-sm">
        <span className="block font-medium">{DIRECTOR_NAME}</span>
        <span className="text-muted-foreground block text-xs">{role}</span>
      </figcaption>
    </figure>
  );
}

export const dynamic = 'force-dynamic';

const STATIC_SLUG = 'mot-du-directeur';

export async function generateMetadata() {
  const locale = await resolveLocale();
  const [cms, t] = await Promise.all([
    fetchCmsPage(STATIC_SLUG, locale),
    getTranslations('directorPage'),
  ]);
  return {
    title: cms?.metaTitle ?? `${cms?.title ?? t('title')} — CPFA`,
    description: cms?.metaDescription ?? undefined,
  };
}

export default async function DirectorWordPage() {
  const locale = await resolveLocale();
  const [cms, t] = await Promise.all([
    fetchCmsPage(STATIC_SLUG, locale),
    getTranslations('directorPage'),
  ]);

  if (cms) {
    return (
      <article className="container max-w-3xl py-16">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start">
          <div className="min-w-0 flex-1">
            <h1 className="text-4xl font-bold tracking-tight">{cms.title}</h1>
            <p className="text-muted-foreground mt-2 text-sm uppercase tracking-widest">
              {t('subtitle')}
            </p>
          </div>
          <DirectorPortrait role={t('role')} />
        </div>
        <div className="prose prose-slate mt-8 max-w-none">
          <BlockRenderer content={cms.content} />
        </div>
      </article>
    );
  }

  // Fallback: shipped copy. Editors override via /admin/cms with the
  // matching slug + locale + published flag.
  return (
    <article className="container max-w-3xl py-16">
      <div className="flex flex-col gap-8 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <h1 className="text-4xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground mt-2 text-sm uppercase tracking-widest">
            {t('subtitle')}
          </p>
        </div>
        <DirectorPortrait role={t('role')} />
      </div>
      <div className="prose prose-slate mt-8 max-w-none">
        <p>{t('p1')}</p>
        <p>{t('p2')}</p>
        <p>{t('p3')}</p>
        <p>{t('p4')}</p>
        <p>{t('p5')}</p>
        <p>{t('p6')}</p>
        <p>{t('p7')}</p>
        <p className="text-right">{t('signature')}</p>
      </div>
    </article>
  );
}
