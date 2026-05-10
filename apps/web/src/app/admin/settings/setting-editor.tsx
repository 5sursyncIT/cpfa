'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@cpfa/ui';
import { trpc } from '@/lib/trpc';

// Generic structured-JSON editor. The registry already enforces a zod schema
// server-side; the client just round-trips between text and JSON. We use
// JSON for arrays (testimonials, governance, stats, partners) — adding
// per-shape WYSIWYG editors would multiply the surface for marginal benefit
// since editors of this site are technical operators, not end users. For
// `object` settings (hero, footer.contact) the field-by-field form below is
// kept simple.

type Props = {
  settingKey: string;
  locale: 'fr' | 'en';
  kind: 'object' | 'array';
  initialValue: unknown;
  hasCustomisation: boolean;
};

export function SettingEditor({
  settingKey,
  locale,
  kind,
  initialValue,
  hasCustomisation,
}: Props) {
  const router = useRouter();
  const [draft, setDraft] = useState(() => JSON.stringify(initialValue, null, 2));
  const set = trpc.cms.settings.set.useMutation({
    onSuccess: () => router.refresh(),
  });
  const reset = trpc.cms.settings.reset.useMutation({
    onSuccess: () => router.refresh(),
  });

  const parseError = useMemo(() => {
    try {
      JSON.parse(draft);
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : String(e);
    }
  }, [draft]);

  async function save() {
    if (parseError) return;
    const value = JSON.parse(draft);
    await set.mutateAsync({ key: settingKey, locale, value });
  }

  async function onReset() {
    if (!confirm('Supprimer la version localisée ? La page repassera sur la valeur héritée.')) {
      return;
    }
    await reset.mutateAsync({ key: settingKey, locale });
  }

  const lines = Math.min(Math.max(draft.split('\n').length + 1, 8), 30);

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        {kind === 'array'
          ? 'Tableau d’objets — éditez en JSON. La structure est vérifiée à l’enregistrement.'
          : 'Objet — éditez en JSON. Les champs requis sont vérifiés à l’enregistrement.'}
      </p>

      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={lines}
        spellCheck={false}
        className="w-full rounded-md border bg-background px-3 py-2 font-mono text-xs leading-relaxed"
      />

      {parseError ? (
        <p className="text-xs text-destructive">JSON invalide : {parseError}</p>
      ) : null}

      {set.isError ? (
        <p className="text-xs text-destructive">{set.error.message}</p>
      ) : null}
      {reset.isError ? (
        <p className="text-xs text-destructive">{reset.error.message}</p>
      ) : null}

      <div className="flex items-center gap-2">
        <Button onClick={save} disabled={Boolean(parseError) || set.isPending}>
          {set.isPending ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
        {hasCustomisation ? (
          <Button variant="ghost" onClick={onReset} disabled={reset.isPending}>
            {locale === 'fr' ? 'Restaurer la valeur par défaut' : 'Hériter du français'}
          </Button>
        ) : null}
        {set.isSuccess ? <span className="text-xs text-emerald-700">Enregistré.</span> : null}
      </div>
    </div>
  );
}
