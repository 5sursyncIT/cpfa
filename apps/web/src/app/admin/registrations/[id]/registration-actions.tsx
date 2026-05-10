'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';

export function RegistrationActions({ registrationId }: { registrationId: string }) {
  const router = useRouter();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const validate = trpc.registrations.validate.useMutation({
    onSuccess: () => router.refresh(),
    onError: (e) => setError(e.message),
  });
  const reject = trpc.registrations.reject.useMutation({
    onSuccess: () => router.refresh(),
    onError: (e) => setError(e.message),
  });

  const pending = validate.isPending || reject.isPending;

  return (
    <div className="panel" style={{ padding: 24 }}>
      <h4 style={{ marginBottom: 16 }}>Décision</h4>
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
        <button
          type="button"
          className="btn btn-primary"
          disabled={pending}
          onClick={() => validate.mutate({ id: registrationId })}
        >
          {validate.isPending ? 'Validation…' : 'Valider l’inscription'}
        </button>
        <div style={{ flex: 1, minWidth: 240 }}>
          <label className="label" htmlFor="rej-reason">Motif de refus</label>
          <input
            id="rej-reason"
            className="input"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Min 3 caractères"
          />
        </div>
        <button
          type="button"
          className="btn btn-ghost"
          style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
          disabled={pending || reason.trim().length < 3}
          onClick={() => reject.mutate({ id: registrationId, reason: reason.trim() })}
        >
          {reject.isPending ? 'Refus…' : 'Refuser'}
        </button>
      </div>
    </div>
  );
}
