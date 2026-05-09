'use client';

import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';

export function SubscribeButton() {
  const router = useRouter();
  const initiate = trpc.subscriptions.initiate.useMutation({
    onSuccess: () => router.refresh(),
  });

  return (
    <button
      type="button"
      className="btn btn-orange btn-lg"
      onClick={() => initiate.mutate(undefined)}
      disabled={initiate.isPending}
    >
      {initiate.isPending ? 'Initialisation…' : 'Souscrire (10 000 FCFA)'}{' '}
      {!initiate.isPending ? <span className="arrow">→</span> : null}
    </button>
  );
}
