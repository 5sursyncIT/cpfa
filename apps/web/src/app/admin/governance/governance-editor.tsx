'use client';

import { useState } from 'react';
import { Button } from '@cpfa/ui';
import { trpc } from '@/lib/trpc';
import { useConfirm } from '@/components/cpfa/admin-ui';

type Row = { id: string; role: string; name: string; note: string | null };

export function GovernanceEditor({ locale }: { locale: 'fr' | 'en' }) {
  const confirm = useConfirm();
  const utils = trpc.useUtils();
  const list = trpc.governance.list.useQuery({ locale });
  const refresh = () => utils.governance.list.invalidate({ locale });

  const create = trpc.governance.create.useMutation({ onSuccess: refresh });
  const update = trpc.governance.update.useMutation({ onSuccess: refresh });
  const del = trpc.governance.delete.useMutation({ onSuccess: refresh });
  const move = trpc.governance.move.useMutation({ onSuccess: refresh });

  const [role, setRole] = useState('');
  const [name, setName] = useState('');
  const [note, setNote] = useState('');

  const rows = list.data ?? [];

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun membre pour l’instant.</p>
        ) : null}
        {rows.map((r, i) => (
          <MemberRow
            key={r.id}
            row={r}
            isFirst={i === 0}
            isLast={i === rows.length - 1}
            onSave={(data) => update.mutate({ id: r.id, ...data })}
            onDelete={async () => {
              const { confirmed } = await confirm({
                title: 'Supprimer ce membre ?',
                confirmLabel: 'Supprimer',
                danger: true,
              });
              if (confirmed) del.mutate({ id: r.id });
            }}
            onMove={(direction) => move.mutate({ id: r.id, direction })}
          />
        ))}
      </div>

      <div className="grid items-end gap-2 rounded-md border bg-background p-3 md:grid-cols-[1fr_1fr_1fr_auto]">
        <label className="text-sm">
          <span className="mb-1 block text-xs text-muted-foreground">Fonction</span>
          <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Direction générale" className="w-full rounded-md border bg-background px-2 py-1.5 text-sm" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs text-muted-foreground">Nom</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-md border bg-background px-2 py-1.5 text-sm" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs text-muted-foreground">Note (optionnel)</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} className="w-full rounded-md border bg-background px-2 py-1.5 text-sm" />
        </label>
        <Button
          size="sm"
          disabled={!role || !name || create.isPending}
          onClick={() => {
            create.mutate(
              { locale, role, name, note },
              {
                onSuccess: () => {
                  setRole('');
                  setName('');
                  setNote('');
                },
              },
            );
          }}
        >
          + Ajouter
        </Button>
      </div>
    </div>
  );
}

function MemberRow({
  row,
  isFirst,
  isLast,
  onSave,
  onDelete,
  onMove,
}: {
  row: Row;
  isFirst: boolean;
  isLast: boolean;
  onSave: (data: { role: string; name: string; note: string }) => void;
  onDelete: () => void;
  onMove: (direction: 'up' | 'down') => void;
}) {
  const [editing, setEditing] = useState(false);
  const [role, setRole] = useState(row.role);
  const [name, setName] = useState(row.name);
  const [note, setNote] = useState(row.note ?? '');

  if (editing) {
    return (
      <div className="grid items-end gap-2 rounded-md border bg-background p-3 md:grid-cols-[1fr_1fr_1fr_auto]">
        <input value={role} onChange={(e) => setRole(e.target.value)} className="rounded-md border bg-background px-2 py-1.5 text-sm" />
        <input value={name} onChange={(e) => setName(e.target.value)} className="rounded-md border bg-background px-2 py-1.5 text-sm" />
        <input value={note} onChange={(e) => setNote(e.target.value)} className="rounded-md border bg-background px-2 py-1.5 text-sm" />
        <div className="flex gap-1">
          <Button size="sm" onClick={() => { onSave({ role, name, note }); setEditing(false); }}>Enregistrer</Button>
          <Button size="sm" variant="ghost" onClick={() => { setRole(row.role); setName(row.name); setNote(row.note ?? ''); setEditing(false); }}>Annuler</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-md border bg-background p-3">
      <div className="flex-1">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{row.role}</div>
        <div className="font-medium">{row.name}</div>
        {row.note ? <div className="text-sm text-muted-foreground">{row.note}</div> : null}
      </div>
      <div className="flex items-center gap-1 text-xs">
        <button type="button" disabled={isFirst} onClick={() => onMove('up')} className="px-1.5 disabled:opacity-30" aria-label="Monter">↑</button>
        <button type="button" disabled={isLast} onClick={() => onMove('down')} className="px-1.5 disabled:opacity-30" aria-label="Descendre">↓</button>
        <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Modifier</Button>
        <Button size="sm" variant="ghost" onClick={onDelete}>Supprimer</Button>
      </div>
    </div>
  );
}
