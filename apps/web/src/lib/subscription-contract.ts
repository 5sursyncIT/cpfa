// « Contrat d'abonnement à la bibliothèque » — texte contractuel signé par la
// gérante, repris mot pour mot du document papier. Le système ne fait que le
// pré-remplir (titulaire, formule, dates, n° de carte) : la ligne « demeurant
// à », la date de lecture et la signature restent manuscrites.
//
// Comme pour la procédure, les montants de l'article 4 viennent de
// library-rules.ts — jamais d'un chiffre recopié ici.
//
// Le document est en français uniquement : c'est la version qui engage les
// parties, une traduction n'aurait pas de valeur contractuelle.

import type { ContractArticle, SubscriptionContractProps } from '@cpfa/pdf';
import { getQueue, type PdfJob } from '@cpfa/lib/queues';
import { LIBRARY_TIERS, type SubscriptionTier } from './library-rules';
import type { LibraryTiers } from './library-pricing';

/** 10000 → « 10 000 FCFA ». */
function xof(amount: number): string {
  return `${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} FCFA`;
}

export function contractArticles(tiers: LibraryTiers = LIBRARY_TIERS): ContractArticle[] {
  const { STUDENT, PROFESSIONAL, HOME_LOAN } = tiers;
  return [
    {
      number: '1',
      title: 'Objet du contrat',
      items: [
        "La Bibliothèque met à la disposition de l'Abonné(e) un accès aux ressources documentaires et services disponibles dans ses locaux, conformément aux règles et conditions définies ci-après.",
      ],
    },
    {
      number: '2',
      title: "Durée de l'abonnement",
      items: [
        "L'abonnement est valable pour une durée annuelle à compter de la date de signature de ce contrat. Il est renouvelable à l'issue de cette période, sous réserve du règlement des frais d'abonnement.",
      ],
    },
    {
      number: '3',
      title: "Conditions d'abonnement",
      items: [
        "L'Abonné(e) s'engage à respecter le règlement intérieur de la Bibliothèque.",
        "L'Abonné(e) s'engage à restituer les documents empruntés dans les délais impartis.",
        "L'Abonné(e) est responsable des documents empruntés et doit en prendre soin. En cas de perte, de vol ou de détérioration, il ou elle devra en rembourser la valeur de remplacement, selon l'évaluation de la Bibliothèque.",
      ],
    },
    {
      number: '4',
      title: 'Tarifs et modalités de paiement',
      items: [
        `Abonnement annuel de ${xof(STUDENT.priceXof)} (pour les étudiants) et ${xof(PROFESSIONAL.priceXof)} (pour les professionnels) : donne accès à la consultation des ouvrages sur place.`,
        `Abonnement annuel avec emprunt à domicile à ${xof(HOME_LOAN.priceXof)}, qui comprend le droit d'abonnement annuel (${xof(HOME_LOAN.feeXof)}) et une caution remboursable en fin d'abonnement de ${xof(HOME_LOAN.depositXof)} pour garantir les emprunts.`,
      ],
    },
    {
      number: '5',
      title: 'Responsabilités',
      items: [
        "La Bibliothèque ne peut être tenue responsable des accidents, pertes ou vols qui surviendraient à l'intérieur de ses locaux ou dans le cadre de l'utilisation des documents empruntés.",
        "L'Abonné(e) doit signaler immédiatement toute perte ou tout dommage concernant un document emprunté.",
      ],
    },
    {
      number: '6',
      title: "Suspension ou résiliation de l'abonnement",
      items: [
        "L'abonnement peut être suspendu ou résilié en cas de non-respect des conditions définies dans ce contrat ou dans le règlement intérieur de la Bibliothèque. En cas de résiliation, aucun remboursement ne sera effectué, sauf si la résiliation intervient avant l'activation de l'abonnement.",
      ],
    },
    {
      number: '7',
      title: 'Protection des données personnelles',
      items: [
        "Les données personnelles de l'Abonné(e) sont collectées exclusivement dans le cadre de la gestion de l'abonnement et seront utilisées conformément à la législation en vigueur sur la protection des données personnelles (RGPD).",
      ],
    },
    {
      number: '8',
      title: 'Litiges',
      items: [
        "En cas de litige relatif à l'interprétation ou à l'exécution du présent contrat, les parties s'efforceront de trouver une solution amiable. À défaut, le litige sera porté devant le tribunal compétent.",
      ],
    },
  ];
}

export type ContractSubscription = {
  cardNumber: string;
  tier: SubscriptionTier;
  startedAt: Date | null;
  expiresAt: Date | null;
};

export type ContractMentions = {
  libraryAddress: string;
  managerName: string;
  city: string;
};

export type ContractSubscriber = {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
};

const dateFmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });

export function subscriberDisplayName(user: ContractSubscriber): string {
  return (
    [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || 'Abonné(e) CPFA'
  );
}

/** Clé d'archivage du contrat rendu — un seul exemplaire par abonnement. */
export function contractStorageKey(subscriptionId: string, cardNumber: string): string {
  return `contract/${subscriptionId}/${cardNumber}.pdf`;
}

// Appelé depuis chaque point d'activation (paiement confirmé, activation
// manuelle au comptoir, création par l'administration). `jobId` déduplique :
// réactiver un abonnement ne renverra pas deux fois le contrat. Un échec de
// file d'attente n'interrompt jamais l'activation — le contrat reste
// téléchargeable à la demande.
export async function enqueueSubscriptionContract(subscriptionId: string): Promise<void> {
  try {
    await getQueue<PdfJob>('pdf').add(
      'subscription-contract',
      { kind: 'subscription-contract', subscriptionId },
      { jobId: `subscription-contract:${subscriptionId}` },
    );
  } catch (err) {
    console.warn('[subscription-contract] enqueue failed', err);
  }
}

export function buildSubscriptionContract({
  subscription,
  user,
  mentions,
  tiers = LIBRARY_TIERS,
}: {
  subscription: ContractSubscription;
  user: ContractSubscriber;
  mentions: ContractMentions;
  tiers?: LibraryTiers;
}): SubscriptionContractProps {
  return {
    subscriberName: subscriberDisplayName(user),
    cardNumber: subscription.cardNumber,
    libraryAddress: mentions.libraryAddress,
    managerName: mentions.managerName,
    city: mentions.city,
    startedAt: subscription.startedAt ? dateFmt.format(subscription.startedAt) : '—',
    expiresAt: subscription.expiresAt ? dateFmt.format(subscription.expiresAt) : '—',
    tierLabel: `${tiers[subscription.tier].label} — ${xof(tiers[subscription.tier].priceXof)}`,
    articles: contractArticles(tiers),
  };
}
