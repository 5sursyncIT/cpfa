// Pure business rules for the library module — no Prisma access, no I/O.
// Exercised by Vitest and reused by the tRPC router so the invariants live in
// exactly one place.
//
// Source of truth: « Procédure d'abonnement annuel à la bibliothèque », signée
// par le Directeur Général. Le texte publié à partir de ces constantes vit dans
// lib/subscription-procedure.ts — ne dupliquez jamais un montant ou un délai
// ailleurs, importez-le d'ici.
//
// Deux usages : la consultation SUR PLACE (formules Étudiant / Professionnel)
// et l'EMPRUNT À DOMICILE (formule à 50 000, dont 35 000 de caution
// remboursable). Le prêt à domicile se gère au comptoir : le site porte le
// catalogue, la carte d'abonné et les règles publiées, pas encore les prêts.
export type SubscriptionTier = 'STUDENT' | 'PROFESSIONAL' | 'HOME_LOAN';

export type LibraryTier = {
  /** Total encaissé à la souscription = feeXof + depositXof. */
  priceXof: number;
  /** Droit d'abonnement annuel, non remboursable. */
  feeXof: number;
  /** Caution remboursable en fin d'abonnement (0 hors emprunt à domicile). */
  depositXof: number;
  /** L'emprunt à domicile est-il ouvert à cette formule ? */
  homeLoan: boolean;
  label: string;
  description: string;
};

/**
 * Les quatre montants que l'administration peut changer (réglage
 * `library.pricing`). Tout le reste — le total à encaisser, les libellés, les
 * textes publiés — s'en déduit, pour qu'aucun écran n'affiche un prix que la
 * caisse n'encaisserait pas.
 */
export type LibraryPricing = {
  studentXof: number;
  professionalXof: number;
  /** Droit d'abonnement de la formule emprunt à domicile. */
  homeLoanFeeXof: number;
  /** Caution remboursable de la formule emprunt à domicile. */
  homeLoanDepositXof: number;
};

/** Grille de la procédure signée — valeur de repli si rien n'est réglé. */
export const DEFAULT_LIBRARY_PRICING: LibraryPricing = {
  studentXof: 10_000,
  professionalXof: 15_000,
  homeLoanFeeXof: 15_000,
  homeLoanDepositXof: 35_000,
};

/** 10000 → « 10 000 FCFA ». */
export function formatXof(amount: number): string {
  return `${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} FCFA`;
}

export function buildLibraryTiers(
  pricing: LibraryPricing = DEFAULT_LIBRARY_PRICING,
): Record<SubscriptionTier, LibraryTier> {
  return {
    STUDENT: {
      priceXof: pricing.studentXof,
      feeXof: pricing.studentXof,
      depositXof: 0,
      homeLoan: false,
      label: 'Étudiant',
      description: 'Tarif réduit · consultation des ouvrages sur place',
    },
    PROFESSIONAL: {
      priceXof: pricing.professionalXof,
      feeXof: pricing.professionalXof,
      depositXof: 0,
      homeLoan: false,
      label: 'Professionnel',
      description: 'Consultation des ouvrages sur place',
    },
    HOME_LOAN: {
      priceXof: pricing.homeLoanFeeXof + pricing.homeLoanDepositXof,
      feeXof: pricing.homeLoanFeeXof,
      depositXof: pricing.homeLoanDepositXof,
      homeLoan: true,
      label: 'Emprunt à domicile',
      description: `Droit d'abonnement ${formatXof(pricing.homeLoanFeeXof)} + caution remboursable ${formatXof(pricing.homeLoanDepositXof)} · emprunt à domicile`,
    },
  };
}

/**
 * Grille par défaut. Côté serveur, préférez `getLibraryTiers()`
 * (lib/library-pricing.ts) qui lit le réglage : ceci ne sert qu'aux tests et
 * aux replis quand la base est injoignable.
 */
export const LIBRARY_TIERS = buildLibraryTiers();

export function priceForTier(
  tier: SubscriptionTier,
  tiers: Record<SubscriptionTier, LibraryTier> = LIBRARY_TIERS,
): number {
  return tiers[tier].priceXof;
}

// ── Prêt à domicile ───────────────────────────────────────────────────────
/** Durée d'un prêt à domicile, par ouvrage. */
export const LIBRARY_LOAN_DAYS = 30;
/** Retard toléré avant toute amende. */
export const LIBRARY_LATE_GRACE_DAYS = 3;
/** Amende journalière une fois la tolérance dépassée. */
export const LIBRARY_DAILY_PENALTY_XOF = 500;
/** Pas de double emprunt : un seul exemplaire par ouvrage et par abonné. */
export const LIBRARY_MAX_COPIES_PER_TITLE = 1;

// ── Services et accueil ───────────────────────────────────────────────────
export const LIBRARY_PHOTOCOPY_XOF_PER_PAGE = 25;
export const LIBRARY_OPENING_HOURS = { opensAt: '08h00', closesAt: '17h00' } as const;
/** Préavis d'expiration envoyé à l'abonné avant l'échéance. */
export const LIBRARY_RENEWAL_NOTICE_DAYS = 30;
/** Durée d'un abonnement annuel. */
export const LIBRARY_SUBSCRIPTION_DAYS = 365;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Jours entiers de retard entre l'échéance et le retour (0 si à l'heure). */
export function computeOverdueDays(dueAt: Date, returnedAt: Date = new Date()): number {
  const diff = returnedAt.getTime() - dueAt.getTime();
  if (diff <= 0) return 0;
  return Math.floor(diff / DAY_MS);
}

// « Une amende de 500 F par jour sera appliquée si le retard excède 3 jours. »
// Règle arrêtée par la Direction : jusqu'à 3 jours de retard, rien n'est dû ;
// passé ce seuil l'amende porte sur tous les jours de retard et court jusqu'à
// la restitution de l'ouvrage — la note d'un livre non rendu continue donc
// d'augmenter tant qu'il n'est pas revenu.
export function computeLatePenaltyXof(dueAt: Date, returnedAt: Date = new Date()): number {
  const overdue = computeOverdueDays(dueAt, returnedAt);
  if (overdue <= LIBRARY_LATE_GRACE_DAYS) return 0;
  return overdue * LIBRARY_DAILY_PENALTY_XOF;
}

export type SubscriptionState =
  | { kind: 'no-subscription' }
  | { kind: 'inactive'; reason: 'pending' | 'cancelled' | 'expired-status' }
  | { kind: 'expired'; expiresAt: Date }
  | { kind: 'usable'; expiresAt: Date | null };

export function evaluateSubscription(
  subscription: { status: string; expiresAt: Date | null } | null | undefined,
  now: Date = new Date(),
): SubscriptionState {
  if (!subscription) return { kind: 'no-subscription' };
  if (subscription.status === 'PENDING') return { kind: 'inactive', reason: 'pending' };
  if (subscription.status === 'CANCELLED') return { kind: 'inactive', reason: 'cancelled' };
  if (subscription.status === 'EXPIRED') return { kind: 'inactive', reason: 'expired-status' };
  if (subscription.expiresAt && subscription.expiresAt < now) {
    return { kind: 'expired', expiresAt: subscription.expiresAt };
  }
  return { kind: 'usable', expiresAt: subscription.expiresAt };
}
