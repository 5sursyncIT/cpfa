'use client';

import { trpc } from '@/lib/trpc';
import { mediaUrl, fileTypeLabel } from '@/lib/media';

type Picked = { storageKey: string; altText?: string | null };

export function MediaPicker({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (m: Picked) => void;
}) {
  const list = trpc.cms.media.list.useQuery({ take: 60 }, { enabled: open });

  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[80vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Choisir un média</h3>
          <button type="button" onClick={onClose} className="text-sm">Fermer</button>
        </div>

        {list.isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : (list.data?.items.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucun média. Téléversez-en depuis <a href="/admin/media" className="underline">/admin/media</a>.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {list.data!.items.map((m) => {
              const url = mediaUrl(m.storageKey);
              const isImage = m.mimeType.startsWith('image/');
              return (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => {
                    onPick({ storageKey: m.storageKey, altText: m.altText });
                    onClose();
                  }}
                  className="group rounded-md border bg-card p-2 text-left hover:border-primary"
                >
                  <div className="mb-1 flex aspect-video items-center justify-center overflow-hidden rounded-md bg-muted text-xs text-muted-foreground">
                    {isImage && url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={url} alt={m.altText ?? ''} className="h-full w-full object-cover" />
                    ) : (
                      <span className="font-medium">{fileTypeLabel(m.mimeType)}</span>
                    )}
                  </div>
                  <div className="truncate font-mono text-[10px] text-muted-foreground">
                    {m.storageKey.split('/').pop()}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export type MediaPicked = Picked;
