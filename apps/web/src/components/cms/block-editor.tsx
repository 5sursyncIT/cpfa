'use client';

import { useState } from 'react';
import { Button } from '@cpfa/ui';
import { mediaUrl } from '@/lib/media';
import { MediaPicker } from './media-picker';

export type Block =
  | { kind: 'heading'; level: 2 | 3 | 4; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'image'; storageKey: string; alt?: string; caption?: string }
  | { kind: 'quote'; text: string; cite?: string }
  | { kind: 'list'; ordered?: boolean; items: string[] };

export type BlockKind = Block['kind'];

const BLOCK_LABELS: Record<BlockKind, string> = {
  heading: 'Titre',
  paragraph: 'Paragraphe',
  image: 'Image',
  quote: 'Citation',
  list: 'Liste',
};

export function emptyBlock(kind: BlockKind): Block {
  switch (kind) {
    case 'heading':
      return { kind: 'heading', level: 2, text: '' };
    case 'paragraph':
      return { kind: 'paragraph', text: '' };
    case 'image':
      return { kind: 'image', storageKey: '' };
    case 'quote':
      return { kind: 'quote', text: '' };
    case 'list':
      return { kind: 'list', ordered: false, items: [''] };
  }
}

export function coerceBlocks(content: unknown): Block[] {
  if (!Array.isArray(content)) return [];
  return content
    .filter((b): b is Record<string, unknown> => typeof b === 'object' && b !== null)
    .map((b) => coerceBlock(b))
    .filter((b): b is Block => b !== null);
}

function coerceBlock(b: Record<string, unknown>): Block | null {
  switch (b.kind) {
    case 'heading': {
      const raw = Number(b.level);
      const level = (raw === 3 || raw === 4 ? raw : 2) as 2 | 3 | 4;
      return { kind: 'heading', level, text: String(b.text ?? '') };
    }
    case 'paragraph':
      return { kind: 'paragraph', text: String(b.text ?? '') };
    case 'image': {
      // Backwards-compat: old rows used `src` to store the storage key.
      const storageKey = String(b.storageKey ?? b.src ?? '');
      if (!storageKey) return null;
      return {
        kind: 'image',
        storageKey,
        alt: b.alt ? String(b.alt) : undefined,
        caption: b.caption ? String(b.caption) : undefined,
      };
    }
    case 'quote':
      return {
        kind: 'quote',
        text: String(b.text ?? ''),
        cite: b.cite ? String(b.cite) : undefined,
      };
    case 'list': {
      const items = Array.isArray(b.items) ? (b.items as unknown[]).map(String) : [];
      return { kind: 'list', ordered: Boolean(b.ordered), items };
    }
    default:
      return null;
  }
}

