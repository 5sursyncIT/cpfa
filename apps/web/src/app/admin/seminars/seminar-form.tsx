'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { trpc } from '@/lib/trpc';
import { MediaPicker } from '@/components/cms/media-picker';
import { useToast, useConfirm } from '@/components/cpfa/admin-ui';

type Initial = {
  id?: string;
  slug: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  location: string | null;
  priceXof: number;
  capacity: number;
  description: string | null;
  brochureKey: string | null;
  published: boolean;
};

function slugify(s: string) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toInputDateTime(d: Date | null): string {
  if (!d) return '';
  const offset = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
}

export function SeminarForm({
  initial,
  mode,
}: {
  initial: Initial;
  mode: 'create' | 'edit';
}) {
  const router = useRouter();
  const { toast } = useToast();
  const confirm = useConfirm();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [brochurePickerOpen, setBrochurePickerOpen] = useState(false);

  const create = trpc.seminars.adminCreate.useMutation();
  const update = trpc.seminars.adminUpdate.useMutation();
  const del = trpc.seminars.adminDelete.useMutation();
  const pending = create.isPending || update.isPending || del.isPending;

  function set<K extends keyof Initial>(key: K, value: Initial[K]) {
    setForm((s) => ({ ...s, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload = {
      slug: form.slug.trim(),
      title: form.title.trim(),
      startsAt: form.startsAt,
      endsAt: form.endsAt,
      location: form.location?.trim() || null,
      priceXof: Math.max(0, Number(form.priceXof) || 0),
      capacity: Math.max(0, Number(form.capacity) || 0),
      description: form.description?.trim() || null,
      brochureKey: form.brochureKey?.trim() || null,
      published: form.published,
    };
    try {
      if (mode === 'create') {
        const res = await create.mutateAsync(payload);
        toast('Séminaire créé.');
        router.push(`/admin/seminars/${res.id}/edit`);
      } else if (initial.id) {
        await update.mutateAsync({ id: initial.id, ...payload });
        toast('Modifications enregistrées.');
        router.refresh();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue.';
      setError(msg);
      toast(msg, 'error');
    }
  }

  async function onDelete() {
    if (!initial.id) return;
    const { confirmed } = await confirm({
      title: 'Supprimer ce séminaire ?',
      message: `« ${form.title} » sera retiré définitivement du site. Cette action est irréversible.`,
      confirmLabel: 'Supprimer',
      danger: true,
    });
    if (!confirmed) return;
    setError(null);
    try {
      await del.mutateAsync({ id: initial.id });
      toast('Séminaire supprimé.');
      router.push('/admin/seminars');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue.';
      setError(msg);
      toast(msg, 'error');
    }
  }

  return (
    <form onSubmit={onSubmit} className="col gap-5">
      {error ? (
        <div
          role="alert"
          className="card"
          style={{ borderColor: 'var(--danger)', color: 'var(--danger)', padding: 16 }}
        >
          {error}
        </div>
      ) : null}

      <div className="panel" style={{ padding: 24 }}>
        <h4 style={{ marginBottom: 16 }}>Identité</h4>
        <div className="col gap-3">
          <div>
            <label className="label" htmlFor="s-title">Titre *</label>
            <input
              id="s-title"
              className="input"
              value={form.title}
              onChange={(e) => {
                set('title', e.target.value);
                if (mode === 'create') set('slug', slugify(e.target.value));
              }}
              required
            />
          </div>
          <details>
            <summary style={{ cursor: 'pointer', fontSize: 13, color: 'var(--text-soft, #64748b)' }}>
              Adresse de la page (avancé)
            </summary>
            <div style={{ marginTop: 8 }}>
              <label className="label" htmlFor="s-slug">Adresse sur le site</label>
              <div className="row gap-1" style={{ alignItems: 'center' }}>
                <span className="fs-13 text-soft mono">/seminaires/</span>
                <input
                  id="s-slug"
                  className="input mono"
                  value={form.slug}
                  onChange={(e) => set('slug', slugify(e.target.value))}
                  required
                  style={{ flex: 1 }}
                />
              </div>
              <p className="fs-13 text-soft" style={{ marginTop: 4 }}>
                Générée automatiquement depuis le titre. Ne la modifiez que si nécessaire.
              </p>
            </div>
          </details>
          <div className="row gap-3">
            <div style={{ flex: 1 }}>
              <label className="label" htmlFor="s-location">Lieu</label>
              <input
                id="s-location"
                className="input"
                value={form.location ?? ''}
                onChange={(e) => set('location', e.target.value)}
                placeholder="Salle, ville…"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="label" htmlFor="s-price">Prix (FCFA)</label>
              <input
                id="s-price"
                type="number"
                min={0}
                className="input"
                value={form.priceXof}
                onChange={(e) => set('priceXof', Number(e.target.value) || 0)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="label" htmlFor="s-cap">Capacité</label>
              <input
                id="s-cap"
                type="number"
                min={0}
                className="input"
                value={form.capacity}
                onChange={(e) => set('capacity', Number(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="panel" style={{ padding: 24 }}>
        <h4 style={{ marginBottom: 16 }}>Calendrier</h4>
        <div className="row gap-3">
          <div style={{ flex: 1 }}>
            <label className="label" htmlFor="s-start">Début *</label>
            <input
              id="s-start"
              type="datetime-local"
              className="input"
              value={toInputDateTime(form.startsAt)}
              onChange={(e) => set('startsAt', new Date(e.target.value))}
              required
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="label" htmlFor="s-end">Fin *</label>
            <input
              id="s-end"
              type="datetime-local"
              className="input"
              value={toInputDateTime(form.endsAt)}
              onChange={(e) => set('endsAt', new Date(e.target.value))}
              required
            />
          </div>
        </div>
      </div>

      <div className="panel" style={{ padding: 24 }}>
        <h4 style={{ marginBottom: 16 }}>Contenu</h4>
        <div className="col gap-3">
          <div>
            <label className="label" htmlFor="s-desc">Description</label>
            <textarea
              id="s-desc"
              className="textarea"
              rows={6}
              value={form.description ?? ''}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Brochure (PDF)</label>
            {form.brochureKey ? (
              <div className="row gap-2" style={{ alignItems: 'center' }}>
                <span className="pill">📄 {form.brochureKey.split('/').pop()}</span>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setBrochurePickerOpen(true)}
                >
                  Remplacer
                </button>
                <button
                  type="button"
                  className="btn-link fs-13"
                  style={{ color: 'var(--danger)' }}
                  onClick={() => set('brochureKey', null)}
                >
                  Retirer
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setBrochurePickerOpen(true)}
              >
                Choisir un fichier
              </button>
            )}
            <p className="fs-13 text-soft" style={{ marginTop: 4 }}>
              Choisissez un document dans la médiathèque, ou ajoutez-en un depuis la page Médias.
            </p>
            <MediaPicker
              open={brochurePickerOpen}
              onClose={() => setBrochurePickerOpen(false)}
              onPick={(m) => set('brochureKey', m.storageKey)}
            />
          </div>
        </div>
      </div>

      <div className="panel" style={{ padding: 24 }}>
        <label className="row gap-3" style={{ alignItems: 'center', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => set('published', e.target.checked)}
          />
          <div>
            <div style={{ fontWeight: 500 }}>Publier sur le site public</div>
            <div className="fs-13 text-soft">Apparaît sur /seminaires quand publié.</div>
          </div>
        </label>
      </div>

      <div className="row gap-3" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="row gap-2">
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? 'Enregistrement…' : mode === 'create' ? 'Créer le séminaire' : 'Enregistrer'}
          </button>
          <Link href="/admin/seminars" className="btn btn-ghost">Annuler</Link>
        </div>
        {mode === 'edit' ? (
          <button
            type="button"
            onClick={onDelete}
            className="btn btn-ghost btn-sm"
            style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
            disabled={pending}
          >
            Supprimer
          </button>
        ) : null}
      </div>
    </form>
  );
}
