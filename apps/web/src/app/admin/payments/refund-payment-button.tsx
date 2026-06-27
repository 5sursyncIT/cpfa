'use client';

import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { useToast, useConfirm } from '@/components/cpfa/admin-ui';

export function RefundPaymentButton({ id }: { id: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const confirm = useConfirm();
  const refund = trpc.payments.refund.useMutation({
    onSuccess: () => {
      router.refresh();
      toast('Paiement marqué comme remboursé.');
    },
    onError: (e) => toast(e.message, 'error'),
  });

  async function onClick() {
    const { confirmed, reason } = await confirm({
      title: 'Marquer ce paiement comme remboursé ?',
      message: 'Le paiement passera au statut « Remboursé ».',
      confirmLabel: 'Confirmer le remboursement',
      danger: true,
      reasonLabel: 'Motif du remboursement (facultatif)',
      reasonPlaceholder: 'Ex. : annulation de la formation',
    });
    if (!confirmed) return;
    refund.mutate({ id, reason: reason || undefined });
  }

  return (
    <button
      type="button"
      className="btn-link fs-13"
      style={{ color: 'var(--danger)' }}
      disabled={refund.isPending}
      onClick={onClick}
    >
      {refund.isPending ? '…' : 'Rembourser'}
    </button>
  );
}
