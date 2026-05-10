import { describe, expect, it } from 'vitest';
import {
  LIBRARY_DAILY_PENALTY_XOF,
  LIBRARY_LOAN_DAYS,
  LIBRARY_MAX_CONCURRENT,
  computeOverdueDays,
  computePenaltyXof,
  dueDateFromNow,
  evaluateBorrowEligibility,
  evaluateSubscription,
} from '@/lib/library-rules';

const day = (n: number) => n * 24 * 60 * 60 * 1000;

describe('library-rules: due date / overdue / penalty', () => {
  it('dueDateFromNow defaults to 14 days', () => {
    const now = new Date('2026-05-01T08:00:00Z');
    const due = dueDateFromNow(now);
    expect(due.getTime() - now.getTime()).toBe(LIBRARY_LOAN_DAYS * 24 * 60 * 60 * 1000);
  });

  it('returns 0 overdue days when not yet due', () => {
    const due = new Date('2026-05-15T08:00:00Z');
    const now = new Date('2026-05-10T08:00:00Z');
    expect(computeOverdueDays(due, now)).toBe(0);
    expect(computePenaltyXof(due, now)).toBe(0);
  });

  it('returns 0 the exact moment dueAt = now (boundary)', () => {
    const t = new Date('2026-05-10T08:00:00Z');
    expect(computeOverdueDays(t, t)).toBe(0);
  });

  it('rounds partial days up — 1h late counts as 1 day', () => {
    const due = new Date('2026-05-10T08:00:00Z');
    const now = new Date('2026-05-10T09:00:00Z');
    expect(computeOverdueDays(due, now)).toBe(1);
    expect(computePenaltyXof(due, now)).toBe(LIBRARY_DAILY_PENALTY_XOF);
  });

  it('penalty scales linearly per day', () => {
    const due = new Date('2026-05-01T08:00:00Z');
    const now = new Date(due.getTime() + day(7));
    expect(computeOverdueDays(due, now)).toBe(7);
    expect(computePenaltyXof(due, now)).toBe(7 * LIBRARY_DAILY_PENALTY_XOF);
  });
});

describe('library-rules: subscription evaluation', () => {
  const now = new Date('2026-05-01T08:00:00Z');

  it('reports no-subscription for null/undefined', () => {
    expect(evaluateSubscription(null, now)).toEqual({ kind: 'no-subscription' });
    expect(evaluateSubscription(undefined, now)).toEqual({ kind: 'no-subscription' });
  });

  it('reports inactive for PENDING / CANCELLED / EXPIRED status', () => {
    expect(evaluateSubscription({ status: 'PENDING', expiresAt: null }, now)).toMatchObject({
      kind: 'inactive',
    });
    expect(evaluateSubscription({ status: 'CANCELLED', expiresAt: null }, now)).toMatchObject({
      kind: 'inactive',
    });
    expect(evaluateSubscription({ status: 'EXPIRED', expiresAt: null }, now)).toMatchObject({
      kind: 'inactive',
    });
  });

  it('reports expired when ACTIVE but expiresAt is past', () => {
    const result = evaluateSubscription(
      { status: 'ACTIVE', expiresAt: new Date(now.getTime() - day(1)) },
      now,
    );
    expect(result.kind).toBe('expired');
  });

  it('reports usable when ACTIVE and within validity window', () => {
    const result = evaluateSubscription(
      { status: 'ACTIVE', expiresAt: new Date(now.getTime() + day(30)) },
      now,
    );
    expect(result.kind).toBe('usable');
  });

  it('reports usable when ACTIVE with no expiresAt', () => {
    const result = evaluateSubscription({ status: 'ACTIVE', expiresAt: null }, now);
    expect(result.kind).toBe('usable');
  });
});

