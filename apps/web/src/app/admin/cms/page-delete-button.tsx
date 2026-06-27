'use client';

import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { useToast, useConfirm } from '@/components/cpfa/admin-ui';

export function PageDeleteButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const confirm = useConfirm();
  const del = trpc.cms.pages.delete.useMutation({
    onSuccess: () => {
      router.refresh();
      toast('Page supprimée.');
    },
    onError: (e) => toast(e.message, 'error'),
  });

  async function onClick() {
    const { confirmed } = await confirm({
      title: 'Supprimer cette page ?',
      message: `« ${title} » sera retirée définitivement du site. Cette action est irréversible.`,
      confirmLabel: 'Supprimer',
      danger: true,
    });
    if (confirmed) del.mutate({ id });
  }

  return (
    <button
      type="button"
      className="btn-link fs-13"
      style={{ color: 'var(--danger)' }}
      disabled={del.isPending}
      onClick={onClick}
    >
      {del.isPending ? '…' : 'Supprimer'}
    </button>
  );
}
