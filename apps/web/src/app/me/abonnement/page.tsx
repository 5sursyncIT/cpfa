import { auth } from '@/lib/auth';
import { prisma } from '@cpfa/db';
import { MemberCard } from '@/components/cpfa/member-card';
import { SubscribeButton } from './subscribe-button';

export const dynamic = 'force-dynamic';

const fmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });
const fmtShort = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  year: '2-digit',
});

const ADVANTAGES = [
  "Emprunt jusqu'à 5 ouvrages simultanément",
  'Accès au fonds numérique CIMA + études BCEAO',
  'Tarif réduit -30% sur tous les séminaires',
  'Invitations aux journées alumni',
];

export default async function MySubscriptionPage() {
  const session = (await auth())!;
  const subscription = await prisma.subscription.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: { payments: { orderBy: { createdAt: 'desc' }, take: 1 } },
  });

  const fullName = session.user.name ?? session.user.email ?? 'Abonné·e CPFA';

  return (
    <div className="col gap-5">
      <h3>Ma carte d&apos;abonné·e</h3>

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
            Présentez-la à l&apos;accueil de la bibliothèque ou scannez le QR code à l&apos;entrée
            des séminaires. Carte virtuelle uniquement — Wallet Apple/Google compatible.
          </p>
          <div style={{ maxWidth: 480 }}>
            <MemberCard
              fullName={fullName}
              cardNumber={subscription.cardNumber}
              promotion={
                subscription.startedAt
                  ? `Promotion ${subscription.startedAt.getFullYear()}`
                  : '—'
              }
              status="Abonné·e"
              validUntil={subscription.expiresAt ? fmtShort.format(subscription.expiresAt) : '—'}
            />
          </div>
          <div className="row gap-3">
            <button type="button" className="btn btn-primary">
              Ajouter à Apple Wallet
            </button>
            <a
              href="/api/me/card"
              target="_blank"
              rel="noopener"
              className="btn btn-ghost"
            >
              Télécharger PDF
            </a>
          </div>
          <div className="card" style={{ maxWidth: 560 }}>
            <div className="label">Avantages abonnement</div>
            <div className="col gap-3" style={{ marginTop: 16 }}>
              {ADVANTAGES.map((t) => (
                <div key={t} className="row gap-3" style={{ alignItems: 'start' }}>
                  <span style={{ color: 'var(--orange)', fontFamily: 'var(--mono)' }}>✓</span>
                  <span className="fs-14">{t}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="fs-13 text-soft" style={{ maxWidth: 560 }}>
            Carte n° <span className="mono">{subscription.cardNumber}</span> · valable jusqu&apos;au{' '}
            {subscription.expiresAt ? fmt.format(subscription.expiresAt) : '—'}.
          </p>
        </>
      ) : (
        <ExpiredSubscription />
      )}
    </div>
  );
}

function NewSubscription() {
  return (
    <section className="card" style={{ padding: 32 }}>
      <h4>Souscrire à l&apos;abonnement bibliothèque</h4>
      <p className="fs-15 text-mid" style={{ marginTop: 12, lineHeight: 1.5 }}>
        L&apos;abonnement CPFA donne accès au catalogue, à 3 prêts simultanés (durée 14 jours) et
        à votre carte d&apos;abonné·e numérique avec QR.
      </p>
      <p
        className="serif"
        style={{ fontSize: 48, lineHeight: 1, marginTop: 16, letterSpacing: '-0.02em' }}
      >
        10 000{' '}
        <small className="mono fs-13 text-soft" style={{ letterSpacing: '0.04em' }}>
          FCFA / an
        </small>
      </p>
      <div style={{ marginTop: 24 }}>
        <SubscribeButton />
      </div>
    </section>
  );
}

function PendingSubscription({
  paymentMetadata,
  amountXof,
  cardNumber,
}: {
  paymentMetadata: unknown;
  amountXof: number;
  cardNumber: string;
}) {
  const meta = (paymentMetadata ?? {}) as { qrPayload?: string; redirectUrl?: string };
  return (
    <section className="card" style={{ padding: 32 }}>
      <h4>Paiement en attente</h4>
      <p className="fs-15 text-mid" style={{ marginTop: 12 }}>
        Carte n° <span className="mono">{cardNumber}</span>. Montant à régler :{' '}
        <strong>{amountXof.toLocaleString('fr-FR')} FCFA</strong>.
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
          Scannez le QR statique CPFA à l&apos;accueil et indiquez votre numéro de carte. Votre
          abonnement sera activé sous 24 h après confirmation par le service comptable.
        </p>
      ) : null}
      {meta.redirectUrl ? (
        <a
          href={meta.redirectUrl}
          className="btn btn-orange"
          style={{ marginTop: 16, alignSelf: 'flex-start' }}
        >
          Continuer le paiement <span className="arrow">→</span>
        </a>
      ) : null}
    </section>
  );
}

function ExpiredSubscription() {
  return (
    <section className="card" style={{ padding: 32 }}>
      <h4>Abonnement expiré</h4>
      <p className="fs-15 text-mid" style={{ marginTop: 12 }}>
        Renouvelez pour continuer à emprunter à la bibliothèque.
      </p>
      <div style={{ marginTop: 24 }}>
        <SubscribeButton />
      </div>
    </section>
  );
}
