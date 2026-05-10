import { prisma, Prisma } from '@cpfa/db';
import { getQueue, type PdfJob } from '@cpfa/lib/queues';

export type ConfirmContext = {
  // Actor on whose behalf the confirmation runs. `null` for webhook callbacks.
  actorId: string | null;
};

export type ConfirmResult =
  | { kind: 'not-found' }
  | { kind: 'already-confirmed'; paymentId: string }
  | { kind: 'confirmed'; paymentId: string };

// Build a human-readable invoice number. Year + monotonically-increasing
// 6-char suffix derived from the payment id keeps it short and unique
// without a separate counter table. Format: INV-YYYY-XXXXXX.
function buildInvoiceNumber(paymentId: string, issuedAt: Date): string {
  const year = issuedAt.getFullYear();
  const suffix = paymentId.slice(-6).toUpperCase();
  return `INV-${year}-${suffix}`;
}

// Mark a Payment as CONFIRMED idempotently and apply downstream effects:
// - LIBRARY_SUBSCRIPTION → activate the linked Subscription for one year
// - COURSE/SEMINAR/EXAM  → flip the linked Registration to PAID
// - All purposes (except LIBRARY_PENALTY): create an Invoice row + enqueue a
//   `pdf` job (kind: invoice). The PDF worker renders + uploads + chains to a
//   `receipt` email with the PDF attached.
//
// Always writes an AuditLog entry. Single source of truth for both the
// `payments.confirm` tRPC mutation and the BullMQ payment-webhook worker.
export async function confirmPayment(
  paymentId: string,
  { actorId }: ConfirmContext,
): Promise<ConfirmResult> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { subscription: true, invoice: true },
  });
  if (!payment) return { kind: 'not-found' };
  if (payment.status === 'CONFIRMED') return { kind: 'already-confirmed', paymentId };

  const now = new Date();
  const ops: Prisma.PrismaPromise<unknown>[] = [
    prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'CONFIRMED', receivedAt: now },
    }),
    prisma.auditLog.create({
      data: {
        actorId,
        action: 'payment.confirm',
        entity: 'Payment',
        entityId: payment.id,
        diff: {
          amountXof: payment.amountXof,
          purpose: payment.purpose,
          via: actorId ? 'manual' : 'webhook',
        },
      },
    }),
  ];

  if (payment.purpose === 'LIBRARY_SUBSCRIPTION' && payment.subscription) {
    const expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    ops.push(
      prisma.subscription.update({
        where: { id: payment.subscription.id },
        data: { status: 'ACTIVE', startedAt: now, expiresAt },
      }),
    );
  }

  if (
    payment.purpose === 'COURSE_REGISTRATION' ||
    payment.purpose === 'SEMINAR_REGISTRATION' ||
    payment.purpose === 'EXAM_FEE'
  ) {
    const reg = await prisma.registration.findFirst({
      where: { paymentId: payment.id },
      select: { id: true },
    });
    if (reg) {
      ops.push(
        prisma.registration.update({
          where: { id: reg.id },
          data: { status: 'PAID' },
        }),
      );
    }
  }

  // Create the Invoice row in the same transaction so a failure rolls back
  // the payment confirmation. Skip LIBRARY_PENALTY (manual reconciliation).
  let invoiceId: string | null = null;
  if (!payment.invoice && payment.purpose !== 'LIBRARY_PENALTY') {
    invoiceId = `inv_${payment.id.slice(-12)}`;
    ops.push(
      prisma.invoice.create({
        data: {
          id: invoiceId,
          number: buildInvoiceNumber(payment.id, now),
          userId: payment.userId,
          paymentId: payment.id,
          amountXof: payment.amountXof,
          issuedAt: now,
        },
      }),
    );
  } else if (payment.invoice) {
    invoiceId = payment.invoice.id;
  }

  await prisma.$transaction(ops);

  // Hand off to the worker out of band. Failures are tolerated — the user
  // can always re-render the PDF on demand from /admin/payments.
  if (invoiceId) {
    try {
      await getQueue<PdfJob>('pdf').add(
        'invoice',
        { kind: 'invoice', paymentId: payment.id },
        { jobId: `invoice:${payment.id}` },
      );
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[confirmPayment] pdf job enqueue failed', err);
    }
  }

  return { kind: 'confirmed', paymentId };
}
