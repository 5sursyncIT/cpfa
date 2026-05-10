import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/rbac';
import { prisma } from '@cpfa/db';
import type { Prisma } from '@cpfa/db';
import { ConfirmPaymentButton } from './confirm-payment-button';
import { RefundPaymentButton } from './refund-payment-button';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Paiements — Admin CPFA' };

const fmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' });

const STATUS_PILL: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'En attente', className: 'pill-warning' },
  CONFIRMED: { label: 'Confirmé', className: 'pill-success' },
  FAILED: { label: 'Échoué', className: '' },
  REFUNDED: { label: 'Remboursé', className: '' },
};

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
  searchParams: Promise<{
    status?: string;
    purpose?: string;
    provider?: string;
    q?: string;
  }>;
}) {
  const session = await auth();
  if (!session?.user) redirect('/sign-in?callbackUrl=/admin/payments');
  if (!hasPermission(session.user.roles, 'payment:validate')) redirect('/admin');

  const { status, purpose, provider, q } = await searchParams;

  const where: Prisma.PaymentWhereInput = {
    ...(status && STATUS_PILL[status]
      ? { status: status as Prisma.PaymentWhereInput['status'] }
      : {}),
    ...(purpose && PURPOSE_LABEL[purpose]
      ? { purpose: purpose as Prisma.PaymentWhereInput['purpose'] }
      : {}),
    ...(provider ? { provider: provider as Prisma.PaymentWhereInput['provider'] } : {}),
    ...(q
      ? {
          OR: [
            { user: { email: { contains: q, mode: 'insensitive' } } },
            { user: { firstName: { contains: q, mode: 'insensitive' } } },
            { user: { lastName: { contains: q, mode: 'insensitive' } } },
            { providerRef: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const payments = await prisma.payment.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
      subscription: { select: { cardNumber: true } },
    },
  });

  const counts = await Promise.all([
    prisma.payment.count({ where: { status: 'PENDING' } }),
    prisma.payment.count({ where: { status: 'CONFIRMED' } }),
    prisma.payment.count({ where: { status: 'FAILED' } }),
    prisma.payment.count({ where: { status: 'REFUNDED' } }),
  ]);

  const filterChips: Array<{ label: string; href: string; active: boolean; count: number }> = [
    { label: 'En attente', href: '/admin/payments?status=PENDING', active: status === 'PENDING', count: counts[0] },
    { label: 'Confirmés', href: '/admin/payments?status=CONFIRMED', active: status === 'CONFIRMED', count: counts[1] },
    { label: 'Échoués', href: '/admin/payments?status=FAILED', active: status === 'FAILED', count: counts[2] },
    { label: 'Remboursés', href: '/admin/payments?status=REFUNDED', active: status === 'REFUNDED', count: counts[3] },
  ];

  return (
    <>
      <div
        className="row"
        style={{ justifyContent: 'space-between', alignItems: 'end', marginBottom: 24, gap: 24 }}
      >
        <div>
          <div className="breadcrumb">
            Admin · <span>Paiements</span>
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 3vw, 36px)', marginTop: 8 }}>
            Paiements · {payments.length} affichés
          </h2>
        </div>
        <div className="row gap-2">
          <Link href="/admin/payments/new" className="btn btn-primary">
            + Enregistrer un paiement
          </Link>
          <a href="/api/admin/exports/payments.csv" className="btn btn-ghost">
            Export CSV
          </a>
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
              placeholder="Email, nom, ref provider"
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="filter-purpose">Objet</label>
            <select id="filter-purpose" name="purpose" defaultValue={purpose ?? ''} className="select">
              <option value="">Tous</option>
              {Object.entries(PURPOSE_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="filter-provider">Provider</label>
            <select id="filter-provider" name="provider" defaultValue={provider ?? ''} className="select">
              <option value="">Tous</option>
              <option value="WAVE">Wave</option>
              <option value="ORANGE_MONEY">Orange Money</option>
              <option value="PAYTECH">PayTech</option>
              <option value="STATIC_QR">QR statique</option>
              <option value="CASH">Espèces</option>
              <option value="BANK_TRANSFER">Virement</option>
            </select>
          </div>
          {status ? <input type="hidden" name="status" value={status} /> : null}
          <button type="submit" className="btn btn-ghost btn-sm">Filtrer</button>
          {(q || purpose || provider) ? (
            <Link
              href={status ? `/admin/payments?status=${status}` : '/admin/payments'}
              className="btn-link fs-13"
            >
              Réinitialiser
            </Link>
          ) : null}
        </div>
      </form>

      <div className="row gap-2" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        <Link
          href="/admin/payments"
          className={'pill ' + (!status ? 'pill-orange' : '')}
          style={{ textDecoration: 'none' }}
        >
          Tous · {counts[0] + counts[1] + counts[2] + counts[3]}
        </Link>
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

      <div className="panel">
        {payments.length === 0 ? (
          <p className="text-soft" style={{ padding: 24 }}>Aucun paiement ne correspond.</p>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Date</th>
                <th>Client</th>
                <th>Objet</th>
                <th>Provider</th>
                <th>Statut</th>
                <th>Montant</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => {
                const fullName =
                  [p.user.firstName, p.user.lastName].filter(Boolean).join(' ') || p.user.email;
                const pill = STATUS_PILL[p.status] ?? { label: p.status, className: '' };
                return (
                  <tr key={p.id}>
                    <td className="mono fs-13 text-soft">
                      {p.receivedAt ? fmt.format(p.receivedAt) : fmt.format(p.createdAt)}
                    </td>
                    <td>
                      <Link
                        href={`/admin/users/${p.user.id}`}
                        style={{ color: 'inherit', textDecoration: 'none' }}
                      >
                        <div style={{ fontWeight: 500 }}>{fullName}</div>
                        <div className="fs-13 text-soft">{p.user.email}</div>
                      </Link>
                    </td>
                    <td className="fs-13">{PURPOSE_LABEL[p.purpose] ?? p.purpose}</td>
                    <td className="fs-13 mono">{p.provider}</td>
                    <td><span className={'pill ' + pill.className}>{pill.label}</span></td>
                    <td className="mono">{p.amountXof.toLocaleString('fr-FR')} FCFA</td>
                    <td>
                      <div className="row gap-2">
                        {p.status === 'PENDING' ? <ConfirmPaymentButton id={p.id} /> : null}
                        {p.status === 'CONFIRMED' ? <RefundPaymentButton id={p.id} /> : null}
                        <Link href={`/admin/payments/${p.id}`} className="btn-link fs-13">
                          Détail →
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
