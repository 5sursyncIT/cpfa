'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
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
      setUploadError('Format non autorisé : merci de fournir un PDF.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setUploadError('Fichier trop volumineux (max 8 Mo).');
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
        <h3>Candidature reçue</h3>
        <p>
          Merci. Votre dossier est en cours d&apos;examen — vous recevrez un email dès qu&apos;une
          décision aura été prise.
        </p>
      </div>
    );
  }

  return (
    <form className="col gap-4 card" style={{ padding: 24, marginTop: 24 }} onSubmit={handleSubmit(onSubmit)}>
      {initial?.status === 'PENDING' ? (
        <div style={{ background: '#fef3c7', padding: 12, borderRadius: 6, fontSize: 14 }}>
          Votre candidature précédente est en cours d&apos;examen. Vous pouvez la mettre à jour
          ici — la soumission réinitialise la file d&apos;attente.
        </div>
      ) : null}
      {initial?.status === 'REJECTED' ? (
        <div style={{ background: '#fee2e2', padding: 12, borderRadius: 6, fontSize: 14 }}>
          <strong>Votre candidature précédente a été refusée.</strong>
          {initial.rejectionReason ? <div style={{ marginTop: 6 }}>Motif : {initial.rejectionReason}</div> : null}
          Vous pouvez en soumettre une nouvelle.
        </div>
      ) : null}

      <div>
        <label className="label">Présentation (mini-bio)</label>
        <textarea
          className="input"
          rows={6}
          {...register('bio', { required: true, minLength: 20, maxLength: 4000 })}
        />
        {errors.bio ? (
          <p className="fs-13" style={{ color: 'var(--danger)' }}>
            Décrivez votre parcours en au moins 20 caractères.
          </p>
        ) : null}
      </div>

      <div>
        <label className="label">Domaines d&apos;expertise (séparés par une virgule)</label>
        <input
          className="input"
          placeholder="Comptabilité, Audit, Fiscalité OHADA"
          {...register('domainsCsv', { required: true })}
        />
        {errors.domainsCsv ? (
          <p className="fs-13" style={{ color: 'var(--danger)' }}>Au moins un domaine est requis.</p>
        ) : null}
      </div>

      <div className="row gap-3">
        <div style={{ flex: 1 }}>
          <label className="label">Téléphone (optionnel)</label>
          <input className="input" type="tel" {...register('phone')} />
        </div>
        <div style={{ flex: 1 }}>
          <label className="label">Années d&apos;expérience (optionnel)</label>
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
        <label className="label">CV (PDF, max 8 Mo)</label>
        <input
          type="file"
          accept="application/pdf"
          disabled={uploading}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void uploadCv(f);
          }}
        />
        {uploading ? <p className="fs-13">Téléversement en cours…</p> : null}
        {uploadError ? (
          <p className="fs-13" style={{ color: 'var(--danger)' }}>{uploadError}</p>
        ) : null}
        {cvKey ? (
          <p className="fs-13">
            CV joint : <code>{cvName ?? cvKey.split('/').pop()}</code>
          </p>
        ) : null}
      </div>

      {apply.error ? (
        <p style={{ color: 'var(--danger)' }}>{apply.error.message}</p>
      ) : null}

      <button type="submit" className="btn btn-primary" disabled={isSubmitting || uploading}>
        {initial ? 'Renvoyer ma candidature' : 'Envoyer ma candidature'}
      </button>
    </form>
  );
}
