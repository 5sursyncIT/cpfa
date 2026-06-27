import { describe, expect, it } from 'vitest';
import {
  LIBRARY_TIERS,
  priceForTier,
  evaluateSubscription,
} from '@/lib/library-rules';

const day = (n: number) => n * 24 * 60 * 60 * 1000;

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

describe('library-rules: access tiers', () => {
  it('exposes the three public price tiers', () => {
    expect(LIBRARY_TIERS.STUDENT.priceXof).toBe(10_000);
    expect(LIBRARY_TIERS.PROFESSIONAL.priceXof).toBe(15_000);
    expect(LIBRARY_TIERS.HOME_LOAN.priceXof).toBe(50_000);
    expect(priceForTier('STUDENT')).toBe(10_000);
    expect(priceForTier('PROFESSIONAL')).toBe(15_000);
  });
});
