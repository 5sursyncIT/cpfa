'use client';

import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';

export function CoursePublishToggle({ id, published }: { id: string; published: boolean }) {
  const router = useRouter();
  const toggle = trpc.courses.togglePublished.useMutation({
    onSuccess: () => router.refresh(),
  });
  return (
    <button
      type="button"
      className={'btn btn-sm ' + (published ? 'btn-ghost' : 'btn-primary')}
      disabled={toggle.isPending}
      onClick={() => toggle.mutate({ id, published: !published })}
    >
      {toggle.isPending ? '…' : published ? 'Dépublier' : 'Publier'}
    </button>
  );
}
