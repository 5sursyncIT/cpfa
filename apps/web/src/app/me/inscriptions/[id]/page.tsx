import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { prisma } from '@cpfa/db';
import { UploadField } from '@/components/upload/upload-field';
import { resolveLocale } from '@/i18n/request';

export const dynamic = 'force-dynamic';

const STATUS_PILL: Record<string, string> = {
  DRAFT: '',
  SUBMITTED: '',
  PAID: 'pill-orange',
  VALIDATED: 'pill-success',
  REJECTED: 'pill-warning',
  CANCELLED: '',
};

export default async function RegistrationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = (await auth())!;
  const [{ id }, t, tStatus, locale] = await Promise.all([
    params,
    getTranslations('meInscriptionDetail'),
    getTranslations('regStatus'),
    resolveLocale(),
  ]);
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

  const fmtDate = new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'fr-FR', {
    dateStyle: 'long',
  });
  const fmtDateTime = new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  // Map original FR doc labels to localised strings while preserving the
  // attachment label key used for upload routing.
  const REQUIRED_EXAM_DOCS: { key: string; label: string }[] = [
    { key: 'CV', label: t('docCV') },
    { key: "Pièce d'identité", label: t('docID') },
    { key: 'Diplôme(s) le plus récent', label: t('docDiploma') },
  ];

  const target = reg.course?.title ?? reg.seminar?.title ?? reg.exam?.title ?? '—';
  const meta = (reg.payment?.metadata ?? {}) as { qrPayload?: string; redirectUrl?: string };
  const statusClass = STATUS_PILL[reg.status] ?? '';
  const statusLabel = tStatus(
    reg.status as 'DRAFT' | 'SUBMITTED' | 'PAID' | 'VALIDATED' | 'REJECTED' | 'CANCELLED',
  );

  return (
    <div className="col gap-5">
      <div>
        <span className="eyebrow">{t('eyebrow')}</span>
        <h3 style={{ marginTop: 8 }}>{target}</h3>
      </div>

      <section className="card" style={{ padding: 24 }}>
        <div
          className="row"
          style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}
        >
          <h4>{t('fileStatusHeading')}</h4>
          <span className={'pill ' + statusClass}>
            <span className="dot"></span>
            {statusLabel}
          </span>
        </div>
        <div className="col gap-3">
          <div className="enroll-stat-row" style={{ borderTop: '1px solid var(--line)' }}>
            <span className="label">{t('submittedAt')}</span>
            <span className="value">
              {reg.submittedAt ? fmtDate.format(reg.submittedAt) : '—'}
            </span>
          </div>
          {reg.session ? (
            <div className="enroll-stat-row">
              <span className="label">{t('session')}</span>
              <span className="value">{fmtDateTime.format(reg.session.startsAt)}</span>
            </div>
          ) : null}
          {reg.seminar?.startsAt ? (
            <div className="enroll-stat-row">
              <span className="label">{t('seminarDate')}</span>
              <span className="value">{fmtDateTime.format(reg.seminar.startsAt)}</span>
            </div>
          ) : null}
          <div
            className="enroll-stat-row"
            style={{ borderBottom: '1px solid var(--line-soft)' }}
          >
            <span className="label">{t('reference')}</span>
            <span className="value mono">{reg.id.slice(0, 16).toUpperCase()}</span>
          </div>
        </div>
      </section>

      {reg.payment ? (
        <section className="card" style={{ padding: 24 }}>
          <h4>{t('paymentHeading')}</h4>
          <div className="col gap-3" style={{ marginTop: 12 }}>
            <div className="enroll-stat-row" style={{ borderTop: '1px solid var(--line)' }}>
              <span className="label">{t('amount')}</span>
              <span className="value">
                {reg.payment.amountXof.toLocaleString('fr-FR')} FCFA
              </span>
            </div>
            <div
              className="enroll-stat-row"
              style={{ borderBottom: '1px solid var(--line-soft)' }}
            >
              <span className="label">{t('state')}</span>
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
                {tStatus(
                  reg.payment.status as 'PENDING' | 'CONFIRMED' | 'FAILED' | 'REFUNDED',
                )}
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
                  {t('continuePayment')} <span className="arrow">→</span>
                </a>
              ) : (
                <>
                  {t('pendingHelp')}{' '}
                  <span className="mono" style={{ color: 'var(--ink)' }}>
                    {reg.id}
                  </span>
                  {t('pendingHelpTail')}
                </>
              )}
            </div>
          ) : null}
        </section>
      ) : null}

      {reg.examId && reg.status !== 'REJECTED' && reg.status !== 'CANCELLED' ? (
        <section className="card" style={{ padding: 24 }}>
          <h4>{t('docsHeading')}</h4>
          <p className="fs-13 text-soft" style={{ marginTop: 8 }}>
            {t('docsHelp')}
          </p>
          <div className="col gap-3" style={{ marginTop: 16 }}>
            {REQUIRED_EXAM_DOCS.map((doc) => {
              const existing = reg.attachments.find((a) => a.label === doc.key);
              return (
                <div key={doc.key}>
                  <UploadField registrationId={reg.id} label={doc.label} required />
                  {existing ? (
                    <p className="fs-13 text-soft" style={{ marginTop: 4 }}>
                      {t('docsAlreadyUploaded', {
                        fileName: existing.storageKey.split('/').pop() ?? '',
                      })}
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
          <h4>{t('convocationHeading')}</h4>
          <p className="fs-13 text-soft" style={{ marginTop: 8 }}>
            {t('convocationDesc')}
          </p>
          <a
            href={`/api/registrations/${reg.id}/convocation`}
            target="_blank"
            rel="noopener"
            className="btn btn-orange"
            style={{ marginTop: 16, alignSelf: 'flex-start' }}
          >
            {t('downloadConvocation')} <span className="arrow">→</span>
          </a>
        </section>
      ) : null}
    </div>
  );
}
