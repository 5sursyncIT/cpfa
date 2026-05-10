// Provider-agnostic payment interface.
// Production provider is `paytech` — a Senegalese aggregator that covers Wave,
// Orange Money, Free Money, Wizall, E-money, Visa and Mastercard via a single
// hosted-checkout API. `static-qr` remains as a manual fallback so that an
// accountant can record offline transfers from /admin/payments. The bare
// `wave` and `orange-money` ids are kept in the schema for historical data
// but are not registered as live providers (PayTech is the route forward —
// see decision §10.2 of docs/projet.md).

import { z } from 'zod';
import { PayTechProvider, readPayTechConfigFromEnv } from './paytech';

export const PaymentProviderId = z.enum(['static-qr', 'wave', 'orange-money', 'paytech']);
export type PaymentProviderId = z.infer<typeof PaymentProviderId>;

export type InitiatePaymentInput = {
  amountXof: number;
  reference: string;
  customer: { id: string; phone?: string; email?: string };
  description?: string;
};

export type InitiatePaymentResult = {
  provider: PaymentProviderId;
  /** Either a redirect URL (for Wave/OM Checkout) or a static QR payload to display. */
  redirectUrl?: string;
  qrPayload?: string;
  /** Provider's transaction id (when known at initiation). */
  providerRef?: string;
};

export type WebhookVerifyResult = {
  ok: boolean;
  reference?: string;
  amountXof?: number;
  providerRef?: string;
};

export interface PaymentProvider {
  readonly id: PaymentProviderId;
  initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult>;
  verifyWebhook(headers: Record<string, string>, body: unknown): Promise<WebhookVerifyResult>;
}

class StaticQrProvider implements PaymentProvider {
  readonly id = 'static-qr' as const;

  async initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    return {
      provider: this.id,
      qrPayload: `cpfa:pay:${input.reference}:${input.amountXof}`,
    };
  }

  async verifyWebhook(): Promise<WebhookVerifyResult> {
    // Static QR has no webhook — confirmation is manual, by an accountant.
    return { ok: false };
  }
}

const providers = new Map<PaymentProviderId, PaymentProvider>([
  ['static-qr', new StaticQrProvider()],
]);

// PayTech is built lazily — its constructor reads env vars, so we only do it
// when actually requested (keeps unit tests env-free unless they opt in).
function ensurePayTech(): PaymentProvider {
  const cached = providers.get('paytech');
  if (cached) return cached;
  const provider = new PayTechProvider(readPayTechConfigFromEnv());
  providers.set('paytech', provider);
  return provider;
}

export function getPaymentProvider(id?: PaymentProviderId): PaymentProvider {
  const requested = id ?? (process.env.PAYMENT_PROVIDER as PaymentProviderId | undefined) ?? 'static-qr';
  if (requested === 'paytech') return ensurePayTech();
  const provider = providers.get(requested);
  if (!provider) {
    throw new Error(
      `Payment provider "${requested}" is not implemented yet. Available: ${[...providers.keys(), 'paytech'].join(', ')}`,
    );
  }
  return provider;
}
