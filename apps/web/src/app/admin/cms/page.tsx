import Link from 'next/link';
import { prisma } from '@cpfa/db';
import { Button } from '@cpfa/ui';
import { CreatePageButton } from './create-page-button';

export const dynamic = 'force-dynamic';

const fmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' });
const ALLOWED_LOCALES = ['fr', 'en'] as const;

export default async function AdminCmsPage({
  searchParams,
}: {
  searchParams: Promise<{ locale?: string }>;
}) {
  const { locale: rawLocale } = await searchParams;
  const locale = rawLocale === 'en' ? 'en' : 'fr';

  const pages = await prisma.page.findMany({
    where: { locale },
    orderBy: { updatedAt: 'desc' },
    take: 200,
    select: {
      id: true,
      slug: true,
      title: true,
      locale: true,
      published: true,
      updatedAt: true,
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Pages CMS</h1>
        <div className="flex gap-2">
          <div className="flex gap-1 text-sm">
            {ALLOWED_LOCALES.map((loc) => (
              <a
                key={loc}
                href={`/admin/cms?locale=${loc}`}
                className={
                  'rounded-md border px-3 py-1.5 ' +
                  (loc === locale ? 'bg-primary text-primary-foreground' : 'bg-background')
                }
              >
                {loc.toUpperCase()}
              </a>
            ))}
          </div>
          <CreatePageButton locale={locale} />
        </div>
      </div>

      {pages.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucune page CMS pour le moment. Les pages publiées sont accessibles via{' '}
          <code className="font-mono text-xs">/p/&lt;slug&gt;</code>.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border bg-card">
          {pages.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-4 p-4">
              <div>
                <Link href={`/admin/cms/${p.id}`} className="font-medium hover:underline">
                  {p.title}
                </Link>
                <div className="mt-1 text-xs text-muted-foreground">
                  /p/{p.slug} · {p.locale} · maj {fmt.format(p.updatedAt)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    p.published
                      ? 'bg-emerald-500/10 text-emerald-700'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {p.published ? 'Publiée' : 'Brouillon'}
                </span>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/admin/cms/${p.id}`}>Éditer</Link>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
