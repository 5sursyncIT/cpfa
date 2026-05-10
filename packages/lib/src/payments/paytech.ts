// PayTech provider — Senegalese aggregator covering Wave, Orange Money, Free Money,
// Wizall, E-money, Visa, Mastercard via a single hosted-checkout API.
// API reference: https://docs.intech.sn/doc_paytech.php
//
// Flow:
//   1. server → POST /api/payment/request-payment with API_KEY+API_SECRET headers
//   2. response { success: 1, token, redirect_url } → redirect the customer
//   3. PayTech POSTs to ipn_url with hmac_compute on completion
//   4. verifyWebhook re-derives HMAC-SHA256("amount|ref_command|api_key", api_secret)
//      and matches it against hmac_compute
//
// Setup envs (see .env.example):
//   PAYTECH_API_KEY, PAYTECH_API_SECRET, PAYTECH_ENV (test|prod),
//   PAYTECH_IPN_URL, PAYTECH_SUCCESS_URL, PAYTECH_CANCEL_URL

import { createHmac, timingSafeEqual } from 'node:crypto';
import type {
  InitiatePaymentInput,
  InitiatePaymentResult,
  PaymentProvider,
  WebhookVerifyResult,
} from './index';

const PAYTECH_BASE_URL = 'https://paytech.sn/api';

type PayTechRequestPaymentResponse = {
  success: number;
  token?: string;
  redirect_url?: string;
  error?: unknown;
};

export type PayTechIpnPayload = {
  type_event?: string; // "sale_complete" | "sale_canceled"
  ref_command?: string;
  item_name?: string;
  item_price?: string | number;
  token?: string;
  api_key_sha256?: string;
  api_secret_sha256?: string;
  hmac_compute?: string;
  custom_field?: string; // base64
};

export type PayTechConfig = {
  apiKey: string;
  apiSecret: string;
  env?: 'test' | 'prod';
  ipnUrl?: string;
  successUrl?: string;
  cancelUrl?: string;
  // Injectable for tests; defaults to global fetch.
  fetchImpl?: typeof fetch;
};

export function readPayTechConfigFromEnv(): PayTechConfig {
  const apiKey = process.env.PAYTECH_API_KEY;
  const apiSecret = process.env.PAYTECH_API_SECRET;
  if (!apiKey || !apiSecret) {
    throw new Error(
      'PayTech not configured — set PAYTECH_API_KEY and PAYTECH_API_SECRET (.env).',
    );
  }
  const envValue = process.env.PAYTECH_ENV;
  return {
    apiKey,
    apiSecret,
    env: envValue === 'prod' ? 'prod' : 'test',
    ipnUrl: process.env.PAYTECH_IPN_URL,
    successUrl: process.env.PAYTECH_SUCCESS_URL,
    cancelUrl: process.env.PAYTECH_CANCEL_URL,
  };
}

// Constant-time string comparison via Buffer; returns false on length mismatch
// instead of throwing (the stdlib timingSafeEqual requires equal-length inputs).
export function safeEqualHex(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const ba = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

// Computes HMAC-SHA256 of "amount|ref_command|api_key" keyed by api_secret.
// Exported so that the test suite can assert against a known vector.
export function computePayTechHmac({
  amountXof,
  refCommand,
  apiKey,
  apiSecret,
}: {
  amountXof: number;
  refCommand: string;
  apiKey: string;
  apiSecret: string;
}): string {
  const message = `${amountXof}|${refCommand}|${apiKey}`;
  return createHmac('sha256', apiSecret).update(message).digest('hex');
}

export class PayTechProvider implements PaymentProvider {
  readonly id = 'paytech' as const;

  constructor(private readonly config: PayTechConfig) {}

  async initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    const fetchImpl = this.config.fetchImpl ?? fetch;
    const body: Record<string, unknown> = {
      item_name: input.description ?? 'CPFA',
      item_price: input.amountXof,
      ref_command: input.reference,
      command_name: input.description ?? 'Paiement CPFA',
      currency: 'XOF',
      env: this.config.env ?? 'test',
    };
    if (this.config.ipnUrl) body.ipn_url = this.config.ipnUrl;
    if (this.config.successUrl) body.success_url = this.config.successUrl;
    if (this.config.cancelUrl) body.cancel_url = this.config.cancelUrl;

    const res = await fetchImpl(`${PAYTECH_BASE_URL}/payment/request-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        API_KEY: this.config.apiKey,
        API_SECRET: this.config.apiSecret,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`PayTech request-payment failed: HTTP ${res.status}`);
    }
    const json = (await res.json()) as PayTechRequestPaymentResponse;
    if (json.success !== 1 || !json.token || !json.redirect_url) {
      throw new Error(
        `PayTech request-payment refused: ${JSON.stringify(json.error ?? json)}`,
      );
    }

    return {
      provider: this.id,
      redirectUrl: json.redirect_url,
      providerRef: json.token,
    };
  }

  async verifyWebhook(
    _headers: Record<string, string>,
    body: unknown,
  ): Promise<WebhookVerifyResult> {
    if (!body || typeof body !== 'object') return { ok: false };
    const payload = body as PayTechIpnPayload;

    // Only sale_complete should confirm a payment. sale_canceled is informational.
    if (payload.type_event !== 'sale_complete') return { ok: false };
    if (!payload.ref_command || payload.item_price == null || !payload.hmac_compute) {
      return { ok: false };
    }

    const amountXof = Number(payload.item_price);
    if (!Number.isFinite(amountXof) || amountXof <= 0) return { ok: false };

    const expected = computePayTechHmac({
      amountXof,
      refCommand: payload.ref_command,
      apiKey: this.config.apiKey,
      apiSecret: this.config.apiSecret,
    });

    if (!safeEqualHex(expected, payload.hmac_compute)) return { ok: false };

    return {
      ok: true,
      reference: payload.ref_command,
      amountXof,
      providerRef: payload.token,
    };
  }
}
