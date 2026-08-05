import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LIBRARY_PRICING,
  buildLibraryTiers,
  LIBRARY_DAILY_PENALTY_XOF,
  LIBRARY_LATE_GRACE_DAYS,
  LIBRARY_LOAN_DAYS,
  LIBRARY_TIERS,
  computeLatePenaltyXof,
  computeOverdueDays,
  priceForTier,
  evaluateSubscription,
} from '@/lib/library-rules';
import { getSubscriptionProcedure } from '@/lib/subscription-procedure';

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

describe('library-rules: pricing is editable', () => {
  it('derives the whole grid from the four editable amounts', () => {
    const tiers = buildLibraryTiers({
      studentXof: 12_000,
      professionalXof: 18_000,
      homeLoanFeeXof: 18_000,
      homeLoanDepositXof: 40_000,
    });
    expect(tiers.STUDENT.priceXof).toBe(12_000);
    expect(tiers.PROFESSIONAL.priceXof).toBe(18_000);
    // Le total de l'emprunt à domicile est calculé, jamais saisi.
    expect(tiers.HOME_LOAN.priceXof).toBe(58_000);
    expect(tiers.HOME_LOAN.feeXof).toBe(18_000);
    expect(tiers.HOME_LOAN.depositXof).toBe(40_000);
    expect(tiers.HOME_LOAN.description).toContain('18 000 FCFA');
    expect(tiers.HOME_LOAN.description).toContain('40 000 FCFA');
    // Le montant facturé suit la grille passée, pas la constante par défaut.
    expect(priceForTier('HOME_LOAN', tiers)).toBe(58_000);
  });

  it('falls back to the signed grid when nothing is configured', () => {
    expect(buildLibraryTiers()).toEqual(LIBRARY_TIERS);
    expect(DEFAULT_LIBRARY_PRICING.studentXof).toBe(10_000);
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

  // « 50 000 FCFA qui comprend le droit d'abonnement (15 000) + une caution
  // remboursable (35 000) » — le total encaissé doit rester la somme des deux.
  it('splits every price into a fee plus a refundable deposit', () => {
    for (const tier of Object.values(LIBRARY_TIERS)) {
      expect(tier.feeXof + tier.depositXof).toBe(tier.priceXof);
    }
    expect(LIBRARY_TIERS.HOME_LOAN.feeXof).toBe(15_000);
    expect(LIBRARY_TIERS.HOME_LOAN.depositXof).toBe(35_000);
  });

  it('opens home lending to the deposit tier only', () => {
    expect(LIBRARY_TIERS.STUDENT.homeLoan).toBe(false);
    expect(LIBRARY_TIERS.PROFESSIONAL.homeLoan).toBe(false);
    expect(LIBRARY_TIERS.HOME_LOAN.homeLoan).toBe(true);
  });
});

describe('library-rules: home-loan lateness', () => {
  const due = new Date('2026-05-01T10:00:00Z');
  const plusDays = (n: number) => new Date(due.getTime() + day(n));

  it('counts no overdue day before the due date', () => {
    expect(computeOverdueDays(due, plusDays(-1))).toBe(0);
    expect(computeOverdueDays(due, due)).toBe(0);
  });

  it('counts whole overdue days only', () => {
    expect(computeOverdueDays(due, new Date(due.getTime() + day(2) + 3600_000))).toBe(2);
    expect(computeOverdueDays(due, plusDays(10))).toBe(10);
  });

  it('charges nothing within the three-day tolerance', () => {
    expect(computeLatePenaltyXof(due, plusDays(1))).toBe(0);
    expect(computeLatePenaltyXof(due, plusDays(LIBRARY_LATE_GRACE_DAYS))).toBe(0);
  });

  it('charges the daily fine once the tolerance is exceeded', () => {
    const overdue = LIBRARY_LATE_GRACE_DAYS + 1;
    expect(computeLatePenaltyXof(due, plusDays(overdue))).toBe(overdue * LIBRARY_DAILY_PENALTY_XOF);
    expect(computeLatePenaltyXof(due, plusDays(10))).toBe(10 * LIBRARY_DAILY_PENALTY_XOF);
  });

  // L'amende court « jusqu'à la restitution » : tant que l'ouvrage n'est pas
  // rendu, la note augmente d'un jour sur l'autre.
  it('keeps accruing until the book comes back', () => {
    let previous = computeLatePenaltyXof(due, plusDays(LIBRARY_LATE_GRACE_DAYS + 1));
    for (const days of [5, 12, 30, 90]) {
      const current = computeLatePenaltyXof(due, plusDays(days));
      expect(current).toBe(days * LIBRARY_DAILY_PENALTY_XOF);
      expect(current).toBeGreaterThan(previous);
      previous = current;
    }
  });
});

describe('subscription procedure', () => {
  it('publishes the eight numbered steps in both locales', () => {
    for (const locale of ['fr', 'en'] as const) {
      const doc = getSubscriptionProcedure(locale);
      expect(doc.sections.map((s) => s.number)).toEqual([
        'I',
        'II',
        'III',
        'IV',
        'V',
        'VI',
        'VII',
        'VIII',
      ]);
      // Section I porte les six sous-sections (modalités → sanctions).
      expect(doc.sections[0].subsections).toHaveLength(6);
      expect(doc.title.length).toBeGreaterThan(10);
      expect(doc.signature.length).toBeGreaterThan(0);
      for (const section of doc.sections) {
        expect(section.title.length).toBeGreaterThan(0);
        expect(section.blocks.length + section.subsections.length).toBeGreaterThan(0);
      }
    }
  });

  it('quotes the amounts and delays from library-rules, never hard-coded', () => {
    const text = JSON.stringify(getSubscriptionProcedure('fr'));
    expect(text).toContain('50 000 FCFA');
    expect(text).toContain('35 000 FCFA');
    expect(text).toContain(`${LIBRARY_LOAN_DAYS} jours`);
    expect(text).toContain(`${LIBRARY_DAILY_PENALTY_XOF} F par jour`);
    expect(text).toContain(`excède ${LIBRARY_LATE_GRACE_DAYS} jours`);
  });
});
