'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@cpfa/ui';
import { trpc } from '@/lib/trpc';
import { BlockEditor, coerceBlocks, type Block } from '@/components/cms/block-editor';
import { useUnsavedChanges } from '@/lib/use-unsaved-changes';
import { useToast, useConfirm } from '@/components/cpfa/admin-ui';

type Initial = {
  title: string;
  slug: string;
  locale: string;
  metaTitle: string;
  metaDescription: string;
  published: boolean;
  content: unknown[];
};

export function PageEditor({ id, initial }: { id: string; initial: Initial }) {
  const router = useRouter();
  const { toast } = useToast();
  const confirm = useConfirm();
  const [title, setTitle] = useState(initial.title);
  const [slug, setSlug] = useState(initial.slug);
  const [metaTitle, setMetaTitle] = useState(initial.metaTitle);
  const [metaDescription, setMetaDescription] = useState(initial.metaDescription);
  const [published, setPublished] = useState(initial.published);
  const [blocks, setBlocks] = useState<Block[]>(() => coerceBlocks(initial.content));
  const [dirty, setDirty] = useState(false);

  useUnsavedChanges(dirty);

  const touch =
    <T,>(setter: (v: T) => void) =>
    (v: T) => {
      setter(v);
      setDirty(true);
    };

  const update = trpc.cms.pages.update.useMutation({
    onSuccess: () => {
      setDirty(false);
      router.refresh();
      toast('Page enregistrée.');
    },
    onError: (e) => toast(e.message, 'error'),
  });
  const del = trpc.cms.pages.delete.useMutation({
    onSuccess: () => router.push('/admin/cms'),
    onError: (e) => toast(e.message, 'error'),
  });

  async function onDelete() {
    const { confirmed } = await confirm({
      title: 'Supprimer cette page ?',
      message: `« ${title} » sera retirée définitivement du site. Cette action est irréversible.`,
      confirmLabel: 'Supprimer',
      danger: true,
    });
    if (confirmed) del.mutate({ id });
  }

  const save = () => {
    update.mutate({
      id,
      title,
      slug,
      metaTitle: metaTitle || undefined,
      metaDescription: metaDescription || undefined,
      published,
      content: blocks,
    });
  };

  const previewHref = `/p/${slug}?preview=1&locale=${initial.locale}`;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 rounded-lg border bg-card p-6 md:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block font-medium">Titre</span>
          <input
            value={title}
            onChange={(e) => touch(setTitle)(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">Adresse de la page</span>
          <div className="flex items-center rounded-md border bg-background px-3 py-2 text-sm">
            <span className="text-muted-foreground">/p/</span>
            <input
              value={slug}
              onChange={(e) => touch(setSlug)(e.target.value)}
              className="w-full bg-transparent font-mono outline-none"
            />
          </div>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">Titre pour Google</span>
          <span className="mb-1 block text-xs text-muted-foreground">
            Affiché dans les résultats de recherche.
          </span>
          <input
            value={metaTitle}
            onChange={(e) => touch(setMetaTitle)(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm md:col-span-2">
          <span className="mb-1 block font-medium">Description pour Google</span>
          <span className="mb-1 block text-xs text-muted-foreground">
            Court résumé affiché sous le titre dans les résultats de recherche.
          </span>
          <textarea
            value={metaDescription}
            onChange={(e) => touch(setMetaDescription)(e.target.value)}
            rows={2}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="flex items-center gap-2 text-sm md:col-span-2">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => touch(setPublished)(e.target.checked)}
          />
          Publier
        </label>
      </section>

      <BlockEditor
        blocks={blocks}
        onChange={(next) => {
          setBlocks(next);
          setDirty(true);
        }}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={save} disabled={update.isPending}>
          {update.isPending ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
        {dirty ? (
          <span className="text-xs text-amber-600">Modifications non enregistrées</span>
        ) : update.isSuccess ? (
          <span className="text-xs text-emerald-700">Enregistré.</span>
        ) : null}
        {update.isError ? (
          <span className="text-xs text-destructive">{update.error.message}</span>
        ) : null}
        <a
          href={previewHref}
          target="_blank"
          rel="noreferrer"
          className="text-sm underline underline-offset-2"
        >
          ↗ Aperçu
        </a>
        <div className="ml-auto">
          <Button
            variant="ghost"
            onClick={onDelete}
            disabled={del.isPending}
          >
            Supprimer
          </Button>
        </div>
      </div>
    </div>
  );
}
