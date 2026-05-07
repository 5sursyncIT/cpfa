import { prisma } from '@cpfa/db';
import { ConfirmPaymentButton } from './confirm-payment-button';

export const dynamic = 'force-dynamic';

const fmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });

const PURPOSE_LABEL: Record<string, string> = {
  COURSE_REGISTRATION: 'Formation',
  SEMINAR_REGISTRATION: 'Séminaire',
  EXAM_FEE: 'Concours',
  LIBRARY_SUBSCRIPTION: 'Abonnement',
  LIBRARY_PENALTY: 'Pénalité',
  OTHER: 'Autre',
};

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter = status === 'CONFIRMED' ? 'CONFIRMED' : 'PENDING';

  const payments = await prisma.payment.findMany({
    where: { status: filter },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
      subscription: { select: { cardNumber: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Paiements</h1>
        <div className="flex items-center gap-2 text-sm">
          {(['PENDING', 'CONFIRMED'] as const).map((s) => (
            <a
              key={s}
              href={`/admin/payments?status=${s}`}
              className={`rounded-md border px-3 py-1.5 ${filter === s ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
            >
              {s}
            </a>
          ))}
          <a
            href="/api/admin/exports/payments.csv"
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            Export CSV
          </a>
        </div>
      </div>

      {payments.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun paiement dans ce statut.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full divide-y text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Reçu le</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Objet</th>
                <th className="px-4 py-3">Provider</th>
                <th className="px-4 py-3">Montant</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {payments.map((p) => {
                const fullName =
                  [p.user.firstName, p.user.lastName].filter(Boolean).join(' ') || p.user.email;
                return (
                  <tr key={p.id}>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.receivedAt ? fmt.format(p.receivedAt) : fmt.format(p.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{fullName}</div>
                      <div className="text-xs text-muted-foreground">{p.user.email}</div>
                    </td>
                    <td className="px-4 py-3">{PURPOSE_LABEL[p.purpose] ?? p.purpose}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {p.provider}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {p.amountXof.toLocaleString('fr-FR')} FCFA
                    </td>
                    <td className="px-4 py-3">
                      {p.status === 'PENDING' ? <ConfirmPaymentButton id={p.id} /> : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
