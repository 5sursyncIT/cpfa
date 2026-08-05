import { Fragment, type ReactNode } from 'react';

// Render markdown-style `*emph*` segments as <em class="italic-emph">. Plain
// text passes through. Used by hero/headline content that comes from CMS
// SiteSettings — the editor types `*ferme dans*` and we render the brand
// italic accent without exposing raw HTML.
//
// Les retours à la ligne saisis dans le back-office sont rendus tels quels :
// un titre sur deux lignes reste sur deux lignes, sans balise à taper.
export function renderEmph(input: string | null | undefined): ReactNode {
  if (!input) return null;
  const parts = input.split(/(\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={i} className="italic-emph">
          {withLineBreaks(part.slice(1, -1))}
        </em>
      );
    }
    return <Fragment key={i}>{withLineBreaks(part)}</Fragment>;
  });
}

function withLineBreaks(text: string): ReactNode {
  if (!text.includes('\n')) return text;
  return text.split('\n').map((line, i) => (
    <Fragment key={i}>
      {i > 0 ? <br /> : null}
      {line}
    </Fragment>
  ));
}
