import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@cpfa/db';

export default async function MeDashboardPage() {
  const session = (await auth())!;

  const [activeLoans, activeSubscription, registrationsCount] = await Promise.all([
    prisma.loan.count({ where: { userId: session.user.id, status: 'ACTIVE' } }),
    prisma.subscription.findFirst({
      where: { userId: session.user.id, status: 'ACTIVE' },
      select: { cardNumber: true, expiresAt: true },
    }),
    prisma.registration.count({ where: { userId: session.user.id } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Bonjour {session.user.name ?? ''}</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Prêts en cours" value={activeLoans} hint={`${activeLoans}/3 max.`} />
        <Card
          title="Abonnement bibliothèque"
          value={activeSubscription ? 'Actif' : 'Inactif'}
          hint={
            activeSubscription?.expiresAt
              ? `Jusqu’au ${new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(activeSubscription.expiresAt)}`
              : 'Aucun abonnement actif'
          }
        />
        <Card title="Inscriptions" value={registrationsCount} hint="Formations & séminaires" />
      </div>

      <section className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold">Actions rapides</h2>
        <ul className="mt-4 grid gap-2 text-sm md:grid-cols-2">
          <li>
            <Link href="/me/bibliotheque" className="hover:underline">
              → Voir mes prêts
            </Link>
          </li>
          <li>
            <Link href="/me/abonnement" className="hover:underline">
              → Gérer mon abonnement
            </Link>
          </li>
          <li>
            <Link href="/bibliotheque" className="hover:underline">
              → Parcourir le catalogue
            </Link>
          </li>
          <li>
            <Link href="/formations" className="hover:underline">
              → Voir les formations
            </Link>
          </li>
        </ul>
      </section>
    </div>
  );
}

function Card({ title, value, hint }: { title: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{title}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
