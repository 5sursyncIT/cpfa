'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@cpfa/ui';
import { trpc } from '@/lib/trpc';

export function CreateArticleButton({ locale = 'fr' }: { locale?: 'fr' | 'en' }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const create = trpc.cms.articles.create.useMutation({
    onSuccess: ({ id }) => router.push(`/admin/articles/${id}`),
  });

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        Nouvel article ({locale.toUpperCase()})
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="text-sm">
        <span className="mb-1 block text-xs text-muted-foreground">Slug</span>
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
          placeholder="reforme-cima-2026"
          className="rounded-md border bg-background px-3 py-1.5 text-sm"
        />
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-xs text-muted-foreground">Titre</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-md border bg-background px-3 py-1.5 text-sm"
        />
      </label>
      <Button
        disabled={!slug || !title || create.isPending}
        onClick={() =>
          create.mutate({ slug, title, locale, content: [], tags: [], published: false })
        }
      >
        {create.isPending ? '…' : 'Créer'}
      </Button>
      <Button variant="ghost" onClick={() => setOpen(false)}>
        Annuler
      </Button>
      {create.isError ? (
        <p className="w-full text-xs text-destructive">{create.error.message}</p>
      ) : null}
    </div>
  );
}
