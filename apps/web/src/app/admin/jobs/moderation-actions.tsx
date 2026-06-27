'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@cpfa/ui';
import { trpc } from '@/lib/trpc';
import { useToast, useConfirm } from '@/components/cpfa/admin-ui';

export function JobModerationActions({
  id,
  status,
}: {
  id: string;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'REJECTED';
}) {
  const router = useRouter();
  const { toast } = useToast();
  const confirm = useConfirm();
  const onError = (e: { message: string }) => toast(e.message, 'error');
  const publish = trpc.jobs.publish.useMutation({
    onSuccess: () => {
      router.refresh();
      toast('Offre publiée.');
    },
    onError,
  });
  const close = trpc.jobs.close.useMutation({
    onSuccess: () => {
      router.refresh();
      toast('Offre clôturée.');
    },
    onError,
  });
  const reject = trpc.jobs.reject.useMutation({
    onSuccess: () => {
      router.refresh();
      toast('Offre rejetée.');
    },
    onError,
  });
  const del = trpc.jobs.delete.useMutation({
    onSuccess: () => {
      router.refresh();
      toast('Offre supprimée.');
    },
    onError,
  });
  const busy =
    publish.isPending || close.isPending || reject.isPending || del.isPending;

  async function onDelete() {
    const { confirmed } = await confirm({
      title: 'Supprimer cette offre ?',
      message: 'L’offre d’emploi sera retirée définitivement. Cette action est irréversible.',
      confirmLabel: 'Supprimer',
      danger: true,
    });
    if (confirmed) del.mutate({ id });
  }

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
      <Button size="sm" variant="ghost" onClick={onDelete} disabled={busy}>
        Supprimer
      </Button>
    </div>
  );
}
