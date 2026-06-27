import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/rbac';
import { prisma } from '@cpfa/db';
import { presignDownload } from '@cpfa/lib/storage';
import { labelFor, TRAINER_STATUS_LABEL } from '@/lib/labels';
import { TrainerReviewActions } from './review-actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Candidatures formateurs — Admin CPFA' };

const fmtDate = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' });

async function safePresign(key: string | null): Promise<string | null> {
  if (!key) return null;
  try {
    return await presignDownload(key, 300);
  } catch {
    return null;
  }
}

export default async function AdminTrainersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect('/sign-in?callbackUrl=/admin/trainers');
  if (!hasPermission(session.user.roles, 'trainer:manage')) redirect('/admin');

  const { status } = await searchParams;
  const filter =
    status === 'APPROVED' || status === 'REJECTED' || status === 'PENDING'
      ? status
      : 'PENDING';

  const profiles = await prisma.trainerProfile.findMany({
    where: { status: filter },
    orderBy: { submittedAt: 'desc' },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true, roles: true } },
      reviewedBy: { select: { email: true } },
    },
  });

  const profilesWithCv = await Promise.all(
    profiles.map(async (p) => ({ ...p, cvUrl: await safePresign(p.cvKey) })),
  );

  return (
    <div className="col gap-5">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'end' }}>
        <h2>Candidatures formateurs</h2>
        <div className="row gap-2 fs-13">
          <a className={'pill' + (filter === 'PENDING' ? ' pill-success' : '')} href="?status=PENDING">
            En attente
          </a>
          <a className={'pill' + (filter === 'APPROVED' ? ' pill-success' : '')} href="?status=APPROVED">
            Approuvées
          </a>
          <a className={'pill' + (filter === 'REJECTED' ? ' pill-success' : '')} href="?status=REJECTED">
            Refusées
          </a>
        </div>
      </div>

      {profilesWithCv.length === 0 ? (
        <div className="card" style={{ padding: 24 }}>
          <p>Aucune candidature dans cet état.</p>
        </div>
      ) : (
        <div className="col gap-3">
          {profilesWithCv.map((p) => {
            const fullName =
              [p.user.firstName, p.user.lastName].filter(Boolean).join(' ') || p.user.email;
            return (
              <article key={p.id} className="card" style={{ padding: 20 }}>
                <header className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div>
                    <h4 style={{ marginBottom: 4 }}>{fullName}</h4>
                    <div className="fs-13" style={{ color: 'var(--cpfa-muted, #64748b)' }}>
                      {p.user.email}
                      {p.experienceYears != null ? ` · ${p.experienceYears} ans d'expérience` : ''}
                      {' · soumise le '}
                      {fmtDate.format(p.submittedAt)}
                    </div>
                  </div>
                  <span className="pill">{labelFor(TRAINER_STATUS_LABEL, p.status)}</span>
                </header>

                <dl style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '120px 1fr', gap: '6px 16px' }}>
                  <dt style={{ color: 'var(--cpfa-muted, #64748b)' }}>Domaines</dt>
                  <dd>{p.domains.join(' · ') || '—'}</dd>
                  {p.phone ? (
                    <>
                      <dt style={{ color: 'var(--cpfa-muted, #64748b)' }}>Téléphone</dt>
                      <dd>{p.phone}</dd>
                    </>
                  ) : null}
                  {p.cvUrl ? (
                    <>
                      <dt style={{ color: 'var(--cpfa-muted, #64748b)' }}>CV</dt>
                      <dd>
                        <a href={p.cvUrl} target="_blank" rel="noreferrer">Ouvrir le PDF</a>
                      </dd>
                    </>
                  ) : null}
                </dl>

                {p.bio ? (
                  <details style={{ marginTop: 12 }}>
                    <summary style={{ cursor: 'pointer', fontSize: 13 }}>Voir la bio</summary>
                    <p style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{p.bio}</p>
                  </details>
                ) : null}

                {p.status === 'REJECTED' && p.rejectionReason ? (
                  <p style={{ marginTop: 12, fontSize: 13, color: 'var(--danger, #b91c1c)' }}>
                    <strong>Motif du refus :</strong> {p.rejectionReason}
                  </p>
                ) : null}
                {p.reviewedBy?.email ? (
                  <p className="fs-13" style={{ color: 'var(--cpfa-muted, #64748b)', marginTop: 6 }}>
                    Examinée par {p.reviewedBy.email}
                    {p.reviewedAt ? ` le ${fmtDate.format(p.reviewedAt)}` : ''}.
                  </p>
                ) : null}

                {p.status === 'PENDING' ? (
                  <TrainerReviewActions profileId={p.id} />
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
