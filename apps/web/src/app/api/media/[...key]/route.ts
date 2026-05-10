import { prisma } from '@cpfa/db';
import { presignDownload } from '@cpfa/lib/storage';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Public read-through proxy for the Media library. Editors store storage keys
// in CMS content blocks (Page / Article); browsers fetch them through this
// endpoint so the bucket can stay private. We verify that the key exists in
// the Media table to avoid turning this into an open redirect to the bucket
// (which would let anyone request presigned URLs for any key they could
// guess). The 302 carries a 4-min cache-control so consecutive requests for
// the same image stay cheap, and the presigned URL itself is valid for 5 min.

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key: parts } = await params;
  if (!parts || parts.length === 0) return new Response('Not found', { status: 404 });
  const storageKey = parts.map(decodeURIComponent).join('/');

  // Defence-in-depth: only resolve keys that have a Media row.
  const exists = await prisma.media.findUnique({
    where: { storageKey },
    select: { id: true },
  });
  if (!exists) return new Response('Not found', { status: 404 });

  let url: string;
  try {
    url = await presignDownload(storageKey, 300);
  } catch {
    return new Response('Storage unavailable', { status: 503 });
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: url,
      'Cache-Control': 'public, max-age=240, stale-while-revalidate=120',
    },
  });
}
