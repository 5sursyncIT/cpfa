import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { prisma } from '@cpfa/db';
import { MemberCard } from '@/components/cpfa/member-card';
import { SubscribeButton } from './subscribe-button';
import { resolveLocale } from '@/i18n/request';

export const dynamic = 'force-dynamic';

export default async function MySubscriptionPage() {
  const session = (await auth())!;
  const [subscription, t, tMe, locale] = await Promise.all([
    prisma.subscription.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: { payments: { orderBy: { createdAt: 'desc' }, take: 1 } },
    }),
    getTranslations('meAbonnement'),
    getTranslations('me'),
    resolveLocale(),
  ]);

  const fmt = new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'fr-FR', { dateStyle: 'long' });
  const fmtShort = new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });

  const fullName = session.user.name ?? session.user.email ?? tMe('fallbackCardholder');

  const ADVANTAGES = [t('advantage1'), t('advantage2'), t('advantage3'), t('advantage4')];

  return (
    <div className="col gap-5">
      <h3>{t('h3')}</h3>

      {!subscription ? (
        <NewSubscription />
      ) : subscription.status === 'PENDING' ? (
        <PendingSubscription
          paymentMetadata={subscription.payments[0]?.metadata}
          amountXof={subscription.payments[0]?.amountXof ?? 10_000}
          cardNumber={subscription.cardNumber}
        />
      ) : subscription.status === 'ACTIVE' ? (
        <>
          <p className="fs-15 text-mid" style={{ maxWidth: 560 }}>
            {t('introActive')}
          </p>
          <div style={{ maxWidth: 480 }}>
            <MemberCard
              fullName={fullName}
              cardNumber={subscription.cardNumber}
              promotion={
                subscription.startedAt
                  ? tMe('promotion', { year: subscription.startedAt.getFullYear() })
                  : '—'
              }
              status={tMe('memberStatusSubscriber')}
              validUntil={
                subscription.expiresAt ? fmtShort.format(subscription.expiresAt) : '—'
              }
            />
          </div>
          <div className="row gap-3">
            <button type="button" className="btn btn-primary">
              {t('addToWallet')}
            </button>
            <a href="/api/me/card" target="_blank" rel="noopener" className="btn btn-ghost">
              {t('downloadPdf')}
            </a>
          </div>
          <div className="card" style={{ maxWidth: 560 }}>
            <div className="label">{t('advantagesLabel')}</div>
            <div className="col gap-3" style={{ marginTop: 16 }}>
              {ADVANTAGES.map((label) => (
                <div key={label} className="row gap-3" style={{ alignItems: 'start' }}>
                  <span style={{ color: 'var(--orange)', fontFamily: 'var(--mono)' }}>✓</span>
                  <span className="fs-14">{label}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="fs-13 text-soft" style={{ maxWidth: 560 }}>
            {t.rich('validUntil', {
              mono: (chunks) => <span className="mono">{chunks}</span>,
              cardNumber: subscription.cardNumber,
              date: subscription.expiresAt ? fmt.format(subscription.expiresAt) : '—',
            })}
          </p>
        </>
      ) : (
        <ExpiredSubscription />
      )}
    </div>
  );
}

async function NewSubscription() {
  const t = await getTranslations('meAbonnement');
  return (
    <section className="card" style={{ padding: 32 }}>
      <h4>{t('newHeading')}</h4>
      <p className="fs-15 text-mid" style={{ marginTop: 12, lineHeight: 1.5 }}>
        {t('newDesc')}
      </p>
      <p
        className="serif"
        style={{ fontSize: 48, lineHeight: 1, marginTop: 16, letterSpacing: '-0.02em' }}
      >
        10 000{' '}
        <small className="mono fs-13 text-soft" style={{ letterSpacing: '0.04em' }}>
          {t('newPriceUnit')}
        </small>
      </p>
      <div style={{ marginTop: 24 }}>
        <SubscribeButton />
      </div>
    </section>
  );
}

async function PendingSubscription({
  paymentMetadata,
  amountXof,
  cardNumber,
}: {
  paymentMetadata: unknown;
  amountXof: number;
  cardNumber: string;
}) {
  const t = await getTranslations('meAbonnement');
  const meta = (paymentMetadata ?? {}) as { qrPayload?: string; redirectUrl?: string };
  return (
    <section className="card" style={{ padding: 32 }}>
      <h4>{t('pendingHeading')}</h4>
      <p className="fs-15 text-mid" style={{ marginTop: 12 }}>
        {t.rich('pendingAmount', {
          mono: (chunks) => <span className="mono">{chunks}</span>,
          strong: (chunks) => <strong>{chunks}</strong>,
          cardNumber,
          amount: `${amountXof.toLocaleString('fr-FR')} FCFA`,
        })}
      </p>
      {meta.qrPayload ? (
        <p
          className="fs-13"
          style={{
            marginTop: 16,
            padding: 16,
            background: 'var(--bg-soft)',
            borderRadius: 'var(--r-2)',
            color: 'var(--ink-mid)',
          }}
        >
          {t('pendingQr')}
        </p>
      ) : null}
      {meta.redirectUrl ? (
        <a
          href={meta.redirectUrl}
          className="btn btn-orange"
          style={{ marginTop: 16, alignSelf: 'flex-start' }}
        >
          {t('continuePayment')} <span className="arrow">→</span>
        </a>
      ) : null}
    </section>
  );
}

async function ExpiredSubscription() {
  const t = await getTranslations('meAbonnement');
  return (
    <section className="card" style={{ padding: 32 }}>
      <h4>{t('expiredHeading')}</h4>
      <p className="fs-15 text-mid" style={{ marginTop: 12 }}>
        {t('expiredDesc')}
      </p>
      <div style={{ marginTop: 24 }}>
        <SubscribeButton />
      </div>
    </section>
  );
}
