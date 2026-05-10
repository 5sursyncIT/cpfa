'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { trpc } from '@/lib/trpc';

const KIND_OPTIONS: Array<[string, string]> = [
  ['CONCOURS', 'Concours'],
  ['EXAM_BLANC', 'Examen blanc'],
  ['CERTIFICATION', 'Certification'],
];

type Initial = {
  id?: string;
  slug: string;
  kind: string;
  title: string;
  openAt: Date;
  closeAt: Date;
  examAt: Date | null;
  feeXof: number;
  description: string | null;
  noticeKey: string | null;
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

function toInputDate(d: Date | null): string {
  if (!d) return '';
  return d.toISOString().slice(0, 10);
}

export function ExamForm({ initial, mode }: { initial: Initial; mode: 'create' | 'edit' }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  const create = trpc.exams.adminCreate.useMutation();
  const update = trpc.exams.adminUpdate.useMutation();
  const del = trpc.exams.adminDelete.useMutation();
  const pending = create.isPending || update.isPending || del.isPending;

  function set<K extends keyof Initial>(key: K, value: Initial[K]) {
    setForm((s) => ({ ...s, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload = {
      slug: form.slug.trim(),
      kind: form.kind as 'CONCOURS',
      title: form.title.trim(),
      openAt: form.openAt,
      closeAt: form.closeAt,
      examAt: form.examAt ?? null,
      feeXof: Math.max(0, Number(form.feeXof) || 0),
      description: form.description?.trim() || null,
      noticeKey: form.noticeKey?.trim() || null,
      published: form.published,
    };
    try {
      if (mode === 'create') {
        const res = await create.mutateAsync(payload);
        router.push(`/admin/exams/${res.id}`);
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
    if (!window.confirm('Supprimer ce concours ?')) return;
    setError(null);
    try {
      await del.mutateAsync({ id: initial.id });
      router.push('/admin/exams');
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
              <label className="label" htmlFor="e-title">Titre *</label>
              <input
                id="e-title"
                className="input"
                value={form.title}
                onChange={(e) => {
                  set('title', e.target.value);
                  if (mode === 'create' && !form.slug) set('slug', slugify(e.target.value));
                }}
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="label" htmlFor="e-slug">Slug *</label>
              <input
                id="e-slug"
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
              <label className="label" htmlFor="e-kind">Type *</label>
              <select
                id="e-kind"
                className="select"
                value={form.kind}
                onChange={(e) => set('kind', e.target.value)}
              >
                {KIND_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label className="label" htmlFor="e-fee">Frais (FCFA)</label>
              <input
                id="e-fee"
                type="number"
                min={0}
                className="input"
                value={form.feeXof}
                onChange={(e) => set('feeXof', Number(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="panel" style={{ padding: 24 }}>
        <h4 style={{ marginBottom: 16 }}>Calendrier</h4>
        <div className="row gap-3">
          <div style={{ flex: 1 }}>
            <label className="label" htmlFor="e-open">Ouverture des candidatures *</label>
            <input
              id="e-open"
              type="date"
              className="input"
              value={toInputDate(form.openAt)}
              onChange={(e) => set('openAt', new Date(e.target.value))}
              required
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="label" htmlFor="e-close">Clôture *</label>
            <input
              id="e-close"
              type="date"
              className="input"
              value={toInputDate(form.closeAt)}
              onChange={(e) => set('closeAt', new Date(e.target.value))}
              required
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="label" htmlFor="e-exam">Date de l&apos;épreuve</label>
            <input
              id="e-exam"
              type="date"
              className="input"
              value={toInputDate(form.examAt)}
              onChange={(e) =>
                set('examAt', e.target.value ? new Date(e.target.value) : null)
              }
            />
          </div>
        </div>
      </div>

      <div className="panel" style={{ padding: 24 }}>
        <h4 style={{ marginBottom: 16 }}>Contenu</h4>
        <div className="col gap-3">
          <div>
            <label className="label" htmlFor="e-desc">Description</label>
            <textarea
              id="e-desc"
              className="textarea"
              rows={6}
              value={form.description ?? ''}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="e-notice">Avis de concours (clé storage PDF)</label>
            <input
              id="e-notice"
              className="input"
              value={form.noticeKey ?? ''}
              onChange={(e) => set('noticeKey', e.target.value)}
              placeholder="media/avis-concours-2026.pdf"
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
            <div className="fs-13 text-soft">Apparaît sur /concours quand publié.</div>
          </div>
        </label>
      </div>

      <div className="row gap-3" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="row gap-2">
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? 'Enregistrement…' : mode === 'create' ? 'Créer le concours' : 'Enregistrer'}
          </button>
          <Link href="/admin/exams" className="btn btn-ghost">Annuler</Link>
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
