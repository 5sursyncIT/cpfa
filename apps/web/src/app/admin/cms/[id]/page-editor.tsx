'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@cpfa/ui';
import { trpc } from '@/lib/trpc';

type Block =
  | { kind: 'heading'; level: 2 | 3; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'image'; src: string; alt?: string };

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
  const [blocks, setBlocks] = useState<Block[]>(() => coerce(initial.content));

  const update = trpc.cms.pages.update.useMutation({ onSuccess: () => router.refresh() });

  const addParagraph = () => setBlocks((b) => [...b, { kind: 'paragraph', text: '' }]);
  const addHeading = () => setBlocks((b) => [...b, { kind: 'heading', level: 2, text: '' }]);
  const removeAt = (i: number) => setBlocks((b) => b.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) =>
    setBlocks((b) => {
      const j = i + dir;
      if (j < 0 || j >= b.length) return b;
      const copy = [...b];
      [copy[i], copy[j]] = [copy[j]!, copy[i]!];
      return copy;
    });

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

      <section className="rounded-lg border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Contenu</h2>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={addHeading}>
              + Titre
            </Button>
            <Button size="sm" variant="outline" onClick={addParagraph}>
              + Paragraphe
            </Button>
          </div>
        </div>

        {blocks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Page vide. Ajoutez votre premier bloc.</p>
        ) : (
          <ol className="space-y-4">
            {blocks.map((block, i) => (
              <li key={i} className="rounded-md border bg-background p-3">
                <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-mono">{block.kind}</span>
                  <div className="flex gap-1">
                    <button onClick={() => move(i, -1)} className="px-2">↑</button>
                    <button onClick={() => move(i, 1)} className="px-2">↓</button>
                    <button
                      onClick={() => removeAt(i)}
                      className="px-2 text-destructive"
                      aria-label="Supprimer"
                    >
                      ×
                    </button>
                  </div>
                </div>
                {block.kind === 'paragraph' ? (
                  <textarea
                    value={block.text}
                    rows={3}
                    onChange={(e) => {
                      const t = e.target.value;
                      setBlocks((b) =>
                        b.map((bl, idx) => (idx === i ? { ...bl, text: t } : bl)),
                      );
                    }}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  />
                ) : block.kind === 'heading' ? (
                  <input
                    value={block.text}
                    onChange={(e) => {
                      const t = e.target.value;
                      setBlocks((b) =>
                        b.map((bl, idx) => (idx === i ? { ...bl, text: t } : bl)),
                      );
                    }}
                    className="w-full rounded-md border bg-background px-3 py-2 text-base font-semibold"
                  />
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </section>

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

function coerce(content: unknown[]): Block[] {
  return content
    .filter((b): b is Record<string, unknown> => typeof b === 'object' && b !== null)
    .map((b) => {
      if (b.kind === 'heading') {
        const level = (b.level as number) === 3 ? 3 : 2;
        return { kind: 'heading', level: level as 2 | 3, text: String(b.text ?? '') };
      }
      if (b.kind === 'image') {
        return { kind: 'image', src: String(b.src ?? ''), alt: b.alt ? String(b.alt) : undefined };
      }
      return { kind: 'paragraph', text: String(b.text ?? '') };
    });
}
