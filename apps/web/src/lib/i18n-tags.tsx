import type { ReactNode } from 'react';

// Shared rich-text tag map for next-intl `t.rich(...)` calls. Keeps the
// `<em className="italic-emph">` and `<br>` styling consistent across pages
// instead of duplicating the inline-tag definitions everywhere.
export const richTags = {
  em: (chunks: ReactNode) => <em className="italic-emph">{chunks}</em>,
  br: () => <br />,
};
