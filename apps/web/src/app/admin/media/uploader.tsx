'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';

const MAX_BYTES = 25 * 1024 * 1024;

export function MediaUploader() {
  const router = useRouter();
  const requestUpload = trpc.cms.media.requestUpload.useMutation();
  const confirm = trpc.cms.media.confirm.useMutation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [done, setDone] = useState<{ count: number } | undefined>();

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(undefined);
    setDone(undefined);
    setBusy(true);
    let count = 0;
    try {
      for (const file of Array.from(files)) {
        if (file.size > MAX_BYTES) {
          throw new Error(`${file.name} dépasse 25 Mo.`);
        }
        const presigned = await requestUpload.mutateAsync({
          fileName: file.name,
          mimeType: file.type || 'application/octet-stream',
          sizeBytes: file.size,
        });
        const res = await fetch(presigned.url, {
          method: 'PUT',
          headers: presigned.headers,
          body: file,
        });
        if (!res.ok) throw new Error(`upload failed: ${file.name} (HTTP ${res.status})`);
        await confirm.mutateAsync({
          storageKey: presigned.key,
          mimeType: file.type || 'application/octet-stream',
          sizeBytes: file.size,
        });
        count += 1;
      }
      setDone({ count });
      if (fileRef.current) fileRef.current.value = '';
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'upload failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-lg border bg-card p-4">
      <label className="block text-sm font-medium">Téléverser</label>
      <p className="mb-3 text-xs text-muted-foreground">
        Images (PNG/JPG/WebP) ou documents (PDF/DOCX). 25 Mo max par fichier.
      </p>
      <input
        ref={fileRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        disabled={busy}
        onChange={(e) => void handleFiles(e.target.files)}
        className="text-sm"
      />
      {busy ? <p className="mt-2 text-xs">Envoi en cours…</p> : null}
      {done ? (
        <p className="mt-2 text-xs text-emerald-700">{done.count} fichier(s) téléversé(s).</p>
      ) : null}
      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
    </section>
  );
}
