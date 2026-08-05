import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { richTags } from '@/lib/i18n-tags';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const t = await getTranslations('payment');
  return { title: t('successMetaTitle') };
}

// Landing reached via PayTech `success_url` after a successful checkout.
// The actual confirmation runs out-of-band: PayTech POSTs the IPN to
// /api/webhooks/payments/paytech, which enqueues a payment-webhook job that
// flips the Payment to CONFIRMED and triggers downstream effects. So the
// user can land here a few seconds before the DB is updated — phrase the
// copy accordingly.
export default async function PaymentSuccessPage({
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
      <h1>{t.rich('successH1', richTags)}</h1>
      <p>{t('successBody')}</p>
      {ref ? (
        <p style={{ color: 'var(--cpfa-muted, #64748b)', fontSize: 13 }}>
          {t('referenceLabel')} <code>{ref}</code>
        </p>
      ) : null}
      <p style={{ marginTop: 24 }}>
        <Link href="/me/abonnement">{t('mySpaceCta')}</Link>
        {' · '}
        <Link href="/">{t('homeCta')}</Link>
      </p>
    </div>
  );
}
