// Pure business rules for the library module — no Prisma access, no I/O.
// These are exercised by Vitest and reused by the tRPC router + the BullMQ
// worker so the §4.3 invariants live in exactly one place.

export const LIBRARY_LOAN_DAYS = 14;
export const LIBRARY_MAX_CONCURRENT = 3;
export const LIBRARY_DAILY_PENALTY_XOF = 500;

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
  subscription: { status: string; expiresAt: Date | null } | null | undefined;
  activeLoansForSubscription: number;
  totalCopies: number;
  copiesOnLoan: number;
  now?: Date;
}): BorrowEligibility {
  const sub = evaluateSubscription(subscription, now);
  if (sub.kind !== 'usable') return { ok: false, reason: 'subscription-not-usable' };
  if (activeLoansForSubscription >= LIBRARY_MAX_CONCURRENT) {
    return { ok: false, reason: 'quota-reached' };
  }
  if (copiesOnLoan >= totalCopies) return { ok: false, reason: 'no-copy-available' };
  return { ok: true };
}
