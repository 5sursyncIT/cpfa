'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { trpc } from '@/lib/trpc';
import { CoverUploadField } from '../library/resources/cover-upload-field';

const KIND_OPTIONS: Array<[string, string]> = [
  ['DIPLOMANT', 'Diplômant'],
  ['CERTIFIANT', 'Certifiant'],
  ['CARTE', 'Sur mesure'],
  ['AUDITORAT', 'Auditorat'],
];
const LEVEL_OPTIONS: Array<[string, string]> = [
  ['INITIATION', 'Initiation'],
  ['INTERMEDIAIRE', 'Intermédiaire'],
  ['AVANCE', 'Avancé'],
];

type Initial = {
  id?: string;
  slug: string;
  title: string;
  kind: string;
  level: string;
  durationHours: number;
  priceXof: number;
  description: string | null;
  brochureKey: string | null;
  coverImageKey: string | null;
  published: boolean;
  applicationsOpenAt: Date | null;
  applicationsCloseAt: Date | null;
};

function slugify(s: string) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toInputDate(d: Date | null): string {
  if (!d) return '';
  return d.toISOString().slice(0, 10);
}

export function CourseForm({
  initial,
  mode,
}: {
  initial: Initial;
  mode: 'create' | 'edit';
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  const create = trpc.courses.adminCreate.useMutation();
  const update = trpc.courses.adminUpdate.useMutation();
  const del = trpc.courses.adminDelete.useMutation();
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
      kind: form.kind as 'DIPLOMANT',
      level: form.level as 'INITIATION',
      durationHours: Math.max(1, Number(form.durationHours) || 1),
      priceXof: Math.max(0, Number(form.priceXof) || 0),
      description: form.description?.trim() || null,
      brochureKey: form.brochureKey?.trim() || null,
      coverImageKey: form.coverImageKey?.trim() || null,
      published: form.published,
      applicationsOpenAt: form.applicationsOpenAt ?? null,
      applicationsCloseAt: form.applicationsCloseAt ?? null,
    };
    try {
      if (mode === 'create') {
        const res = await create.mutateAsync(payload);
        router.push(`/admin/courses/${res.id}/edit`);
      } else if (initial.id) {
        await update.mutateAsync({ id: initial.id, ...payload });
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue.');
    }
  }

  async function onDelete() {
    if (!initial.id) return;
    if (!window.confirm('Supprimer cette formation ?')) return;
    setError(null);
    try {
      await del.mutateAsync({ id: initial.id });
      router.push('/admin/courses');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue.');
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
          <div className="row gap-3">
            <div style={{ flex: 2 }}>
              <label className="label" htmlFor="c-title">Titre *</label>
              <input
                id="c-title"
                className="input"
                value={form.title}
                onChange={(e) => {
                  set('title', e.target.value);
                  if (mode === 'create' && !form.slug) {
                    set('slug', slugify(e.target.value));
                  }
                }}
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="label" htmlFor="c-slug">Slug *</label>
              <input
                id="c-slug"
                className="input mono"
                value={form.slug}
                onChange={(e) => set('slug', slugify(e.target.value))}
                required
                pattern="[a-z0-9-]+"
              />
            </div>
          </div>
          <div className="row gap-3">
            <div style={{ flex: 1 }}>
              <label className="label" htmlFor="c-kind">Type *</label>
              <select
                id="c-kind"
                className="select"
                value={form.kind}
                onChange={(e) => set('kind', e.target.value)}
              >
                {KIND_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label className="label" htmlFor="c-level">Niveau *</label>
              <select
                id="c-level"
                className="select"
                value={form.level}
                onChange={(e) => set('level', e.target.value)}
              >
                {LEVEL_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label className="label" htmlFor="c-duration">Durée (h)</label>
              <input
                id="c-duration"
                type="number"
                min={1}
                className="input"
                value={form.durationHours}
                onChange={(e) => set('durationHours', Number(e.target.value) || 1)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="label" htmlFor="c-price">Prix (FCFA)</label>
              <input
                id="c-price"
                type="number"
                min={0}
                className="input"
                value={form.priceXof}
                onChange={(e) => set('priceXof', Number(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="panel" style={{ padding: 24 }}>
        <h4 style={{ marginBottom: 16 }}>Contenu</h4>
        <div className="col gap-3">
          <CoverUploadField
            value={form.coverImageKey}
            onChange={(key) => set('coverImageKey', key)}
            altText={form.title}
            label="Image de la formation"
            helperText="JPG, PNG, WebP · 8 Mo max · format paysage recommandé pour les cartes."
            previewVariant="landscape"
          />
          <div>
            <label className="label" htmlFor="c-desc">Description</label>
            <textarea
              id="c-desc"
              className="textarea"
              rows={6}
              value={form.description ?? ''}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="c-brochure">Brochure (clé storage)</label>
            <input
              id="c-brochure"
              className="input"
              value={form.brochureKey ?? ''}
              onChange={(e) => set('brochureKey', e.target.value)}
              placeholder="media/brochure-dta.pdf (uploadez via /admin/media)"
            />
          </div>
        </div>
      </div>

      <div className="panel" style={{ padding: 24 }}>
        <h4 style={{ marginBottom: 16 }}>Fenêtre d&apos;inscription</h4>
        <p className="fs-13 text-soft" style={{ marginBottom: 12 }}>
          Vide = toujours ouvert. Pour les diplômantes (DTA, BTS), gate via les dates de concours.
        </p>
        <div className="row gap-3">
          <div style={{ flex: 1 }}>
            <label className="label" htmlFor="c-open">Ouvre le</label>
            <input
              id="c-open"
              type="date"
              className="input"
              value={toInputDate(form.applicationsOpenAt)}
              onChange={(e) =>
                set('applicationsOpenAt', e.target.value ? new Date(e.target.value) : null)
              }
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="label" htmlFor="c-close">Ferme le</label>
            <input
              id="c-close"
              type="date"
              className="input"
              value={toInputDate(form.applicationsCloseAt)}
              onChange={(e) =>
                set('applicationsCloseAt', e.target.value ? new Date(e.target.value) : null)
              }
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
            <div className="fs-13 text-soft">
              Si décochée, la formation reste invisible sur /formations.
            </div>
          </div>
        </label>
      </div>

      <div className="row gap-3" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="row gap-2">
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? 'Enregistrement…' : mode === 'create' ? 'Créer la formation' : 'Enregistrer'}
          </button>
          <Link href="/admin/courses" className="btn btn-ghost">Annuler</Link>
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
