import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@cpfa/db';

export const dynamic = 'force-dynamic';

const fmtDate = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' });

export default async function MyRegistrationsPage() {
  const session = (await auth())!;

  const registrations = await prisma.registration.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      course: { select: { title: true } },
      seminar: { select: { title: true, startsAt: true } },
      exam: { select: { title: true } },
      payment: { select: { status: true, amountXof: true } },
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Mes inscriptions</h1>

      {registrations.length === 0 ? (
        <p className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
          Aucune inscription pour le moment.{' '}
          <Link href="/formations" className="font-medium text-foreground hover:underline">
            Parcourir les formations
          </Link>
          .
        </p>
      ) : (
        <ul className="space-y-3">
          {registrations.map((r) => {
            const target = r.course?.title ?? r.seminar?.title ?? r.exam?.title ?? '—';
            return (
              <li key={r.id}>
                <Link
                  href={`/me/inscriptions/${r.id}`}
                  className="flex items-center justify-between gap-4 rounded-lg border bg-card p-4 transition-shadow hover:shadow-sm"
                >
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">
                      {fmtDate.format(r.createdAt)} · {target.includes('Séminaire') ? 'séminaire' : r.course ? 'formation' : r.seminar ? 'séminaire' : 'concours'}
                    </p>
                    <h2 className="mt-1 text-base font-medium">{target}</h2>
                  </div>
                  <StatusBadge status={r.status} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    DRAFT: ['Brouillon', 'bg-muted text-muted-foreground'],
    SUBMITTED: ['Soumise', 'bg-amber-500/10 text-amber-700'],
    PAID: ['Payée', 'bg-blue-500/10 text-blue-700'],
    VALIDATED: ['Validée', 'bg-emerald-500/10 text-emerald-700'],
    REJECTED: ['Refusée', 'bg-destructive/10 text-destructive'],
    CANCELLED: ['Annulée', 'bg-muted text-muted-foreground'],
  };
  const [label, classes] = map[status] ?? [status, 'bg-muted text-muted-foreground'];
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${classes}`}>{label}</span>;
}
