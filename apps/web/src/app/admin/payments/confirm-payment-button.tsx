'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@cpfa/ui';
import { trpc } from '@/lib/trpc';
import { useToast } from '@/components/cpfa/admin-ui';

export function ConfirmPaymentButton({ id }: { id: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const confirm = trpc.payments.confirm.useMutation({
    onSuccess: () => {
      router.refresh();
      toast('Paiement confirmé.');
    },
    onError: (e) => toast(e.message, 'error'),
  });

  return (
    <Button
      size="sm"
      disabled={confirm.isPending}
      onClick={() => confirm.mutate({ id })}
    >
      {confirm.isPending ? '…' : 'Confirmer'}
    </Button>
  );
}
