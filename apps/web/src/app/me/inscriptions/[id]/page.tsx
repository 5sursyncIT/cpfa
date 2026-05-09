import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@cpfa/db';
import { UploadField } from '@/components/upload/upload-field';

export const dynamic = 'force-dynamic';

const REQUIRED_EXAM_DOCS = ['CV', "Pièce d'identité", 'Diplôme(s) le plus récent'] as const;

const fmtDate = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });
const fmtDateTime = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' });

const STATUS_PILL: Record<string, { label: string; className: string }> = {
  DRAFT: { label: 'Brouillon', className: '' },
  SUBMITTED: { label: 'En attente', className: '' },
  PAID: { label: 'Payée', className: 'pill-orange' },
  VALIDATED: { label: 'Confirmée', className: 'pill-success' },
  REJECTED: { label: 'Refusée', className: 'pill-warning' },
  CANCELLED: { label: 'Annulée', className: '' },
};

export default async function RegistrationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = (await auth())!;
  const { id } = await params;
  const reg = await prisma.registration.findFirst({
    where: { id, userId: session.user.id },
    include: {
      course: { select: { title: true, priceXof: true } },
      seminar: { select: { title: true, priceXof: true, startsAt: true, location: true } },
      exam: { select: { title: true, feeXof: true } },
      session: { select: { startsAt: true, location: true } },
      payment: true,
      attachments: { select: { id: true, label: true, storageKey: true } },
    },
  });
  if (!reg) notFound();

  const target = reg.course?.title ?? reg.seminar?.title ?? reg.exam?.title ?? '—';
  const meta = (reg.payment?.metadata ?? {}) as { qrPayload?: string; redirectUrl?: string };
  const status = STATUS_PILL[reg.status] ?? { label: reg.status, className: '' };

  return (
    <div className="col gap-5">
      <div>
        <span className="eyebrow">Inscription</span>
        <h3 style={{ marginTop: 8 }}>{target}</h3>
      </div>

      <section className="card" style={{ padding: 24 }}>
        <div
          className="row"
          style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}
        >
          <h4>État du dossier</h4>
          <span className={'pill ' + status.className}>
            <span className="dot"></span>
            {status.label}
          </span>
        </div>
        <div className="col gap-3">
          <div className="enroll-stat-row" style={{ borderTop: '1px solid var(--line)' }}>
            <span className="label">Soumise le</span>
            <span className="value">
              {reg.submittedAt ? fmtDate.format(reg.submittedAt) : '—'}
            </span>
          </div>
          {reg.session ? (
            <div className="enroll-stat-row">
              <span className="label">Session</span>
              <span className="value">{fmtDateTime.format(reg.session.startsAt)}</span>
            </div>
          ) : null}
          {reg.seminar?.startsAt ? (
            <div className="enroll-stat-row">
              <span className="label">Date du séminaire</span>
              <span className="value">{fmtDateTime.format(reg.seminar.startsAt)}</span>
            </div>
          ) : null}
          <div className="enroll-stat-row" style={{ borderBottom: '1px solid var(--line-soft)' }}>
            <span className="label">Référence</span>
            <span className="value mono">{reg.id.slice(0, 16).toUpperCase()}</span>
          </div>
        </div>
      </section>

      {reg.payment ? (
        <section className="card" style={{ padding: 24 }}>
          <h4>Paiement</h4>
          <div className="col gap-3" style={{ marginTop: 12 }}>
            <div className="enroll-stat-row" style={{ borderTop: '1px solid var(--line)' }}>
              <span className="label">Montant</span>
              <span className="value">
                {reg.payment.amountXof.toLocaleString('fr-FR')} FCFA
              </span>
            </div>
            <div className="enroll-stat-row" style={{ borderBottom: '1px solid var(--line-soft)' }}>
              <span className="label">État</span>
              <span
                className={
                  'pill ' +
                  (reg.payment.status === 'CONFIRMED'
                    ? 'pill-success'
                    : reg.payment.status === 'PENDING'
                      ? 'pill-orange'
                      : '')
                }
              >
                {reg.payment.status}
              </span>
            </div>
          </div>
          {reg.payment.status === 'PENDING' ? (
            <div
              style={{
                marginTop: 16,
                padding: 16,
                background: 'var(--bg-soft)',
                borderRadius: 'var(--r-2)',
                fontSize: 13,
                color: 'var(--ink-mid)',
              }}
            >
              {meta.redirectUrl ? (
                <a href={meta.redirectUrl} className="btn btn-orange">
                  Continuer le paiement <span className="arrow">→</span>
                </a>
              ) : (
                <>
                  Référence à indiquer lors du paiement à l&apos;accueil :{' '}
                  <span className="mono" style={{ color: 'var(--ink)' }}>
                    {reg.id}
                  </span>
                  . La validation est effectuée par le service comptable sous 24 h.
                </>
              )}
            </div>
          ) : null}
        </section>
      ) : null}

      {reg.examId && reg.status !== 'REJECTED' && reg.status !== 'CANCELLED' ? (
        <section className="card" style={{ padding: 24 }}>
          <h4>Pièces du dossier</h4>
          <p className="fs-13 text-soft" style={{ marginTop: 8 }}>
            Téléversez chaque document. PDF ou image — 25 Mo maximum par fichier.
          </p>
          <div className="col gap-3" style={{ marginTop: 16 }}>
            {REQUIRED_EXAM_DOCS.map((label) => {
              const existing = reg.attachments.find((a) => a.label === label);
              return (
                <div key={label}>
                  <UploadField registrationId={reg.id} label={label} required />
                  {existing ? (
                    <p className="fs-13 text-soft" style={{ marginTop: 4 }}>
                      Déjà téléversé : {existing.storageKey.split('/').pop()}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {reg.status === 'VALIDATED' ? (
        <section className="card" style={{ padding: 24 }}>
          <h4>Convocation</h4>
          <p className="fs-13 text-soft" style={{ marginTop: 8 }}>
            Votre inscription est validée. Téléchargez votre convocation officielle CPFA.
          </p>
          <a
            href={`/api/registrations/${reg.id}/convocation`}
            target="_blank"
            rel="noopener"
            className="btn btn-orange"
            style={{ marginTop: 16, alignSelf: 'flex-start' }}
          >
            Télécharger la convocation (PDF) <span className="arrow">→</span>
          </a>
        </section>
      ) : null}
    </div>
  );
}
