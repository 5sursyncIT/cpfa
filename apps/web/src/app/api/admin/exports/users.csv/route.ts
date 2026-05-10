import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/rbac';
import { csvResponse, toCsv } from '@/lib/csv';
import { prisma } from '@cpfa/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session?.user) return new Response('Unauthorized', { status: 401 });
  if (!hasPermission(session.user.roles, 'admin:any')) {
    return new Response('Forbidden', { status: 403 });
  }

  const items = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10_000,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      locale: true,
      twoFactorEnabled: true,
      roles: true,
      createdAt: true,
      emailVerifiedAt: true,
    },
  });

  const rows = items.map((u) => ({
    id: u.id,
    email: u.email,
    nom: [u.firstName, u.lastName].filter(Boolean).join(' '),
    phone: u.phone ?? '',
    locale: u.locale,
    roles: u.roles.join('|'),
    twoFactor: u.twoFactorEnabled ? 'oui' : 'non',
    emailVerified: u.emailVerifiedAt ? 'oui' : 'non',
    createdAt: u.createdAt,
  }));

  const csv = toCsv(
    ['id', 'email', 'nom', 'phone', 'locale', 'roles', 'twoFactor', 'emailVerified', 'createdAt'],
    rows,
  );
  return csvResponse(`cpfa-users-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}
