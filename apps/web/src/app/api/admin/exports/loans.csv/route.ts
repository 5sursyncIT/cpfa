import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/rbac';
import { csvResponse, toCsv } from '@/lib/csv';
import { prisma } from '@cpfa/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session?.user) return new Response('Unauthorized', { status: 401 });
  if (!hasPermission(session.user.roles, 'library:manage')) {
    return new Response('Forbidden', { status: 403 });
  }

  const items = await prisma.loan.findMany({
    orderBy: { borrowedAt: 'desc' },
    take: 5000,
    include: {
      resource: { select: { title: true, kind: true } },
      user: { select: { firstName: true, lastName: true, email: true } },
      subscription: { select: { cardNumber: true } },
    },
  });

  const rows = items.map((l) => ({
    id: l.id,
    borrowedAt: l.borrowedAt,
    dueAt: l.dueAt,
    returnedAt: l.returnedAt ?? '',
    status: l.status,
    penaltyXof: l.penaltyAmount,
    ressource: l.resource.title,
    type: l.resource.kind,
    abonne: [l.user.firstName, l.user.lastName].filter(Boolean).join(' ') || l.user.email,
    email: l.user.email,
    carte: l.subscription.cardNumber,
  }));

  const csv = toCsv(
    [
      'id',
      'borrowedAt',
      'dueAt',
      'returnedAt',
      'status',
      'penaltyXof',
      'ressource',
      'type',
      'abonne',
      'email',
      'carte',
    ],
    rows,
  );
  return csvResponse(`cpfa-loans-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}
