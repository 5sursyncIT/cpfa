import { auth } from '@/lib/auth';
import { prisma } from '@cpfa/db';
import { SubscribeButton } from './subscribe-button';

export const dynamic = 'force-dynamic';

export default async function MySubscriptionPage() {
  const session = (await auth())!;

  const subscription = await prisma.subscription.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: { payments: { orderBy: { createdAt: 'desc' }, take: 1 } },
  });

  const fmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Mon abonnement bibliothèque</h1>

      {!subscription ? (
        <NewSubscription />
      ) : subscription.status === 'PENDING' ? (
        <PendingSubscription
          paymentMetadata={subscription.payments[0]?.metadata}
          amountXof={subscription.payments[0]?.amountXof ?? 10_000}
          cardNumber={subscription.cardNumber}
        />
      ) : subscription.status === 'ACTIVE' ? (
        <ActiveSubscription
          cardNumber={subscription.cardNumber}
          expiresAt={subscription.expiresAt}
          fmt={fmt}
        />
      ) : (
        <ExpiredSubscription />
      )}
    </div>
  );
}

function NewSubscription() {
  return (
    <section className="rounded-lg border bg-card p-6">
      <h2 className="text-lg font-semibold">Souscrire</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        L’abonnement bibliothèque CPFA donne accès au catalogue, à 3 prêts simultanés (durée
        14 jours) et à votre carte d’abonné numérique avec QR.
      </p>
      <p className="mt-4 text-2xl font-bold">10 000 FCFA <span className="text-base font-normal text-muted-foreground">/ an</span></p>
      <div className="mt-6">
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
    <section className="rounded-lg border bg-card p-6">
      <h2 className="text-lg font-semibold">Paiement en attente</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Carte n° <span className="font-mono">{cardNumber}</span>. Montant à régler :
        <strong> {amountXof.toLocaleString('fr-FR')} FCFA</strong>.
      </p>
      {meta.qrPayload ? (
        <p className="mt-4 rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
          Scannez le QR statique CPFA à l’accueil et indiquez votre numéro de carte. Votre
          abonnement sera activé sous 24 h après confirmation par le service comptable.
        </p>
      ) : null}
      {meta.redirectUrl ? (
        <a
          href={meta.redirectUrl}
          className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          Continuer le paiement
        </a>
      ) : null}
    </section>
  );
}

function ActiveSubscription({
  cardNumber,
  expiresAt,
  fmt,
}: {
  cardNumber: string;
  expiresAt: Date | null;
  fmt: Intl.DateTimeFormat;
}) {
  return (
    <section className="rounded-lg border bg-card p-6">
      <h2 className="text-lg font-semibold">Abonnement actif</h2>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <dt className="text-muted-foreground">N° de carte</dt>
        <dd className="font-mono">{cardNumber}</dd>
        <dt className="text-muted-foreground">Valide jusqu’au</dt>
        <dd>{expiresAt ? fmt.format(expiresAt) : '—'}</dd>
      </dl>
      <a
        href="/api/me/card"
        target="_blank"
        rel="noopener"
        className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
      >
        Télécharger ma carte (PDF)
      </a>
    </section>
  );
}

function ExpiredSubscription() {
  return (
    <section className="rounded-lg border bg-card p-6">
      <h2 className="text-lg font-semibold">Abonnement expiré</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Renouvelez pour continuer à emprunter à la bibliothèque.
      </p>
      <div className="mt-6">
        <SubscribeButton />
      </div>
    </section>
  );
}
