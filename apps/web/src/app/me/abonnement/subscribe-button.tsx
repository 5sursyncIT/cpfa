'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@cpfa/ui';
import { trpc } from '@/lib/trpc';

export function SubscribeButton() {
  const router = useRouter();
  const initiate = trpc.subscriptions.initiate.useMutation({
    onSuccess: () => router.refresh(),
  });

  return (
    <Button
      onClick={() => initiate.mutate(undefined)}
      disabled={initiate.isPending}
      size="lg"
    >
      {initiate.isPending ? 'Initialisation…' : 'Souscrire (10 000 FCFA)'}
    </Button>
  );
}
