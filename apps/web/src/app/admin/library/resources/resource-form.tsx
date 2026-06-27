'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { trpc } from '@/lib/trpc';
import { useToast, useConfirm } from '@/components/cpfa/admin-ui';
import { CoverUploadField } from './cover-upload-field';

type Category = { id: string; name: string };

type Initial = {
  id?: string;
  kind: string;
  title: string;
  subtitle: string | null;
  authors: string[];
  cote: string | null;
  isbn: string | null;
  publisher: string | null;
  publishedYear: number | null;
  language: string;
  summary: string | null;
  coverKey: string | null;
  totalCopies: number;
  keywords: string[];
  categoryId: string | null;
};

const KIND_OPTIONS: Array<[string, string]> = [
  ['BOOK', 'Livre'],
  ['JOURNAL', 'Revue'],
  ['THESIS', 'Mémoire / Thèse'],
  ['AUDIO', 'Audio'],
  ['VIDEO', 'Vidéo'],
  ['DIGITAL', 'Document numérique'],
  ['OTHER', 'Autre'],
];

export function ResourceForm({
  initial,
  categories,
  mode,
}: {
  initial: Initial;
  categories: Category[];
  mode: 'create' | 'edit';
}) {
  const router = useRouter();
  const { toast } = useToast();
  const confirm = useConfirm();
  const [form, setForm] = useState(initial);
  const [authorsRaw, setAuthorsRaw] = useState(initial.authors.join(', '));
  const [keywordsRaw, setKeywordsRaw] = useState(initial.keywords.join(', '));
  const [error, setError] = useState<string | null>(null);

  const create = trpc.library.adminCreate.useMutation();
  const update = trpc.library.adminUpdate.useMutation();
  const del = trpc.library.adminDelete.useMutation();

  const pending = create.isPending || update.isPending || del.isPending;

  function set<K extends keyof Initial>(key: K, value: Initial[K]) {
    setForm((s) => ({ ...s, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload = {
      kind: form.kind as 'BOOK',
      title: form.title.trim(),
      subtitle: form.subtitle?.trim() || null,
      authors: authorsRaw.split(',').map((s) => s.trim()).filter(Boolean),
      cote: form.cote?.trim() || null,
      isbn: form.isbn?.trim() || null,
      publisher: form.publisher?.trim() || null,
      publishedYear: form.publishedYear || null,
      language: form.language || 'fr',
      summary: form.summary?.trim() || null,
      coverKey: form.coverKey?.trim() || null,
      totalCopies: Math.max(1, Number(form.totalCopies) || 1),
      keywords: keywordsRaw.split(',').map((s) => s.trim()).filter(Boolean),
      categoryId: form.categoryId || null,
    };
    try {
      if (mode === 'create') {
        const res = await create.mutateAsync(payload);
        toast('Ressource créée.');
        router.push(`/admin/library/resources/${res.id}/edit`);
      } else if (initial.id) {
        await update.mutateAsync({ id: initial.id, ...payload });
        toast('Modifications enregistrées.');
        router.refresh();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue.');
    }
  }

  async function onDelete() {
    if (!initial.id) return;
    const { confirmed } = await confirm({
      title: 'Supprimer cette ressource ?',
      message: `« ${form.title} » sera retirée définitivement du catalogue. Cette action est irréversible.`,
      confirmLabel: 'Supprimer',
      danger: true,
    });
    if (!confirmed) return;
    setError(null);
    try {
      await del.mutateAsync({ id: initial.id });
      toast('Ressource supprimée.');
      router.push('/admin/library/resources');
    } catch (err: unknown) {
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
            <label className="label" htmlFor="r-title">Titre *</label>
            <input
              id="r-title"
              className="input"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="r-subtitle">Sous-titre</label>
            <input
              id="r-subtitle"
              className="input"
              value={form.subtitle ?? ''}
              onChange={(e) => set('subtitle', e.target.value)}
            />
          </div>
          <div className="row gap-3">
            <div style={{ flex: 1 }}>
              <label className="label" htmlFor="r-kind">Type *</label>
              <select
                id="r-kind"
                className="select"
                value={form.kind}
                onChange={(e) => set('kind', e.target.value)}
              >
                {KIND_OPTIONS.map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label className="label" htmlFor="r-language">Langue</label>
              <input
                id="r-language"
                className="input"
                value={form.language}
                onChange={(e) => set('language', e.target.value)}
                placeholder="fr"
                maxLength={8}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="label" htmlFor="r-cat">Catégorie</label>
              <select
                id="r-cat"
                className="select"
                value={form.categoryId ?? ''}
                onChange={(e) => set('categoryId', e.target.value || null)}
              >
                <option value="">— Aucune —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label" htmlFor="r-authors">Auteurs (séparés par virgule)</label>
            <input
              id="r-authors"
              className="input"
              value={authorsRaw}
              onChange={(e) => setAuthorsRaw(e.target.value)}
              placeholder="Mamadou Sow, Fatou Ndiaye"
            />
          </div>
          <div className="row gap-3">
            <div style={{ flex: 2 }}>
              <label className="label" htmlFor="r-publisher">Éditeur</label>
              <input
                id="r-publisher"
                className="input"
                value={form.publisher ?? ''}
                onChange={(e) => set('publisher', e.target.value)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="label" htmlFor="r-year">Année</label>
              <input
                id="r-year"
                className="input"
                type="number"
                min={1500}
                max={3000}
                value={form.publishedYear ?? ''}
                onChange={(e) =>
                  set('publishedYear', e.target.value ? Number(e.target.value) : null)
                }
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="label" htmlFor="r-cote">Cote</label>
              <input
                id="r-cote"
                className="input mono"
                value={form.cote ?? ''}
                onChange={(e) => set('cote', e.target.value)}
                placeholder="OUG 9.1"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="label" htmlFor="r-isbn">ISBN</label>
              <input
                id="r-isbn"
                className="input"
                value={form.isbn ?? ''}
                onChange={(e) => set('isbn', e.target.value)}
                placeholder="9782001020304"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="panel" style={{ padding: 24 }}>
        <h4 style={{ marginBottom: 16 }}>Contenu</h4>
        <div className="col gap-3">
          <div>
            <label className="label" htmlFor="r-summary">Résumé</label>
            <textarea
              id="r-summary"
              className="textarea"
              rows={5}
              value={form.summary ?? ''}
              onChange={(e) => set('summary', e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="r-keywords">Mots-clés (séparés par virgule)</label>
            <input
              id="r-keywords"
              className="input"
              value={keywordsRaw}
              onChange={(e) => setKeywordsRaw(e.target.value)}
              placeholder="assurance, CIMA, risk management"
            />
          </div>
          <CoverUploadField
            value={form.coverKey}
            onChange={(key) => set('coverKey', key)}
            altText={form.title}
          />
        </div>
      </div>

      <div className="panel" style={{ padding: 24 }}>
        <h4 style={{ marginBottom: 16 }}>Exemplaires</h4>
        <div>
          <label className="label" htmlFor="r-copies">Nombre d&apos;exemplaires</label>
          <input
            id="r-copies"
            className="input"
            type="number"
            min={1}
            max={9999}
            value={form.totalCopies}
            onChange={(e) => set('totalCopies', Number(e.target.value) || 1)}
            style={{ maxWidth: 120 }}
          />
          <p className="fs-13 text-soft" style={{ marginTop: 4 }}>
            Compteur global. Pour les exemplaires individuels traçables, voir TODO dans le schéma.
          </p>
        </div>
      </div>

      <div className="row gap-3" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="row gap-2">
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? 'Enregistrement…' : mode === 'create' ? 'Créer la ressource' : 'Enregistrer'}
          </button>
          <Link href="/admin/library/resources" className="btn btn-ghost">
            Annuler
          </Link>
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
