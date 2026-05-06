import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@cpfa/db';
import { Button } from '@cpfa/ui';

export const dynamic = 'force-dynamic';

export default async function MyLibraryPage() {
  const session = (await auth())!;

  const [loans, subscription] = await Promise.all([
    prisma.loan.findMany({
      where: { userId: session.user.id },
      orderBy: { borrowedAt: 'desc' },
      take: 30,
      include: { resource: { select: { id: true, title: true, authors: true } } },
    }),
    prisma.subscription.findFirst({
      where: { userId: session.user.id, status: 'ACTIVE' },
      select: { id: true, cardNumber: true, expiresAt: true, qrPayload: true },
    }),
  ]);

  const fmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' });
  const today = Date.now();

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Mes prêts</h1>
        {subscription ? (
          <Button asChild variant="outline">
            <a href="/api/me/card" target="_blank" rel="noopener">
              Télécharger ma carte
            </a>
          </Button>
        ) : (
          <Button asChild>
            <Link href="/me/abonnement">S’abonner</Link>
          </Button>
        )}
      </header>

      {!subscription ? (
        <p className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
          Vous n’êtes pas abonné. Souscrivez pour emprunter jusqu’à 3 ouvrages simultanément.
        </p>
      ) : null}

      {loans.length === 0 ? (
        <p className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
          Aucun prêt enregistré. Demandez un emprunt à l’accueil de la bibliothèque.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full divide-y text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Ouvrage</th>
                <th className="px-4 py-3">Emprunté le</th>
                <th className="px-4 py-3">Échéance</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Pénalité</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loans.map((loan) => {
                const overdue = loan.status === 'ACTIVE' && loan.dueAt.getTime() < today;
                return (
                  <tr key={loan.id}>
                    <td className="px-4 py-3">
                      <Link
                        href={`/bibliotheque/${loan.resource.id}`}
                        className="font-medium hover:underline"
                      >
                        {loan.resource.title}
                      </Link>
                      {loan.resource.authors.length > 0 ? (
                        <div className="text-xs text-muted-foreground">
                          {loan.resource.authors.join(', ')}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{fmt.format(loan.borrowedAt)}</td>
                    <td className={`px-4 py-3 ${overdue ? 'font-semibold text-destructive' : ''}`}>
                      {fmt.format(loan.dueAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge status={loan.status} overdue={overdue} />
                    </td>
                    <td className="px-4 py-3">
                      {loan.penaltyAmount > 0 ? `${loan.penaltyAmount.toLocaleString('fr-FR')} FCFA` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Badge({ status, overdue }: { status: string; overdue: boolean }) {
  if (overdue) return <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">En retard</span>;
  if (status === 'ACTIVE') return <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700">En cours</span>;
  if (status === 'RETURNED') return <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">Rendu</span>;
  return <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{status}</span>;
}
