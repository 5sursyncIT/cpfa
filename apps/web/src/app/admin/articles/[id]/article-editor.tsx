'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@cpfa/ui';
import { trpc } from '@/lib/trpc';
import { BlockEditor, coerceBlocks, type Block } from '@/components/cms/block-editor';
import { MediaPicker } from '@/components/cms/media-picker';
import { useToast, useConfirm } from '@/components/cpfa/admin-ui';
import { mediaUrl } from '@/lib/media';
import { useUnsavedChanges } from '@/lib/use-unsaved-changes';

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
  const { toast } = useToast();
  const confirm = useConfirm();
  const [title, setTitle] = useState(initial.title);
  const [excerpt, setExcerpt] = useState(initial.excerpt);
  const [tags, setTags] = useState<string[]>(initial.tags);
  const [tagDraft, setTagDraft] = useState('');
  const [coverKey, setCoverKey] = useState<string | null>(initial.coverKey);
  const [published, setPublished] = useState(initial.published);
  const [blocks, setBlocks] = useState<Block[]>(() => coerceBlocks(initial.content));
  const [pickerOpen, setPickerOpen] = useState(false);
  const [dirty, setDirty] = useState(false);

  useUnsavedChanges(dirty);

  const touch =
    <T,>(setter: (v: T) => void) =>
    (v: T) => {
      setter(v);
      setDirty(true);
    };

  const update = trpc.cms.articles.update.useMutation({
    onSuccess: () => {
      setDirty(false);
      router.refresh();
      toast('Article enregistré.');
    },
    onError: (e) => toast(e.message, 'error'),
  });
  const del = trpc.cms.articles.delete.useMutation({
    onSuccess: () => router.push('/admin/articles'),
    onError: (e) => toast(e.message, 'error'),
  });

  async function onDelete() {
    const { confirmed } = await confirm({
      title: 'Supprimer cet article ?',
      message: `« ${title} » sera retiré définitivement du site. Cette action est irréversible.`,
      confirmLabel: 'Supprimer',
      danger: true,
    });
    if (confirmed) del.mutate({ id });
  }

  const addTag = (raw: string) => {
    const t = raw.trim();
    if (!t || tags.includes(t)) {
      setTagDraft('');
      return;
    }
    setTags((prev) => [...prev, t]);
    setTagDraft('');
    setDirty(true);
  };
  const removeTag = (i: number) => {
    setTags((prev) => prev.filter((_, idx) => idx !== i));
    setDirty(true);
  };

  const save = () => {
    update.mutate({
      id,
      title,
      excerpt: excerpt || undefined,
      tags,
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
            onChange={(e) => touch(setTitle)(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm md:col-span-2">
          <span className="mb-1 block font-medium">Résumé</span>
          <span className="mb-1 block text-xs text-muted-foreground">
            Court texte affiché dans la liste des actualités.
          </span>
          <textarea
            value={excerpt}
            onChange={(e) => touch(setExcerpt)(e.target.value)}
            rows={2}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </label>
        <div className="text-sm">
          <span className="mb-1 block font-medium">Mots-clés</span>
          <span className="mb-1 block text-xs text-muted-foreground">
            Tapez un mot-clé puis Entrée pour l’ajouter.
          </span>
          <div className="flex flex-wrap items-center gap-1.5 rounded-md border bg-background px-2 py-1.5">
            {tags.map((t, i) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs"
              >
                {t}
                <button
                  type="button"
                  onClick={() => removeTag(i)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label={`Retirer ${t}`}
                >
                  ×
                </button>
              </span>
            ))}
            <input
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  addTag(tagDraft);
                } else if (e.key === 'Backspace' && !tagDraft && tags.length) {
                  removeTag(tags.length - 1);
                }
              }}
              onBlur={() => addTag(tagDraft)}
              placeholder={tags.length ? '' : 'cima, conformité…'}
              className="min-w-[8rem] flex-1 bg-transparent px-1 py-0.5 text-sm outline-none"
            />
          </div>
        </div>
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
                <Button size="sm" variant="ghost" onClick={() => touch(setCoverKey)(null)}>
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
          href={`/blog/${initial.slug}?preview=1`}
          target="_blank"
          rel="noreferrer"
          className="text-sm underline underline-offset-2"
        >
          ↗ Aperçu
        </a>
        <div className="ml-auto">
          <Button variant="ghost" onClick={onDelete} disabled={del.isPending}>
            Supprimer
          </Button>
        </div>
      </div>

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(m) => touch(setCoverKey)(m.storageKey)}
      />
    </div>
  );
}
