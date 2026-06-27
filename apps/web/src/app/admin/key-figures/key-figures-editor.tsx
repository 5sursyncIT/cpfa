'use client';

import { useState } from 'react';
import { Button } from '@cpfa/ui';
import { trpc } from '@/lib/trpc';
import { useConfirm } from '@/components/cpfa/admin-ui';

type Row = { id: string; value: string; sup: string; label: string };

export function KeyFiguresEditor({
  section,
  locale,
}: {
  section: 'HOME' | 'ABOUT';
  locale: 'fr' | 'en';
}) {
  const confirm = useConfirm();
  const utils = trpc.useUtils();
  const list = trpc.keyFigures.list.useQuery({ section, locale });
  const refresh = () => utils.keyFigures.list.invalidate({ section, locale });

  const create = trpc.keyFigures.create.useMutation({ onSuccess: refresh });
  const update = trpc.keyFigures.update.useMutation({ onSuccess: refresh });
  const del = trpc.keyFigures.delete.useMutation({ onSuccess: refresh });
  const move = trpc.keyFigures.move.useMutation({ onSuccess: refresh });

  const [value, setValue] = useState('');
  const [sup, setSup] = useState('');
  const [label, setLabel] = useState('');

  const rows = list.data ?? [];

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun chiffre pour l’instant.</p>
        ) : null}
        {rows.map((r, i) => (
          <FigureRow
            key={r.id}
            row={r}
            isFirst={i === 0}
            isLast={i === rows.length - 1}
            onSave={(data) => update.mutate({ id: r.id, ...data })}
            onDelete={async () => {
              const { confirmed } = await confirm({
                title: 'Supprimer ce chiffre-clé ?',
                confirmLabel: 'Supprimer',
                danger: true,
              });
              if (confirmed) del.mutate({ id: r.id });
            }}
            onMove={(direction) => move.mutate({ id: r.id, direction })}
          />
        ))}
      </div>

      <div className="grid items-end gap-2 rounded-md border bg-background p-3 md:grid-cols-[1fr_1fr_2fr_auto]">
        <label className="text-sm">
          <span className="mb-1 block text-xs text-muted-foreground">Valeur</span>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="4 200"
            className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs text-muted-foreground">Exposant (optionnel)</span>
          <input
            value={sup}
            onChange={(e) => setSup(e.target.value)}
            placeholder="+"
            className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs text-muted-foreground">Libellé</span>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Diplômés actifs"
            className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
          />
        </label>
        <Button
          size="sm"
          disabled={!value || !label || create.isPending}
          onClick={() => {
            create.mutate(
              { section, locale, value, sup, label },
              {
                onSuccess: () => {
                  setValue('');
                  setSup('');
                  setLabel('');
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

function FigureRow({
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
  onSave: (data: { value: string; sup: string; label: string }) => void;
  onDelete: () => void;
  onMove: (direction: 'up' | 'down') => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(row.value);
  const [sup, setSup] = useState(row.sup);
  const [label, setLabel] = useState(row.label);

  if (editing) {
    return (
      <div className="grid items-end gap-2 rounded-md border bg-background p-3 md:grid-cols-[1fr_1fr_2fr_auto]">
        <input value={value} onChange={(e) => setValue(e.target.value)} className="rounded-md border bg-background px-2 py-1.5 text-sm" />
        <input value={sup} onChange={(e) => setSup(e.target.value)} className="rounded-md border bg-background px-2 py-1.5 text-sm" />
        <input value={label} onChange={(e) => setLabel(e.target.value)} className="rounded-md border bg-background px-2 py-1.5 text-sm" />
        <div className="flex gap-1">
          <Button size="sm" onClick={() => { onSave({ value, sup, label }); setEditing(false); }}>
            Enregistrer
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setValue(row.value); setSup(row.sup); setLabel(row.label); setEditing(false); }}>
            Annuler
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-md border bg-background p-3">
      <div className="flex-1">
        <span className="text-lg font-semibold">
          {row.value}
          {row.sup ? <sup className="ml-0.5 text-xs">{row.sup}</sup> : null}
        </span>
        <span className="ml-3 text-sm text-muted-foreground">{row.label}</span>
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
