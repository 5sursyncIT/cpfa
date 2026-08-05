'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { ResourceKind } from '@cpfa/db';
import { Book, type BookData } from './book';

type Item = {
  id: string;
  kind: ResourceKind;
  keywords: string[];
  book: BookData;
};

// `id` sert de clé de filtre, `labelKey` d'étiquette traduite et `match` de
// terme cherché dans les mots-clés du catalogue. Les trois sont distincts à
// dessein : les mots-clés saisis par la bibliothécaire restent en français,
// alors que la puce, elle, doit se traduire.
const CATEGORIES = [
  { id: 'all', labelKey: 'catAll', match: null },
  { id: 'law', labelKey: 'catLaw', match: 'droit' },
  { id: 'actuarial', labelKey: 'catActuarial', match: 'actuariat' },
  { id: 'reinsurance', labelKey: 'catReinsurance', match: 'réassurance' },
  { id: 'management', labelKey: 'catManagement', match: 'gestion' },
  { id: 'cima', labelKey: 'catCima', match: 'cima' },
  { id: 'theses', labelKey: 'catTheses', match: 'mémoires' },
] as const;
type CategoryId = (typeof CATEGORIES)[number]['id'];

const SUPPORT_OPTIONS = [
  { value: 'all', labelKey: 'supportAll' },
  { value: 'BOOK', labelKey: 'supportBook' },
  { value: 'JOURNAL', labelKey: 'supportJournal' },
  { value: 'THESIS', labelKey: 'supportThesis' },
  { value: 'DIGITAL', labelKey: 'supportDigital' },
] as const;

export function LibraryCatalog({ items }: { items: Item[] }) {
  const t = useTranslations('libraryCatalog');
  const [filter, setFilter] = useState<CategoryId>('all');
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
      const match = CATEGORIES.find((c) => c.id === filter)?.match;
      if (match) {
        const hay = (it.keywords.join(' ') + ' ' + it.book.title).toLowerCase();
        if (!hay.includes(match)) return false;
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
          <label className="label">{t('searchLabel')}</label>
          <input
            className="input"
            placeholder={t('searchPlaceholder')}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div style={{ minWidth: 180 }}>
          <label className="label">{t('supportLabel')}</label>
          <select
            className="select"
            value={support}
            onChange={(e) => setSupport(e.target.value)}
          >
            {SUPPORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {t(o.labelKey)}
              </option>
            ))}
          </select>
        </div>
        <div style={{ minWidth: 180 }}>
          <label className="label">{t('availabilityLabel')}</label>
          <select
            className="select"
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
          >
            <option value="all">{t('availabilityAll')}</option>
            <option value="available">{t('availabilityAvailable')}</option>
            <option value="reserved">{t('availabilityReserved')}</option>
          </select>
        </div>
      </div>

      <div className="filter-bar">
        {CATEGORIES.map((c) => (
          <button
            type="button"
            key={c.id}
            className={'filter-chip' + (c.id === filter ? ' active' : '')}
            onClick={() => setFilter(c.id)}
          >
            {t(c.labelKey)}
          </button>
        ))}
      </div>

      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 24 }}>
        <span className="text-soft fs-13 mono">{t('resultCount', { count: filtered.length })}</span>
        <div className="row gap-2">
          <button
            type="button"
            className={'filter-chip' + (view === 'covers' ? ' active' : '')}
            onClick={() => setView('covers')}
          >
            {t('viewCovers')}
          </button>
          <button
            type="button"
            className={'filter-chip' + (view === 'list' ? ' active' : '')}
            onClick={() => setView('list')}
          >
            {t('viewList')}
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-soft" style={{ padding: '48px 0', textAlign: 'center' }}>
          {t('empty')}
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
                {it.book.status === 'dispo' ? t('statusAvailable') : t('statusOut')}
              </span>
              <div></div>
              <span className="btn btn-ghost btn-sm">{t('viewCta')} →</span>
            </a>
          ))}
        </div>
      )}
    </>
  );
}
