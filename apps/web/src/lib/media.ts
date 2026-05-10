// URL builder for the public media proxy. Storage keys may contain slashes
// (e.g. `media/user_xyz/abc-cover.png`); we URL-encode each segment to keep
// a clean path while preserving the directory structure for the proxy.
export function mediaUrl(storageKey: string | null | undefined): string | null {
  if (!storageKey) return null;
  const path = storageKey
    .split('/')
    .map((s) => encodeURIComponent(s))
    .join('/');
  return `/api/media/${path}`;
}
