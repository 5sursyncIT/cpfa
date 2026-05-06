import { prisma } from '@cpfa/db';

export const dynamic = 'force-dynamic';

export default async function AdminHomePage() {
  const now = new Date();
  const [activeLoans, overdueLoans, activeSubscribers, pendingPayments] = await Promise.all([
    prisma.loan.count({ where: { status: 'ACTIVE' } }),
    prisma.loan.count({ where: { status: 'ACTIVE', dueAt: { lt: now } } }),
    prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    prisma.payment.count({ where: { status: 'PENDING' } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Abonnés actifs" value={activeSubscribers} />
        <Stat label="Prêts en cours" value={activeLoans} />
        <Stat label="Prêts en retard" value={overdueLoans} accent={overdueLoans > 0} />
        <Stat label="Paiements à valider" value={pendingPayments} />
      </div>
    </div>
  );
}

function Stat({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`rounded-lg border p-6 ${accent ? 'border-destructive/40 bg-destructive/5' : 'bg-card'}`}>
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${accent ? 'text-destructive' : ''}`}>{value}</p>
    </div>
  );
}
