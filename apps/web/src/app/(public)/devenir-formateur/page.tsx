import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@cpfa/db';
import { TrainerApplyForm } from './apply-form';
import { resolveLocale } from '@/i18n/request';

export const metadata = { title: 'Devenir formateur — CPFA' };
export const dynamic = 'force-dynamic';

export default async function BecomeTrainerPage() {
  const session = await auth();
  if (!session?.user) {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent('/devenir-formateur')}`);
  }

  const locale = await resolveLocale();
  const [profile, approvedCount, teacherTestimonials] = await Promise.all([
    prisma.trainerProfile.findUnique({ where: { userId: session.user.id } }),
    prisma.trainerProfile.count({ where: { status: 'APPROVED' } }),
    prisma.testimonial.findMany({
      where: { published: true, locale, scope: 'TEACHER' },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      take: 4,
    }),
  ]);

  return (
    <div className="container" style={{ padding: '64px 0', maxWidth: 760 }}>
      <div className="breadcrumb">
        CPFA · <span>Devenir formateur</span>
      </div>
      <h1>
        Rejoindre <em className="italic-emph">l&apos;équipe pédagogique</em>
      </h1>
      <p style={{ color: 'var(--cpfa-muted, #475569)' }}>
        Le CPFA s&apos;appuie sur un réseau de praticiens et d&apos;universitaires pour ses formations
        diplômantes, ses séminaires et ses concours blancs. Déposez votre candidature ci-dessous —
        nous reviendrons vers vous dès qu&apos;elle aura été examinée.
      </p>
      <p style={{ fontSize: 13, color: 'var(--cpfa-muted, #64748b)' }}>
        {approvedCount} formateur(s) déjà approuvé(s) sur la plateforme.
      </p>

      {profile?.status === 'APPROVED' ? (
        <div className="card" style={{ padding: 24, marginTop: 24 }}>
          <h3>Vous êtes déjà formateur</h3>
          <p>
            Votre candidature a été approuvée. Rendez-vous sur votre{' '}
            <Link href="/me/formateur">espace formateur</Link> pour mettre à jour votre fiche.
          </p>
        </div>
      ) : (
        <TrainerApplyForm
          initial={
            profile
              ? {
                  bio: profile.bio ?? '',
                  domains: profile.domains,
                  phone: profile.phone ?? undefined,
                  experienceYears: profile.experienceYears ?? undefined,
                  cvKey: profile.cvKey ?? undefined,
                  status: profile.status,
                  rejectionReason: profile.rejectionReason ?? undefined,
                }
              : undefined
          }
        />
      )}

      {teacherTestimonials.length > 0 ? (
        <section style={{ marginTop: 64 }}>
          <h2 style={{ marginBottom: 16, fontSize: 20 }}>
            Témoignages d&apos;<em className="italic-emph">enseignants</em>
          </h2>
          <div className="col gap-3">
            {teacherTestimonials.map((t) => (
              <blockquote
                key={t.id}
                className="card"
                style={{
                  padding: 20,
                  borderLeft: '3px solid var(--orange-deep)',
                  fontStyle: 'italic',
                }}
              >
                <p style={{ marginBottom: 8 }}>« {t.quote} »</p>
                <footer
                  className="fs-13"
                  style={{ color: 'var(--cpfa-muted, #64748b)', fontStyle: 'normal' }}
                >
                  <strong>{t.authorName}</strong>
                  {t.authorRole ? ` · ${t.authorRole}` : ''}
                </footer>
              </blockquote>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
