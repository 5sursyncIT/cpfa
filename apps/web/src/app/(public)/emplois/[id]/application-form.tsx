'use client';

import { useState } from 'react';
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

  if (submit.isSuccess) {
    return (
      <div style={{ background: 'var(--bg-soft, #f1f5f9)', padding: 12, borderRadius: 6 }}>
        <strong>Candidature transmise.</strong>
        <p className="fs-13 text-soft" style={{ marginTop: 4 }}>
          Vous recevrez un email de confirmation. Le recruteur vous contactera directement.
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
          placeholder="Prénom"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
          style={{ flex: 1 }}
        />
        <input
          className="input"
          placeholder="Nom"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
          style={{ flex: 1 }}
        />
      </div>
      <input
        className="input"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        className="input"
        type="tel"
        placeholder="Téléphone (optionnel)"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <textarea
        className="input"
        rows={4}
        placeholder={`Pourquoi postulez-vous au poste de ${jobTitle} ? (≥ 20 caractères)`}
        value={motivation}
        onChange={(e) => setMotivation(e.target.value)}
        required
      />
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
        {cvKey ? <p className="fs-13">CV joint : {cvName ?? cvKey.split('/').pop()}</p> : null}
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
        {submit.isPending ? 'Envoi…' : 'Envoyer ma candidature'}
      </button>
    </form>
  );
}
