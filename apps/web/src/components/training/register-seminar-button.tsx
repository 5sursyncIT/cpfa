'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@cpfa/ui';
import { trpc } from '@/lib/trpc';

export function RegisterSeminarButton({ seminarId, disabled }: { seminarId: string; disabled?: boolean }) {
  const router = useRouter();
  const register = trpc.registrations.registerForSeminar.useMutation({
    onSuccess: ({ registration }) => router.push(`/me/inscriptions/${registration.id}`),
  });

  return (
    <div className="space-y-2">
      <Button
        size="lg"
        className="w-full"
        disabled={disabled || register.isPending}
        onClick={() => register.mutate({ seminarId })}
      >
        {disabled ? 'Complet' : register.isPending ? 'Inscription…' : "S’inscrire"}
      </Button>
      {register.isError ? (
        <p className="text-xs text-destructive">{register.error.message}</p>
      ) : null}
    </div>
  );
}
