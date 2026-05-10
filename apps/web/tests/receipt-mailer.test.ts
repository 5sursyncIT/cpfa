import { describe, expect, it } from 'vitest';
import { subjectFor, type EmailTemplate } from '@/lib/mailer';

describe('mailer subjectFor: receipt template', () => {
  it('builds a French subject including the invoice number', () => {
    const tmpl: EmailTemplate = {
      kind: 'receipt',
      data: {
        customerName: 'Aïssatou Ndiaye',
        invoiceNumber: 'INV-2026-ABCDEF',
        amountXof: 50_000,
        description: 'LIBRARY_SUBSCRIPTION',
        issuedAt: '15 mai 2026',
      },
    };
    expect(subjectFor(tmpl)).toBe('Reçu N° INV-2026-ABCDEF — CPFA');
  });
});
