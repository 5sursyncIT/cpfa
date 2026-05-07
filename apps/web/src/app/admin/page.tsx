import Link from 'next/link';
import { prisma } from '@cpfa/db';
import { RevenueSparkline } from '@/components/admin/revenue-sparkline';

export const dynamic = 'force-dynamic';

const fmtXof = (n: number) => `${n.toLocaleString('fr-FR')} FCFA`;
const fmtDate = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' });

export default async function AdminHomePage() {
  const now = new Date();
  const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    activeSubscribers,
    activeLoans,
    overdueLoans,
    pendingRegistrations,
    pendingPayments,
    revenue30,
    newRegs30,
    recentAudit,
    revenueRows,
  ] = await Promise.all([
    prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    prisma.loan.count({ where: { status: 'ACTIVE' } }),
    prisma.loan.count({ where: { status: 'ACTIVE', dueAt: { lt: now } } }),
    prisma.registration.count({ where: { status: { in: ['SUBMITTED', 'PAID'] } } }),
    prisma.payment.count({ where: { status: 'PENDING' } }),
    prisma.payment.aggregate({
      _sum: { amountXof: true },
      where: { status: 'CONFIRMED', receivedAt: { gte: last30 } },
    }),
    prisma.registration.count({ where: { createdAt: { gte: last30 } } }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: { actor: { select: { firstName: true, lastName: true, email: true } } },
    }),
    prisma.payment.findMany({
      where: { status: 'CONFIRMED', receivedAt: { gte: last30 } },
      select: { receivedAt: true, amountXof: true },
      orderBy: { receivedAt: 'asc' },
    }),
  ]);

  const buckets = new Map<string, number>();
  for (const p of revenueRows) {
    if (!p.receivedAt) continue;
    const key = p.receivedAt.toISOString().slice(0, 10);
    buckets.set(key, (buckets.get(key) ?? 0) + p.amountXof);
  }
  const series = Array.from(buckets.entries()).map(([date, totalXof]) => ({ date, totalXof }));

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
        <p className="text-xs text-muted-foreground">
          Données arrêtées au {fmtDate.format(now)}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Abonnés actifs" value={activeSubscribers} />
        <Stat label="Prêts en cours" value={activeLoans} />
        <Stat label="Prêts en retard" value={overdueLoans} accent={overdueLoans > 0} />
        <Stat label="Inscriptions à valider" value={pendingRegistrations} />
        <Stat label="Paiements à valider" value={pendingPayments} />
        <Stat label="Inscriptions (30j)" value={newRegs30} />
        <Stat label="Recettes 30j" value={fmtXof(revenue30._sum.amountXof ?? 0)} className="md:col-span-2" />
      </div>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-6">
          <header className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recettes (30 derniers jours)</h2>
            <Link href="/api/admin/exports/payments.csv" className="text-xs hover:underline">
              Export CSV →
            </Link>
          </header>
          <RevenueSparkline series={series} />
        </div>

        <div className="rounded-lg border bg-card p-6">
          <header className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Activité récente</h2>
            <Link href="/admin/audit" className="text-xs hover:underline">
              Journal complet →
            </Link>
          </header>
          {recentAudit.length === 0 ? (
            <p className="text-sm text-muted-foreground">Pas encore d’activité.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {recentAudit.map((a) => {
                const actor = a.actor
                  ? [a.actor.firstName, a.actor.lastName].filter(Boolean).join(' ') || a.actor.email
                  : 'Système';
                return (
                  <li key={a.id} className="flex items-baseline justify-between gap-4">
                    <span>
                      <span className="font-mono text-xs text-muted-foreground">{a.action}</span>{' '}
                      <span className="text-muted-foreground">par</span> {actor}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {fmtDate.format(a.createdAt)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  accent = false,
  className = '',
}: {
  label: string;
  value: string | number;
  accent?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg border p-6 ${accent ? 'border-destructive/40 bg-destructive/5' : 'bg-card'} ${className}`}
    >
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${accent ? 'text-destructive' : ''}`}>{value}</p>
    </div>
  );
}
