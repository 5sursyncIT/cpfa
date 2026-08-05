import { describe, expect, it } from 'vitest';
import { renderSubscriptionContract } from '@cpfa/pdf';
import { LIBRARY_TIERS } from '@/lib/library-rules';
import {
  buildSubscriptionContract,
  contractArticles,
  contractStorageKey,
  subscriberDisplayName,
} from '@/lib/subscription-contract';

const mentions = {
  libraryAddress: 'Liberté 6 Ext Lot 242 — Immeuble Serigne Cheikh Mbacké Gaïndé Fatma, 5ème étage',
  managerName: 'Madame Marie José PREIRA',
  city: 'Dakar',
};

const subscription = {
  cardNumber: 'CPFA-ABC123-4F',
  tier: 'HOME_LOAN' as const,
  startedAt: new Date('2026-08-04T10:00:00Z'),
  expiresAt: new Date('2027-08-04T10:00:00Z'),
};

describe('subscription contract', () => {
  it('carries the eight articles of the signed contract', () => {
    const articles = contractArticles();
    expect(articles.map((a) => a.number)).toEqual(['1', '2', '3', '4', '5', '6', '7', '8']);
    for (const article of articles) {
      expect(article.title.length).toBeGreaterThan(0);
      expect(article.items.length).toBeGreaterThan(0);
    }
  });

  // Article 4 doit refléter la grille tarifaire, pas une copie figée.
  it('quotes article 4 tariffs from library-rules', () => {
    const article4 = contractArticles().find((a) => a.number === '4')!;
    const text = article4.items.join(' ');
    expect(text).toContain('10 000 FCFA');
    expect(text).toContain('15 000 FCFA');
    expect(text).toContain('50 000 FCFA');
    expect(text).toContain('35 000 FCFA');
    expect(LIBRARY_TIERS.HOME_LOAN.feeXof + LIBRARY_TIERS.HOME_LOAN.depositXof).toBe(
      LIBRARY_TIERS.HOME_LOAN.priceXof,
    );
  });

  it('fills the parties, the formula and the dates', () => {
    const contract = buildSubscriptionContract({
      subscription,
      user: { firstName: 'Aïssatou', lastName: 'Diop', email: 'a@b.c' },
      mentions,
    });
    expect(contract.subscriberName).toBe('Aïssatou Diop');
    expect(contract.managerName).toBe(mentions.managerName);
    expect(contract.city).toBe('Dakar');
    expect(contract.cardNumber).toBe('CPFA-ABC123-4F');
    expect(contract.tierLabel).toContain('50 000 FCFA');
    expect(contract.startedAt).toContain('2026');
    expect(contract.expiresAt).toContain('2027');
    // L'adresse du domicile reste manuscrite : rien ne doit être inventé.
    expect(contract.subscriberAddress).toBeUndefined();
  });

  it('falls back to the email when the name is missing', () => {
    expect(subscriberDisplayName({ email: 'sans-nom@cpfa.local' })).toBe('sans-nom@cpfa.local');
    expect(subscriberDisplayName({})).toBe('Abonné(e) CPFA');
  });

  it('archives one contract per subscription', () => {
    expect(contractStorageKey('sub_1', 'CPFA-ABC123-4F')).toBe('contract/sub_1/CPFA-ABC123-4F.pdf');
  });

  it('renders a PDF', async () => {
    const buffer = await renderSubscriptionContract(
      buildSubscriptionContract({
        subscription,
        user: { firstName: 'Aïssatou', lastName: 'Diop', email: 'a@b.c' },
        mentions,
      }),
    );
    expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
    expect(buffer.length).toBeGreaterThan(5_000);
  });
});
