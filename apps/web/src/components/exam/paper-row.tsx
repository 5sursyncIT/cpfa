'use client';

import { Button } from '@cpfa/ui';
import { trpc } from '@/lib/trpc';

type Paper = {
  id: string;
  title: string;
  year: number | null;
  mimeType: string;
  sizeBytes: number | null;
  accessLevel: string;
};

const ACCESS_LABEL: Record<string, string> = {
  PUBLIC: 'Public',
  REGISTERED: 'Candidats',
  PAID: 'Banque protégée',
};

export function PaperRow({ paper }: { paper: Paper }) {
  const dl = trpc.examPapers.getDownloadUrl.useMutation({
    onSuccess: ({ url }) => window.open(url, '_blank', 'noopener'),
  });

  return (
    <li className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium">{paper.title}</p>
        <p className="text-xs text-muted-foreground">
          {paper.year ? `${paper.year} · ` : ''}
          {ACCESS_LABEL[paper.accessLevel] ?? paper.accessLevel}
          {paper.sizeBytes ? ` · ${(paper.sizeBytes / 1024).toFixed(0)} Ko` : ''}
        </p>
      </div>
      <Button
        size="sm"
        variant="outline"
        disabled={dl.isPending}
        onClick={() => dl.mutate({ paperId: paper.id })}
      >
        {dl.isPending ? '…' : 'Télécharger'}
      </Button>
      {dl.isError ? <span className="text-xs text-destructive">{dl.error.message}</span> : null}
    </li>
  );
}
