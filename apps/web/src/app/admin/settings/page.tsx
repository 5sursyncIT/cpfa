import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/rbac';
import { prisma } from '@cpfa/db';
import { settingsRegistry, SETTING_KEYS } from '@/lib/site-settings/registry';
import { settingsUi } from '@/lib/site-settings/ui';
import { SettingEditor } from './setting-editor';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Paramètres du site — Admin CPFA' };

const fmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });

const ALLOWED_LOCALES = ['fr', 'en'] as const;
type AdminLocale = (typeof ALLOWED_LOCALES)[number];

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ locale?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect('/sign-in?callbackUrl=/admin/settings');
  if (!hasPermission(session.user.roles, 'cms:write')) redirect('/admin');

  const { locale: rawLocale } = await searchParams;
  const locale: AdminLocale =
    rawLocale === 'en' ? 'en' : 'fr';

  const rows = await prisma.siteSetting.findMany({
    select: {
      key: true,
      locale: true,
      value: true,
      updatedAt: true,
      updatedBy: { select: { email: true } },
    },
  });
  const ownRows = new Map(rows.filter((r) => r.locale === locale).map((r) => [r.key, r]));
  const frRows = new Map(rows.filter((r) => r.locale === 'fr').map((r) => [r.key, r]));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Paramètres du site</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Contenus transverses (bandeau d&apos;accueil, témoignages, gouvernance, coordonnées du
            pied de page). Édition par langue — les valeurs absentes héritent de la version
            française. Chaque entrée est validée selon un schéma à l&apos;enregistrement.
          </p>
        </div>
        <div className="flex gap-1 text-sm">
          {ALLOWED_LOCALES.map((loc) => (
            <a
              key={loc}
              href={`/admin/settings?locale=${loc}`}
              className={
                'rounded-md border px-3 py-1.5 ' +
                (loc === locale ? 'bg-primary text-primary-foreground' : 'bg-background')
              }
            >
              {loc.toUpperCase()}
            </a>
          ))}
        </div>
      </header>

      <div className="space-y-4">
        {SETTING_KEYS.filter((key) => settingsUi[key]).map((key) => {
          const entry = settingsRegistry[key];
          const ui = settingsUi[key]!;
          const own = ownRows.get(key);
          const fallback = locale === 'fr' ? null : frRows.get(key) ?? null;
          const value = own?.value ?? fallback?.value ?? entry.default;
          const source: 'locale' | 'fallback' | 'default' = own
            ? 'locale'
            : fallback
              ? 'fallback'
              : 'default';
          return (
            <section key={key} className="rounded-lg border bg-card p-6">
              <header className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold">{entry.label}</h2>
                  <p className="font-mono text-xs text-muted-foreground">
                    {key} · {locale}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground">
                  {source === 'locale' && own ? (
                    <>
                      Modifié le {fmt.format(own.updatedAt)}
                      {own.updatedBy?.email ? ` par ${own.updatedBy.email}` : ''}
                    </>
                  ) : source === 'fallback' ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-900">
                      Hérite du français
                    </span>
                  ) : (
                    <span className="rounded-full bg-muted px-2 py-0.5">Valeur par défaut</span>
                  )}
                </div>
              </header>

              <SettingEditor
                settingKey={key}
                locale={locale}
                ui={ui}
                initialValue={value}
                hasCustomisation={source === 'locale'}
              />
            </section>
          );
        })}
      </div>
    </div>
  );
}
