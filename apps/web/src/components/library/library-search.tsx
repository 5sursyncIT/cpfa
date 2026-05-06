'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@cpfa/ui';
import { trpc } from '@/lib/trpc';

const KINDS = [
  { value: undefined, label: 'Tous les types' },
  { value: 'BOOK', label: 'Livres' },
  { value: 'JOURNAL', label: 'Revues' },
  { value: 'THESIS', label: 'Mémoires' },
  { value: 'DIGITAL', label: 'Numérique' },
] as const;

type Kind = (typeof KINDS)[number]['value'];

export function LibrarySearch() {
  const [q, setQ] = useState('');
  const [kind, setKind] = useState<Kind>(undefined);

  const { data, isLoading, isError } = trpc.library.search.useQuery(
    { q: q.trim() || undefined, kind, take: 20 },
    { staleTime: 10_000 },
  );

  return (
    <div>
      <form
        onSubmit={(e) => e.preventDefault()}
        className="flex flex-col gap-3 rounded-lg border bg-card p-4 md:flex-row md:items-center"
      >
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Titre, auteur, mot-clé, ISBN…"
          className="flex-1 rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <select
          value={kind ?? ''}
          onChange={(e) => setKind((e.target.value || undefined) as Kind)}
          className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {KINDS.map((k) => (
            <option key={k.label} value={k.value ?? ''}>
              {k.label}
            </option>
          ))}
        </select>
      </form>

      <div className="mt-8">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : isError ? (
          <p className="text-sm text-destructive">Une erreur est survenue.</p>
        ) : !data || data.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun résultat.</p>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.items.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/bibliotheque/${r.id}`}
                  className="block rounded-lg border bg-card p-4 transition-shadow hover:shadow-sm"
                >
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">{r.kind}</p>
                  <h3 className="mt-1 text-base font-semibold leading-snug">{r.title}</h3>
                  {r.subtitle ? (
                    <p className="mt-1 text-sm text-muted-foreground">{r.subtitle}</p>
                  ) : null}
                  {r.authors.length > 0 ? (
                    <p className="mt-2 text-sm text-muted-foreground">{r.authors.join(', ')}</p>
                  ) : null}
                  {r.publishedYear ? (
                    <p className="mt-1 text-xs text-muted-foreground">{r.publishedYear}</p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {data?.nextCursor ? (
        <div className="mt-6">
          <Button variant="outline">Charger plus</Button>
        </div>
      ) : null}
    </div>
  );
}
