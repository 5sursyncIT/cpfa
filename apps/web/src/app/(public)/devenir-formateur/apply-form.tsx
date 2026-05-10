'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { trpc } from '@/lib/trpc';

type FormValues = {
  bio: string;
  domainsCsv: string;
  phone?: string;
  experienceYears?: number;
};

type Initial = {
  bio: string;
  domains: string[];
  phone?: string;
  experienceYears?: number;
  cvKey?: string;
  status: 'PENDING' | 'REJECTED' | 'APPROVED';
  rejectionReason?: string;
};

const ALLOWED_CV = ['application/pdf'];
const MAX_BYTES = 8 * 1024 * 1024;

export function TrainerApplyForm({ initial }: { initial?: Initial }) {
  const t = useTranslations('applyForm');
  const apply = trpc.trainers.submitApplication.useMutation();
  const requestUpload = trpc.trainers.requestCvUpload.useMutation();
  const [cvKey, setCvKey] = useState<string | undefined>(initial?.cvKey);
  const [cvName, setCvName] = useState<string | undefined>();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | undefined>();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      bio: initial?.bio ?? '',
      domainsCsv: initial?.domains?.join(', ') ?? '',
      phone: initial?.phone ?? '',
      experienceYears: initial?.experienceYears,
    },
  });

  async function uploadCv(file: File) {
    setUploadError(undefined);
    if (!ALLOWED_CV.includes(file.type)) {
      setUploadError(t('errorBadFormat'));
      return;
    }
    if (file.size > MAX_BYTES) {
      setUploadError(t('errorTooLarge'));
      return;
    }
    setUploading(true);
    try {
      const presigned = await requestUpload.mutateAsync({
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
      });
      const res = await fetch(presigned.url, {
        method: 'PUT',
        headers: presigned.headers,
        body: file,
      });
      if (!res.ok) throw new Error(`upload failed: HTTP ${res.status}`);
      setCvKey(presigned.key);
      setCvName(file.name);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'upload failed');
    } finally {
      setUploading(false);
    }
  }

  const onSubmit = async (values: FormValues) => {
    const domains = values.domainsCsv
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean);
    if (domains.length === 0) return;
    await apply.mutateAsync({
      bio: values.bio,
      domains,
      phone: values.phone || undefined,
      experienceYears: values.experienceYears,
      cvKey,
    });
  };

  if (apply.isSuccess) {
    return (
      <div className="card" style={{ padding: 24, marginTop: 24 }}>
        <h3>{t('successHeading')}</h3>
        <p>{t('successBody')}</p>
      </div>
    );
  }

  return (
    <form
      className="col gap-4 card"
      style={{ padding: 24, marginTop: 24 }}
      onSubmit={handleSubmit(onSubmit)}
    >
      {initial?.status === 'PENDING' ? (
        <div style={{ background: '#fef3c7', padding: 12, borderRadius: 6, fontSize: 14 }}>
          {t('pendingNote')}
        </div>
      ) : null}
      {initial?.status === 'REJECTED' ? (
        <div style={{ background: '#fee2e2', padding: 12, borderRadius: 6, fontSize: 14 }}>
          <strong>{t('rejectedHeading')}</strong>
          {initial.rejectionReason ? (
            <div style={{ marginTop: 6 }}>
              {t('rejectedReason', { reason: initial.rejectionReason })}
            </div>
          ) : null}
          {' '}
          {t('rejectedRetry')}
        </div>
      ) : null}

      <div>
        <label className="label">{t('bioLabel')}</label>
        <textarea
          className="input"
          rows={6}
          {...register('bio', { required: true, minLength: 20, maxLength: 4000 })}
        />
        {errors.bio ? (
          <p className="fs-13" style={{ color: 'var(--danger)' }}>
            {t('bioError')}
          </p>
        ) : null}
      </div>

      <div>
        <label className="label">{t('domainsLabel')}</label>
        <input
          className="input"
          placeholder={t('domainsPlaceholder')}
          {...register('domainsCsv', { required: true })}
        />
        {errors.domainsCsv ? (
          <p className="fs-13" style={{ color: 'var(--danger)' }}>
            {t('domainsError')}
          </p>
        ) : null}
      </div>

      <div className="row gap-3">
        <div style={{ flex: 1 }}>
          <label className="label">{t('phoneLabel')}</label>
          <input className="input" type="tel" {...register('phone')} />
        </div>
        <div style={{ flex: 1 }}>
          <label className="label">{t('experienceLabel')}</label>
          <input
            className="input"
            type="number"
            min={0}
            max={70}
            {...register('experienceYears', { valueAsNumber: true })}
          />
        </div>
      </div>

      <div>
        <label className="label">{t('cvLabel')}</label>
        <input
          type="file"
          accept="application/pdf"
          disabled={uploading}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void uploadCv(f);
          }}
        />
        {uploading ? <p className="fs-13">{t('uploadInProgress')}</p> : null}
        {uploadError ? (
          <p className="fs-13" style={{ color: 'var(--danger)' }}>
            {uploadError}
          </p>
        ) : null}
        {cvKey ? (
          <p className="fs-13">
            {t('cvAttached')} <code>{cvName ?? cvKey.split('/').pop()}</code>
          </p>
        ) : null}
      </div>

      {apply.error ? (
        <p style={{ color: 'var(--danger)' }}>{apply.error.message}</p>
      ) : null}

      <button type="submit" className="btn btn-primary" disabled={isSubmitting || uploading}>
        {initial ? t('submitResubmit') : t('submitNew')}
      </button>
    </form>
  );
}
