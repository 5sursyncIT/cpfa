import { getTranslations } from 'next-intl/server';
import { prisma } from '@cpfa/db';
import { LibraryCatalog } from '@/components/cpfa/library-catalog';
import { resourceToBook } from '@/lib/cpfa-mappers';
import { getSetting } from '@/lib/site-settings/get';
import { mediaUrl } from '@/lib/media';
import { richTags } from '@/lib/i18n-tags';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const t = await getTranslations('library');
  return { title: t('metaTitle') };
}

export default async function LibraryIndexPage() {
  const [resources, t, documents] = await Promise.all([
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
    getSetting('library.documents'),
  ]);

  // Official documents (Directeur §4.1) — only the PDFs the admin has set.
  const officialDocs = [
    { label: 'Règlement intérieur', key: documents.regulationKey },
    { label: "Procédure d'abonnement", key: documents.procedureKey },
    { label: "Fiche d'abonnement", key: documents.subscriptionFormKey },
  ].filter((d) => d.key);

  const items = resources.map((r) => ({
    id: r.id,
    kind: r.kind,
    keywords: r.keywords,
    book: resourceToBook({
      id: r.id,
      title: r.title,
      authors: r.authors,
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

      {officialDocs.length > 0 ? (
        <div className="container" style={{ marginBottom: 32 }}>
          <div className="panel" style={{ padding: 24 }}>
            <h4 style={{ marginBottom: 12 }}>Documents officiels</h4>
            <div className="row gap-3" style={{ flexWrap: 'wrap' }}>
              {officialDocs.map((d) => (
                <a
                  key={d.label}
                  href={mediaUrl(d.key) ?? '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-ghost"
                >
                  📄 {d.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className="container">
        <LibraryCatalog items={items} />
      </div>
    </div>
  );
}
