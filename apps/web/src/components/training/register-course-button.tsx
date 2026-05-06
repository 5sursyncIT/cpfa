'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@cpfa/ui';
import { trpc } from '@/lib/trpc';

export function RegisterCourseButton({
  courseId,
  sessions,
}: {
  courseId: string;
  sessions: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | undefined>(sessions[0]?.id);
  const register = trpc.registrations.registerForCourse.useMutation({
    onSuccess: ({ registration }) => router.push(`/me/inscriptions/${registration.id}`),
  });

  return (
    <div className="space-y-3 pt-2">
      {sessions.length > 1 ? (
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Choisir une session</span>
          <select
            value={sessionId ?? ''}
            onChange={(e) => setSessionId(e.target.value || undefined)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <Button
        size="lg"
        className="w-full"
        disabled={register.isPending}
        onClick={() => register.mutate({ courseId, sessionId })}
      >
        {register.isPending ? 'Inscription…' : "S’inscrire"}
      </Button>

      {register.isError ? (
        <p className="text-xs text-destructive">{register.error.message}</p>
      ) : null}
    </div>
  );
}
