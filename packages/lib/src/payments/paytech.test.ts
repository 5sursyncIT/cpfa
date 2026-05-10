import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  PayTechProvider,
  computePayTechHmac,
  safeEqualHex,
  type PayTechIpnPayload,
} from './paytech';

const API_KEY = 'test-api-key';
const API_SECRET = 'test-api-secret';

const baseConfig = {
  apiKey: API_KEY,
  apiSecret: API_SECRET,
  env: 'test' as const,
};

describe('PayTech HMAC', () => {
  it('matches the documented HMAC-SHA256(amount|ref_command|api_key, api_secret) recipe', () => {
    const amountXof = 25_000;
    const refCommand = 'cm0pay123';

    const expected = createHmac('sha256', API_SECRET)
      .update(`${amountXof}|${refCommand}|${API_KEY}`)
      .digest('hex');

    expect(
      computePayTechHmac({ amountXof, refCommand, apiKey: API_KEY, apiSecret: API_SECRET }),
    ).toBe(expected);
  });

  it('safeEqualHex is constant-time and rejects length mismatches', () => {
    expect(safeEqualHex('abc', 'abc')).toBe(true);
    expect(safeEqualHex('abc', 'abd')).toBe(false);
    expect(safeEqualHex('abc', 'abcd')).toBe(false);
    expect(safeEqualHex('', '')).toBe(true);
  });
});

describe('PayTechProvider.verifyWebhook', () => {
  function makeIpn(overrides: Partial<PayTechIpnPayload> = {}): PayTechIpnPayload {
    const amountXof = 5_000;
    const refCommand = 'pay_abc';
    return {
      type_event: 'sale_complete',
      ref_command: refCommand,
      item_name: 'Abonnement bibliothèque',
      item_price: amountXof,
      token: 'token123',
      hmac_compute: computePayTechHmac({
        amountXof,
        refCommand,
        apiKey: API_KEY,
        apiSecret: API_SECRET,
      }),
      ...overrides,
    };
  }

  it('accepts a valid sale_complete with correct HMAC', async () => {
    const provider = new PayTechProvider(baseConfig);
    const result = await provider.verifyWebhook({}, makeIpn());
    expect(result.ok).toBe(true);
    expect(result.reference).toBe('pay_abc');
    expect(result.amountXof).toBe(5_000);
    expect(result.providerRef).toBe('token123');
  });

  it('rejects a tampered amount (HMAC fails)', async () => {
    const provider = new PayTechProvider(baseConfig);
    const tampered = makeIpn({ item_price: 1 }); // hmac was for 5000
    expect((await provider.verifyWebhook({}, tampered)).ok).toBe(false);
  });

  it('rejects a tampered reference', async () => {
    const provider = new PayTechProvider(baseConfig);
    const tampered = makeIpn({ ref_command: 'pay_zzz' });
    expect((await provider.verifyWebhook({}, tampered)).ok).toBe(false);
  });

  it('rejects sale_canceled even with a correct HMAC (we only confirm sale_complete)', async () => {
    const provider = new PayTechProvider(baseConfig);
    const cancelled = makeIpn({ type_event: 'sale_canceled' });
    expect((await provider.verifyWebhook({}, cancelled)).ok).toBe(false);
  });

  it('rejects payloads missing hmac_compute', async () => {
    const provider = new PayTechProvider(baseConfig);
    const noHmac = makeIpn({ hmac_compute: undefined });
    expect((await provider.verifyWebhook({}, noHmac)).ok).toBe(false);
  });

  it('rejects non-object bodies', async () => {
    const provider = new PayTechProvider(baseConfig);
    expect((await provider.verifyWebhook({}, null)).ok).toBe(false);
    expect((await provider.verifyWebhook({}, 'not-json')).ok).toBe(false);
  });
});

describe('PayTechProvider.initiate', () => {
  it('POSTs to /payment/request-payment with API_KEY/API_SECRET headers and returns redirectUrl + token', async () => {
    let capturedUrl = '';
    let capturedInit: RequestInit | undefined;
    const fakeFetch: typeof fetch = async (url, init) => {
      capturedUrl = url instanceof URL ? url.toString() : String(url);
      capturedInit = init;
      return new Response(
        JSON.stringify({
          success: 1,
          token: 'tok_xyz',
          redirect_url: 'https://paytech.sn/payment/checkout/tok_xyz',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    };

    const provider = new PayTechProvider({
      ...baseConfig,
      ipnUrl: 'https://cpfa.example.org/api/webhooks/payments/paytech',
      successUrl: 'https://cpfa.example.org/paiement/succes',
      cancelUrl: 'https://cpfa.example.org/paiement/annule',
      fetchImpl: fakeFetch,
    });

    const result = await provider.initiate({
      amountXof: 25_000,
      reference: 'pay_42',
      customer: { id: 'user_1', email: 'u@example.org' },
      description: 'CPFA — LIBRARY_SUBSCRIPTION',
    });

    expect(capturedUrl).toBe('https://paytech.sn/api/payment/request-payment');
    const headers = (capturedInit?.headers ?? {}) as Record<string, string>;
    expect(headers.API_KEY).toBe(API_KEY);
    expect(headers.API_SECRET).toBe(API_SECRET);
    const body = JSON.parse(String(capturedInit?.body));
    expect(body.ref_command).toBe('pay_42');
    expect(body.item_price).toBe(25_000);
    expect(body.currency).toBe('XOF');
    expect(body.env).toBe('test');
    expect(body.ipn_url).toContain('/api/webhooks/payments/paytech');
    expect(result.redirectUrl).toContain('paytech.sn/payment/checkout');
    expect(result.providerRef).toBe('tok_xyz');
  });

  it('throws when PayTech responds success != 1', async () => {
    const fakeFetch: typeof fetch = async () =>
      new Response(JSON.stringify({ success: 0, error: 'invalid api key' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    const provider = new PayTechProvider({ ...baseConfig, fetchImpl: fakeFetch });
    await expect(
      provider.initiate({
        amountXof: 1000,
        reference: 'pay_1',
        customer: { id: 'u' },
      }),
    ).rejects.toThrow(/refused/);
  });
});
