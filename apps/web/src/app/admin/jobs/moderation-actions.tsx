'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@cpfa/ui';
import { trpc } from '@/lib/trpc';

export function JobModerationActions({
  id,
  status,
}: {
  id: string;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'REJECTED';
}) {
  const router = useRouter();
  const publish = trpc.jobs.publish.useMutation({ onSuccess: () => router.refresh() });
  const close = trpc.jobs.close.useMutation({ onSuccess: () => router.refresh() });
  const reject = trpc.jobs.reject.useMutation({ onSuccess: () => router.refresh() });
  const del = trpc.jobs.delete.useMutation({ onSuccess: () => router.refresh() });
  const busy =
    publish.isPending || close.isPending || reject.isPending || del.isPending;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {status === 'DRAFT' ? (
        <>
          <Button
            size="sm"
            onClick={() => publish.mutate({ id })}
            disabled={busy}
          >
            Publier
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => reject.mutate({ id })}
            disabled={busy}
          >
            Rejeter
          </Button>
        </>
      ) : null}
      {status === 'PUBLISHED' ? (
        <Button
          size="sm"
          variant="outline"
          onClick={() => close.mutate({ id })}
          disabled={busy}
        >
          Clôturer
        </Button>
      ) : null}
      <Button
        size="sm"
        variant="ghost"
        onClick={() => {
          if (confirm('Supprimer définitivement cette offre ?')) del.mutate({ id });
        }}
        disabled={busy}
      >
        Supprimer
      </Button>
    </div>
  );
}
