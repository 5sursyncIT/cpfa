'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@cpfa/ui';
import { trpc } from '@/lib/trpc';

const SCOPES = [
  { value: 'STUDENT', label: 'Étudiant' },
  { value: 'TEACHER', label: 'Enseignant' },
  { value: 'PROFESSIONAL', label: 'Professionnel' },
  { value: 'PARTNER', label: 'Partenaire' },
] as const;

export function CreateTestimonialButton({ locale }: { locale: 'fr' | 'en' }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<(typeof SCOPES)[number]['value']>('STUDENT');
  const [authorName, setAuthorName] = useState('');
  const [authorRole, setAuthorRole] = useState('');
  const [quote, setQuote] = useState('');
  const create = trpc.testimonials.create.useMutation({
    onSuccess: () => {
      setOpen(false);
      setAuthorName('');
      setAuthorRole('');
      setQuote('');
      router.refresh();
    },
  });

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        Nouveau témoignage ({locale.toUpperCase()})
      </Button>
    );
  }

  const valid = authorName.length >= 2 && quote.length >= 10;

  return (
    <div className="grid w-full gap-2 rounded-md border bg-background p-3">
      <div className="grid gap-2 md:grid-cols-3">
        <select
          value={scope}
          onChange={(e) => setScope(e.target.value as typeof scope)}
          className="rounded-md border bg-background px-2 py-1.5 text-sm"
        >
          {SCOPES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <input
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          placeholder="Auteur"
          className="rounded-md border bg-background px-2 py-1.5 text-sm"
        />
        <input
          value={authorRole}
          onChange={(e) => setAuthorRole(e.target.value)}
          placeholder="Rôle / fonction (optionnel)"
          className="rounded-md border bg-background px-2 py-1.5 text-sm"
        />
      </div>
      <textarea
        value={quote}
        onChange={(e) => setQuote(e.target.value)}
        placeholder="Témoignage (10 caractères minimum)"
        rows={3}
        className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
      />
      {create.error ? (
        <p className="text-xs text-destructive">{create.error.message}</p>
      ) : null}
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={!valid || create.isPending}
          onClick={() =>
            create.mutate({
              scope,
              authorName,
              authorRole: authorRole || undefined,
              quote,
              locale,
              published: false,
              displayOrder: 0,
            })
          }
        >
          {create.isPending ? '…' : 'Créer (brouillon)'}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Annuler
        </Button>
      </div>
    </div>
  );
}
