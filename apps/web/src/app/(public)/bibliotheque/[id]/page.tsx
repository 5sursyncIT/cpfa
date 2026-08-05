import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@cpfa/db';
import { formatNumber } from '@cpfa/lib/i18n';
import { resolveLocale } from '@/i18n/request';
import { pickCover, resourceKindLabel } from '@/lib/cpfa-mappers';
import { LIBRARY_DAILY_PENALTY_XOF, LIBRARY_LOAN_DAYS } from '@/lib/library-rules';

export const dynamic = 'force-dynamic';

type Cover = 'navy' | 'orange' | 'ink' | 'cream' | 'olive';
const COVER_PALETTE: Cover[] = ['navy', 'orange', 'ink', 'cream', 'olive'];

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, t] = await Promise.all([params, getTranslations('resourceDetail')]);
  const resource = await prisma.resource.findUnique({ where: { id }, select: { title: true } });
  return { title: resource ? `${resource.title} — CPFA` : t('notFound') };
}

export default async function ResourcePage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, t, locale] = await Promise.all([
    params,
    getTranslations('resourceDetail'),
    resolveLocale(),
  ]);
  const resource = await prisma.resource.findUnique({
    where: { id },
    include: { category: true },
  });
  if (!resource) notFound();

  const cover = pickCover<Cover>(resource.id, COVER_PALETTE);
  const author = (resource.authors[0] ?? t('anonymous')).toUpperCase();

  return (
    <div>
      <div className="container">
        <div className="page-head" style={{ paddingBottom: 32 }}>
          <div className="breadcrumb">
            CPFA · {t('breadcrumb')} · <span>{resource.title}</span>
          </div>
        </div>

        <div className="detail-grid" style={{ gridTemplateColumns: '380px 1fr', gap: 64, paddingTop: 0 }}>
          <div>
            <div
              className={`book-cover ${cover}`}
              style={{ width: '100%', aspectRatio: '2 / 3', maxWidth: 340 }}
            >
              <div className="book-author-on-cover">{author}</div>
              <div className="book-title-on-cover" style={{ fontSize: 28, lineHeight: 1.05 }}>
                {resource.title}
              </div>
            </div>
            <div style={{ marginTop: 24 }}>
              <span className="pill pill-success">
                <span className="dot"></span>
                {t('onSiteBadge')}
              </span>
            </div>
          </div>

          <div>
            <span className="eyebrow" style={{ marginBottom: 16 }}>
              {resourceKindLabel(resource.kind, locale)}
            </span>
            <h1 style={{ fontSize: 'clamp(36px, 4vw, 56px)', marginTop: 8 }}>
              {resource.title}
            </h1>
            {resource.subtitle ? (
              <p
                className="fs-17 text-mid"
                style={{ marginTop: 16, lineHeight: 1.45 }}
              >
                {resource.subtitle}
              </p>
            ) : null}

            <div style={{ marginTop: 32 }} className="col gap-3">
              {resource.authors.length > 0 ? (
                <div className="enroll-stat-row" style={{ borderTop: '1px solid var(--line)' }}>
                  <span className="label">{t('authorsLabel')}</span>
                  <span className="value">{resource.authors.join(', ')}</span>
                </div>
              ) : null}
              {resource.publisher ? (
                <div className="enroll-stat-row">
                  <span className="label">{t('publisherLabel')}</span>
                  <span className="value">{resource.publisher}</span>
                </div>
              ) : null}
              {resource.publishedYear ? (
                <div className="enroll-stat-row">
                  <span className="label">{t('yearLabel')}</span>
                  <span className="value">{resource.publishedYear}</span>
                </div>
              ) : null}
              {resource.isbn ? (
                <div className="enroll-stat-row">
                  <span className="label">{t('isbnLabel')}</span>
                  <span className="value mono">{resource.isbn}</span>
                </div>
              ) : null}
              <div className="enroll-stat-row" style={{ borderBottom: '1px solid var(--line-soft)' }}>
                <span className="label">{t('languageLabel')}</span>
                <span className="value">{resource.language.toUpperCase()}</span>
              </div>
            </div>

            {resource.summary ? (
              <p
                className="fs-15 text-mid"
                style={{ marginTop: 32, maxWidth: 640, lineHeight: 1.55 }}
              >
                {resource.summary}
              </p>
            ) : null}

            <div className="row gap-3" style={{ marginTop: 32 }}>
              <Link href="/me/bibliotheque" className="btn btn-primary">
                {t('myLibraryCta')} <span className="arrow">→</span>
              </Link>
              <Link href="/me/abonnement" className="btn btn-ghost">
                {t('subscribeCta')}
              </Link>
            </div>

            <p className="fs-13 text-soft" style={{ marginTop: 24, lineHeight: 1.45 }}>
              {t('loanNote', {
                days: LIBRARY_LOAN_DAYS,
                penalty: formatNumber(LIBRARY_DAILY_PENALTY_XOF, locale),
              })}
            </p>
          </div>
        </div>

        <div style={{ height: 96 }}></div>
      </div>
    </div>
  );
}
