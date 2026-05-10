'use client';

import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';

export function RefundPaymentButton({ id }: { id: string }) {
  const router = useRouter();
  const refund = trpc.payments.refund.useMutation({
    onSuccess: () => router.refresh(),
  });
  return (
    <button
      type="button"
      className="btn-link fs-13"
      style={{ color: 'var(--danger)' }}
      disabled={refund.isPending}
      onClick={() => {
        const reason = window.prompt('Motif du remboursement (facultatif)') ?? undefined;
        if (!window.confirm('Marquer comme remboursé ?')) return;
        refund.mutate({ id, reason });
      }}
    >
      {refund.isPending ? '…' : 'Rembourser'}
    </button>
  );
}
