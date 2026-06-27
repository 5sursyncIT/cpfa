'use client';

import { useState } from 'react';
import { Button } from '@cpfa/ui';
import { trpc } from '@/lib/trpc';
import { MediaPicker } from '@/components/cms/media-picker';
import { mediaUrl } from '@/lib/media';
import { useConfirm } from '@/components/cpfa/admin-ui';

type Row = { id: string; name: string; logoKey: string | null; url: string | null };

export function PartnersEditor({ locale }: { locale: 'fr' | 'en' }) {
  const confirm = useConfirm();
  const utils = trpc.useUtils();
  const list = trpc.partners.list.useQuery({ locale });
  const refresh = () => utils.partners.list.invalidate({ locale });

  const create = trpc.partners.create.useMutation({ onSuccess: refresh });
  const update = trpc.partners.update.useMutation({ onSuccess: refresh });
  const del = trpc.partners.delete.useMutation({ onSuccess: refresh });
  const move = trpc.partners.move.useMutation({ onSuccess: refresh });

  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [logoKey, setLogoKey] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const rows = list.data ?? [];

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun partenaire pour l’instant.</p>
        ) : null}
        {rows.map((r, i) => (
          <PartnerRow
            key={r.id}
            row={r}
            isFirst={i === 0}
            isLast={i === rows.length - 1}
            onSave={(data) => update.mutate({ id: r.id, ...data })}
            onDelete={async () => {
              const { confirmed } = await confirm({
                title: 'Supprimer ce partenaire ?',
                confirmLabel: 'Supprimer',
                danger: true,
              });
              if (confirmed) del.mutate({ id: r.id });
            }}
            onMove={(direction) => move.mutate({ id: r.id, direction })}
          />
        ))}
      </div>

      <div className="space-y-2 rounded-md border bg-background p-3">
        <div className="grid gap-2 md:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block text-xs text-muted-foreground">Nom</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="IIA Yaoundé"
              className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs text-muted-foreground">Lien (optionnel)</span>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
            />
          </label>
        </div>
        <div className="flex items-center gap-2">
          {logoKey ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={mediaUrl(logoKey) ?? ''} alt="" className="h-8 rounded border object-contain" />
          ) : (
            <span className="text-xs text-muted-foreground">Aucun logo</span>
          )}
          <Button size="sm" variant="outline" onClick={() => setPickerOpen(true)}>
            {logoKey ? 'Changer le logo' : 'Choisir un logo'}
          </Button>
          {logoKey ? (
            <Button size="sm" variant="ghost" onClick={() => setLogoKey(null)}>Retirer</Button>
          ) : null}
          <Button
            size="sm"
            className="ml-auto"
            disabled={!name || create.isPending}
            onClick={() => {
              create.mutate(
                { locale, name, url, logoKey },
                {
                  onSuccess: () => {
                    setName('');
                    setUrl('');
                    setLogoKey(null);
                  },
                },
              );
            }}
          >
            + Ajouter
          </Button>
        </div>
      </div>

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(m) => setLogoKey(m.storageKey)}
      />
    </div>
  );
}

function PartnerRow({
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
  onSave: (data: { name: string; url: string; logoKey: string | null }) => void;
  onDelete: () => void;
  onMove: (direction: 'up' | 'down') => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(row.name);
  const [url, setUrl] = useState(row.url ?? '');
  const [logoKey, setLogoKey] = useState<string | null>(row.logoKey);
  const [pickerOpen, setPickerOpen] = useState(false);

  if (editing) {
    return (
      <div className="space-y-2 rounded-md border bg-background p-3">
        <div className="grid gap-2 md:grid-cols-2">
          <input value={name} onChange={(e) => setName(e.target.value)} className="rounded-md border bg-background px-2 py-1.5 text-sm" />
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className="rounded-md border bg-background px-2 py-1.5 text-sm" />
        </div>
        <div className="flex items-center gap-2">
          {logoKey ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={mediaUrl(logoKey) ?? ''} alt="" className="h-8 rounded border object-contain" />
          ) : (
            <span className="text-xs text-muted-foreground">Aucun logo</span>
          )}
          <Button size="sm" variant="outline" onClick={() => setPickerOpen(true)}>
            {logoKey ? 'Changer' : 'Logo'}
          </Button>
          {logoKey ? <Button size="sm" variant="ghost" onClick={() => setLogoKey(null)}>Retirer</Button> : null}
          <div className="ml-auto flex gap-1">
            <Button size="sm" onClick={() => { onSave({ name, url, logoKey }); setEditing(false); }}>Enregistrer</Button>
            <Button size="sm" variant="ghost" onClick={() => { setName(row.name); setUrl(row.url ?? ''); setLogoKey(row.logoKey); setEditing(false); }}>Annuler</Button>
          </div>
        </div>
        <MediaPicker open={pickerOpen} onClose={() => setPickerOpen(false)} onPick={(m) => setLogoKey(m.storageKey)} />
      </div>
    );
  }

  const logo = mediaUrl(row.logoKey);
  return (
    <div className="flex items-center gap-3 rounded-md border bg-background p-3">
      {logo ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={logo} alt="" className="h-8 w-20 rounded border object-contain" />
      ) : null}
      <div className="flex-1">
        <span className="font-medium">{row.name}</span>
        {row.url ? <span className="ml-2 text-xs text-muted-foreground">{row.url}</span> : null}
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
