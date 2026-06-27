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

// Human-readable file type from a MIME type, for non-technical editors.
// Falls back to the broad category ("Image", "Document") rather than the raw
// MIME string so the media library never shows things like
// "application/vnd.openxmlformats-officedocument…".
export function fileTypeLabel(mimeType: string): string {
  const m = mimeType.toLowerCase();
  if (m === 'application/pdf') return 'PDF';
  if (m.includes('word') || m.includes('msword')) return 'Document Word';
  if (m.includes('excel') || m.includes('spreadsheet')) return 'Tableur';
  if (m.includes('presentation') || m.includes('powerpoint')) return 'Présentation';
  if (m === 'image/svg+xml') return 'Image SVG';
  if (m.startsWith('image/')) return 'Image ' + m.slice('image/'.length).toUpperCase();
  if (m.startsWith('video/')) return 'Vidéo';
  if (m.startsWith('audio/')) return 'Audio';
  return 'Document';
}
