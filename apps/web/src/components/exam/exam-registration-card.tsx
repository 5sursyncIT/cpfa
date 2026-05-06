'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@cpfa/ui';
import { trpc } from '@/lib/trpc';

export function ExamRegistrationCard({ examId, disabled }: { examId: string; disabled: boolean }) {
  const router = useRouter();
  const register = trpc.registrations.registerForExam.useMutation({
    onSuccess: ({ registration }) => router.push(`/me/inscriptions/${registration.id}`),
  });

  return (
    <div className="space-y-2">
      <Button
        size="lg"
        className="w-full"
        disabled={disabled || register.isPending}
        onClick={() => register.mutate({ examId })}
      >
        {disabled ? 'Inscriptions fermées' : register.isPending ? 'Inscription…' : 'Candidater'}
      </Button>
      {register.isError ? (
        <p className="text-xs text-destructive">{register.error.message}</p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Vous serez redirigé pour téléverser vos pièces et régler les frais.
        </p>
      )}
    </div>
  );
}
