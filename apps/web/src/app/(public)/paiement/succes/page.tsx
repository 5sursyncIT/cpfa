import Link from 'next/link';

export const metadata = { title: 'Paiement confirmé — CPFA' };
export const dynamic = 'force-dynamic';

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
  const { ref } = await searchParams;
  return (
    <div className="container" style={{ padding: '64px 0' }}>
      <div className="breadcrumb">
        CPFA · <span>Paiement</span>
      </div>
      <h1>
        Paiement <em className="italic-emph">confirmé</em>
      </h1>
      <p>
        Merci, votre règlement a bien été reçu par notre prestataire de paiement.
        L&apos;activation du service correspondant peut prendre quelques secondes —
        rechargez la page si elle ne reflète pas encore le nouveau statut.
      </p>
      {ref ? (
        <p style={{ color: 'var(--cpfa-muted, #64748b)', fontSize: 13 }}>
          Référence : <code>{ref}</code>
        </p>
      ) : null}
      <p style={{ marginTop: 24 }}>
        <Link href="/me/abonnement">Voir mon espace</Link>
        {' · '}
        <Link href="/">Retour à l&apos;accueil</Link>
      </p>
    </div>
  );
}
