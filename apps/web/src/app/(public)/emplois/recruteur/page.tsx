import Link from 'next/link';
import { RecruiterOfferForm } from './offer-form';

export const metadata = { title: 'Publier une offre — CPFA' };

export default function RecruiterPage() {
  return (
    <div className="container" style={{ padding: '64px 0', maxWidth: 800 }}>
      <div className="breadcrumb">
        CPFA · Espaces Apprenants · <Link href="/emplois">Offres</Link> ·{' '}
        <span>Espace Recruteur</span>
      </div>

      <h1 style={{ fontSize: 'clamp(36px, 4.5vw, 56px)', marginBottom: 12 }}>
        Vous recrutez ? <em className="italic-emph">Publiez votre offre</em>.
      </h1>
      <p className="fs-15 text-mid" style={{ marginBottom: 24, lineHeight: 1.5 }}>
        Vous êtes une entreprise à la recherche de talents qualifiés dans les métiers de
        l&apos;assurance ? Le CPFA vous offre la possibilité de publier vos offres et de recevoir
        directement des candidatures ciblées. Chaque dépôt est revu par notre équipe avant
        publication ; vous recevez un email dès que l&apos;offre est en ligne, puis à chaque
        nouvelle candidature.
      </p>

      <RecruiterOfferForm />
    </div>
  );
}
