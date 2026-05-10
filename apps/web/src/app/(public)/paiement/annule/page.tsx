import Link from 'next/link';

export const metadata = { title: 'Paiement annulé — CPFA' };
export const dynamic = 'force-dynamic';

// Landing reached via PayTech `cancel_url`. The Payment row stays PENDING — the
// user can retry from the same page that triggered initiate(), or contact the
// comptable for a manual static-QR fallback.
export default async function PaymentCancelPage({
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
        Paiement <em className="italic-emph">annulé</em>
      </h1>
      <p>
        Le paiement n&apos;a pas été finalisé. Aucun montant n&apos;a été débité.
        Vous pouvez relancer la transaction depuis votre espace, ou contacter
        notre service comptable pour un règlement par QR statique.
      </p>
      {ref ? (
        <p style={{ color: 'var(--cpfa-muted, #64748b)', fontSize: 13 }}>
          Référence : <code>{ref}</code>
        </p>
      ) : null}
      <p style={{ marginTop: 24 }}>
        <Link href="/me/abonnement">Réessayer</Link>
        {' · '}
        <Link href="/contact">Nous contacter</Link>
      </p>
    </div>
  );
}
