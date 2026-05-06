'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@cpfa/ui';
import { trpc } from '@/lib/trpc';

type Row = {
  id: string;
  status: string;
  createdAt: Date;
  user: { firstName: string | null; lastName: string | null; email: string };
  course: { title: string } | null;
  seminar: { title: string } | null;
  exam: { title: string } | null;
  payment: { status: string; amountXof: number } | null;
};

const fmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' });

export function RegistrationsTable({ registrations }: { registrations: Row[] }) {
  const router = useRouter();
  const validate = trpc.registrations.validate.useMutation({ onSuccess: () => router.refresh() });
  const reject = trpc.registrations.reject.useMutation({ onSuccess: () => router.refresh() });
  const [reasonById, setReasonById] = useState<Record<string, string>>({});

  if (registrations.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucune inscription dans ce statut.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="min-w-full divide-y text-sm">
        <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Candidat</th>
            <th className="px-4 py-3">Objet</th>
            <th className="px-4 py-3">Reçue le</th>
            <th className="px-4 py-3">Paiement</th>
            <th className="px-4 py-3">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {registrations.map((r) => {
            const fullName = [r.user.firstName, r.user.lastName].filter(Boolean).join(' ') || r.user.email;
            const target = r.course?.title ?? r.seminar?.title ?? r.exam?.title ?? '—';
            const reason = reasonById[r.id] ?? '';
            return (
              <tr key={r.id}>
                <td className="px-4 py-3">
                  <div className="font-medium">{fullName}</div>
                  <div className="text-xs text-muted-foreground">{r.user.email}</div>
                </td>
                <td className="px-4 py-3">{target}</td>
                <td className="px-4 py-3 text-muted-foreground">{fmt.format(r.createdAt)}</td>
                <td className="px-4 py-3">
                  {r.payment ? (
                    <>
                      {r.payment.amountXof.toLocaleString('fr-FR')} FCFA
                      <div className="text-xs text-muted-foreground">{r.payment.status}</div>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">N/A</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={validate.isPending}
                        onClick={() => validate.mutate({ id: r.id })}
                      >
                        Valider
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={reject.isPending || reason.length < 3}
                        onClick={() => reject.mutate({ id: r.id, reason })}
                      >
                        Rejeter
                      </Button>
                    </div>
                    <input
                      placeholder="Motif (≥ 3 caractères)"
                      value={reason}
                      onChange={(e) => setReasonById((s) => ({ ...s, [r.id]: e.target.value }))}
                      className="w-48 rounded-md border bg-background px-2 py-1 text-xs"
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
