'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { FormationCard, type FormationCardData } from './formation-card';

// Le filtre porte sur `CourseKind`, pas sur le libellé affiché : celui-ci est
// traduit, donc comparer des chaînes visibles casserait le catalogue dès qu'on
// bascule en anglais. Le `?cat=` de l'URL transporte donc la clé d'enum, ce qui
// le rend au passage stable d'une langue à l'autre.
const CATEGORIES = [
  { kind: 'all', labelKey: 'catAll' },
  { kind: 'DIPLOMANT', labelKey: 'catDegree' },
  { kind: 'CERTIFIANT', labelKey: 'catCertification' },
  { kind: 'CARTE', labelKey: 'catTailored' },
  { kind: 'AUDITORAT', labelKey: 'catAudit' },
] as const;

type CategoryKind = (typeof CATEGORIES)[number]['kind'];

function isCategoryKind(v: string | undefined): v is CategoryKind {
  return !!v && CATEGORIES.some((c) => c.kind === v);
}

export function FormationsCatalog({
  cards,
  initialCategory,
}: {
  cards: FormationCardData[];
  initialCategory?: string;
}) {
  const t = useTranslations('formationsCatalog');
  const [cat, setCat] = useState<CategoryKind>(
    isCategoryKind(initialCategory) ? initialCategory : 'all',
  );
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return cards.filter((c) => {
      if (cat !== 'all' && c.kind !== cat) return false;
      if (term && !c.title.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [cards, cat, q]);

  return (
    <>
      <div className="filter-bar">
        {CATEGORIES.map((c) => (
          <button
            key={c.kind}
            type="button"
            className={'filter-chip' + (c.kind === cat ? ' active' : '')}
            onClick={() => setCat(c.kind)}
          >
            {t(c.labelKey)}
          </button>
        ))}
        <div style={{ flex: 1 }}></div>
        <input
          className="input"
          placeholder={t('searchPlaceholder')}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ maxWidth: 280 }}
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-soft" style={{ padding: '32px 0' }}>
          {t('empty')}
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
