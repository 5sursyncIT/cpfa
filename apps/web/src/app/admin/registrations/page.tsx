import { prisma } from '@cpfa/db';
import { RegistrationsTable } from './registrations-table';

export const dynamic = 'force-dynamic';

export default async function AdminRegistrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter = status === 'PAID' ? 'PAID' : status === 'VALIDATED' ? 'VALIDATED' : 'SUBMITTED';

  const registrations = await prisma.registration.findMany({
    where: { status: filter },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
      course: { select: { title: true } },
      seminar: { select: { title: true } },
      exam: { select: { title: true } },
      payment: { select: { status: true, amountXof: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Inscriptions</h1>
        <div className="flex gap-2 text-sm">
          {(['SUBMITTED', 'PAID', 'VALIDATED'] as const).map((s) => (
            <a
              key={s}
              href={`/admin/registrations?status=${s}`}
              className={`rounded-md border px-3 py-1.5 ${filter === s ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
            >
              {s}
            </a>
          ))}
        </div>
      </div>

      <RegistrationsTable registrations={registrations} />
    </div>
  );
}
