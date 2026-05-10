// Pure business rules for the library module — no Prisma access, no I/O.
// These are exercised by Vitest and reused by the tRPC router + the BullMQ
// worker so the §4.3 invariants live in exactly one place.

// Three tiers (cf. cpfa-sn.com — actual public pricing):
//   STUDENT       10 000 FCFA/an — 2 prêts simultanés, sur place + emprunt limité
//   PROFESSIONAL  15 000 FCFA/an — 3 prêts simultanés (règles historiques)
//   HOME_LOAN     50 000 FCFA/an — 5 prêts simultanés, emprunt domicile illimité
//
// Loan duration (14 j) and daily penalty (500 FCFA/jour) restent communs aux
// trois formules — la différence porte sur le quota concurrent et le prix.
export type SubscriptionTier = 'STUDENT' | 'PROFESSIONAL' | 'HOME_LOAN';

export type LibraryTier = {
  priceXof: number;
  maxConcurrentLoans: number;
  label: string;
  description: string;
};

export const LIBRARY_TIERS: Record<SubscriptionTier, LibraryTier> = {
  STUDENT: {
    priceXof: 10_000,
    maxConcurrentLoans: 2,
    label: 'Étudiant',
    description: 'Tarif réduit · 2 prêts simultanés',
  },
  PROFESSIONAL: {
    priceXof: 15_000,
    maxConcurrentLoans: 3,
    label: 'Professionnel',
    description: '3 prêts simultanés · accès complet',
  },
  HOME_LOAN: {
    priceXof: 50_000,
    maxConcurrentLoans: 5,
    label: 'Emprunt à domicile',
    description: 'Emprunt étendu · 5 prêts simultanés',
  },
};

export const LIBRARY_LOAN_DAYS = 14;
export const LIBRARY_DAILY_PENALTY_XOF = 500;

// Backwards compatibility — prior code referenced this single constant.
// Defaults to PROFESSIONAL since that was the historical contract.
export const LIBRARY_MAX_CONCURRENT = LIBRARY_TIERS.PROFESSIONAL.maxConcurrentLoans;

export function maxConcurrentForTier(tier: SubscriptionTier): number {
  return LIBRARY_TIERS[tier].maxConcurrentLoans;
}

export function priceForTier(tier: SubscriptionTier): number {
  return LIBRARY_TIERS[tier].priceXof;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function computeOverdueDays(dueAt: Date, now: Date = new Date()): number {
  const diffMs = now.getTime() - dueAt.getTime();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / MS_PER_DAY);
}

export function computePenaltyXof(dueAt: Date, now: Date = new Date()): number {
  return computeOverdueDays(dueAt, now) * LIBRARY_DAILY_PENALTY_XOF;
}

export function dueDateFromNow(now: Date = new Date(), days = LIBRARY_LOAN_DAYS): Date {
  return new Date(now.getTime() + days * MS_PER_DAY);
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

export type BorrowEligibility =
  | { ok: true }
  | { ok: false; reason: 'subscription-not-usable' | 'quota-reached' | 'no-copy-available' };

export function evaluateBorrowEligibility({
  subscription,
  activeLoansForSubscription,
  totalCopies,
  copiesOnLoan,
  now = new Date(),
}: {
  subscription:
    | { status: string; expiresAt: Date | null; tier?: SubscriptionTier }
    | null
    | undefined;
  activeLoansForSubscription: number;
  totalCopies: number;
  copiesOnLoan: number;
  now?: Date;
}): BorrowEligibility {
  const sub = evaluateSubscription(subscription, now);
  if (sub.kind !== 'usable') return { ok: false, reason: 'subscription-not-usable' };
  const max = subscription?.tier
    ? maxConcurrentForTier(subscription.tier)
    : LIBRARY_MAX_CONCURRENT;
  if (activeLoansForSubscription >= max) {
    return { ok: false, reason: 'quota-reached' };
  }
  if (copiesOnLoan >= totalCopies) return { ok: false, reason: 'no-copy-available' };
  return { ok: true };
}
