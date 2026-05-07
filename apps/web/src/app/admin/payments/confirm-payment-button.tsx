'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@cpfa/ui';
import { trpc } from '@/lib/trpc';

export function ConfirmPaymentButton({ id }: { id: string }) {
  const router = useRouter();
  const confirm = trpc.payments.confirm.useMutation({ onSuccess: () => router.refresh() });

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
