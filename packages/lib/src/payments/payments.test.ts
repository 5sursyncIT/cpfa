import { describe, expect, it } from 'vitest';
import { getPaymentProvider } from './index';

describe('payment provider abstraction', () => {
  it('defaults to static-qr when PAYMENT_PROVIDER is not set', () => {
    const original = process.env.PAYMENT_PROVIDER;
    delete process.env.PAYMENT_PROVIDER;
    const provider = getPaymentProvider();
    expect(provider.id).toBe('static-qr');
    if (original !== undefined) process.env.PAYMENT_PROVIDER = original;
  });

  it('static-qr returns a qrPayload, no redirectUrl, no providerRef', async () => {
    const provider = getPaymentProvider('static-qr');
    const result = await provider.initiate({
      amountXof: 25_000,
      reference: 'reg-123',
      customer: { id: 'user-1' },
    });
    expect(result.provider).toBe('static-qr');
    expect(result.qrPayload).toContain('cpfa:pay:reg-123:25000');
    expect(result.redirectUrl).toBeUndefined();
    expect(result.providerRef).toBeUndefined();
  });

  it('static-qr webhook is never auto-confirmed (manual comptable flow)', async () => {
    const provider = getPaymentProvider('static-qr');
    const verify = await provider.verifyWebhook({}, {});
    expect(verify.ok).toBe(false);
  });

  it('throws a clear error when an unimplemented provider is requested', () => {
    expect(() => getPaymentProvider('wave')).toThrowError(/not implemented/);
    expect(() => getPaymentProvider('orange-money')).toThrowError(/not implemented/);
  });
});
