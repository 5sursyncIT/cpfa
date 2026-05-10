'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@cpfa/ui';
import { trpc } from '@/lib/trpc';

// Inline editor for a single course's application window. Both bounds optional.
// `<input type="datetime-local">` returns local-time strings; we convert to
// UTC Date before sending. Empty input → null.

function dateToInputValue(d: Date | null): string {
  if (!d) return '';
  // Strip timezone — datetime-local expects "YYYY-MM-DDTHH:mm".
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function inputValueToDate(v: string): Date | null {
  return v ? new Date(v) : null;
}

export function ApplicationWindowEditor({
  courseId,
  applicationsOpenAt,
  applicationsCloseAt,
}: {
  courseId: string;
  applicationsOpenAt: Date | null;
  applicationsCloseAt: Date | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState(() => dateToInputValue(applicationsOpenAt));
  const [to, setTo] = useState(() => dateToInputValue(applicationsCloseAt));
  const set = trpc.courses.setApplicationWindow.useMutation({
    onSuccess: () => {
      setOpen(false);
      router.refresh();
    },
  });

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Modifier la fenêtre
      </Button>
    );
  }

  return (
    <div className="space-y-2 rounded-md border bg-background p-3">
      <label className="block text-xs">
        <span className="mb-1 block text-muted-foreground">Ouverture</span>
        <input
          type="datetime-local"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="w-full rounded-md border bg-background px-2 py-1 text-xs"
        />
      </label>
      <label className="block text-xs">
        <span className="mb-1 block text-muted-foreground">Fermeture</span>
        <input
          type="datetime-local"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="w-full rounded-md border bg-background px-2 py-1 text-xs"
        />
      </label>
      {set.error ? (
        <p className="text-xs text-destructive">{set.error.message}</p>
      ) : null}
      <div className="flex gap-1">
        <Button
          size="sm"
          onClick={() =>
            set.mutate({
              courseId,
              applicationsOpenAt: inputValueToDate(from),
              applicationsCloseAt: inputValueToDate(to),
            })
          }
          disabled={set.isPending}
        >
          {set.isPending ? '…' : 'Enregistrer'}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Annuler
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() =>
            set.mutate({
              courseId,
              applicationsOpenAt: null,
              applicationsCloseAt: null,
            })
          }
          disabled={set.isPending}
        >
          Toujours ouvert
        </Button>
      </div>
    </div>
  );
}
