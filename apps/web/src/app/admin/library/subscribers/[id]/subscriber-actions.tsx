'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { useConfirm } from '@/components/cpfa/admin-ui';

export function SubscriberActions({
  subscriptionId,
  status,
}: {
  subscriptionId: string;
  status: string;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [error, setError] = useState<string | null>(null);
  const [extendDays, setExtendDays] = useState(365);

  const activate = trpc.subscriptions.adminActivate.useMutation();
  const extend = trpc.subscriptions.adminExtend.useMutation();
  const cancel = trpc.subscriptions.adminCancel.useMutation();

  const pending = activate.isPending || extend.isPending || cancel.isPending;

  async function run<T>(fn: () => Promise<T>) {
    setError(null);
    try {
      await fn();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue.');
    }
  }

  return (
    <div className="panel" style={{ padding: 24, marginTop: 24 }}>
      <h4 style={{ marginBottom: 16 }}>Actions</h4>
      {error ? (
        <div
          role="alert"
          className="fs-13"
          style={{
            color: 'var(--danger)',
            border: '1px solid var(--danger)',
            padding: 12,
            borderRadius: 'var(--r-2)',
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      ) : null}

      <div className="row gap-3" style={{ flexWrap: 'wrap', alignItems: 'end' }}>
        {status !== 'ACTIVE' ? (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={pending}
            onClick={() => run(() => activate.mutateAsync({ id: subscriptionId, durationDays: 365 }))}
          >
            {activate.isPending ? 'Activation…' : 'Activer (365 jours)'}
          </button>
        ) : null}

        <div className="row gap-2" style={{ alignItems: 'end' }}>
          <div>
            <label className="label" htmlFor="extend-days">Prolonger</label>
            <input
              id="extend-days"
              type="number"
              min={1}
              max={730}
              className="input"
              value={extendDays}
              onChange={(e) => setExtendDays(Number(e.target.value) || 1)}
              style={{ width: 100 }}
            />
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={pending}
            onClick={() =>
              run(() => extend.mutateAsync({ id: subscriptionId, days: extendDays }))
            }
          >
            {extend.isPending ? 'Prolongation…' : `+ ${extendDays} jours`}
          </button>
        </div>

        {status !== 'CANCELLED' ? (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
            disabled={pending}
            onClick={async () => {
              const { confirmed } = await confirm({
                title: 'Annuler cet abonnement ?',
                message: 'L’abonné perdra l’accès à la salle de consultation jusqu’à un renouvellement.',
                confirmLabel: 'Annuler l’abonnement',
                cancelLabel: 'Retour',
                danger: true,
              });
              if (!confirmed) return;
              run(() => cancel.mutateAsync({ id: subscriptionId }));
            }}
          >
            Annuler l&apos;abonnement
          </button>
        ) : null}
      </div>
    </div>
  );
}
