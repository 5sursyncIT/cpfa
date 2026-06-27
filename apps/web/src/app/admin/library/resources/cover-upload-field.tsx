'use client';

import { useRef, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { mediaUrl } from '@/lib/media';
import { useConfirm } from '@/components/cpfa/admin-ui';

const ACCEPT = 'image/png,image/jpeg,image/webp,image/avif,image/gif';
const MAX_BYTES = 8 * 1024 * 1024;

export function CoverUploadField({
  value,
  onChange,
  altText,
  label = 'Couverture (image)',
  helperText = 'JPG, PNG, WebP · 8 Mo max · format portrait recommandé.',
  previewVariant = 'portrait',
}: {
  value: string | null;
  onChange: (key: string | null) => void;
  altText?: string;
  label?: string;
  helperText?: string;
  previewVariant?: 'portrait' | 'landscape';
}) {
  const askConfirm = useConfirm();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<
    'idle' | 'signing' | 'uploading' | 'confirming' | 'error'
  >('idle');
  const [error, setError] = useState<string | null>(null);

  const presign = trpc.library.requestCoverUpload.useMutation();
  const confirm = trpc.library.confirmCoverUpload.useMutation();

  const previewUrl = mediaUrl(value);
  const busy =
    status === 'signing' || status === 'uploading' || status === 'confirming';

  async function handleFile(file: File) {
    setError(null);
    if (file.size > MAX_BYTES) {
      setError(`Fichier trop lourd (${Math.round(file.size / 1024 / 1024)} Mo, max 8 Mo).`);
      return;
    }
    setStatus('signing');
    try {
      const presigned = await presign.mutateAsync({
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
      });

      setStatus('uploading');
      const res = await fetch(presigned.url, {
        method: 'PUT',
        headers: presigned.headers,
        body: file,
      });
      if (!res.ok) {
        throw new Error(`Upload S3 échoué (HTTP ${res.status}).`);
      }

      setStatus('confirming');
      await confirm.mutateAsync({
        storageKey: presigned.key,
        mimeType: file.type,
        sizeBytes: file.size,
        altText: altText?.trim() || undefined,
      });

      onChange(presigned.key);
      setStatus('idle');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : "Erreur d'upload.");
    }
  }

  return (
    <div>
      <label className="label">{label}</label>
      <div className="row gap-4" style={{ alignItems: 'flex-start', marginTop: 6 }}>
        <div
          style={{
            width: previewVariant === 'landscape' ? 180 : 120,
            height: previewVariant === 'landscape' ? 110 : 160,
            borderRadius: 'var(--r-2)',
            overflow: 'hidden',
            border: '1px solid var(--line)',
            background: 'var(--bg-soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Aperçu de la couverture"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span className="text-soft fs-13 mono" style={{ textAlign: 'center', padding: 8 }}>
              Aucune
            </span>
          )}
        </div>
        <div className="col gap-2" style={{ flex: 1, minWidth: 0 }}>
          <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
            >
              {status === 'signing'
                ? 'Préparation…'
                : status === 'uploading'
                  ? 'Envoi…'
                  : status === 'confirming'
                    ? 'Finalisation…'
                    : value
                      ? 'Remplacer'
                      : 'Téléverser'}
            </button>
            {value ? (
              <button
                type="button"
                className="btn-link fs-13"
                style={{ color: 'var(--danger)' }}
                disabled={busy}
                onClick={async () => {
                  const { confirmed } = await askConfirm({
                    title: 'Retirer cette image ?',
                    message: 'L’image sera détachée. Vous pourrez en choisir une autre ensuite.',
                    confirmLabel: 'Retirer',
                    danger: true,
                  });
                  if (confirmed) onChange(null);
                }}
              >
                Retirer
              </button>
            ) : null}
          </div>
          <p className="fs-13 text-soft">
            {helperText}
          </p>
          {value ? (
            <p className="fs-13 text-soft">
              Fichier : {value.split('/').pop()}
            </p>
          ) : null}
          {error ? (
            <p className="fs-13" style={{ color: 'var(--danger)' }}>
              {error}
            </p>
          ) : null}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}
