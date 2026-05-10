'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';

export function TrainerReviewActions({ profileId }: { profileId: string }) {
  const router = useRouter();
  const approve = trpc.trainers.approve.useMutation();
  const reject = trpc.trainers.reject.useMutation();
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState('');
  const busy = approve.isPending || reject.isPending;

  async function onApprove() {
    await approve.mutateAsync({ profileId });
    router.refresh();
  }

  async function onReject() {
    if (reason.trim().length < 5) return;
    await reject.mutateAsync({ profileId, reason: reason.trim() });
    router.refresh();
    setShowReject(false);
    setReason('');
  }

  if (showReject) {
    return (
      <div className="col gap-2" style={{ marginTop: 16 }}>
        <textarea
          className="input"
          rows={3}
          placeholder="Motif du refus (visible par le candidat)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        {reject.error ? (
          <p style={{ color: 'var(--danger)' }}>{reject.error.message}</p>
        ) : null}
        <div className="row gap-2">
          <button
            type="button"
            className="btn btn-primary"
            onClick={onReject}
            disabled={busy || reason.trim().length < 5}
          >
            Confirmer le refus
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setShowReject(false);
              setReason('');
            }}
            disabled={busy}
          >
            Annuler
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="row gap-2" style={{ marginTop: 16 }}>
      <button type="button" className="btn btn-primary" onClick={onApprove} disabled={busy}>
        Approuver
      </button>
      <button
        type="button"
        className="btn btn-ghost"
        onClick={() => setShowReject(true)}
        disabled={busy}
      >
        Refuser
      </button>
      {approve.error ? (
        <span style={{ color: 'var(--danger)' }}>{approve.error.message}</span>
      ) : null}
    </div>
  );
}
