import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/rbac';
import { csvResponse, toCsv } from '@/lib/csv';
import { prisma } from '@cpfa/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session?.user) return new Response('Unauthorized', { status: 401 });
  if (!hasPermission(session.user.roles, 'payment:validate')) {
    return new Response('Forbidden', { status: 403 });
  }

  const items = await prisma.payment.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5000,
    include: { user: { select: { firstName: true, lastName: true, email: true } } },
  });

  const rows = items.map((p) => ({
    id: p.id,
    createdAt: p.createdAt,
    receivedAt: p.receivedAt ?? '',
    status: p.status,
    purpose: p.purpose,
    provider: p.provider,
    amountXof: p.amountXof,
    client: [p.user.firstName, p.user.lastName].filter(Boolean).join(' ') || p.user.email,
    email: p.user.email,
    providerRef: p.providerRef ?? '',
  }));

  const csv = toCsv(
    ['id', 'createdAt', 'receivedAt', 'status', 'purpose', 'provider', 'amountXof', 'client', 'email', 'providerRef'],
    rows,
  );
  return csvResponse(`cpfa-payments-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}
