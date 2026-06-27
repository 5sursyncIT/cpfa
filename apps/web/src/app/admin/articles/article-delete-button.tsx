'use client';

import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { useToast, useConfirm } from '@/components/cpfa/admin-ui';

export function ArticleDeleteButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const confirm = useConfirm();
  const del = trpc.cms.articles.delete.useMutation({
    onSuccess: () => {
      router.refresh();
      toast('Article supprimé.');
    },
    onError: (e) => toast(e.message, 'error'),
  });

  async function onClick() {
    const { confirmed } = await confirm({
      title: 'Supprimer cet article ?',
      message: `« ${title} » sera retiré définitivement du site. Cette action est irréversible.`,
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
