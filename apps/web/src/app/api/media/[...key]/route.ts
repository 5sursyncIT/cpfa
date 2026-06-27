import { prisma } from '@cpfa/db';
import { contentTypeForKey, readObject } from '@cpfa/lib/storage';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Public read-through for the Media library. Editors store storage keys in CMS
// content blocks (Page / Article); browsers fetch them through this endpoint.
// We verify the key exists in the Media table (defence-in-depth: this endpoint
// is unauthenticated, so it must only ever serve managed media), then stream
// the bytes straight from local disk.

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key: parts } = await params;
  if (!parts || parts.length === 0) return new Response('Not found', { status: 404 });
  const storageKey = parts.map(decodeURIComponent).join('/');

  const media = await prisma.media.findUnique({
    where: { storageKey },
    select: { mimeType: true },
  });
  if (!media) return new Response('Not found', { status: 404 });

  let bytes: Buffer;
  try {
    bytes = await readObject(storageKey);
  } catch {
    return new Response('Not found', { status: 404 });
  }

  return new Response(new Uint8Array(bytes), {
    headers: {
      'Content-Type': media.mimeType || contentTypeForKey(storageKey),
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=120',
    },
  });
}
