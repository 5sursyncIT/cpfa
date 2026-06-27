// Pure business rules for the library module — no Prisma access, no I/O.
// Exercised by Vitest and reused by the tRPC router so the invariants live in
// exactly one place.
//
// The library is a virtual catalogue: books are consulted ON SITE, there is no
// home-lending. A paid subscription acts as an access pass (with a member card
// PDF). Three access tiers keep the public pricing of cpfa-sn.com.
export type SubscriptionTier = 'STUDENT' | 'PROFESSIONAL' | 'HOME_LOAN';

export type LibraryTier = {
  priceXof: number;
  label: string;
  description: string;
};

export const LIBRARY_TIERS: Record<SubscriptionTier, LibraryTier> = {
  STUDENT: {
    priceXof: 10_000,
    label: 'Étudiant',
    description: 'Tarif réduit · accès à la salle de consultation',
  },
  PROFESSIONAL: {
    priceXof: 15_000,
    label: 'Professionnel',
    description: 'Accès complet à la salle de consultation',
  },
  HOME_LOAN: {
    priceXof: 50_000,
    label: 'Accès étendu',
    description: 'Accès étendu et services prioritaires',
  },
};

export function priceForTier(tier: SubscriptionTier): number {
  return LIBRARY_TIERS[tier].priceXof;
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
