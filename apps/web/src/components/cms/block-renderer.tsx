// Public-facing renderer for CMS block content. Server component (no 'use client').
// Mirror of the editor's block schema in apps/web/src/components/cms/block-editor.tsx.
import { mediaUrl } from '@/lib/media';

type Block = {
  kind?: string;
  text?: string;
  level?: number;
  storageKey?: string;
  src?: string; // legacy fallback for older rows
  alt?: string;
  caption?: string;
  cite?: string;
  ordered?: boolean;
  items?: unknown[];
};

export function BlockRenderer({ content }: { content: unknown }) {
  if (!content || typeof content !== 'object') return null;
  const blocks = Array.isArray(content) ? (content as Block[]) : [];
  return (
    <>
      {blocks.map((b, i) => {
        if (!b || typeof b !== 'object') return null;
        switch (b.kind) {
          case 'heading': {
            const level = Math.min(Math.max(b.level ?? 2, 2), 4) as 2 | 3 | 4;
            const Tag = `h${level}` as 'h2' | 'h3' | 'h4';
            return <Tag key={i}>{b.text}</Tag>;
          }
          case 'paragraph':
            return <p key={i}>{b.text}</p>;
          case 'image': {
            const key = b.storageKey ?? b.src;
            const url = mediaUrl(key);
            if (!url) return null;
            return (
              <figure key={i}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={b.alt ?? ''} />
                {b.caption ? <figcaption>{b.caption}</figcaption> : null}
              </figure>
            );
          }
          case 'quote':
            return (
              <blockquote key={i}>
                <p>{b.text}</p>
                {b.cite ? <cite>— {b.cite}</cite> : null}
              </blockquote>
            );
          case 'list': {
            const items = Array.isArray(b.items) ? b.items.map(String) : [];
            const Tag = b.ordered ? 'ol' : 'ul';
            return (
              <Tag key={i}>
                {items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </Tag>
            );
          }
          default:
            return null;
        }
      })}
    </>
  );
}
