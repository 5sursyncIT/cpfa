import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/rbac';
import { prisma } from '@cpfa/db';
import type { Prisma } from '@cpfa/db';
import { LoansTable } from './loans-table';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Prêts — Admin CPFA' };

const STATUS_OPTIONS: Array<[string, string]> = [
  ['ACTIVE', 'En cours'],
  ['RETURNED', 'Rendus'],
  ['LOST', 'Perdus'],
  ['OVERDUE', 'Statut OVERDUE'],
];

export default async function AdminLoansPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    overdue?: string;
    q?: string;
  }>;
}) {
  const session = await auth();
  if (!session?.user) redirect('/sign-in?callbackUrl=/admin/loans');
  if (!hasPermission(session.user.roles, 'library:manage')) redirect('/admin');

  const { status, overdue, q } = await searchParams;
  const overdueOnly = overdue === '1';

  const where: Prisma.LoanWhereInput = {
    ...(overdueOnly
      ? { status: 'ACTIVE', dueAt: { lt: new Date() } }
      : status
        ? { status: status as Prisma.LoanWhereInput['status'] }
        : { status: 'ACTIVE' }),
    ...(q
      ? {
          OR: [
            { resource: { title: { contains: q, mode: 'insensitive' } } },
            { user: { email: { contains: q, mode: 'insensitive' } } },
            { user: { firstName: { contains: q, mode: 'insensitive' } } },
            { user: { lastName: { contains: q, mode: 'insensitive' } } },
            { subscription: { cardNumber: { contains: q, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };

  const loans = await prisma.loan.findMany({
    where,
    orderBy: [{ borrowedAt: 'desc' }],
    take: 200,
    include: {
      resource: { select: { title: true } },
      user: { select: { firstName: true, lastName: true, email: true } },
      subscription: { select: { id: true, cardNumber: true } },
    },
  });

  const counts = await Promise.all([
    prisma.loan.count({ where: { status: 'ACTIVE' } }),
    prisma.loan.count({ where: { status: 'ACTIVE', dueAt: { lt: new Date() } } }),
    prisma.loan.count({ where: { status: 'RETURNED' } }),
    prisma.loan.count({ where: { status: 'LOST' } }),
  ]);

  const filterChips: Array<{ label: string; href: string; active: boolean; count: number }> = [
    {
      label: 'Tous actifs',
      href: '/admin/loans',
      active: !overdueOnly && (!status || status === 'ACTIVE'),
      count: counts[0],
    },
    {
      label: 'En retard',
      href: '/admin/loans?overdue=1',
      active: overdueOnly,
      count: counts[1],
    },
    {
      label: 'Rendus',
      href: '/admin/loans?status=RETURNED',
      active: !overdueOnly && status === 'RETURNED',
      count: counts[2],
    },
    {
      label: 'Perdus',
      href: '/admin/loans?status=LOST',
      active: !overdueOnly && status === 'LOST',
      count: counts[3],
    },
  ];

  return (
    <>
      <div
        className="row"
        style={{ justifyContent: 'space-between', alignItems: 'end', marginBottom: 24, gap: 24 }}
      >
        <div>
          <div className="breadcrumb">
            Admin · <Link href="/admin/library">Bibliothèque</Link> · <span>Prêts</span>
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 3vw, 36px)', marginTop: 8 }}>
            Prêts <span className="text-soft">· {loans.length} affichés</span>
          </h2>
        </div>
        <div className="row gap-2">
          <a href="/api/admin/exports/loans.csv" className="btn btn-ghost">
            Export CSV
          </a>
          <Link href="/admin/library/borrow" className="btn btn-primary">
            + Prêter un ouvrage
          </Link>
        </div>
      </div>

      <form className="panel" style={{ padding: 16, marginBottom: 16 }}>
        <div className="row gap-3" style={{ flexWrap: 'wrap', alignItems: 'end' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label className="label" htmlFor="filter-q">Recherche</label>
            <input
              id="filter-q"
              name="q"
              defaultValue={q ?? ''}
              placeholder="Titre, abonné, n° de carte"
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="filter-status">Statut</label>
            <select
              id="filter-status"
              name="status"
              defaultValue={overdueOnly ? '' : status ?? ''}
              className="select"
            >
              <option value="">Tous</option>
              {STATUS_OPTIONS.map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-ghost btn-sm">Filtrer</button>
          {(q || status || overdueOnly) ? (
            <Link href="/admin/loans" className="btn-link fs-13">Réinitialiser</Link>
          ) : null}
        </div>
      </form>

      <div className="row gap-2" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        {filterChips.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className={'pill ' + (c.active ? 'pill-orange' : '')}
            style={{ textDecoration: 'none' }}
          >
            {c.label} · {c.count}
          </Link>
        ))}
      </div>

      <LoansTable
        loans={loans.map((l) => ({
          id: l.id,
          status: l.status,
          borrowedAt: l.borrowedAt,
          dueAt: l.dueAt,
          returnedAt: l.returnedAt,
          penaltyAmount: l.penaltyAmount,
          notes: l.notes,
          resource: l.resource,
          user: l.user,
          subscription: l.subscription,
        }))}
      />
    </>
  );
}
