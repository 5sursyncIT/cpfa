'use client';

import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';

export function ExamRegistrationCard({ examId, disabled }: { examId: string; disabled: boolean }) {
  const router = useRouter();
  const register = trpc.registrations.registerForExam.useMutation({
    onSuccess: ({ registration }) => router.push(`/me/inscriptions/${registration.id}`),
  });

  return (
    <div className="col gap-2">
      <button
        type="button"
        className="btn btn-orange btn-lg"
        disabled={disabled || register.isPending}
        onClick={() => register.mutate({ examId })}
      >
        {disabled ? 'Inscriptions fermées' : register.isPending ? 'Inscription…' : 'Candidater'}{' '}
        {!disabled && !register.isPending ? <span className="arrow">→</span> : null}
      </button>
      {register.isError ? (
        <p className="fs-13" style={{ color: 'var(--danger)' }}>
          {register.error.message}
        </p>
      ) : (
        <p className="fs-13 text-soft">
          Vous serez redirigé pour téléverser vos pièces et régler les frais.
        </p>
      )}
    </div>
  );
}