export function BlockEditor({
  blocks,
  onChange,
}: {
  blocks: Block[];
  onChange: (next: Block[]) => void;
}) {
  const [pickerFor, setPickerFor] = useState<number | null>(null);

  const update = (i: number, patch: Partial<Block>) =>
    onChange(blocks.map((b, idx) => (idx === i ? ({ ...b, ...patch } as Block) : b)));
  const remove = (i: number) => onChange(blocks.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const copy = [...blocks];
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
    onChange(copy);
  };
  const add = (block: Block) => onChange([...blocks, block]);
  // Insert a fresh block right after index `i` (i = -1 inserts at the top).
  const insertAfter = (i: number, kind: BlockKind) => {
    const copy = [...blocks];
    copy.splice(i + 1, 0, emptyBlock(kind));
    onChange(copy);
  };
  const duplicate = (i: number) => {
    const copy = [...blocks];
    copy.splice(i + 1, 0, structuredClone(blocks[i]!));
    onChange(copy);
  };

  return (
    <section className="rounded-lg border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Contenu</h2>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(BLOCK_LABELS) as BlockKind[]).map((kind) => (
            <Button key={kind} size="sm" variant="outline" onClick={() => add(emptyBlock(kind))}>
              + {BLOCK_LABELS[kind]}
            </Button>
          ))}
        </div>
      </div>

      {blocks.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun bloc. Ajoutez votre premier élément.</p>
      ) : (
        <ol className="space-y-4">
          {blocks.map((block, i) => (
            <li key={i} className="rounded-md border bg-background p-3">
              <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-medium">{BLOCK_LABELS[block.kind]}</span>
                <div className="flex gap-1">
                  <button onClick={() => move(i, -1)} className="px-2" aria-label="Monter">↑</button>
                  <button onClick={() => move(i, 1)} className="px-2" aria-label="Descendre">↓</button>
                  <button
                    onClick={() => remove(i)}
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
                  onChange={(e) => update(i, { text: e.target.value })}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              ) : block.kind === 'heading' ? (
                <div className="flex gap-2">
                  <select
                    value={block.level}
                    onChange={(e) => update(i, { level: Number(e.target.value) as 2 | 3 | 4 })}
                    className="rounded-md border bg-background px-2 py-2 text-sm"
                  >
                    <option value={2}>Grand titre</option>
                    <option value={3}>Sous-titre</option>
                    <option value={4}>Petit sous-titre</option>
                  </select>
                  <input
                    value={block.text}
                    onChange={(e) => update(i, { text: e.target.value })}
                    className="w-full rounded-md border bg-background px-3 py-2 text-base font-semibold"
                  />
                </div>
              ) : block.kind === 'image' ? (
                <div className="space-y-2">
                  {block.storageKey ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={mediaUrl(block.storageKey) ?? ''}
                      alt={block.alt ?? ''}
                      className="max-h-64 rounded-md border object-contain"
                    />
                  ) : (
                    <div className="flex aspect-video items-center justify-center rounded-md border bg-muted text-xs text-muted-foreground">
                      Aucune image sélectionnée
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setPickerFor(i)}>
                      {block.storageKey ? 'Changer' : 'Choisir un média'}
                    </Button>
                  </div>
                  <input
                    value={block.alt ?? ''}
                    onChange={(e) => update(i, { alt: e.target.value })}
                    placeholder="Description de l’image (pour l’accessibilité)"
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  />
                  <input
                    value={block.caption ?? ''}
                    onChange={(e) => update(i, { caption: e.target.value })}
                    placeholder="Légende (optionnelle)"
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  />
                </div>
              ) : block.kind === 'quote' ? (
                <div className="space-y-2">
                  <textarea
                    value={block.text}
                    rows={3}
                    onChange={(e) => update(i, { text: e.target.value })}
                    placeholder="Texte de la citation"
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm italic"
                  />
                  <input
                    value={block.cite ?? ''}
                    onChange={(e) => update(i, { cite: e.target.value })}
                    placeholder="Auteur / source (optionnel)"
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  />
                </div>
              ) : block.kind === 'list' ? (
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={Boolean(block.ordered)}
                      onChange={(e) => update(i, { ordered: e.target.checked })}
                    />
                    Liste numérotée
                  </label>
                  <ul className="space-y-1">
                    {block.items.map((item, j) => (
                      <li key={j} className="flex gap-2">
                        <input
                          value={item}
                          onChange={(e) => {
                            const items = [...block.items];
                            items[j] = e.target.value;
                            update(i, { items });
                          }}
                          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const items = block.items.filter((_, idx) => idx !== j);
                            update(i, { items });
                          }}
                          className="px-2 text-destructive"
                          aria-label="Retirer"
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => update(i, { items: [...block.items, ''] })}
                  >
                    + élément
                  </Button>
                </div>
              ) : null}

              <div className="mt-3 flex items-center gap-3 border-t pt-2 text-xs text-muted-foreground">
                <button
                  type="button"
                  onClick={() => duplicate(i)}
                  className="hover:text-foreground"
                >
                  Dupliquer
                </button>
                <label className="flex items-center gap-1">
                  Insérer en dessous
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) insertAfter(i, e.target.value as BlockKind);
                    }}
                    className="rounded-md border bg-background px-1 py-1"
                  >
                    <option value="">choisir…</option>
                    {(Object.keys(BLOCK_LABELS) as BlockKind[]).map((kind) => (
                      <option key={kind} value={kind}>
                        {BLOCK_LABELS[kind]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </li>
          ))}
        </ol>
      )}

      <MediaPicker
        open={pickerFor !== null}
        onClose={() => setPickerFor(null)}
        onPick={(m) => {
          if (pickerFor === null) return;
          update(pickerFor, { storageKey: m.storageKey, alt: m.altText ?? '' });
        }}
      />
    </section>
  );
}
