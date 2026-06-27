// Turn human text into a URL-safe slug: strip accents, lowercase, collapse
// non-alphanumerics to single hyphens, trim edge hyphens. Used so non-technical
// editors only ever type a title — the web address is derived automatically.
export function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
