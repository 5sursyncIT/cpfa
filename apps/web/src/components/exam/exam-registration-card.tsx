'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { trpc } from '@/lib/trpc';

export function ExamRegistrationCard({ examId, disabled }: { examId: string; disabled: boolean }) {
  const t = useTranslations('examRegistration');
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
        {disabled ? t('closed') : register.isPending ? t('pending') : t('apply')}{' '}
        {!disabled && !register.isPending ? <span className="arrow">→</span> : null}
      </button>
      {register.isError ? (
        <p className="fs-13" style={{ color: 'var(--danger)' }}>
          {register.error.message}
        </p>
      ) : (
        <p className="fs-13 text-soft">{t('hint')}</p>
      )}
    </div>
  );
}
