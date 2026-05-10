import { getTranslations } from 'next-intl/server';
import { prisma } from '@cpfa/db';
import { LibraryCatalog } from '@/components/cpfa/library-catalog';
import { resourceToBook } from '@/lib/cpfa-mappers';
import { richTags } from '@/lib/i18n-tags';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const t = await getTranslations('library');
  return { title: t('metaTitle') };
}

export default async function LibraryIndexPage() {
  const [resources, t] = await Promise.all([
    prisma.resource.findMany({
      orderBy: { createdAt: 'desc' },
      take: 60,
      select: {
        id: true,
        title: true,
        authors: true,
        kind: true,
        totalCopies: true,
        keywords: true,
      },
    }),
    getTranslations('library'),
  ]);

  // Tag each resource with its current loan count for availability badges.
  const ids = resources.map((r) => r.id);
  const counts =
    ids.length === 0
      ? new Map<string, number>()
      : await prisma.loan
          .groupBy({
            by: ['resourceId'],
            where: { resourceId: { in: ids }, status: 'ACTIVE' },
            _count: { _all: true },
          })
          .then(
            (rows) => new Map(rows.map((r) => [r.resourceId, r._count._all])),
          );

  const items = resources.map((r) => ({
    id: r.id,
    kind: r.kind,
    keywords: r.keywords,
    book: resourceToBook({
      id: r.id,
      title: r.title,
      authors: r.authors,
      totalCopies: r.totalCopies,
      activeLoans: counts.get(r.id) ?? 0,
    }),
  }));

  return (
    <div>
      <div className="container page-head">
        <div className="breadcrumb">
          CPFA · <span>{t('title')}</span>
        </div>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'end', gap: 32 }}>
          <h1>{t.rich('h1', richTags)}</h1>
          <p className="fs-17 text-mid" style={{ maxWidth: 420, paddingBottom: 12 }}>
            {t('intro')}
          </p>
        </div>
      </div>

      <div className="container">
        <LibraryCatalog items={items} />
      </div>
    </div>
  );
}
