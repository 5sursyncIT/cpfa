'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@cpfa/ui';
import { trpc } from '@/lib/trpc';

export function AddPaperForm({ examId }: { examId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [year, setYear] = useState<number | undefined>(undefined);
  const [accessLevel, setAccessLevel] = useState<'PUBLIC' | 'REGISTERED' | 'PAID'>('PAID');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'saving' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const presign = trpc.examPapers.createPresignedUpload.useMutation();
  const create = trpc.examPapers.create.useMutation({
    onSuccess: () => {
      setTitle('');
      setYear(undefined);
      router.refresh();
    },
  });

  async function submit() {
    const file = inputRef.current?.files?.[0];
    if (!file || !title) return;
    setErrorMsg(null);
    setStatus('uploading');
    try {
      const presigned = await presign.mutateAsync({
        examId,
        fileName: file.name,
        mimeType: file.type || 'application/pdf',
        sizeBytes: file.size,
      });
      const res = await fetch(presigned.url, {
        method: 'PUT',
        headers: presigned.headers,
        body: file,
      });
      if (!res.ok) throw new Error(`Upload échoué (HTTP ${res.status}).`);

      setStatus('saving');
      await create.mutateAsync({
        examId,
        title,
        year,
        fileKey: presigned.key,
        mimeType: file.type || 'application/pdf',
        sizeBytes: file.size,
        accessLevel,
      });
      setStatus('idle');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Erreur');
    }
  }

  return (
    <div className="mt-3 grid gap-3 md:grid-cols-2">
      <input
        placeholder="Titre"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="rounded-md border bg-background px-3 py-2 text-sm"
      />
      <input
        type="number"
        placeholder="Année (optionnel)"
        value={year ?? ''}
        onChange={(e) => setYear(e.target.value ? Number(e.target.value) : undefined)}
        className="rounded-md border bg-background px-3 py-2 text-sm"
      />
      <select
        value={accessLevel}
        onChange={(e) => setAccessLevel(e.target.value as 'PUBLIC' | 'REGISTERED' | 'PAID')}
        className="rounded-md border bg-background px-3 py-2 text-sm"
      >
        <option value="PUBLIC">Public</option>
        <option value="REGISTERED">Candidats inscrits</option>
        <option value="PAID">Banque protégée (PAID/VALIDATED)</option>
      </select>
      <input ref={inputRef} type="file" accept="application/pdf" className="text-xs" />
      <Button
        onClick={submit}
        disabled={!title || status === 'uploading' || status === 'saving'}
      >
        {status === 'uploading' ? 'Envoi…' : status === 'saving' ? 'Enregistrement…' : 'Ajouter'}
      </Button>
      {errorMsg ? <p className="text-xs text-destructive md:col-span-2">{errorMsg}</p> : null}
    </div>
  );
}
