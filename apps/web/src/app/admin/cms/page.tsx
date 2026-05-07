import Link from 'next/link';
import { prisma } from '@cpfa/db';
import { Button } from '@cpfa/ui';
import { CreatePageButton } from './create-page-button';

export const dynamic = 'force-dynamic';

const fmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' });

export default async function AdminCmsPage() {
  const pages = await prisma.page.findMany({
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Pages CMS</h1>
        <CreatePageButton />
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
