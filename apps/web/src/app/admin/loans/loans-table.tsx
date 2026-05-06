'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@cpfa/ui';
import { trpc } from '@/lib/trpc';

type LoanRow = {
  id: string;
  borrowedAt: Date;
  dueAt: Date;
  status: string;
  penaltyAmount: number;
  resource: { title: string };
  user: { firstName: string | null; lastName: string | null; email: string };
  subscription: { cardNumber: string };
};

const fmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' });

export function LoansTable({ loans }: { loans: LoanRow[] }) {
  const router = useRouter();
  const ret = trpc.loans.return.useMutation({
    onSuccess: () => router.refresh(),
  });

  if (loans.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucun prêt à afficher.</p>;
  }

  const today = Date.now();

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="min-w-full divide-y text-sm">
        <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Ouvrage</th>
            <th className="px-4 py-3">Abonné</th>
            <th className="px-4 py-3">Carte</th>
            <th className="px-4 py-3">Échéance</th>
            <th className="px-4 py-3">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {loans.map((loan) => {
            const overdue = loan.dueAt.getTime() < today;
            const fullName = [loan.user.firstName, loan.user.lastName].filter(Boolean).join(' ') || loan.user.email;
            return (
              <tr key={loan.id}>
                <td className="px-4 py-3 font-medium">{loan.resource.title}</td>
                <td className="px-4 py-3 text-muted-foreground">{fullName}</td>
                <td className="px-4 py-3 font-mono text-xs">{loan.subscription.cardNumber}</td>
                <td className={`px-4 py-3 ${overdue ? 'font-semibold text-destructive' : ''}`}>
                  {fmt.format(loan.dueAt)}
                </td>
                <td className="px-4 py-3">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={ret.isPending}
                    onClick={() => ret.mutate({ loanId: loan.id })}
                  >
                    {ret.isPending && ret.variables?.loanId === loan.id ? 'Retour…' : 'Marquer rendu'}
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
