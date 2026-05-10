import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/rbac';
import { prisma } from '@cpfa/db';
import { ConfirmPaymentButton } from '../confirm-payment-button';
import { RefundPaymentButton } from '../refund-payment-button';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Paiement — Admin CPFA' };

const fmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });

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
  LIBRARY_SUBSCRIPTION: 'Abonnement bibliothèque',
  LIBRARY_PENALTY: 'Pénalité bibliothèque',
  OTHER: 'Autre',
};

export default async function PaymentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect('/sign-in?callbackUrl=/admin/payments');
  if (!hasPermission(session.user.roles, 'payment:validate')) redirect('/admin');

  const { id } = await params;
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      user: true,
      subscription: { select: { id: true, cardNumber: true, tier: true, status: true } },
      registration: {
        include: {
          course: { select: { title: true } },
          seminar: { select: { title: true } },
          exam: { select: { title: true } },
        },
      },
    },
  });
  if (!payment) notFound();

  const auditEntries = await prisma.auditLog.findMany({
    where: { entity: 'Payment', entityId: id },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: { actor: { select: { firstName: true, lastName: true, email: true } } },
  });

  const fullName =
    [payment.user.firstName, payment.user.lastName].filter(Boolean).join(' ') ||
    payment.user.email;
  const pill = STATUS_PILL[payment.status] ?? { label: payment.status, className: '' };

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <div className="breadcrumb">
          Admin · <Link href="/admin/payments">Paiements</Link> · <span>{payment.id.slice(0, 8)}</span>
        </div>
        <div
          className="row"
          style={{ justifyContent: 'space-between', alignItems: 'end', gap: 24, marginTop: 8 }}
        >
          <div>
            <h2 style={{ fontSize: 'clamp(28px, 3vw, 36px)' }}>
              {payment.amountXof.toLocaleString('fr-FR')} FCFA
            </h2>
            <div className="fs-15 text-soft" style={{ marginTop: 4 }}>
              {PURPOSE_LABEL[payment.purpose] ?? payment.purpose} · {payment.provider} ·{' '}
              <code className="mono">{payment.id}</code>
            </div>
          </div>
          <span className={'pill ' + pill.className}>{pill.label}</span>
        </div>
      </div>

      <div className="row gap-2" style={{ marginBottom: 24 }}>
        {payment.status === 'PENDING' ? <ConfirmPaymentButton id={payment.id} /> : null}
        {payment.status === 'CONFIRMED' ? <RefundPaymentButton id={payment.id} /> : null}
      </div>

      <div className="admin-grid-2">
        <div className="panel" style={{ padding: 24 }}>
          <h4 style={{ marginBottom: 16 }}>Client</h4>
          <Link
            href={`/admin/users/${payment.user.id}`}
            style={{ color: 'inherit', textDecoration: 'none' }}
          >
            <div style={{ fontWeight: 500, fontSize: 18 }}>{fullName}</div>
            <div className="fs-13 text-soft">{payment.user.email}</div>
            {payment.user.phone ? (
              <div className="fs-13 text-soft mono">{payment.user.phone}</div>
            ) : null}
          </Link>
          {payment.subscription ? (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
              <div className="label">Abonnement lié</div>
              <Link
                href={`/admin/library/subscribers/${payment.subscription.id}`}
                className="btn-link fs-13"
                style={{ marginTop: 4, display: 'inline-block' }}
              >
                {payment.subscription.cardNumber} · {payment.subscription.tier} →
              </Link>
            </div>
          ) : null}
          {payment.registration ? (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
              <div className="label">Inscription liée</div>
              <div className="fs-13" style={{ marginTop: 4 }}>
                {payment.registration.course?.title ??
                  payment.registration.seminar?.title ??
                  payment.registration.exam?.title ??
                  '—'}
              </div>
            </div>
          ) : null}
        </div>

        <div className="panel" style={{ padding: 24 }}>
          <h4 style={{ marginBottom: 16 }}>Détails techniques</h4>
          <dl
            style={{
              display: 'grid',
              gridTemplateColumns: '160px 1fr',
              gap: '8px 16px',
              fontSize: 14,
            }}
          >
            <dt className="text-soft">ID</dt>
            <dd><code className="mono fs-13">{payment.id}</code></dd>
            <dt className="text-soft">Provider</dt>
            <dd className="mono">{payment.provider}</dd>
            <dt className="text-soft">Provider ref</dt>
            <dd>
              {payment.providerRef ? (
                <code className="mono fs-13">{payment.providerRef}</code>
              ) : (
                <span className="text-soft">—</span>
              )}
            </dd>
            <dt className="text-soft">Créé le</dt>
            <dd className="mono">{fmt.format(payment.createdAt)}</dd>
            <dt className="text-soft">Reçu le</dt>
            <dd className="mono">
              {payment.receivedAt ? fmt.format(payment.receivedAt) : '—'}
            </dd>
            <dt className="text-soft">Mis à jour</dt>
            <dd className="mono">{fmt.format(payment.updatedAt)}</dd>
            {payment.metadata ? (
              <>
                <dt className="text-soft" style={{ alignSelf: 'start' }}>Metadata</dt>
                <dd>
                  <pre
                    className="mono fs-13"
                    style={{
                      background: 'var(--bg-soft)',
                      padding: 8,
                      borderRadius: 'var(--r-2)',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {JSON.stringify(payment.metadata, null, 2)}
                  </pre>
                </dd>
              </>
            ) : null}
          </dl>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 32 }}>
        <div className="panel-head">
          <h4>Audit</h4>
          <span className="fs-13 text-soft">{auditEntries.length} entrée(s)</span>
        </div>
        {auditEntries.length === 0 ? (
          <p className="text-soft" style={{ padding: 24 }}>Aucune entrée d&apos;audit.</p>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Quand</th>
                <th>Acteur</th>
                <th>Action</th>
                <th>Détails</th>
              </tr>
            </thead>
            <tbody>
              {auditEntries.map((a) => {
                const actor = a.actor
                  ? [a.actor.firstName, a.actor.lastName].filter(Boolean).join(' ') ||
                    a.actor.email
                  : 'Système';
                return (
                  <tr key={a.id}>
                    <td className="mono fs-13 text-soft">{fmt.format(a.createdAt)}</td>
                    <td className="fs-13">{actor}</td>
                    <td className="mono fs-13">{a.action}</td>
                    <td className="fs-13 text-soft">
                      {a.diff ? (
                        <details>
                          <summary style={{ cursor: 'pointer' }}>voir</summary>
                          <pre
                            className="mono"
                            style={{
                              fontSize: 11,
                              marginTop: 4,
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                            }}
                          >
                            {JSON.stringify(a.diff, null, 2)}
                          </pre>
                        </details>
                      ) : (
                        '—'
                      )}
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
