import { describe, expect, it } from 'vitest';
import { CHANNEL_LABEL, declarationFromMetadata, withDeclaration } from '@/lib/payment-declaration';

const declaration = {
  channel: 'WAVE' as const,
  reference: 'TX123456789',
  declaredAt: '2026-08-04T10:00:00.000Z',
};

describe('payment declaration', () => {
  it('reads back a declaration it wrote', () => {
    const metadata = withDeclaration({ tier: 'PROFESSIONAL' }, declaration);
    expect(declarationFromMetadata(metadata)).toEqual(declaration);
  });

  // Le bloc metadata porte déjà le tier et les données du provider : la
  // déclaration s'ajoute, elle ne remplace pas.
  it('preserves the existing metadata', () => {
    const metadata = withDeclaration(
      { tier: 'HOME_LOAN', qrPayload: 'cpfa:pay:x:50000' },
      declaration,
    );
    expect(metadata.tier).toBe('HOME_LOAN');
    expect(metadata.qrPayload).toBe('cpfa:pay:x:50000');
  });

  it('returns null when there is nothing usable', () => {
    expect(declarationFromMetadata(null)).toBeNull();
    expect(declarationFromMetadata({})).toBeNull();
    expect(declarationFromMetadata({ declaration: null })).toBeNull();
    expect(declarationFromMetadata({ declaration: { channel: 'WAVE' } })).toBeNull();
    expect(
      declarationFromMetadata({ declaration: { channel: 'WAVE', reference: '  ' } }),
    ).toBeNull();
    // Un canal inconnu (donnée ancienne ou trafiquée) n'est pas affiché.
    expect(
      declarationFromMetadata({ declaration: { channel: 'BITCOIN', reference: 'TX1' } }),
    ).toBeNull();
  });

  it('trims the reference typed by the subscriber', () => {
    const parsed = declarationFromMetadata({
      declaration: { ...declaration, reference: '  TX123456789 ' },
    });
    expect(parsed?.reference).toBe('TX123456789');
  });

  it('labels both channels in plain French', () => {
    expect(CHANNEL_LABEL.WAVE).toBe('Wave');
    expect(CHANNEL_LABEL.ORANGE_MONEY).toBe('Orange Money');
  });
});
