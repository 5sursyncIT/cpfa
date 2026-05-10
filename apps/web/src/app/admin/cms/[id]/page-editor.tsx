'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@cpfa/ui';
import { trpc } from '@/lib/trpc';
import { BlockEditor, coerceBlocks, type Block } from '@/components/cms/block-editor';

type Initial = {
  title: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  published: boolean;
  content: unknown[];
};

export function PageEditor({ id, initial }: { id: string; initial: Initial }) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [metaTitle, setMetaTitle] = useState(initial.metaTitle);
  const [metaDescription, setMetaDescription] = useState(initial.metaDescription);
  const [published, setPublished] = useState(initial.published);
  const [blocks, setBlocks] = useState<Block[]>(() => coerceBlocks(initial.content));

  const update = trpc.cms.pages.update.useMutation({ onSuccess: () => router.refresh() });

  const save = () => {
    update.mutate({
      id,
      title,
      metaTitle: metaTitle || undefined,
      metaDescription: metaDescription || undefined,
      published,
      content: blocks,
    });
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-4 rounded-lg border bg-card p-6 md:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block font-medium">Titre</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">Meta titre (SEO)</span>
          <input
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm md:col-span-2">
          <span className="mb-1 block font-medium">Meta description</span>
          <textarea
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            rows={2}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="flex items-center gap-2 text-sm md:col-span-2">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
          />
          Publier
        </label>
      </section>

      <BlockEditor blocks={blocks} onChange={setBlocks} />

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={update.isPending}>
          {update.isPending ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
        {update.isSuccess ? (
          <span className="text-xs text-emerald-700">Enregistré.</span>
        ) : null}
        {update.isError ? (
          <span className="text-xs text-destructive">{update.error.message}</span>
        ) : null}
      </div>
    </div>
  );
}
