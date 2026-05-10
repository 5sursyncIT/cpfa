import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/rbac';
import { prisma } from '@cpfa/db';
import { mediaUrl } from '@/lib/media';
import { MediaUploader } from './uploader';
import { MediaActions } from './media-actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Bibliothèque média — Admin CPFA' };

const fmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });

export default async function AdminMediaPage() {
  const session = await auth();
  if (!session?.user) redirect('/sign-in?callbackUrl=/admin/media');
  if (!hasPermission(session.user.roles, 'cms:write')) redirect('/admin');

  const items = await prisma.media.findMany({
    orderBy: { uploadedAt: 'desc' },
    take: 200,
    select: {
      id: true,
      storageKey: true,
      mimeType: true,
      sizeBytes: true,
      altText: true,
      uploadedAt: true,
      uploadedBy: { select: { email: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Bibliothèque média</h1>
      </div>

      <MediaUploader />

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun fichier pour l&apos;instant.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((m) => {
            const url = mediaUrl(m.storageKey);
            const isImage = m.mimeType.startsWith('image/');
            return (
              <article key={m.id} className="rounded-lg border bg-card p-3">
                <div
                  className="mb-2 flex aspect-video items-center justify-center overflow-hidden rounded-md bg-muted text-xs text-muted-foreground"
                >
                  {isImage && url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={url} alt={m.altText ?? ''} className="h-full w-full object-cover" />
                  ) : (
                    <span className="font-mono">{m.mimeType}</span>
                  )}
                </div>
                <div className="space-y-1 text-xs">
                  <div className="font-mono break-all text-[10px] text-muted-foreground">
                    {m.storageKey.split('/').pop()}
                  </div>
                  <div className="text-muted-foreground">
                    {Math.round(m.sizeBytes / 1024)} Ko · {fmt.format(m.uploadedAt)}
                  </div>
                  {m.altText ? <div className="italic">« {m.altText} »</div> : null}
                </div>
                <MediaActions id={m.id} storageKey={m.storageKey} altText={m.altText ?? ''} />
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
