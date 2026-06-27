import { contentTypeForKey, readObject, verifyDownloadToken } from '@cpfa/lib/storage';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Authorised read for private files (CVs, registration attachments, exam
// papers, trainer resources, generated cards/invoices…). The signed `token`
// is minted by the server (tRPC procedures or server components) only after
// the caller's permission has been checked, and binds this exact key. Replaces
// the previous S3 presigned GET URL.

export async function GET(
  req: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key: parts } = await params;
  if (!parts || parts.length === 0) return new Response('Not found', { status: 404 });
  const key = parts.map(decodeURIComponent).join('/');

  const token = new URL(req.url).searchParams.get('token');
  if (!token || !verifyDownloadToken(token, key)) {
    return new Response('Forbidden', { status: 403 });
  }

  let bytes: Buffer;
  try {
    bytes = await readObject(key);
  } catch {
    return new Response('Not found', { status: 404 });
  }

  return new Response(new Uint8Array(bytes), {
    headers: {
      'Content-Type': contentTypeForKey(key),
      'Content-Disposition': `inline; filename="${key.split('/').pop() ?? 'file'}"`,
      'Cache-Control': 'private, max-age=300',
    },
  });
}
