import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@cpfa/db';
import { pickCover, resourceKindLabel } from '@/lib/cpfa-mappers';

export const dynamic = 'force-dynamic';

type Cover = 'navy' | 'orange' | 'ink' | 'cream' | 'olive';
const COVER_PALETTE: Cover[] = ['navy', 'orange', 'ink', 'cream', 'olive'];

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const resource = await prisma.resource.findUnique({ where: { id }, select: { title: true } });
  return { title: resource ? `${resource.title} — CPFA` : 'Ressource introuvable — CPFA' };
}

export default async function ResourcePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const resource = await prisma.resource.findUnique({
    where: { id },
    include: { category: true },
  });
  if (!resource) notFound();

  const onLoan = await prisma.loan.count({ where: { resourceId: id, status: 'ACTIVE' } });
  const available = Math.max(0, resource.totalCopies - onLoan);
  const cover = pickCover<Cover>(resource.id, COVER_PALETTE);
  const author = (resource.authors[0] ?? 'Anonyme').toUpperCase();

  return (
    <div>
      <div className="container">
        <div className="page-head" style={{ paddingBottom: 32 }}>
          <div className="breadcrumb">
            CPFA · Bibliothèque · <span>{resource.title}</span>
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
              <span
                className={
                  'pill ' + (available > 0 ? 'pill-success' : 'pill-warning')
                }
              >
                <span className="dot"></span>
                {available > 0
                  ? `${available} / ${resource.totalCopies} disponible(s)`
                  : 'Indisponible'}
              </span>
            </div>
          </div>

          <div>
            <span className="eyebrow" style={{ marginBottom: 16 }}>
              {resourceKindLabel(resource.kind)}
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
                  <span className="label">Auteur(s)</span>
                  <span className="value">{resource.authors.join(', ')}</span>
                </div>
              ) : null}
              {resource.publisher ? (
                <div className="enroll-stat-row">
                  <span className="label">Éditeur</span>
                  <span className="value">{resource.publisher}</span>
                </div>
              ) : null}
              {resource.publishedYear ? (
                <div className="enroll-stat-row">
                  <span className="label">Année</span>
                  <span className="value">{resource.publishedYear}</span>
                </div>
              ) : null}
              {resource.isbn ? (
                <div className="enroll-stat-row">
                  <span className="label">ISBN</span>
                  <span className="value mono">{resource.isbn}</span>
                </div>
              ) : null}
              <div className="enroll-stat-row" style={{ borderBottom: '1px solid var(--line-soft)' }}>
                <span className="label">Langue</span>
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
                Mon espace bibliothèque <span className="arrow">→</span>
              </Link>
              <Link href="/me/abonnement" className="btn btn-ghost">
                Devenir abonné
              </Link>
            </div>

            <p className="fs-13 text-soft" style={{ marginTop: 24, lineHeight: 1.45 }}>
              L&apos;emprunt s&apos;effectue à l&apos;accueil de la bibliothèque (scan QR de
              votre carte). Durée : 14 jours. Pénalité de retard : 500 FCFA/jour.
            </p>
          </div>
        </div>

        <div style={{ height: 96 }}></div>
      </div>
    </div>
  );
}
