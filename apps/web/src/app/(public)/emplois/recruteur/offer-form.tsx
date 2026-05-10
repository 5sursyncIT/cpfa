'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { trpc } from '@/lib/trpc';

const TYPE_VALUES = ['CDI', 'CDD', 'STAGE', 'FREELANCE', 'ALTERNANCE'] as const;
const LEVEL_VALUES = ['JUNIOR', 'INTERMEDIAIRE', 'SENIOR', 'EXECUTIVE'] as const;

const MAX_BYTES = 10 * 1024 * 1024;

export function RecruiterOfferForm() {
  const t = useTranslations('offerForm');
  const tJobs = useTranslations('jobs');
  const [recruiterEmail, setRecruiterEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState<(typeof TYPE_VALUES)[number]>('CDI');
  const [level, setLevel] = useState<(typeof LEVEL_VALUES)[number]>('JUNIOR');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [profile, setProfile] = useState('');
  const [contact, setContact] = useState('');
  const [closesAt, setClosesAt] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [fileSheetKey, setFileSheetKey] = useState<string | undefined>();
  const [fileSheetName, setFileSheetName] = useState<string | undefined>();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | undefined>();

  const requestUpload = trpc.jobs.requestSheetUpload.useMutation();
  const submit = trpc.jobs.submitOffer.useMutation();

  async function uploadSheet(file: File) {
    setUploadError(undefined);
    if (file.size > MAX_BYTES) {
      setUploadError(t('errorTooLarge'));
      return;
    }
    setUploading(true);
    try {
      const presigned = await requestUpload.mutateAsync({
        fileName: file.name,
        mimeType: file.type || 'application/pdf',
        sizeBytes: file.size,
      });
      const res = await fetch(presigned.url, {
        method: 'PUT',
        headers: presigned.headers,
        body: file,
      });
      if (!res.ok) throw new Error(`upload failed: HTTP ${res.status}`);
      setFileSheetKey(presigned.key);
      setFileSheetName(file.name);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'upload failed');
    } finally {
      setUploading(false);
    }
  }

  if (submit.isSuccess) {
    return (
      <div className="card" style={{ padding: 24 }}>
        <h3>{t('successHeading')}</h3>
        <p>{t('successBody')}</p>
      </div>
    );
  }

  const valid =
    /\S+@\S+\.\S+/.test(recruiterEmail) &&
    companyName.trim().length >= 2 &&
    title.trim().length >= 3 &&
    description.trim().length >= 20 &&
    profile.trim().length >= 10 &&
    contact.trim().length >= 3;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    await submit.mutateAsync({
      recruiterEmail,
      companyName,
      title,
      description,
      profile,
      contact,
      type,
      level,
      location: location || undefined,
      urgent,
      closesAt: closesAt ? new Date(closesAt) : undefined,
      fileSheetKey,
    });
  }

  return (
    <form className="col gap-3 card" style={{ padding: 24 }} onSubmit={onSubmit}>
      <div>
        <label className="label">{t('recruiterEmailLabel')}</label>
        <input
          className="input"
          type="email"
          value={recruiterEmail}
          onChange={(e) => setRecruiterEmail(e.target.value)}
          required
        />
      </div>
      <div className="row gap-2">
        <div style={{ flex: 1 }}>
          <label className="label">{t('companyLabel')}</label>
          <input
            className="input"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
          />
        </div>
        <div style={{ flex: 1 }}>
          <label className="label">{t('locationLabel')}</label>
          <input
            className="input"
            placeholder={t('locationPlaceholder')}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="label">{t('titleLabel')}</label>
        <input
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div className="row gap-2">
        <div style={{ flex: 1 }}>
          <label className="label">{t('typeLabel')}</label>
          <select
            className="select"
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
          >
            {TYPE_VALUES.map((v) => (
              <option key={v} value={v}>
                {tJobs(`type${v}` as 'typeCDI')}
              </option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label className="label">{t('levelLabel')}</label>
          <select
            className="select"
            value={level}
            onChange={(e) => setLevel(e.target.value as typeof level)}
          >
            {LEVEL_VALUES.map((v) => (
              <option key={v} value={v}>
                {tJobs(`level${v}` as 'levelJUNIOR')}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="label">{t('descriptionLabel')}</label>
        <textarea
          className="input"
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('descriptionPlaceholder')}
          required
        />
      </div>
      <div>
        <label className="label">{t('profileLabel')}</label>
        <textarea
          className="input"
          rows={4}
          value={profile}
          onChange={(e) => setProfile(e.target.value)}
          placeholder={t('profilePlaceholder')}
          required
        />
      </div>
      <div>
        <label className="label">{t('contactLabel')}</label>
        <textarea
          className="input"
          rows={2}
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          required
        />
      </div>
      <div className="row gap-2">
        <div style={{ flex: 1 }}>
          <label className="label">{t('closesAtLabel')}</label>
          <input
            type="date"
            className="input"
            value={closesAt}
            onChange={(e) => setClosesAt(e.target.value)}
          />
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'end', paddingBottom: 8 }}>
          <label className="row gap-2 fs-14" style={{ alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={urgent}
              onChange={(e) => setUrgent(e.target.checked)}
            />
            {t('urgentLabel')}
          </label>
        </div>
      </div>
      <div>
        <label className="label">{t('sheetLabel')}</label>
        <input
          type="file"
          accept="application/pdf"
          disabled={uploading}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void uploadSheet(f);
          }}
        />
        {uploading ? <p className="fs-13">{t('uploadInProgress')}</p> : null}
        {uploadError ? (
          <p className="fs-13" style={{ color: 'var(--danger)' }}>
            {uploadError}
          </p>
        ) : null}
        {fileSheetKey ? (
          <p className="fs-13">
            {t('sheetAttached')} {fileSheetName ?? fileSheetKey.split('/').pop()}
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
