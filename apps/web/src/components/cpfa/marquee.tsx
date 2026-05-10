import { getSetting } from '@/lib/site-settings/get';
import { resolveLocale } from '@/i18n/request';

export async function Marquee() {
  const locale = await resolveLocale();
  const items = await getSetting('home.marquee', locale);
  if (items.length === 0) return null;
  // Duplicate the items so the CSS marquee animation loops without a visible
  // seam — the keyframe slides the strip by -50% which lands exactly on the
  // start of the second copy.
  const all = [...items, ...items];
  return (
    <div className="full-bleed-bar">
      <div className="marquee">
        {all.map((it, i) => (
          <span key={i}>{it}</span>
        ))}
      </div>
    </div>
  );
}
