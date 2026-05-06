import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@cpfa/db';
import { Button } from '@cpfa/ui';

export const dynamic = 'force-dynamic';

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

  return (
    <article className="container grid gap-12 py-16 md:grid-cols-[1fr_2fr]">
      <div className="aspect-[2/3] rounded-lg border bg-muted/30">
        {resource.coverKey ? (
          // Real cover served from S3 — skipped for now since storage isn't wired in S3.
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Couverture
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-xs uppercase tracking-widest text-muted-foreground">
            {resource.kind}
          </div>
        )}
      </div>

      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{resource.kind}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">{resource.title}</h1>
        {resource.subtitle ? (
          <p className="mt-2 text-lg text-muted-foreground">{resource.subtitle}</p>
        ) : null}

        <dl className="mt-8 grid grid-cols-2 gap-y-3 text-sm">
          {resource.authors.length > 0 ? (
            <>
              <dt className="text-muted-foreground">Auteur(s)</dt>
              <dd>{resource.authors.join(', ')}</dd>
            </>
          ) : null}
          {resource.publisher ? (
            <>
              <dt className="text-muted-foreground">Éditeur</dt>
              <dd>{resource.publisher}</dd>
            </>
          ) : null}
          {resource.publishedYear ? (
            <>
              <dt className="text-muted-foreground">Année</dt>
              <dd>{resource.publishedYear}</dd>
            </>
          ) : null}
          {resource.isbn ? (
            <>
              <dt className="text-muted-foreground">ISBN</dt>
              <dd className="font-mono text-xs">{resource.isbn}</dd>
            </>
          ) : null}
          <dt className="text-muted-foreground">Disponibilité</dt>
          <dd>
            <span
              className={
                available > 0
                  ? 'rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700'
                  : 'rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive'
              }
            >
              {available > 0 ? `${available} / ${resource.totalCopies} disponible(s)` : 'Indisponible'}
            </span>
          </dd>
        </dl>

        {resource.summary ? (
          <div className="prose prose-slate mt-8 max-w-none">
            <p>{resource.summary}</p>
          </div>
        ) : null}

        <div className="mt-10 flex gap-3">
          <Button asChild>
            <Link href="/me/bibliotheque">Mon espace bibliothèque</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/me/abonnement">Devenir abonné</Link>
          </Button>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          L’emprunt s’effectue à l’accueil de la bibliothèque (scan QR de votre carte).
          Durée : 14 jours. Pénalité de retard : 500 FCFA/jour.
        </p>
      </div>
    </article>
  );
}
