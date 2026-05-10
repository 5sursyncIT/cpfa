'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { trpc } from '@/lib/trpc';

type LoanRow = {
  id: string;
  status: string;
  borrowedAt: Date;
  dueAt: Date;
  returnedAt: Date | null;
  penaltyAmount: number;
  notes: string | null;
  resource: { title: string };
  user: { firstName: string | null; lastName: string | null; email: string };
  subscription: { id: string; cardNumber: string };
};

const fmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' });
const fmtXof = (n: number) => `${n.toLocaleString('fr-FR')} FCFA`;

const STATUS_PILL: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: 'En cours', className: 'pill-orange' },
  RETURNED: { label: 'Rendu', className: 'pill-success' },
  OVERDUE: { label: 'En retard', className: 'pill-warning' },
  LOST: { label: 'Perdu', className: 'pill-warning' },
};

export function LoansTable({ loans }: { loans: LoanRow[] }) {
  const router = useRouter();
  const [actionLoanId, setActionLoanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ret = trpc.loans.return.useMutation({
    onSuccess: () => {
      router.refresh();
      setActionLoanId(null);
    },
    onError: (e) => setError(e.message),
  });
  const markLost = trpc.loans.markLost.useMutation({
    onSuccess: () => {
      router.refresh();
      setActionLoanId(null);
    },
    onError: (e) => setError(e.message),
  });
  const collect = trpc.loans.collectPenalty.useMutation({
    onSuccess: () => {
      router.refresh();
      setActionLoanId(null);
    },
    onError: (e) => setError(e.message),
  });

  if (loans.length === 0) {
    return (
      <div className="panel">
        <p className="text-soft" style={{ padding: 24 }}>
          Aucun prêt à afficher.
        </p>
      </div>
    );
  }

  const today = Date.now();

  return (
    <>
      {error ? (
        <div
          role="alert"
          className="card"
          style={{
            borderColor: 'var(--danger)',
            color: 'var(--danger)',
            padding: 12,
            marginBottom: 12,
          }}
        >
          {error}{' '}
          <button type="button" className="btn-link fs-13" onClick={() => setError(null)}>
            Fermer
          </button>
        </div>
      ) : null}

      <div className="panel">
        <table className="tbl">
          <thead>
            <tr>
              <th>Ouvrage</th>
              <th>Abonné</th>
              <th>Emprunt</th>
              <th>Échéance</th>
              <th>Statut</th>
              <th>Pénalité</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loans.map((loan) => {
              const overdue = loan.status === 'ACTIVE' && loan.dueAt.getTime() < today;
              const fullName =
                [loan.user.firstName, loan.user.lastName].filter(Boolean).join(' ') ||
                loan.user.email;
              const pill = STATUS_PILL[loan.status] ?? { label: loan.status, className: '' };
              const busy = actionLoanId === loan.id;
              return (
                <tr key={loan.id}>
                  <td>{loan.resource.title}</td>
                  <td>
                    <Link
                      href={`/admin/library/subscribers/${loan.subscription.id}`}
                      style={{ color: 'inherit', textDecoration: 'none' }}
                    >
                      <div style={{ fontWeight: 500 }}>{fullName}</div>
                      <div className="mono fs-13 text-soft">{loan.subscription.cardNumber}</div>
                    </Link>
                  </td>
                  <td className="mono fs-13 text-soft">{fmt.format(loan.borrowedAt)}</td>
                  <td
                    className="mono fs-13"
                    style={{ color: overdue ? 'var(--danger)' : undefined }}
                  >
                    {fmt.format(loan.dueAt)}
                  </td>
                  <td>
                    <span className={'pill ' + pill.className}>{pill.label}</span>
                  </td>
                  <td className="mono fs-13">
                    {loan.penaltyAmount > 0 ? (
                      <span style={{ color: 'var(--orange-deep)' }}>
                        {fmtXof(loan.penaltyAmount)}
                      </span>
                    ) : (
                      <span className="text-soft">—</span>
                    )}
                  </td>
                  <td>
                    {loan.status === 'ACTIVE' ? (
                      <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          disabled={busy}
                          onClick={() => {
                            setActionLoanId(loan.id);
                            ret.mutate({ loanId: loan.id });
                          }}
                        >
                          {busy && ret.isPending ? 'Retour…' : 'Marquer rendu'}
                        </button>
                        <button
                          type="button"
                          className="btn-link fs-13"
                          style={{ color: 'var(--danger)' }}
                          disabled={busy}
                          onClick={() => {
                            if (
                              !window.confirm(
                                "Marquer cet ouvrage comme perdu ? Pénalité calculée automatiquement.",
                              )
                            )
                              return;
                            setActionLoanId(loan.id);
                            markLost.mutate({ loanId: loan.id });
                          }}
                        >
                          Perdu
                        </button>
                      </div>
                    ) : loan.penaltyAmount > 0 ? (
                      <button
                        type="button"
                        className="btn-link fs-13"
                        disabled={busy}
                        onClick={() => {
                          if (
                            !window.confirm(
                              `Encaisser ${fmtXof(loan.penaltyAmount)} en espèces ?`,
                            )
                          )
                            return;
                          setActionLoanId(loan.id);
                          collect.mutate({ loanId: loan.id, provider: 'CASH' });
                        }}
                      >
                        {busy && collect.isPending ? 'Encaissement…' : 'Encaisser pénalité'}
                      </button>
                    ) : (
                      <span className="text-soft fs-13">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
