import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { prisma } from '@cpfa/db';
import { MemberCard } from '@/components/cpfa/member-card';
import { SubscribeButton, type TierOption } from './subscribe-button';
import { DeclarePaymentForm } from './declare-payment-form';
import { getSetting } from '@/lib/site-settings/get';
import { mediaUrl } from '@/lib/media';
import { CHANNEL_LABEL, declarationFromMetadata } from '@/lib/payment-declaration';
import { resolveLocale } from '@/i18n/request';
import {
  LIBRARY_LOAN_DAYS,
  LIBRARY_OPENING_HOURS,
  type SubscriptionTier,
} from '@/lib/library-rules';
import { getLibraryTiers, type LibraryTiers } from '@/lib/library-pricing';

export const dynamic = 'force-dynamic';

export default async function MySubscriptionPage() {
  const session = (await auth())!;
  const [subscription, t, tMe, locale, tiers] = await Promise.all([
    prisma.subscription.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: { payments: { orderBy: { createdAt: 'desc' }, take: 1 } },
    }),
    getTranslations('meAbonnement'),
    getTranslations('me'),
    resolveLocale(),
    getLibraryTiers(),
  ]);

  const fmt = new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'fr-FR', { dateStyle: 'long' });
  const fmtShort = new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });

  const fullName = session.user.name ?? session.user.email ?? tMe('fallbackCardholder');

  // Les avantages qui portent une règle métier (horaires, durée de prêt) sont
  // interpolés depuis library-rules : jamais de chiffre en dur dans le texte.
  const ADVANTAGES = [
    t('advantage1', {
      opensAt: hour(LIBRARY_OPENING_HOURS.opensAt, locale),
      closesAt: hour(LIBRARY_OPENING_HOURS.closesAt, locale),
    }),
    t('advantage2'),
    t('advantage3'),
    t('advantage4'),
    t('advantage5', { days: LIBRARY_LOAN_DAYS }),
  ];

  return (
    <div className="col gap-5">
      <h3>{t('h3')}</h3>

      {!subscription ? (
        <NewSubscription tiers={tiers} />
      ) : subscription.status === 'PENDING' ? (
        <PendingSubscription
          paymentId={subscription.payments[0]?.id ?? null}
          paymentMetadata={subscription.payments[0]?.metadata}
          amountXof={subscription.payments[0]?.amountXof ?? tiers[subscription.tier].priceXof}
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
              validUntil={subscription.expiresAt ? fmtShort.format(subscription.expiresAt) : '—'}
            />
          </div>
          <div className="row gap-3">
            <button type="button" className="btn btn-primary">
              {t('addToWallet')}
            </button>
            <a href="/api/me/card" target="_blank" rel="noopener" className="btn btn-ghost">
              {t('downloadPdf')}
            </a>
            <a href="/api/me/contrat" className="btn btn-ghost">
              {t('downloadContract')}
            </a>
          </div>
          <p className="fs-13 text-soft" style={{ maxWidth: 560, marginTop: -8 }}>
            {t('contractHint')}
          </p>
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
        <ExpiredSubscription tiers={tiers} />
      )}
    </div>
  );
}

async function NewSubscription({ tiers }: { tiers: LibraryTiers }) {
  const t = await getTranslations('meAbonnement');
  return (
    <section className="card" style={{ padding: 32 }}>
      <h4>{t('newHeading')}</h4>
      <p className="fs-15 text-mid" style={{ marginTop: 12, lineHeight: 1.5 }}>
        {t('newDesc')}
      </p>
      <div style={{ marginTop: 24 }}>
        <SubscribeButton tiers={tierOptions(tiers)} />
      </div>
      <p className="fs-13 text-soft" style={{ marginTop: 20 }}>
        <Link href="/bibliotheque/abonnement">{t('procedureLink')}</Link>
      </p>
    </section>
  );
}

/** « 08h00 » se lit « 08:00 » en anglais. */
function hour(value: string, locale: string): string {
  return locale === 'en' ? value.replace('h', ':') : value;
}

