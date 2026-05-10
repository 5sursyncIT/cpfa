'use client';

import { useMemo, useState } from 'react';
import { FormationCard, type FormationCardData } from './formation-card';

const CATEGORIES = ['Tout', 'Cursus diplômant', 'Certification', 'Séminaire', 'Sur mesure'] as const;
type Category = (typeof CATEGORIES)[number];

function isCategory(v: string | undefined): v is Category {
  return !!v && (CATEGORIES as readonly string[]).includes(v);
}

export function FormationsCatalog({
  cards,
  initialCategory,
}: {
  cards: FormationCardData[];
  initialCategory?: string;
}) {
  const [cat, setCat] = useState<Category>(
    isCategory(initialCategory) ? initialCategory : 'Tout',
  );
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return cards.filter((c) => {
      if (cat !== 'Tout' && c.category !== cat) return false;
      if (term && !c.title.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [cards, cat, q]);

  return (
    <>
      <div className="filter-bar">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            className={'filter-chip' + (c === cat ? ' active' : '')}
            onClick={() => setCat(c)}
          >
            {c}
          </button>
        ))}
        <div style={{ flex: 1 }}></div>
        <input
          className="input"
          placeholder="Rechercher un programme…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ maxWidth: 280 }}
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-soft" style={{ padding: '32px 0' }}>
          Aucune formation ne correspond à vos critères.
        </p>
      ) : (
        <div className="formations-grid">
          {filtered.map((f) => (
            <FormationCard key={f.slug} f={f} />
          ))}
        </div>
      )}
    </>
  );
}
