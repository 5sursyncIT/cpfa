'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';

export function ClonePageButton({
  sourceId,
  targetLocale,
}: {
  sourceId: string;
  targetLocale: 'fr' | 'en';
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const clone = trpc.cms.pages.cloneFromLocale.useMutation({
    onSuccess: ({ id }) => {
      router.push(`/admin/cms/${id}`);
      router.refresh();
    },
    onError: (e) => setError(e.message),
  });

  return (
    <>
      <button
        type="button"
        className="btn-link fs-13"
        disabled={clone.isPending}
        onClick={() => {
          setError(null);
          clone.mutate({ sourceId, targetLocale });
        }}
      >
        {clone.isPending ? '…' : `Cloner vers ${targetLocale.toUpperCase()} →`}
      </button>
      {error ? (
        <div className="fs-13" style={{ color: 'var(--danger)' }}>
          {error}
        </div>
      ) : null}
    </>
  );
}
