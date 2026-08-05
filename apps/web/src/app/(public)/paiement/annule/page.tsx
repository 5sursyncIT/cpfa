import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { richTags } from '@/lib/i18n-tags';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const t = await getTranslations('payment');
  return { title: t('cancelMetaTitle') };
}

// Landing reached via PayTech `cancel_url`. The Payment row stays PENDING — the
// user can retry from the same page that triggered initiate(), or contact the
// comptable for a manual static-QR fallback.
export default async function PaymentCancelPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const [{ ref }, t] = await Promise.all([searchParams, getTranslations('payment')]);
  return (
    <div className="container" style={{ padding: '64px 0' }}>
      <div className="breadcrumb">
        CPFA · <span>{t('breadcrumb')}</span>
      </div>
      <h1>{t.rich('cancelH1', richTags)}</h1>
      <p>{t('cancelBody')}</p>
      {ref ? (
        <p style={{ color: 'var(--cpfa-muted, #64748b)', fontSize: 13 }}>
          {t('referenceLabel')} <code>{ref}</code>
        </p>
      ) : null}
      <p style={{ marginTop: 24 }}>
        <Link href="/me/abonnement">{t('retryCta')}</Link>
        {' · '}
        <Link href="/contact">{t('contactCta')}</Link>
      </p>
    </div>
  );
}
