import { putObject, verifyUploadToken } from '@cpfa/lib/storage';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Local-disk upload endpoint. Replaces the previous S3 presigned PUT. The
// browser sends the raw file bytes with a signed `token` (from a tRPC
// request*Upload mutation) that encodes the approved storage key, MIME type
// and max size — so authorisation already happened in the mutation and the key
// can't be tampered with. Accepts PUT (existing client code) and POST.
async function handle(req: Request): Promise<Response> {
  const token = new URL(req.url).searchParams.get('token');
  if (!token) return new Response('Missing token', { status: 400 });

  const approved = verifyUploadToken(token);
  if (!approved) return new Response('Invalid or expired upload token', { status: 403 });

  const body = Buffer.from(await req.arrayBuffer());
  if (body.byteLength === 0) return new Response('Empty body', { status: 400 });
  if (body.byteLength > approved.maxBytes) {
    return new Response('File larger than approved size', { status: 413 });
  }

  try {
    await putObject({ key: approved.key, body, contentType: approved.mimeType });
  } catch (err) {
    // Surface the real cause (e.g. EACCES on the storage volume) in the logs;
    // the client still gets a generic message.
    console.error('[upload] putObject failed for key', approved.key, err);
    return new Response('Storage write failed', { status: 500 });
  }
  return Response.json({ key: approved.key });
}

export const PUT = handle;
export const POST = handle;
