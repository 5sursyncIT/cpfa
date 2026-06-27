'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc';
import { labelFor, PAYMENT_STATUS_LABEL } from '@/lib/labels';
import { useToast } from '@/components/cpfa/admin-ui';

type Row = {
  id: string;
  status: string;
  createdAt: Date;
  user: { id: string; firstName: string | null; lastName: string | null; email: string };
  course: { title: string } | null;
  seminar: { title: string } | null;
  exam: { title: string } | null;
  payment: { status: string; amountXof: number } | null;
};

const fmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' });

const STATUS_PILL: Record<string, { label: string; className: string }> = {
  DRAFT: { label: 'Brouillon', className: '' },
  SUBMITTED: { label: 'Soumise', className: 'pill-warning' },
  PAID: { label: 'Réglée', className: 'pill-orange' },
  VALIDATED: { label: 'Validée', className: 'pill-success' },
  REJECTED: { label: 'Refusée', className: '' },
  CANCELLED: { label: 'Annulée', className: '' },
};

export function RegistrationsTable({ registrations }: { registrations: Row[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reasonById, setReasonById] = useState<Record<string, string>>({});

  const validate = trpc.registrations.validate.useMutation({
    onSuccess: () => {
      router.refresh();
      setActionId(null);
      toast('Inscription validée.');
    },
    onError: (e) => {
      setError(e.message);
      toast(e.message, 'error');
    },
  });
  const reject = trpc.registrations.reject.useMutation({
    onSuccess: () => {
      router.refresh();
      setActionId(null);
      toast('Inscription refusée.');
    },
    onError: (e) => {
      setError(e.message);
      toast(e.message, 'error');
    },
  });

  if (registrations.length === 0) {
    return (
      <div className="panel">
        <p className="text-soft" style={{ padding: 24 }}>Aucune inscription ne correspond.</p>
      </div>
    );
  }

  return (
    <>
      {error ? (
        <div
          role="alert"
          className="card"
          style={{ borderColor: 'var(--danger)', color: 'var(--danger)', padding: 12, marginBottom: 12 }}
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
              <th>Candidat</th>
              <th>Programme</th>
              <th>Statut</th>
              <th>Paiement</th>
              <th>Reçue le</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {registrations.map((r) => {
              const fullName =
                [r.user.firstName, r.user.lastName].filter(Boolean).join(' ') || r.user.email;
              const target = r.course?.title ?? r.seminar?.title ?? r.exam?.title ?? '—';
              const kind = r.course ? 'Formation' : r.seminar ? 'Séminaire' : r.exam ? 'Concours' : '—';
              const reason = reasonById[r.id] ?? '';
              const pill = STATUS_PILL[r.status] ?? { label: r.status, className: '' };
              const busy = actionId === r.id;
              const actionable = r.status === 'SUBMITTED' || r.status === 'PAID';
              return (
                <tr key={r.id}>
                  <td>
                    <Link
                      href={`/admin/users/${r.user.id}`}
                      style={{ color: 'inherit', textDecoration: 'none' }}
                    >
                      <div style={{ fontWeight: 500 }}>{fullName}</div>
                      <div className="fs-13 text-soft">{r.user.email}</div>
                    </Link>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{target}</div>
                    <div className="fs-13 text-soft">{kind}</div>
                  </td>
                  <td><span className={'pill ' + pill.className}>{pill.label}</span></td>
                  <td className="mono fs-13">
                    {r.payment ? (
                      <>
                        {r.payment.amountXof.toLocaleString('fr-FR')} FCFA
                        <div className="fs-13 text-soft">
                          {labelFor(PAYMENT_STATUS_LABEL, r.payment.status)}
                        </div>
                      </>
                    ) : (
                      <span className="text-soft">—</span>
                    )}
                  </td>
                  <td className="mono fs-13 text-soft">{fmt.format(r.createdAt)}</td>
                  <td>
                    {actionable ? (
                      <div className="col gap-2" style={{ minWidth: 260 }}>
                        <div className="row gap-2">
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            disabled={busy}
                            onClick={() => {
                              setActionId(r.id);
                              validate.mutate({ id: r.id });
                            }}
                          >
                            {busy && validate.isPending ? '…' : 'Valider'}
                          </button>
                          <Link href={`/admin/registrations/${r.id}`} className="btn-link fs-13">
                            Détail →
                          </Link>
                        </div>
                        <div className="row gap-2" style={{ alignItems: 'stretch' }}>
                          <input
                            className="input"
                            placeholder="Motif de refus (min 3 car.)"
                            value={reason}
                            onChange={(e) =>
                              setReasonById((s) => ({ ...s, [r.id]: e.target.value }))
                            }
                            style={{ flex: 1, fontSize: 13 }}
                          />
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                            disabled={busy || reason.trim().length < 3}
                            onClick={() => {
                              setActionId(r.id);
                              reject.mutate({ id: r.id, reason: reason.trim() });
                            }}
                          >
                            Refuser
                          </button>
                        </div>
                      </div>
                    ) : (
                      <Link href={`/admin/registrations/${r.id}`} className="btn-link fs-13">
                        Détail →
                      </Link>
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
