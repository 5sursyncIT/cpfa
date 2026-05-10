import { NextResponse } from 'next/server';
import { getPaymentProvider, PaymentProviderId } from '@cpfa/lib/payments';
import { getQueue, type PaymentWebhookJob } from '@cpfa/lib/queues';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ALLOWED: ReadonlySet<PaymentProviderId> = new Set(['wave', 'orange-money']);

export async function POST(
  req: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;

  const parsed = PaymentProviderId.safeParse(provider);
  if (!parsed.success || !ALLOWED.has(parsed.data)) {
    return NextResponse.json({ ok: false, error: 'unknown provider' }, { status: 404 });
  }

  const headers: Record<string, string> = {};
  req.headers.forEach((v, k) => {
    headers[k] = v;
  });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = null;
  }

  const verified = await getPaymentProvider(parsed.data).verifyWebhook(headers, body);
  if (!verified.ok) {
    return NextResponse.json({ ok: false, error: 'verification failed' }, { status: 400 });
  }

  await getQueue<PaymentWebhookJob>('payment-webhook').add(
    'verified',
    {
      provider: parsed.data as PaymentWebhookJob['provider'],
      payload: verified,
    },
    {
      jobId: verified.providerRef
        ? `webhook:${parsed.data}:${verified.providerRef}`
        : undefined,
      removeOnComplete: 100,
      removeOnFail: 1000,
    },
  );

  return NextResponse.json({ ok: true });
}
