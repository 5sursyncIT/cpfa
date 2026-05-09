'use client';

import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';

export function RegisterSeminarButton({ seminarId, disabled }: { seminarId: string; disabled?: boolean }) {
  const router = useRouter();
  const register = trpc.registrations.registerForSeminar.useMutation({
    onSuccess: ({ registration }) => router.push(`/me/inscriptions/${registration.id}`),
  });

  return (
    <div className="col gap-2">
      <button
        type="button"
        className="btn btn-orange btn-lg"
        disabled={disabled || register.isPending}
        onClick={() => register.mutate({ seminarId })}
      >
        {disabled ? 'Complet' : register.isPending ? 'Inscription…' : "S'inscrire"}{' '}
        {!disabled && !register.isPending ? <span className="arrow">→</span> : null}
      </button>
      {register.isError ? (
        <p className="fs-13" style={{ color: 'var(--danger)' }}>
          {register.error.message}
        </p>
      ) : null}
    </div>
  );
}
