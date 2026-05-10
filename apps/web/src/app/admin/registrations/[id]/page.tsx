import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/rbac';
import { prisma } from '@cpfa/db';
import { presignDownload } from '@cpfa/lib/storage';
import { RegistrationActions } from './registration-actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Inscription — Admin CPFA' };

const fmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
const fmtXof = (n: number) => `${n.toLocaleString('fr-FR')} FCFA`;

const STATUS_PILL: Record<string, { label: string; className: string }> = {
  DRAFT: { label: 'Brouillon', className: '' },
  SUBMITTED: { label: 'Soumise', className: 'pill-warning' },
  PAID: { label: 'Réglée', className: 'pill-orange' },
  VALIDATED: { label: 'Validée', className: 'pill-success' },
  REJECTED: { label: 'Refusée', className: '' },
  CANCELLED: { label: 'Annulée', className: '' },
};

async function safePresign(key: string): Promise<string | null> {
  try {
    return await presignDownload(key, 600);
  } catch {
    return null;
  }
}

export default async function RegistrationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect('/sign-in?callbackUrl=/admin/registrations');
  if (!hasPermission(session.user.roles, 'admin:any')) redirect('/admin');

  const { id } = await params;
  const reg = await prisma.registration.findUnique({
    where: { id },
    include: {
      user: true,
      course: { select: { id: true, title: true, slug: true } },
      seminar: { select: { id: true, title: true, slug: true, startsAt: true } },
      exam: { select: { id: true, title: true, slug: true } },
      session: true,
      attachments: true,
      payment: true,
    },
  });
  if (!reg) notFound();

  const attachments = await Promise.all(
    reg.attachments.map(async (a) => ({ ...a, url: await safePresign(a.storageKey) })),
  );

  const fullName =
    [reg.user.firstName, reg.user.lastName].filter(Boolean).join(' ') || reg.user.email;
  const target = reg.course?.title ?? reg.seminar?.title ?? reg.exam?.title ?? '—';
  const kind = reg.course
    ? 'Formation'
    : reg.seminar
      ? 'Séminaire'
      : reg.exam
        ? 'Concours'
        : '—';
  const pill = STATUS_PILL[reg.status] ?? { label: reg.status, className: '' };
  const actionable = reg.status === 'SUBMITTED' || reg.status === 'PAID';

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <div className="breadcrumb">
          Admin · <Link href="/admin/registrations">Inscriptions</Link> ·{' '}
          <span>{reg.id.slice(0, 8)}</span>
        </div>
        <div
          className="row"
          style={{ justifyContent: 'space-between', alignItems: 'end', gap: 24, marginTop: 8 }}
        >
          <div>
            <h2 style={{ fontSize: 'clamp(28px, 3vw, 36px)' }}>{target}</h2>
            <div className="fs-15 text-soft" style={{ marginTop: 4 }}>
              {kind} · candidat :{' '}
              <Link
                href={`/admin/users/${reg.user.id}`}
                style={{ color: 'inherit' }}
              >
                {fullName}
              </Link>
              {' · '} reçue le {fmt.format(reg.createdAt)}
            </div>
          </div>
          <span className={'pill ' + pill.className}>{pill.label}</span>
        </div>
      </div>

      {actionable ? <RegistrationActions registrationId={reg.id} /> : null}

      <div className="admin-grid-2" style={{ marginTop: 24 }}>
        <div className="panel" style={{ padding: 24 }}>
          <h4 style={{ marginBottom: 16 }}>Candidat</h4>
          <Link
            href={`/admin/users/${reg.user.id}`}
            style={{ color: 'inherit', textDecoration: 'none' }}
          >
            <div style={{ fontWeight: 500, fontSize: 18 }}>{fullName}</div>
            <div className="fs-13 text-soft">{reg.user.email}</div>
            {reg.user.phone ? (
              <div className="fs-13 text-soft mono">{reg.user.phone}</div>
            ) : null}
          </Link>
          {reg.notes ? (
            <div style={{ marginTop: 16 }}>
              <div className="label">Notes du candidat</div>
              <p style={{ marginTop: 4, whiteSpace: 'pre-wrap', fontSize: 14 }}>{reg.notes}</p>
            </div>
          ) : null}
        </div>

        <div className="panel" style={{ padding: 24 }}>
          <h4 style={{ marginBottom: 16 }}>Paiement</h4>
          {reg.payment ? (
            <dl
              style={{
                display: 'grid',
                gridTemplateColumns: '120px 1fr',
                gap: '8px 16px',
                fontSize: 14,
              }}
            >
              <dt className="text-soft">Montant</dt>
              <dd className="mono">{fmtXof(reg.payment.amountXof)}</dd>
              <dt className="text-soft">Statut</dt>
              <dd>{reg.payment.status}</dd>
              <dt className="text-soft">Provider</dt>
              <dd className="mono">{reg.payment.provider}</dd>
              <dt className="text-soft">Reçu le</dt>
              <dd className="mono">
                {reg.payment.receivedAt ? fmt.format(reg.payment.receivedAt) : '—'}
              </dd>
              <dt></dt>
              <dd>
                <Link
                  href={`/admin/payments/${reg.payment.id}`}
                  className="btn-link fs-13"
                >
                  Voir le paiement →
                </Link>
              </dd>
            </dl>
          ) : (
            <p className="text-soft">Aucun paiement associé.</p>
          )}
        </div>
      </div>

      {attachments.length > 0 ? (
        <div className="panel" style={{ marginTop: 32 }}>
          <div className="panel-head">
            <h4>Pièces jointes</h4>
            <span className="fs-13 text-soft">{attachments.length} fichier(s)</span>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Libellé</th>
                <th>Type</th>
                <th>Taille</th>
                <th>Uploadé le</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {attachments.map((a) => (
                <tr key={a.id}>
                  <td>{a.label}</td>
                  <td className="mono fs-13">{a.mimeType}</td>
                  <td className="mono fs-13">{Math.round(a.sizeBytes / 1024)} Ko</td>
                  <td className="mono fs-13 text-soft">{fmt.format(a.uploadedAt)}</td>
                  <td>
                    {a.url ? (
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-link fs-13"
                      >
                        Ouvrir →
                      </a>
                    ) : (
                      <span className="text-soft fs-13">indisponible</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </>
  );
}
