import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@cpfa/db';
import { LibraryCatalog } from '@/components/cpfa/library-catalog';
import { resolveLocale } from '@/i18n/request';
import { resourceToBook } from '@/lib/cpfa-mappers';
import { getSetting } from '@/lib/site-settings/get';
import { mediaUrl } from '@/lib/media';
import { richTags } from '@/lib/i18n-tags';
import { applyFigures, getSiteFigures } from '@/lib/site-figures';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const t = await getTranslations('library');
  return { title: t('metaTitle') };
}

export default async function LibraryIndexPage() {
  const [resources, t, locale, documents, figures] = await Promise.all([
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
    resolveLocale(),
    getSetting('library.documents'),
    getSiteFigures(),
  ]);

  // Official documents (Directeur §4.1) — the PDFs the admin has set, plus the
  // subscription procedure, toujours disponible : sa route sert le PDF officiel
  // déposé en médiathèque et, à défaut, le document généré depuis le site.
  const officialDocs = [
    { label: t('docRegulation'), href: mediaUrl(documents.regulationKey) },
    { label: t('procedurePdf'), href: '/bibliotheque/abonnement/procedure.pdf' },
    { label: t('docSubscriptionForm'), href: mediaUrl(documents.subscriptionFormKey) },
  ].filter((d): d is { label: string; href: string } => Boolean(d.href));

  const items = resources.map((r) => ({
    id: r.id,
    kind: r.kind,
    keywords: r.keywords,
    book: resourceToBook(
      {
        id: r.id,
        title: r.title,
        authors: r.authors,
      },
      locale,
    ),
  }));

  return (
    <div>
      <div className="page-head container">
        <div className="breadcrumb">
          CPFA · <span>{t('title')}</span>
        </div>
        <div
          className="row"
          style={{ justifyContent: 'space-between', alignItems: 'end', gap: 32 }}
        >
          <h1>{t.rich('h1', richTags)}</h1>
          <p className="fs-17 text-mid" style={{ maxWidth: 420, paddingBottom: 12 }}>
            {applyFigures(t('intro'), figures)}
          </p>
        </div>
      </div>

      <div className="container" style={{ marginBottom: 32 }}>
        <div className="panel" style={{ padding: 24 }}>
          <div
            className="row"
            style={{
              justifyContent: 'space-between',
              alignItems: 'start',
              gap: 24,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <h4 style={{ marginBottom: 4 }}>{t('officialDocsHeading')}</h4>
              <p className="fs-14 text-mid">{t('procedureHint')}</p>
            </div>
            <Link href="/bibliotheque/abonnement" className="btn btn-primary">
              {t('procedureCta')} <span className="arrow">→</span>
            </Link>
          </div>
          <div className="row gap-3" style={{ flexWrap: 'wrap', marginTop: 20 }}>
            {officialDocs.map((d) => (
              <a
                key={d.label}
                href={d.href}
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

      <div className="container">
        <LibraryCatalog items={items} />
      </div>
    </div>
  );
}
