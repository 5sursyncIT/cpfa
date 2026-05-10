import { Fragment, type ReactNode } from 'react';

// Render markdown-style `*emph*` segments as <em class="italic-emph">. Plain
// text passes through. Used by hero/headline content that comes from CMS
// SiteSettings — the editor types `*ferme dans*` and we render the brand
// italic accent without exposing raw HTML.
export function renderEmph(input: string | null | undefined): ReactNode {
  if (!input) return null;
  const parts = input.split(/(\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={i} className="italic-emph">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}
