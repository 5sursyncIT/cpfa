import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/rbac';
import { csvResponse, toCsv } from '@/lib/csv';
import { prisma } from '@cpfa/db';
import type { Prisma } from '@cpfa/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) return new Response('Unauthorized', { status: 401 });
  if (!hasPermission(session.user.roles, 'admin:any')) {
    return new Response('Forbidden', { status: 403 });
  }

  const url = new URL(request.url);
  const entity = url.searchParams.get('entity');
  const action = url.searchParams.get('action');
  const q = url.searchParams.get('q');
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to + 'T23:59:59') : null;

  const where: Prisma.AuditLogWhereInput = {
    ...(entity ? { entity } : {}),
    ...(action ? { action: { contains: action } } : {}),
    ...(q
      ? {
          OR: [
            { actor: { email: { contains: q, mode: 'insensitive' } } },
            { entityId: { contains: q } },
          ],
        }
      : {}),
    ...(fromDate || toDate
      ? {
          createdAt: {
            ...(fromDate ? { gte: fromDate } : {}),
            ...(toDate ? { lte: toDate } : {}),
          },
        }
      : {}),
  };

  const items = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 10_000,
    include: { actor: { select: { firstName: true, lastName: true, email: true } } },
  });

  const rows = items.map((a) => ({
    createdAt: a.createdAt,
    action: a.action,
    entity: a.entity,
    entityId: a.entityId ?? '',
    actor: a.actor
      ? [a.actor.firstName, a.actor.lastName].filter(Boolean).join(' ') || a.actor.email
      : 'Système',
    actorEmail: a.actor?.email ?? '',
    diff: a.diff ? JSON.stringify(a.diff) : '',
  }));

  const csv = toCsv(
    ['createdAt', 'action', 'entity', 'entityId', 'actor', 'actorEmail', 'diff'],
    rows,
  );
  return csvResponse(`cpfa-audit-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}
