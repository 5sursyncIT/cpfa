'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { useToast, useConfirm } from '@/components/cpfa/admin-ui';

export function MediaActions({
  id,
  storageKey,
  altText,
}: {
  id: string;
  storageKey: string;
  altText: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const confirm = useConfirm();
  const updateAlt = trpc.cms.media.updateAlt.useMutation();
  const del = trpc.cms.media.delete.useMutation();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(altText);
  const [copied, setCopied] = useState(false);

  async function copyKey() {
    await navigator.clipboard.writeText(storageKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function onSaveAlt() {
    try {
      await updateAlt.mutateAsync({ id, altText: draft });
      setEditing(false);
      router.refresh();
      toast('Description enregistrée.');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Erreur.', 'error');
    }
  }

  async function onDelete() {
    const fileName = storageKey.split('/').pop();
    const { confirmed } = await confirm({
      title: 'Supprimer ce média ?',
      message: `« ${fileName} » sera supprimé définitivement. Les pages qui l’utilisent ne l’afficheront plus.`,
      confirmLabel: 'Supprimer',
      danger: true,
    });
    if (!confirmed) return;
    try {
      await del.mutateAsync({ id });
      router.refresh();
      toast('Média supprimé.');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Erreur.', 'error');
    }
  }

  if (editing) {
    return (
      <div className="mt-2 space-y-1">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="w-full rounded-md border bg-background px-2 py-1 text-xs"
          placeholder="Description de l’image (accessibilité)"
        />
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onSaveAlt}
            disabled={updateAlt.isPending}
            className="rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground"
          >
            Enregistrer
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setDraft(altText);
            }}
            className="rounded-md border px-2 py-1 text-xs"
          >
            Annuler
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2 flex flex-wrap gap-1 text-xs">
      <button type="button" onClick={copyKey} className="rounded-md border px-2 py-1">
        {copied ? 'Copié' : 'Copier l’identifiant'}
      </button>
      <button type="button" onClick={() => setEditing(true)} className="rounded-md border px-2 py-1">
        Description
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={del.isPending}
        className="rounded-md border px-2 py-1 text-destructive"
      >
        Supprimer
      </button>
    </div>
  );
}
