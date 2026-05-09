'use client';

import { useMemo, useState } from 'react';
import type { ResourceKind } from '@cpfa/db';
import { Book, type BookData } from './book';

type Item = {
  id: string;
  kind: ResourceKind;
  keywords: string[];
  book: BookData;
};

const CATEGORIES = [
  'Tout',
  'Droit',
  'Actuariat',
  'Réassurance',
  'Gestion',
  'Études CIMA',
  'Mémoires',
] as const;
type Category = (typeof CATEGORIES)[number];

const SUPPORT_OPTIONS = [
  { value: 'all', label: 'Tous les supports' },
  { value: 'BOOK', label: 'Ouvrages' },
  { value: 'JOURNAL', label: 'Périodiques' },
  { value: 'THESIS', label: 'Mémoires' },
  { value: 'DIGITAL', label: 'Numérique' },
] as const;

export function LibraryCatalog({ items }: { items: Item[] }) {
  const [filter, setFilter] = useState<Category>('Tout');
  const [support, setSupport] = useState<string>('all');
  const [availability, setAvailability] = useState<string>('all');
  const [q, setQ] = useState('');
  const [view, setView] = useState<'covers' | 'list'>('covers');

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return items.filter((it) => {
      if (support !== 'all' && it.kind !== support) return false;
      if (availability === 'available' && it.book.status !== 'dispo') return false;
      if (availability === 'reserved' && it.book.status !== 'emprunte') return false;
      if (filter !== 'Tout') {
        const target = filter.toLowerCase();
        const hay = (it.keywords.join(' ') + ' ' + it.book.title).toLowerCase();
        if (!hay.includes(target.split(' ')[0]!)) return false;
      }
      if (term) {
        const hay = (it.book.title + ' ' + it.book.author + ' ' + it.keywords.join(' '))
          .toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [items, filter, support, availability, q]);

  return (
    <>
      <div className="row gap-4" style={{ marginBottom: 32, alignItems: 'end', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 240, maxWidth: 460 }}>
          <label className="label">Recherche</label>
          <input
            className="input"
            placeholder="Titre, auteur, sujet, ISBN…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div style={{ minWidth: 180 }}>
          <label className="label">Type de support</label>
          <select
            className="select"
            value={support}
            onChange={(e) => setSupport(e.target.value)}
          >
            {SUPPORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div style={{ minWidth: 180 }}>
          <label className="label">Disponibilité</label>
          <select
            className="select"
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
          >
            <option value="all">Tout</option>
            <option value="available">Disponible immédiatement</option>
            <option value="reserved">Sur réservation</option>
          </select>
        </div>
      </div>

      <div className="filter-bar">
        {CATEGORIES.map((c) => (
          <button
            type="button"
            key={c}
            className={'filter-chip' + (c === filter ? ' active' : '')}
            onClick={() => setFilter(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 24 }}>
        <span className="text-soft fs-13 mono">
          {filtered.length} résultat{filtered.length > 1 ? 's' : ''} · trié par nouveauté
        </span>
        <div className="row gap-2">
          <button
            type="button"
            className={'filter-chip' + (view === 'covers' ? ' active' : '')}
            onClick={() => setView('covers')}
          >
            Couvertures
          </button>
          <button
            type="button"
            className={'filter-chip' + (view === 'list' ? ' active' : '')}
            onClick={() => setView('list')}
          >
            Liste
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-soft" style={{ padding: '48px 0', textAlign: 'center' }}>
          Aucune ressource ne correspond à votre recherche.
        </p>
      ) : view === 'covers' ? (
        <div className="book-grid" style={{ marginBottom: 96 }}>
          {filtered.map((it) => (
            <Book key={it.id} b={it.book} href={`/bibliotheque/${it.id}`} />
          ))}
        </div>
      ) : (
        <div className="loan-list" style={{ marginBottom: 96 }}>
          {filtered.map((it) => (
            <a key={it.id} href={`/bibliotheque/${it.id}`} className="loan-item" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className={'loan-cover ' + it.book.cover}></div>
              <div>
                <div className="loan-title">{it.book.title}</div>
                <div className="loan-author">{it.book.author}</div>
              </div>
              <span className={'pill ' + (it.book.status === 'dispo' ? 'pill-success' : '')}>
                {it.book.status === 'dispo' ? 'Disponible' : 'Sortie'}
              </span>
              <div></div>
              <span className="btn btn-ghost btn-sm">Voir →</span>
            </a>
          ))}
        </div>
      )}
    </>
  );
}
