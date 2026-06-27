'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { trpc } from '@/lib/trpc';
import { MediaPicker } from '@/components/cms/media-picker';
import { useToast, useConfirm } from '@/components/cpfa/admin-ui';

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
  const { toast } = useToast();
  const confirm = useConfirm();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [noticePickerOpen, setNoticePickerOpen] = useState(false);

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
        toast('Concours créé.');
        router.push(`/admin/exams/${res.id}`);
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
      title: 'Supprimer ce concours ?',
      message: `« ${form.title} » sera retiré définitivement du site. Cette action est irréversible.`,
      confirmLabel: 'Supprimer',
      danger: true,
    });
    if (!confirmed) return;
    setError(null);
    try {
      await del.mutateAsync({ id: initial.id });
      toast('Concours supprimé.');
      router.push('/admin/exams');
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
            <label className="label" htmlFor="e-title">Titre *</label>
            <input
              id="e-title"
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
              <label className="label" htmlFor="e-slug">Adresse sur le site</label>
              <div className="row gap-1" style={{ alignItems: 'center' }}>
                <span className="fs-13 text-soft mono">/concours/</span>
                <input
                  id="e-slug"
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
            <label className="label">Avis de concours (PDF)</label>
            {form.noticeKey ? (
              <div className="row gap-2" style={{ alignItems: 'center' }}>
                <span className="pill">📄 {form.noticeKey.split('/').pop()}</span>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setNoticePickerOpen(true)}
                >
                  Remplacer
                </button>
                <button
                  type="button"
                  className="btn-link fs-13"
                  style={{ color: 'var(--danger)' }}
                  onClick={() => set('noticeKey', null)}
                >
                  Retirer
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setNoticePickerOpen(true)}
              >
                Choisir un fichier
              </button>
            )}
            <p className="fs-13 text-soft" style={{ marginTop: 4 }}>
              Choisissez le document dans la médiathèque, ou ajoutez-en un depuis la page Médias.
            </p>
            <MediaPicker
              open={noticePickerOpen}
              onClose={() => setNoticePickerOpen(false)}
              onPick={(m) => set('noticeKey', m.storageKey)}
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