// Les formules proposées à la souscription — mêmes montants que la procédure
// officielle, lus depuis LIBRARY_TIERS.
function tierOptions(tiers: LibraryTiers): TierOption[] {
  return (['STUDENT', 'PROFESSIONAL', 'HOME_LOAN'] as SubscriptionTier[]).map((tier) => ({
    tier,
    priceXof: tiers[tier].priceXof,
    feeXof: tiers[tier].feeXof,
    depositXof: tiers[tier].depositXof,
    homeLoan: tiers[tier].homeLoan,
  }));
}

async function PendingSubscription({
  paymentId,
  paymentMetadata,
  amountXof,
  cardNumber,
}: {
  paymentId: string | null;
  paymentMetadata: unknown;
  amountXof: number;
  cardNumber: string;
}) {
  const [t, mobileMoney] = await Promise.all([
    getTranslations('meAbonnement'),
    getSetting('payments.mobileMoney', 'fr'),
  ]);
  const meta = (paymentMetadata ?? {}) as { qrPayload?: string; redirectUrl?: string };
  const declaration = declarationFromMetadata(paymentMetadata);

  // Un canal sans QR ni numéro n'est pas proposé : tant que l'administration
  // n'a rien chargé, l'écran reste celui d'avant.
  const channels = [
    { channel: 'WAVE' as const, qrKey: mobileMoney.waveQrKey, number: mobileMoney.waveNumber },
    {
      channel: 'ORANGE_MONEY' as const,
      qrKey: mobileMoney.orangeQrKey,
      number: mobileMoney.orangeNumber,
    },
  ].filter((c) => c.qrKey || c.number);

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

      {channels.length > 0 ? (
        <div style={{ marginTop: 24 }}>
          <div className="label">{t('payWithMobileMoney')}</div>
          <div className="qr-grid" style={{ marginTop: 12 }}>
            {channels.map((c) => {
              const src = mediaUrl(c.qrKey);
              return (
                <div key={c.channel} className="qr-card">
                  <div className="fs-15" style={{ fontWeight: 500 }}>
                    {CHANNEL_LABEL[c.channel]}
                  </div>
                  {src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={src}
                      alt={t('qrAlt', { channel: CHANNEL_LABEL[c.channel] })}
                      className="qr-image"
                    />
                  ) : null}
                  {c.number ? <div className="mono fs-14">{c.number}</div> : null}
                </div>
              );
            })}
          </div>
          <p className="fs-13 text-soft" style={{ marginTop: 12 }}>
            {t('payReference', { reference: cardNumber })}
          </p>
          {mobileMoney.instructions ? (
            <p className="fs-13 text-soft" style={{ marginTop: 6 }}>
              {mobileMoney.instructions}
            </p>
          ) : null}
        </div>
      ) : null}

      {declaration ? (
        <p
          className="fs-14"
          style={{
            marginTop: 24,
            padding: 16,
            background: 'var(--bg-soft)',
            borderRadius: 'var(--r-2)',
            color: 'var(--ink-mid)',
          }}
        >
          {t('declarationReceived', {
            channel: CHANNEL_LABEL[declaration.channel],
            reference: declaration.reference,
          })}
        </p>
      ) : paymentId && channels.length > 0 ? (
        <div style={{ marginTop: 24 }}>
          <DeclarePaymentForm paymentId={paymentId} channels={channels.map((c) => c.channel)} />
        </div>
      ) : null}

      {meta.qrPayload && channels.length === 0 ? (
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

async function ExpiredSubscription({ tiers }: { tiers: LibraryTiers }) {
  const t = await getTranslations('meAbonnement');
  return (
    <section className="card" style={{ padding: 32 }}>
      <h4>{t('expiredHeading')}</h4>
      <p className="fs-15 text-mid" style={{ marginTop: 12 }}>
        {t('expiredDesc')}
      </p>
      <div style={{ marginTop: 24 }}>
        <SubscribeButton tiers={tierOptions(tiers)} />
      </div>
    </section>
  );
}
