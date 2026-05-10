import { getLocale } from 'next-intl/server';
import { setLocaleAction } from '@/app/actions/set-locale';

// Server-rendered language toggle. Two pills, one per locale; clicking the
// inactive one POSTs to the server action which sets the cookie then
// revalidates. No client JS needed.
export async function LocaleSwitcher() {
  const current = await getLocale();
  return (
    <div className="row gap-1" aria-label="Language">
      {(['fr', 'en'] as const).map((loc) => {
        const isActive = current === loc;
        return (
          <form key={loc} action={setLocaleAction}>
            <input type="hidden" name="locale" value={loc} />
            <button
              type="submit"
              aria-pressed={isActive}
              className="pill"
              style={{
                fontSize: 11,
                padding: '4px 10px',
                cursor: isActive ? 'default' : 'pointer',
                opacity: isActive ? 1 : 0.6,
              }}
            >
              {loc.toUpperCase()}
            </button>
          </form>
        );
      })}
    </div>
  );
}
