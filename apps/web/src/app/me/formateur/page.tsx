import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@cpfa/db';
import { presignDownload } from '@cpfa/lib/storage';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Espace formateur — CPFA' };

const fmtDate = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'long',
  timeStyle: 'short',
});

async function safePresignDownload(key: string | null): Promise<string | null> {
  if (!key) return null;
  try {
    return await presignDownload(key, 300);
  } catch {
    // Storage unconfigured in dev / signing failed — let the page render gracefully.
    return null;
  }
}

export default async function TrainerSpacePage() {
  const session = await auth();
  if (!session?.user) redirect('/sign-in?callbackUrl=/me/formateur');

  const userId = session.user.id;

  const [profile, sessions, resources] = await Promise.all([
    prisma.trainerProfile.findUnique({ where: { userId } }),
    session.user.roles.includes('FORMATEUR')
      ? prisma.courseSession.findMany({
          where: { trainerId: userId },
          orderBy: { startsAt: 'asc' },
          include: {
            course: { select: { title: true, slug: true } },
            _count: { select: { registrations: true } },
          },
        })
      : Promise.resolve([]),
    session.user.roles.includes('FORMATEUR')
      ? prisma.trainerResource.findMany({
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: {
            course: { select: { title: true, slug: true } },
            module: { select: { title: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  // No candidacy at all → suggest applying.
  if (!profile) {
    return (
      <div className="col gap-5">
        <h3>Espace formateur</h3>
        <div className="card" style={{ padding: 24 }}>
          <p>
            Vous n&apos;avez pas encore déposé de candidature.{' '}
            <Link href="/devenir-formateur">Devenir formateur</Link>.
          </p>
        </div>
      </div>
    );
  }

  if (profile.status === 'PENDING') {
    return (
      <div className="col gap-5">
        <h3>Espace formateur</h3>
        <div className="card" style={{ padding: 24, background: '#fef3c7' }}>
          <h4>Candidature en cours d&apos;examen</h4>
          <p>
            Votre dossier a été reçu le{' '}
            {new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(profile.submittedAt)}.
            Nous vous contacterons par email dès qu&apos;une décision aura été prise.
          </p>
          <p style={{ marginTop: 12 }}>
            <Link href="/devenir-formateur">Mettre à jour ma candidature</Link>
          </p>
        </div>
      </div>
    );
  }

  if (profile.status === 'REJECTED') {
    return (
      <div className="col gap-5">
        <h3>Espace formateur</h3>
        <div className="card" style={{ padding: 24, background: '#fee2e2' }}>
          <h4>Candidature non retenue</h4>
          {profile.rejectionReason ? (
            <p>
              <strong>Motif :</strong> {profile.rejectionReason}
            </p>
          ) : null}
          <p style={{ marginTop: 12 }}>
            Vous pouvez nous adresser une nouvelle candidature depuis la page{' '}
            <Link href="/devenir-formateur">Devenir formateur</Link>.
          </p>
        </div>
      </div>
    );
  }

  // APPROVED — full dashboard.
  const cvUrl = await safePresignDownload(profile.cvKey);
  const resourcesWithUrls = await Promise.all(
    resources.map(async (r) => ({ ...r, downloadUrl: await safePresignDownload(r.storageKey) })),
  );

  return (
    <div className="col gap-5">
      <h3>Espace formateur</h3>

      <section className="card" style={{ padding: 24 }}>
        <h4>Ma fiche</h4>
        <dl style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '8px 16px' }}>
          <dt style={{ color: 'var(--cpfa-muted, #64748b)' }}>Domaines</dt>
          <dd>{profile.domains.join(' · ') || '—'}</dd>
          {profile.experienceYears != null ? (
            <>
              <dt style={{ color: 'var(--cpfa-muted, #64748b)' }}>Expérience</dt>
              <dd>{profile.experienceYears} ans</dd>
            </>
          ) : null}
          {profile.phone ? (
            <>
              <dt style={{ color: 'var(--cpfa-muted, #64748b)' }}>Téléphone</dt>
              <dd>{profile.phone}</dd>
            </>
          ) : null}
          {cvUrl ? (
            <>
              <dt style={{ color: 'var(--cpfa-muted, #64748b)' }}>CV</dt>
              <dd>
                <a href={cvUrl} target="_blank" rel="noreferrer">Télécharger (PDF)</a>
              </dd>
            </>
          ) : null}
        </dl>
        {profile.bio ? (
          <div style={{ marginTop: 16 }}>
            <div style={{ color: 'var(--cpfa-muted, #64748b)', fontSize: 13 }}>Bio</div>
            <p style={{ whiteSpace: 'pre-wrap' }}>{profile.bio}</p>
          </div>
        ) : null}
      </section>

      <section className="card" style={{ padding: 24 }}>
        <h4>Mon planning</h4>
        {sessions.length === 0 ? (
          <p style={{ color: 'var(--cpfa-muted, #64748b)' }}>
            Aucune session ne vous est encore assignée. Un administrateur vous attribuera des
            sessions de formation depuis l&apos;espace admin.
          </p>
        ) : (
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sessions.map((s) => (
              <li key={s.id} style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
                <div>
                  <strong>{s.course.title}</strong>
                </div>
                <div style={{ fontSize: 13, color: 'var(--cpfa-muted, #64748b)' }}>
                  {fmtDate.format(s.startsAt)} — {fmtDate.format(s.endsAt)}
                  {s.location ? ` · ${s.location}` : ''}
                  {' · '}
                  {s._count.registrations} inscrit(s)
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card" style={{ padding: 24 }}>
        <h4>Ressources pédagogiques</h4>
        {resourcesWithUrls.length === 0 ? (
          <p style={{ color: 'var(--cpfa-muted, #64748b)' }}>
            Les supports déposés par l&apos;équipe pédagogique apparaîtront ici.
          </p>
        ) : (
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {resourcesWithUrls.map((r) => (
              <li key={r.id}>
                {r.downloadUrl ? <a href={r.downloadUrl}>{r.title}</a> : <span>{r.title}</span>}
                <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--cpfa-muted, #64748b)' }}>
                  {r.course?.title ?? ''}
                  {r.module ? ` · ${r.module.title}` : ''}
                  {' · '}
                  {Math.round(r.sizeBytes / 1024)} Ko
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
