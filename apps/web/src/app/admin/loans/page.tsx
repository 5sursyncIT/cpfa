import { prisma } from '@cpfa/db';
import { LoansTable } from './loans-table';

export const dynamic = 'force-dynamic';

export default async function AdminLoansPage({
  searchParams,
}: {
  searchParams: Promise<{ overdue?: string }>;
}) {
  const { overdue } = await searchParams;
  const overdueOnly = overdue === '1';

  const loans = await prisma.loan.findMany({
    where: {
      status: 'ACTIVE',
      ...(overdueOnly ? { dueAt: { lt: new Date() } } : {}),
    },
    orderBy: [{ dueAt: 'asc' }],
    take: 100,
    include: {
      resource: { select: { title: true } },
      user: { select: { firstName: true, lastName: true, email: true } },
      subscription: { select: { cardNumber: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          Prêts {overdueOnly ? 'en retard' : 'en cours'}
        </h1>
        <div className="flex gap-2 text-sm">
          <a
            href="/admin/loans"
            className={`rounded-md border px-3 py-1.5 ${!overdueOnly ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
          >
            Tous
          </a>
          <a
            href="/admin/loans?overdue=1"
            className={`rounded-md border px-3 py-1.5 ${overdueOnly ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
          >
            En retard
          </a>
        </div>
      </div>

      <LoansTable loans={loans} />
    </div>
  );
}
