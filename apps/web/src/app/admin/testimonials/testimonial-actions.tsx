'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@cpfa/ui';
import { trpc } from '@/lib/trpc';
import { useConfirm } from '@/components/cpfa/admin-ui';

const SCOPES = [
  { value: 'STUDENT', label: 'Étudiant' },
  { value: 'TEACHER', label: 'Enseignant' },
  { value: 'PROFESSIONAL', label: 'Professionnel' },
  { value: 'PARTNER', label: 'Partenaire' },
] as const;

type Initial = {
  scope: 'STUDENT' | 'TEACHER' | 'PROFESSIONAL' | 'PARTNER';
  authorName: string;
  authorRole: string;
  quote: string;
  locale: 'fr' | 'en';
  displayOrder: number;
};

export function TestimonialActions({
  id,
  published,
  initial,
}: {
  id: string;
  published: boolean;
  initial: Initial;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initial);
  const update = trpc.testimonials.update.useMutation({
    onSuccess: () => {
      setEditing(false);
      router.refresh();
    },
  });
  const toggle = trpc.testimonials.togglePublished.useMutation({
    onSuccess: () => router.refresh(),
  });
  const del = trpc.testimonials.delete.useMutation({
    onSuccess: () => router.refresh(),
  });

  if (editing) {
    return (
      <div className="col-span-full mt-2 flex w-full flex-col gap-2 rounded-md border bg-background p-3">
        <div className="grid gap-2 md:grid-cols-3">
          <select
            value={draft.scope}
            onChange={(e) =>
              setDraft({ ...draft, scope: e.target.value as Initial['scope'] })
            }
            className="rounded-md border bg-background px-2 py-1.5 text-sm"
          >
            {SCOPES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <input
            value={draft.authorName}
            onChange={(e) => setDraft({ ...draft, authorName: e.target.value })}
            className="rounded-md border bg-background px-2 py-1.5 text-sm"
          />
          <input
            value={draft.authorRole}
            onChange={(e) => setDraft({ ...draft, authorRole: e.target.value })}
            placeholder="Rôle (optionnel)"
            className="rounded-md border bg-background px-2 py-1.5 text-sm"
          />
        </div>
        <textarea
          value={draft.quote}
          onChange={(e) => setDraft({ ...draft, quote: e.target.value })}
          rows={3}
          className="rounded-md border bg-background px-2 py-1.5 text-sm"
        />
        <div className="flex items-center gap-2 text-xs">
          <label>
            Ordre d’affichage (1 = en premier) :{' '}
            <input
              type="number"
              min={0}
              value={draft.displayOrder}
              onChange={(e) =>
                setDraft({ ...draft, displayOrder: Number(e.target.value) })
              }
              className="w-16 rounded-md border bg-background px-2 py-1 text-sm"
            />
          </label>
        </div>
        {update.error ? (
          <p className="text-xs text-destructive">{update.error.message}</p>
        ) : null}
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() =>
              update.mutate({
                id,
                scope: draft.scope,
                authorName: draft.authorName,
                authorRole: draft.authorRole || undefined,
                quote: draft.quote,
                locale: draft.locale,
                displayOrder: draft.displayOrder,
              })
            }
            disabled={update.isPending}
          >
            {update.isPending ? '…' : 'Enregistrer'}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
            Annuler
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-1">
      <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
        Modifier
      </Button>
      <Button
        size="sm"
        variant={published ? 'ghost' : 'default'}
        onClick={() => toggle.mutate({ id, published: !published })}
        disabled={toggle.isPending}
      >
        {published ? 'Dépublier' : 'Publier'}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={async () => {
          const { confirmed } = await confirm({
            title: 'Supprimer ce témoignage ?',
            confirmLabel: 'Supprimer',
            danger: true,
          });
          if (confirmed) del.mutate({ id });
        }}
        disabled={del.isPending}
      >
        Supprimer
      </Button>
    </div>
  );
}
