'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';

type Cat = {
  id: string;
  slug: string;
  name: string;
  parentId: string | null;
  resourceCount: number;
  childCount: number;
};

function slugify(s: string) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function CategoriesEditor({ initial }: { initial: Cat[] }) {
  const router = useRouter();
  const [cats] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [draftSlug, setDraftSlug] = useState('');
  const [draftParent, setDraftParent] = useState<string>('');

  const create = trpc.library.categoryCreate.useMutation();
  const update = trpc.library.categoryUpdate.useMutation();
  const del = trpc.library.categoryDelete.useMutation();

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await create.mutateAsync({
        name: draftName.trim(),
        slug: (draftSlug || slugify(draftName)).trim(),
        parentId: draftParent || null,
      });
      setDraftName('');
      setDraftSlug('');
      setDraftParent('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue.');
    }
  }

  async function onRename(id: string, current: string) {
    const next = window.prompt('Nouveau nom', current);
    if (!next || next === current) return;
    setError(null);
    try {
      await update.mutateAsync({ id, name: next.trim() });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue.');
    }
  }

  async function onChangeParent(id: string, currentParentId: string | null) {
    const options = ['(racine)']
      .concat(cats.filter((c) => c.id !== id).map((c) => c.name))
      .join('\n  - ');
    const choice = window.prompt(
      `Nouveau parent (entrez le nom exact ou laissez vide pour racine) :\n  - ${options}`,
      currentParentId ? cats.find((c) => c.id === currentParentId)?.name ?? '' : '',
    );
    if (choice === null) return;
    const trimmed = choice.trim();
    const target = trimmed === '' ? null : cats.find((c) => c.name === trimmed)?.id ?? null;
    if (trimmed && !target) {
      setError(`Catégorie introuvable : ${trimmed}`);
      return;
    }
    setError(null);
    try {
      await update.mutateAsync({ id, parentId: target });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue.');
    }
  }

  async function onDelete(c: Cat) {
    if (!window.confirm(`Supprimer la catégorie "${c.name}" ?`)) return;
    setError(null);
    try {
      await del.mutateAsync({ id: c.id });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue.');
    }
  }

  const roots = cats.filter((c) => !c.parentId);
  const children = (parentId: string) => cats.filter((c) => c.parentId === parentId);
  const pending = create.isPending || update.isPending || del.isPending;

  return (
    <div className="col gap-5">
      {error ? (
        <div
          role="alert"
          className="card"
          style={{ borderColor: 'var(--danger)', color: 'var(--danger)', padding: 16 }}
        >
          {error}
        </div>
      ) : null}

      <form onSubmit={onCreate} className="panel" style={{ padding: 24 }}>
        <h4 style={{ marginBottom: 16 }}>Ajouter une catégorie</h4>
        <div className="row gap-3" style={{ flexWrap: 'wrap', alignItems: 'end' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label className="label" htmlFor="cat-name">Nom *</label>
            <input
              id="cat-name"
              className="input"
              value={draftName}
              onChange={(e) => {
                setDraftName(e.target.value);
                if (!draftSlug) setDraftSlug(slugify(e.target.value));
              }}
              required
            />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label className="label" htmlFor="cat-slug">Slug</label>
            <input
              id="cat-slug"
              className="input"
              value={draftSlug}
              onChange={(e) => setDraftSlug(slugify(e.target.value))}
              placeholder="auto"
            />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label className="label" htmlFor="cat-parent">Parent</label>
            <select
              id="cat-parent"
              className="select"
              value={draftParent}
              onChange={(e) => setDraftParent(e.target.value)}
            >
              <option value="">— Racine —</option>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-primary" disabled={pending || !draftName}>
            {create.isPending ? 'Création…' : '+ Ajouter'}
          </button>
        </div>
      </form>

      <div className="panel">
        {cats.length === 0 ? (
          <p className="text-soft" style={{ padding: 24 }}>
            Aucune catégorie. Crée-en une pour organiser le catalogue.
          </p>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Catégorie</th>
                <th>Slug</th>
                <th>Ressources</th>
                <th>Sous-catégories</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {roots.map((root) => (
                <CategoryRows
                  key={root.id}
                  cat={root}
                  depth={0}
                  cats={cats}
                  childrenOf={children}
                  onRename={onRename}
                  onChangeParent={onChangeParent}
                  onDelete={onDelete}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function CategoryRows({
  cat,
  depth,
  cats: _cats,
  childrenOf,
  onRename,
  onChangeParent,
  onDelete,
}: {
  cat: Cat;
  depth: number;
  cats: Cat[];
  childrenOf: (id: string) => Cat[];
  onRename: (id: string, current: string) => void;
  onChangeParent: (id: string, currentParentId: string | null) => void;
  onDelete: (c: Cat) => void;
}) {
  const subs = childrenOf(cat.id);
  return (
    <>
      <tr>
        <td style={{ paddingLeft: 16 + depth * 24 }}>
          {depth > 0 ? <span aria-hidden="true">↳ </span> : null}
          <span style={{ fontWeight: depth === 0 ? 500 : 400 }}>{cat.name}</span>
        </td>
        <td className="mono fs-13 text-soft">{cat.slug}</td>
        <td className="mono fs-13">{cat.resourceCount}</td>
        <td className="mono fs-13">{cat.childCount}</td>
        <td>
          <div className="row gap-2">
            <button
              type="button"
              className="btn-link fs-13"
              onClick={() => onRename(cat.id, cat.name)}
            >
              Renommer
            </button>
            <button
              type="button"
              className="btn-link fs-13"
              onClick={() => onChangeParent(cat.id, cat.parentId)}
            >
              Parent
            </button>
            <button
              type="button"
              className="btn-link fs-13"
              style={{ color: 'var(--danger)' }}
              onClick={() => onDelete(cat)}
            >
              Supprimer
            </button>
          </div>
        </td>
      </tr>
      {subs.map((sub) => (
        <CategoryRows
          key={sub.id}
          cat={sub}
          depth={depth + 1}
          cats={_cats}
          childrenOf={childrenOf}
          onRename={onRename}
          onChangeParent={onChangeParent}
          onDelete={onDelete}
        />
      ))}
    </>
  );
}
