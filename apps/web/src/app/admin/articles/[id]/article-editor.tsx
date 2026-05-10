'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@cpfa/ui';
import { trpc } from '@/lib/trpc';
import { BlockEditor, coerceBlocks, type Block } from '@/components/cms/block-editor';
import { MediaPicker } from '@/components/cms/media-picker';
import { mediaUrl } from '@/lib/media';

type Initial = {
  title: string;
  slug: string;
  excerpt: string;
  tags: string[];
  coverKey: string | null;
  published: boolean;
  content: unknown[];
};

export function ArticleEditor({ id, initial }: { id: string; initial: Initial }) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [excerpt, setExcerpt] = useState(initial.excerpt);
  const [tagsCsv, setTagsCsv] = useState(initial.tags.join(', '));
  const [coverKey, setCoverKey] = useState<string | null>(initial.coverKey);
  const [published, setPublished] = useState(initial.published);
  const [blocks, setBlocks] = useState<Block[]>(() => coerceBlocks(initial.content));
  const [pickerOpen, setPickerOpen] = useState(false);

  const update = trpc.cms.articles.update.useMutation({ onSuccess: () => router.refresh() });
  const del = trpc.cms.articles.delete.useMutation({
    onSuccess: () => router.push('/admin/articles'),
  });

  const save = () => {
    update.mutate({
      id,
      title,
      excerpt: excerpt || undefined,
      tags: tagsCsv
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      coverKey,
      published,
      content: blocks,
    });
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-4 rounded-lg border bg-card p-6 md:grid-cols-2">
        <label className="text-sm md:col-span-2">
          <span className="mb-1 block font-medium">Titre</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm md:col-span-2">
          <span className="mb-1 block font-medium">Chapô / résumé</span>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">Tags (séparés par virgule)</span>
          <input
            value={tagsCsv}
            onChange={(e) => setTagsCsv(e.target.value)}
            placeholder="cima, conformité, ohada"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </label>
        <div className="text-sm">
          <span className="mb-1 block font-medium">Image de couverture</span>
          <div className="space-y-2">
            {coverKey ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={mediaUrl(coverKey) ?? ''}
                alt=""
                className="max-h-32 rounded-md border object-contain"
              />
            ) : null}
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setPickerOpen(true)}>
                {coverKey ? 'Changer' : 'Choisir une image'}
              </Button>
              {coverKey ? (
                <Button size="sm" variant="ghost" onClick={() => setCoverKey(null)}>
                  Retirer
                </Button>
              ) : null}
            </div>
          </div>
        </div>
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

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={save} disabled={update.isPending}>
          {update.isPending ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
        {update.isSuccess ? (
          <span className="text-xs text-emerald-700">Enregistré.</span>
        ) : null}
        {update.isError ? (
          <span className="text-xs text-destructive">{update.error.message}</span>
        ) : null}
        <div className="ml-auto">
          <Button
            variant="ghost"
            onClick={() => {
              if (confirm('Supprimer cet article ?')) del.mutate({ id });
            }}
            disabled={del.isPending}
          >
            Supprimer
          </Button>
        </div>
      </div>

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(m) => setCoverKey(m.storageKey)}
      />
    </div>
  );
}
