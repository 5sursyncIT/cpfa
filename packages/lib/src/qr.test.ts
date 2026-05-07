import { describe, expect, it } from 'vitest';
import { buildQrPayload } from './qr';

describe('buildQrPayload', () => {
  it('emits the cpfa: scheme with kind, id, and short secret', () => {
    const payload = buildQrPayload('subscription', 'CARD-123', 'abcdef0123456789aaaa');
    expect(payload).toBe('cpfa:subscription:CARD-123:abcdef012345');
  });

  it('truncates the secret to 12 chars', () => {
    const payload = buildQrPayload('resource', 'R1', 'a'.repeat(64));
    expect(payload.split(':').at(-1)?.length).toBe(12);
  });

  it('keeps short secrets as-is (no padding)', () => {
    const payload = buildQrPayload('payment', 'P1', 'short');
    expect(payload).toBe('cpfa:payment:P1:short');
  });

  it('encodes payment kind', () => {
    expect(buildQrPayload('payment', 'tx-1', 'sec123456789X').startsWith('cpfa:payment:')).toBe(
      true,
    );
  });
});
