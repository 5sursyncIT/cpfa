import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@cpfa/db';
import { UploadField } from '@/components/upload/upload-field';

export const dynamic = 'force-dynamic';

const REQUIRED_EXAM_DOCS = ['CV', 'Pièce d’identité', 'Diplôme(s) le plus récent'] as const;

const fmtDate = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });
const fmtDateTime = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' });

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

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Inscription</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">{target}</h1>
      </header>

      <section className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold">État</h2>
        <dl className="mt-4 grid grid-cols-2 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Statut</dt>
          <dd className="font-medium">{reg.status}</dd>
          <dt className="text-muted-foreground">Soumise le</dt>
          <dd>{reg.submittedAt ? fmtDate.format(reg.submittedAt) : '—'}</dd>
          {reg.session ? (
            <>
              <dt className="text-muted-foreground">Session</dt>
              <dd>{fmtDateTime.format(reg.session.startsAt)}</dd>
            </>
          ) : null}
          {reg.seminar?.startsAt ? (
            <>
              <dt className="text-muted-foreground">Date du séminaire</dt>
              <dd>{fmtDateTime.format(reg.seminar.startsAt)}</dd>
            </>
          ) : null}
        </dl>
      </section>

      {reg.payment ? (
        <section className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold">Paiement</h2>
          <dl className="mt-4 grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Montant</dt>
            <dd className="font-medium">{reg.payment.amountXof.toLocaleString('fr-FR')} FCFA</dd>
            <dt className="text-muted-foreground">État</dt>
            <dd>{reg.payment.status}</dd>
          </dl>
          {reg.payment.status === 'PENDING' ? (
            <div className="mt-4 rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
              {meta.redirectUrl ? (
                <a href={meta.redirectUrl} className="font-medium text-foreground hover:underline">
                  Continuer le paiement →
                </a>
              ) : (
                <>
                  Référence à indiquer lors du paiement à l’accueil :{' '}
                  <span className="font-mono text-foreground">{reg.id}</span>. La validation est
                  effectuée par le service comptable sous 24 h.
                </>
              )}
            </div>
          ) : null}
        </section>
      ) : null}

      {reg.examId && reg.status !== 'REJECTED' && reg.status !== 'CANCELLED' ? (
        <section className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold">Pièces du dossier</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Téléversez chaque document. PDF ou image — 25 Mo maximum par fichier.
          </p>
          <div className="mt-4 space-y-3">
            {REQUIRED_EXAM_DOCS.map((label) => {
              const existing = reg.attachments.find((a) => a.label === label);
              return (
                <div key={label}>
                  <UploadField registrationId={reg.id} label={label} required />
                  {existing ? (
                    <p className="mt-1 text-xs text-muted-foreground">
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
        <section className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold">Convocation</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Votre inscription est validée. Téléchargez votre convocation officielle CPFA.
          </p>
          <a
            href={`/api/registrations/${reg.id}/convocation`}
            target="_blank"
            rel="noopener"
            className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            Télécharger la convocation (PDF)
          </a>
        </section>
      ) : null}
    </div>
  );
}
