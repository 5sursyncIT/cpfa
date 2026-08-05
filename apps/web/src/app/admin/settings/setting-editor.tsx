'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@cpfa/ui';
import { trpc } from '@/lib/trpc';
import { MediaPicker } from '@/components/cms/media-picker';
import { mediaUrl } from '@/lib/media';
import { useToast, useConfirm } from '@/components/cpfa/admin-ui';
import type { FieldSpec, SettingUi } from '@/lib/site-settings/ui';

// Friendly form editor for site settings. Renders inputs from the UI
// descriptor (lib/site-settings/ui.ts) so editors never touch raw JSON. The
// server re-validates against the registry schema on save, so anything the
// form lets through is still checked. A collapsible "advanced (JSON)" panel
// remains for power users / fields the descriptor doesn't cover.

type Props = {
  settingKey: string;
  locale: 'fr' | 'en';
  ui: SettingUi;
  initialValue: unknown;
  hasCustomisation: boolean;
};

type Obj = Record<string, unknown>;

function asObj(v: unknown): Obj {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Obj) : {};
}
function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}
function emptyItem(fields: FieldSpec[]): Obj {
  return Object.fromEntries(fields.map((f) => [f.name, '']));
}

export function SettingEditor({ settingKey, locale, ui, initialValue, hasCustomisation }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const confirm = useConfirm();

  // One state shape per form kind; we read the relevant one at save time.
  const [obj, setObj] = useState<Obj>(() => (ui.form === 'object' ? asObj(initialValue) : {}));
  const [strList, setStrList] = useState<string[]>(() =>
    ui.form === 'string-list' ? asArray(initialValue).map((x) => String(x ?? '')) : [],
  );
  const [objList, setObjList] = useState<Obj[]>(() =>
    ui.form === 'object-list' ? asArray(initialValue).map(asObj) : [],
  );

  const [dirty, setDirty] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [jsonDraft, setJsonDraft] = useState(() => JSON.stringify(initialValue, null, 2));
  // When set, the media picker is open and this callback receives the chosen key.
  const [pickTarget, setPickTarget] = useState<{ apply: (key: string) => void } | null>(null);

  const set = trpc.cms.settings.set.useMutation({
    onSuccess: () => {
      setDirty(false);
      router.refresh();
      toast('Paramètres enregistrés.');
    },
    onError: (e) => toast(e.message, 'error'),
  });
  const reset = trpc.cms.settings.reset.useMutation({
    onSuccess: () => {
      router.refresh();
      toast('Contenu réinitialisé.');
    },
    onError: (e) => toast(e.message, 'error'),
  });

  const jsonError = useMemo(() => {
    if (!showJson) return null;
    try {
      JSON.parse(jsonDraft);
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : String(e);
    }
  }, [showJson, jsonDraft]);

  function currentValue(): unknown {
    if (showJson) return JSON.parse(jsonDraft);
    if (ui.form === 'object') return obj;
    if (ui.form === 'string-list') return strList.map((s) => s.trim()).filter(Boolean);
    return objList;
  }

  async function save() {
    if (showJson && jsonError) return;
    await set.mutateAsync({ key: settingKey, locale, value: currentValue() });
  }

  async function onReset() {
    const { confirmed } = await confirm({
      title: 'Réinitialiser ce contenu ?',
      message:
        'La version personnalisée sera supprimée et le contenu reviendra à sa valeur par défaut.',
      confirmLabel: 'Réinitialiser',
      danger: true,
    });
    if (!confirmed) return;
    await reset.mutateAsync({ key: settingKey, locale });
  }

  // ── Field renderer (shared by object + object-list) ─────────────────────
  function renderField(spec: FieldSpec, value: unknown, onChange: (v: string) => void) {
    const str = value == null ? '' : String(value);
    const touchedChange = (v: string) => {
      onChange(v);
      setDirty(true);
    };

    if (spec.type === 'textarea') {
      return (
        <textarea
          value={str}
          rows={3}
          placeholder={spec.placeholder}
          onChange={(e) => touchedChange(e.target.value)}
          className="bg-background w-full rounded-md border px-3 py-2 text-sm"
        />
      );
    }
    if (spec.type === 'image' || spec.type === 'media') {
      const url = spec.type === 'image' ? mediaUrl(str) : null;
      return (
        <div className="space-y-2">
          {str && url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={url} alt="" className="max-h-28 rounded-md border object-contain" />
          ) : str ? (
            <p className="text-muted-foreground break-all font-mono text-xs">{str}</p>
          ) : (
            <p className="text-muted-foreground text-xs">Aucun média sélectionné.</p>
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setPickTarget({ apply: (key) => touchedChange(key) })}
            >
              {str ? 'Changer' : 'Choisir un média'}
            </Button>
            {str ? (
              <Button type="button" size="sm" variant="ghost" onClick={() => touchedChange('')}>
                Retirer
              </Button>
            ) : null}
          </div>
        </div>
      );
    }
    // `number` sert aux montants (tarifs d'abonnement) : clavier numérique sur
    // mobile, et le schéma du registre convertit la saisie en nombre.
    const inputType =
      spec.type === 'email'
        ? 'email'
        : spec.type === 'url'
          ? 'url'
          : spec.type === 'number'
            ? 'number'
            : 'text';
    return (
      <input
        type={inputType}
        inputMode={spec.type === 'number' ? 'numeric' : undefined}
        step={spec.type === 'number' ? 500 : undefined}
        min={spec.type === 'number' ? 0 : undefined}
        value={str}
        placeholder={spec.placeholder}
        onChange={(e) => touchedChange(e.target.value)}
        className="bg-background w-full rounded-md border px-3 py-2 text-sm"
      />
    );
  }

  // ── List helpers ────────────────────────────────────────────────────────
  function move<T>(list: T[], i: number, dir: -1 | 1): T[] {
    const j = i + dir;
    if (j < 0 || j >= list.length) return list;
    const copy = [...list];
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
    return copy;
  }

  return (
    <div className="space-y-4">
      {!showJson && ui.form === 'object' ? (
        <div className="grid gap-4 md:grid-cols-2">
          {ui.fields.map((f) => (
            <label
              key={f.name}
              className={'text-sm' + (f.type === 'textarea' ? ' md:col-span-2' : '')}
            >
              <span className="mb-1 block font-medium">
                {f.label}
                {f.optional ? <span className="text-muted-foreground"> (optionnel)</span> : null}
              </span>
              {renderField(f, obj[f.name], (v) => setObj((o) => ({ ...o, [f.name]: v })))}
            </label>
          ))}
        </div>
      ) : null}

      {!showJson && ui.form === 'string-list' ? (
        <div className="space-y-2">
          {strList.length === 0 ? (
            <p className="text-muted-foreground text-sm">Aucun élément.</p>
          ) : null}
          {strList.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={item}
                onChange={(e) => {
                  setStrList((l) => l.map((x, idx) => (idx === i ? e.target.value : x)));
                  setDirty(true);
                }}
                className="bg-background w-full rounded-md border px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => {
                  setStrList((l) => move(l, i, -1));
                  setDirty(true);
                }}
                className="text-muted-foreground hover:text-foreground px-2"
                aria-label="Monter"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => {
                  setStrList((l) => move(l, i, 1));
                  setDirty(true);
                }}
                className="text-muted-foreground hover:text-foreground px-2"
                aria-label="Descendre"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => {
                  setStrList((l) => l.filter((_, idx) => idx !== i));
                  setDirty(true);
                }}
                className="text-destructive px-2"
                aria-label="Supprimer"
              >
                ×
              </button>
            </div>
          ))}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setStrList((l) => [...l, '']);
              setDirty(true);
            }}
          >
            + {ui.itemLabel}
          </Button>
        </div>
      ) : null}

      {!showJson && ui.form === 'object-list' ? (
        <div className="space-y-3">
          {objList.length === 0 ? (
            <p className="text-muted-foreground text-sm">Aucun élément.</p>
          ) : null}
          {objList.map((item, i) => (
            <div key={i} className="bg-background rounded-md border p-3">
              <div className="text-muted-foreground mb-2 flex items-center justify-between text-xs">
                <span>
                  {ui.itemLabel} {i + 1}
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setObjList((l) => move(l, i, -1));
                      setDirty(true);
                    }}
                    className="px-2"
                    aria-label="Monter"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setObjList((l) => move(l, i, 1));
                      setDirty(true);
                    }}
                    className="px-2"
                    aria-label="Descendre"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setObjList((l) => l.filter((_, idx) => idx !== i));
                      setDirty(true);
                    }}
                    className="text-destructive px-2"
                    aria-label="Supprimer"
                  >
                    ×
                  </button>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {ui.fields.map((f) => (
                  <label
                    key={f.name}
                    className={'text-sm' + (f.type === 'textarea' ? ' md:col-span-2' : '')}
                  >
                    <span className="mb-1 block font-medium">
                      {f.label}
                      {f.optional ? (
                        <span className="text-muted-foreground"> (optionnel)</span>
                      ) : null}
                    </span>
                    {renderField(f, item[f.name], (v) =>
                      setObjList((l) =>
                        l.map((it, idx) => (idx === i ? { ...it, [f.name]: v } : it)),
                      ),
                    )}
                  </label>
                ))}
              </div>
            </div>
          ))}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setObjList((l) => [...l, emptyItem(ui.fields)]);
              setDirty(true);
            }}
          >
            + {ui.itemLabel}
          </Button>
        </div>
      ) : null}

      {showJson ? (
        <div className="space-y-2">
          <textarea
            value={jsonDraft}
            onChange={(e) => {
              setJsonDraft(e.target.value);
              setDirty(true);
            }}
            rows={Math.min(Math.max(jsonDraft.split('\n').length + 1, 8), 30)}
            spellCheck={false}
            className="bg-background w-full rounded-md border px-3 py-2 font-mono text-xs leading-relaxed"
          />
          {jsonError ? (
            <p className="text-destructive text-xs">JSON invalide : {jsonError}</p>
          ) : null}
        </div>
      ) : null}

      {set.isError ? <p className="text-destructive text-xs">{set.error.message}</p> : null}
      {reset.isError ? <p className="text-destructive text-xs">{reset.error.message}</p> : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={save} disabled={(showJson && Boolean(jsonError)) || set.isPending}>
          {set.isPending ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
        {hasCustomisation ? (
          <Button variant="ghost" onClick={onReset} disabled={reset.isPending}>
            {locale === 'fr' ? 'Restaurer la valeur par défaut' : 'Hériter du français'}
          </Button>
        ) : null}
        {dirty ? (
          <span className="text-xs text-amber-600">Modifications non enregistrées</span>
        ) : set.isSuccess ? (
          <span className="text-xs text-emerald-700">Enregistré.</span>
        ) : null}
        <button
          type="button"
          onClick={() => {
            // Sync the JSON draft with the current form state when opening it.
            if (!showJson) setJsonDraft(JSON.stringify(currentValue(), null, 2));
            setShowJson((s) => !s);
          }}
          className="text-muted-foreground ml-auto text-xs underline underline-offset-2"
        >
          {showJson ? '← Édition simplifiée' : 'Édition avancée (JSON)'}
        </button>
      </div>

      <MediaPicker
        open={pickTarget !== null}
        onClose={() => setPickTarget(null)}
        onPick={(m) => {
          pickTarget?.apply(m.storageKey);
          setPickTarget(null);
        }}
      />
    </div>
  );
}
