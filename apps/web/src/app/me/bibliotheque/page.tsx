import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@cpfa/db';
import { Book } from '@/components/cpfa/book';
import { resourceToBook } from '@/lib/cpfa-mappers';

export const dynamic = 'force-dynamic';

export default async function MyLibraryPage() {
  const session = (await auth())!;
  const userId = session.user.id;

  const [subscription, recommended] = await Promise.all([
    prisma.subscription.findFirst({
      where: { userId, status: 'ACTIVE' },
      select: { id: true, cardNumber: true, expiresAt: true },
    }),
    prisma.resource.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: { id: true, title: true, authors: true },
    }),
  ]);

  const fmtDate = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' });

  return (
    <div className="col gap-5">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'end' }}>
        <h3>Ma bibliothèque</h3>
        <Link href="/bibliotheque" className="btn btn-ghost btn-sm">
          Parcourir le catalogue →
        </Link>
      </div>

      {subscription ? (
        <div className="card" style={{ padding: 24 }}>
          <div className="label">Abonnement actif</div>
          <p className="fs-15" style={{ marginTop: 8 }}>
            Carte <strong className="mono">{subscription.cardNumber}</strong>
            {subscription.expiresAt
              ? ` · valable jusqu'au ${fmtDate.format(subscription.expiresAt)}`
              : ''}
            . Présentez votre carte de membre à l&apos;accueil pour consulter les ouvrages sur place.
          </p>
          <div className="row gap-2" style={{ marginTop: 12 }}>
            <a href="/api/me/card" target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">
              Télécharger ma carte (PDF)
            </a>
            <Link href="/me/abonnement" className="btn btn-ghost btn-sm">
              Gérer mon abonnement
            </Link>
          </div>
        </div>
      ) : (
        <div
          className="card"
          style={{
            background: 'var(--orange-soft)',
            borderColor: 'transparent',
            color: 'var(--orange-deep)',
            padding: 24,
          }}
        >
          <div className="label" style={{ color: 'var(--orange-deep)' }}>
            Aucun abonnement actif
          </div>
          <p className="fs-15" style={{ marginTop: 8 }}>
            L&apos;abonnement vous donne accès à la salle de consultation de la bibliothèque du CPFA.
          </p>
          <Link
            href="/me/abonnement"
            className="btn btn-orange btn-sm"
            style={{ marginTop: 12, alignSelf: 'flex-start' }}
          >
            M&apos;abonner <span className="arrow">→</span>
          </Link>
        </div>
      )}

      {recommended.length > 0 ? (
        <div>
          <h3 style={{ marginBottom: 16 }}>À découvrir au catalogue</h3>
          <div className="book-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {recommended.map((r) => (
              <Book key={r.id} b={resourceToBook(r)} href={`/bibliotheque/${r.id}`} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