describe('library-rules: borrow eligibility', () => {
  const now = new Date('2026-05-01T08:00:00Z');
  const usableSub = { status: 'ACTIVE', expiresAt: new Date(now.getTime() + day(30)) };

  it('rejects when no subscription', () => {
    const r = evaluateBorrowEligibility({
      subscription: null,
      activeLoansForSubscription: 0,
      totalCopies: 1,
      copiesOnLoan: 0,
      now,
    });
    expect(r).toEqual({ ok: false, reason: 'subscription-not-usable' });
  });

  it('rejects at the §4.3 quota boundary', () => {
    const r = evaluateBorrowEligibility({
      subscription: usableSub,
      activeLoansForSubscription: LIBRARY_MAX_CONCURRENT,
      totalCopies: 5,
      copiesOnLoan: 0,
      now,
    });
    expect(r).toEqual({ ok: false, reason: 'quota-reached' });
  });

  it('allows the third borrow when 2 are active', () => {
    const r = evaluateBorrowEligibility({
      subscription: usableSub,
      activeLoansForSubscription: 2,
      totalCopies: 5,
      copiesOnLoan: 0,
      now,
    });
    expect(r.ok).toBe(true);
  });

  it('rejects when no copies left', () => {
    const r = evaluateBorrowEligibility({
      subscription: usableSub,
      activeLoansForSubscription: 0,
      totalCopies: 2,
      copiesOnLoan: 2,
      now,
    });
    expect(r).toEqual({ ok: false, reason: 'no-copy-available' });
  });

  it('allows when there is exactly one copy free', () => {
    const r = evaluateBorrowEligibility({
      subscription: usableSub,
      activeLoansForSubscription: 0,
      totalCopies: 2,
      copiesOnLoan: 1,
      now,
    });
    expect(r.ok).toBe(true);
  });
});

describe('library-rules: tiers', () => {
  it('STUDENT tier: 10 000 FCFA, 2 prêts max', async () => {
    const { LIBRARY_TIERS, priceForTier, maxConcurrentForTier } = await import(
      '@/lib/library-rules'
    );
    expect(LIBRARY_TIERS.STUDENT.priceXof).toBe(10_000);
    expect(priceForTier('STUDENT')).toBe(10_000);
    expect(maxConcurrentForTier('STUDENT')).toBe(2);
  });

  it('PROFESSIONAL tier: 15 000 FCFA, 3 prêts max (compatible avec règle historique)', async () => {
    const { priceForTier, maxConcurrentForTier } = await import('@/lib/library-rules');
    expect(priceForTier('PROFESSIONAL')).toBe(15_000);
    expect(maxConcurrentForTier('PROFESSIONAL')).toBe(LIBRARY_MAX_CONCURRENT);
  });

  it('HOME_LOAN tier: 50 000 FCFA, 5 prêts max', async () => {
    const { priceForTier, maxConcurrentForTier } = await import('@/lib/library-rules');
    expect(priceForTier('HOME_LOAN')).toBe(50_000);
    expect(maxConcurrentForTier('HOME_LOAN')).toBe(5);
  });

  it('quota d’éligibilité respecte le tier de l’abonnement', () => {
    const usable = { status: 'ACTIVE', expiresAt: null };
    // STUDENT plafonne à 2 — le 2e prêt est encore OK, le 3e est refusé.
    expect(
      evaluateBorrowEligibility({
        subscription: { ...usable, tier: 'STUDENT' },
        activeLoansForSubscription: 1,
        totalCopies: 5,
        copiesOnLoan: 0,
      }).ok,
    ).toBe(true);
    expect(
      evaluateBorrowEligibility({
        subscription: { ...usable, tier: 'STUDENT' },
        activeLoansForSubscription: 2,
        totalCopies: 5,
        copiesOnLoan: 0,
      }),
    ).toEqual({ ok: false, reason: 'quota-reached' });

    // HOME_LOAN va jusqu’à 5.
    expect(
      evaluateBorrowEligibility({
        subscription: { ...usable, tier: 'HOME_LOAN' },
        activeLoansForSubscription: 4,
        totalCopies: 10,
        copiesOnLoan: 0,
      }).ok,
    ).toBe(true);
    expect(
      evaluateBorrowEligibility({
        subscription: { ...usable, tier: 'HOME_LOAN' },
        activeLoansForSubscription: 5,
        totalCopies: 10,
        copiesOnLoan: 0,
      }),
    ).toEqual({ ok: false, reason: 'quota-reached' });
  });
});
