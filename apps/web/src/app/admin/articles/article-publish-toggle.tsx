'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@cpfa/ui';
import { trpc } from '@/lib/trpc';

export function ArticlePublishToggle({ id, published }: { id: string; published: boolean }) {
  const router = useRouter();
  const toggle = trpc.cms.articles.togglePublished.useMutation({
    onSuccess: () => router.refresh(),
  });

  return (
    <Button
      size="sm"
      variant={published ? 'outline' : 'default'}
      disabled={toggle.isPending}
      onClick={() => toggle.mutate({ id, published: !published })}
    >
      {toggle.isPending ? '…' : published ? 'Dépublier' : 'Publier'}
    </Button>
  );
}
