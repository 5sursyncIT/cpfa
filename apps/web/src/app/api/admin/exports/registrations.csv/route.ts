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

  const items = await prisma.registration.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5000,
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
      course: { select: { title: true } },
      seminar: { select: { title: true } },
      exam: { select: { title: true } },
      payment: { select: { amountXof: true, status: true } },
    },
  });

  const rows = items.map((r) => ({
    id: r.id,
    createdAt: r.createdAt,
    status: r.status,
    candidat: [r.user.firstName, r.user.lastName].filter(Boolean).join(' ') || r.user.email,
    email: r.user.email,
    objet: r.course?.title ?? r.seminar?.title ?? r.exam?.title ?? '',
    type: r.courseId ? 'formation' : r.seminarId ? 'seminaire' : r.examId ? 'concours' : '',
    montantXof: r.payment?.amountXof ?? '',
    paiement: r.payment?.status ?? '',
  }));

  const csv = toCsv(
    ['id', 'createdAt', 'status', 'candidat', 'email', 'objet', 'type', 'montantXof', 'paiement'],
    rows,
  );
  return csvResponse(`cpfa-registrations-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}
