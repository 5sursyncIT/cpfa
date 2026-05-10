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

  const items = await prisma.subscription.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10_000,
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
      _count: { select: { loans: true } },
    },
  });

  const rows = items.map((s) => ({
    id: s.id,
    cardNumber: s.cardNumber,
    abonne: [s.user.firstName, s.user.lastName].filter(Boolean).join(' ') || s.user.email,
    email: s.user.email,
    tier: s.tier,
    status: s.status,
    startedAt: s.startedAt ?? '',
    expiresAt: s.expiresAt ?? '',
    totalLoans: s._count.loans,
    createdAt: s.createdAt,
  }));

  const csv = toCsv(
    [
      'id',
      'cardNumber',
      'abonne',
      'email',
      'tier',
      'status',
      'startedAt',
      'expiresAt',
      'totalLoans',
      'createdAt',
    ],
    rows,
  );
  return csvResponse(`cpfa-subscriptions-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}
