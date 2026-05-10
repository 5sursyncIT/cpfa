import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { prisma } from '@cpfa/db';
import { TrainerApplyForm } from './apply-form';
import { resolveLocale } from '@/i18n/request';
import { richTags } from '@/lib/i18n-tags';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const t = await getTranslations('becomeTrainer');
  return { title: t('metaTitle') };
}

export default async function BecomeTrainerPage() {
  const session = await auth();
  if (!session?.user) {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent('/devenir-formateur')}`);
  }

  const locale = await resolveLocale();
  const [profile, approvedCount, teacherTestimonials, t] = await Promise.all([
    prisma.trainerProfile.findUnique({ where: { userId: session.user.id } }),
    prisma.trainerProfile.count({ where: { status: 'APPROVED' } }),
    prisma.testimonial.findMany({
      where: { published: true, locale, scope: 'TEACHER' },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      take: 4,
    }),
    getTranslations('becomeTrainer'),
  ]);

  return (
    <div className="container" style={{ padding: '64px 0', maxWidth: 760 }}>
      <div className="breadcrumb">
        CPFA · <span>{t('breadcrumb')}</span>
      </div>
      <h1>{t.rich('h1', richTags)}</h1>
      <p style={{ color: 'var(--cpfa-muted, #475569)' }}>{t('intro')}</p>
      <p style={{ fontSize: 13, color: 'var(--cpfa-muted, #64748b)' }}>
        {t('approvedCount', { count: approvedCount })}
      </p>

      {profile?.status === 'APPROVED' ? (
        <div className="card" style={{ padding: 24, marginTop: 24 }}>
          <h3>{t('alreadyApprovedHeading')}</h3>
          <p>
            {t('alreadyApprovedDesc')}{' '}
            <Link href="/me/formateur">{t('alreadyApprovedLink')}</Link>{' '}
            {t('alreadyApprovedTail')}
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
            {t.rich('testimonialsHeading', richTags)}
          </h2>
          <div className="col gap-3">
            {teacherTestimonials.map((tm) => (
              <blockquote
                key={tm.id}
                className="card"
                style={{
                  padding: 20,
                  borderLeft: '3px solid var(--orange-deep)',
                  fontStyle: 'italic',
                }}
              >
                <p style={{ marginBottom: 8 }}>« {tm.quote} »</p>
                <footer
                  className="fs-13"
                  style={{ color: 'var(--cpfa-muted, #64748b)', fontStyle: 'normal' }}
                >
                  <strong>{tm.authorName}</strong>
                  {tm.authorRole ? ` · ${tm.authorRole}` : ''}
                </footer>
              </blockquote>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
