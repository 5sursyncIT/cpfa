'use client';

import { useRef, useState } from 'react';
import { Button } from '@cpfa/ui';
import { trpc } from '@/lib/trpc';

type UploadResult = { storageKey: string; mimeType: string; sizeBytes: number; label: string };

export function UploadField({
  registrationId,
  label,
  accept = 'application/pdf,image/png,image/jpeg,image/webp',
  required = false,
  onUploaded,
}: {
  registrationId: string;
  label: string;
  accept?: string;
  required?: boolean;
  onUploaded?: (result: UploadResult) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<'idle' | 'signing' | 'uploading' | 'confirming' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState<UploadResult | null>(null);

  const presign = trpc.attachments.createPresignedUpload.useMutation();
  const confirm = trpc.attachments.confirm.useMutation();

  async function handleFile(file: File) {
    setErrorMsg(null);
    setStatus('signing');
    try {
      const presigned = await presign.mutateAsync({
        registrationId,
        label,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
      });

      setStatus('uploading');
      const res = await fetch(presigned.url, {
        method: 'PUT',
        headers: presigned.headers,
        body: file,
      });
      if (!res.ok) throw new Error(`Upload échoué (HTTP ${res.status}).`);

      setStatus('confirming');
      await confirm.mutateAsync({
        registrationId,
        label,
        storageKey: presigned.key,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
      });

      const result = {
        storageKey: presigned.key,
        mimeType: file.type,
        sizeBytes: file.size,
        label,
      };
      setUploaded(result);
      setStatus('done');
      onUploaded?.(result);
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Erreur d’upload');
    }
  }

  return (
    <div className="rounded-md border bg-background p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">
            {label}
            {required ? <span className="ml-1 text-destructive">*</span> : null}
          </p>
          {uploaded ? (
            <p className="text-xs text-emerald-700">Téléversé · {(uploaded.sizeBytes / 1024).toFixed(0)} Ko</p>
          ) : (
            <p className="text-xs text-muted-foreground">PDF / image · 25 Mo max</p>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={status === 'signing' || status === 'uploading' || status === 'confirming'}
        >
          {status === 'signing'
            ? 'Préparation…'
            : status === 'uploading'
              ? 'Envoi…'
              : status === 'confirming'
                ? 'Finalisation…'
                : uploaded
                  ? 'Remplacer'
                  : 'Téléverser'}
        </Button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
      {errorMsg ? <p className="mt-2 text-xs text-destructive">{errorMsg}</p> : null}
    </div>
  );
}
