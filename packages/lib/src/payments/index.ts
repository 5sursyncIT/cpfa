// Provider-agnostic payment interface.
// Default V1 implementation is `static-qr` until Wave/OM merchant contracts are signed
// (decision §10.2 of docs/projet.md). Wave/OM API providers can be plugged in later
// without touching the calling code.

import { z } from 'zod';

export const PaymentProviderId = z.enum(['static-qr', 'wave', 'orange-money']);
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

export function getPaymentProvider(id?: PaymentProviderId): PaymentProvider {
  const requested = id ?? (process.env.PAYMENT_PROVIDER as PaymentProviderId | undefined) ?? 'static-qr';
  const provider = providers.get(requested);
  if (!provider) {
    throw new Error(
      `Payment provider "${requested}" is not implemented yet. Available: ${[...providers.keys()].join(', ')}`,
    );
  }
  return provider;
}
