import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { RecruiterOfferForm } from './offer-form';
import { richTags } from '@/lib/i18n-tags';

export async function generateMetadata() {
  const t = await getTranslations('recruiterPage');
  return { title: t('metaTitle') };
}

export default async function RecruiterPage() {
  const [t, tLearners] = await Promise.all([
    getTranslations('recruiterPage'),
    getTranslations('learners'),
  ]);
  return (
    <div className="container" style={{ padding: '64px 0', maxWidth: 800 }}>
      <div className="breadcrumb">
        CPFA · {tLearners('title')} · <Link href="/emplois">{t('offersBreadcrumb')}</Link> ·{' '}
        <span>{t('breadcrumb')}</span>
      </div>

      <h1 style={{ fontSize: 'clamp(36px, 4.5vw, 56px)', marginBottom: 12 }}>
        {t.rich('h1', richTags)}
      </h1>
      <p className="fs-15 text-mid" style={{ marginBottom: 24, lineHeight: 1.5 }}>
        {t('intro')}
      </p>

      <RecruiterOfferForm />
    </div>
  );
}
