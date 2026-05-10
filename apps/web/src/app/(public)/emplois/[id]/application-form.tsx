'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { trpc } from '@/lib/trpc';

const ALLOWED_CV = ['application/pdf'];
const MAX_BYTES = 8 * 1024 * 1024;

export function JobApplicationForm({
  jobId,
  jobTitle,
}: {
  jobId: string;
  jobTitle: string;
}) {
  const t = useTranslations('jobApplicationForm');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [motivation, setMotivation] = useState('');
  const [cvKey, setCvKey] = useState<string | undefined>();
  const [cvName, setCvName] = useState<string | undefined>();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | undefined>();

  const requestUpload = trpc.jobs.requestCvUpload.useMutation();
  const submit = trpc.jobs.submitApplication.useMutation();

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

  if (submit.isSuccess) {
    return (
      <div style={{ background: 'var(--bg-soft, #f1f5f9)', padding: 12, borderRadius: 6 }}>
        <strong>{t('successHeading')}</strong>
        <p className="fs-13 text-soft" style={{ marginTop: 4 }}>
          {t('successBody')}
        </p>
      </div>
    );
  }

  const valid =
    firstName.trim().length >= 2 &&
    lastName.trim().length >= 2 &&
    /\S+@\S+\.\S+/.test(email) &&
    motivation.trim().length >= 20 &&
    !!cvKey;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || !cvKey) return;
    await submit.mutateAsync({
      jobPostingId: jobId,
      firstName,
      lastName,
      email,
      phone: phone || undefined,
      motivation,
      cvKey,
    });
  }

  return (
    <form className="col gap-2" onSubmit={onSubmit}>
      <div className="row gap-2">
        <input
          className="input"
          placeholder={t('firstNamePlaceholder')}
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
          style={{ flex: 1 }}
        />
        <input
          className="input"
          placeholder={t('lastNamePlaceholder')}
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
          style={{ flex: 1 }}
        />
      </div>
      <input
        className="input"
        type="email"
        placeholder={t('emailPlaceholder')}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        className="input"
        type="tel"
        placeholder={t('phonePlaceholder')}
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <textarea
        className="input"
        rows={4}
        placeholder={t('motivationPlaceholder', { jobTitle })}
        value={motivation}
        onChange={(e) => setMotivation(e.target.value)}
        required
      />
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
            {t('cvAttached')} {cvName ?? cvKey.split('/').pop()}
          </p>
        ) : null}
      </div>
      {submit.error ? (
        <p className="fs-13" style={{ color: 'var(--danger)' }}>
          {submit.error.message}
        </p>
      ) : null}
      <button
        type="submit"
        className="btn btn-primary"
        disabled={!valid || submit.isPending || uploading}
      >
        {submit.isPending ? t('submitting') : t('submitCta')}
      </button>
    </form>
  );
}
