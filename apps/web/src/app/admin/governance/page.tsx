import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/rbac';
import { GovernanceEditor } from './governance-editor';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Gouvernance — Admin CPFA' };

const ALLOWED = ['fr', 'en'] as const;

export default async function AdminGovernancePage({
  searchParams,
}: {
  searchParams: Promise<{ locale?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect('/sign-in?callbackUrl=/admin/governance');
  if (!hasPermission(session.user.roles, 'cms:write')) redirect('/admin');

  const { locale: rawLocale } = await searchParams;
  const locale = rawLocale === 'en' ? 'en' : 'fr';

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gouvernance</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Les membres de la gouvernance affichés sur la page « À propos ».
          </p>
        </div>
        <div className="flex gap-1 text-sm">
          {ALLOWED.map((loc) => (
            <a
              key={loc}
              href={`/admin/governance?locale=${loc}`}
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

      <section className="rounded-lg border bg-card p-6">
        <GovernanceEditor locale={locale} />
      </section>
    </div>
  );
}
