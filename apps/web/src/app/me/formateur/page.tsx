import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { prisma } from '@cpfa/db';
import { presignDownload } from '@cpfa/lib/storage';
import { resolveLocale } from '@/i18n/request';
import { richTags } from '@/lib/i18n-tags';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const t = await getTranslations('meFormateur');
  return { title: t('metaTitle') };
}

async function safePresignDownload(key: string | null): Promise<string | null> {
  if (!key) return null;
  try {
    return await presignDownload(key, 300);
  } catch {
    return null;
  }
}

export default async function TrainerSpacePage() {
  const session = await auth();
  if (!session?.user) redirect('/sign-in?callbackUrl=/me/formateur');

  const userId = session.user.id;

  const [profile, sessions, resources, t, locale] = await Promise.all([
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
    getTranslations('meFormateur'),
    resolveLocale(),
  ]);

  const fmtDate = new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  if (!profile) {
    return (
      <div className="col gap-5">
        <h3>{t('h3')}</h3>
        <div className="card" style={{ padding: 24 }}>
          <p>
            {t('noProfileDesc')}{' '}
            <Link href="/devenir-formateur">{t('noProfileLink')}</Link>.
          </p>
        </div>
      </div>
    );
  }

  if (profile.status === 'PENDING') {
    return (
      <div className="col gap-5">
        <h3>{t('h3')}</h3>
        <div className="card" style={{ padding: 24, background: '#fef3c7' }}>
          <h4>{t('pendingHeading')}</h4>
          <p>{t('pendingBody', { date: fmtDate.format(profile.submittedAt) })}</p>
          <p style={{ marginTop: 12 }}>
            <Link href="/devenir-formateur">{t('pendingUpdate')}</Link>
          </p>
        </div>
      </div>
    );
  }

  if (profile.status === 'REJECTED') {
    return (
      <div className="col gap-5">
        <h3>{t('h3')}</h3>
        <div className="card" style={{ padding: 24, background: '#fee2e2' }}>
          <h4>{t('rejectedHeading')}</h4>
          {profile.rejectionReason ? (
            <p>
              {t.rich('rejectedReason', { ...richTags, reason: profile.rejectionReason })}
            </p>
          ) : null}
          <p style={{ marginTop: 12 }}>
            {t('rejectedRetry')}{' '}
            <Link href="/devenir-formateur">{t('rejectedRetryLink')}</Link>
            {t('rejectedRetryTail')}
          </p>
        </div>
      </div>
    );
  }

  // APPROVED
  const cvUrl = await safePresignDownload(profile.cvKey);
  const resourcesWithUrls = await Promise.all(
    resources.map(async (r) => ({ ...r, downloadUrl: await safePresignDownload(r.storageKey) })),
  );

  return (
    <div className="col gap-5">
      <h3>{t('h3')}</h3>

      <section className="card" style={{ padding: 24 }}>
        <h4>{t('myCardHeading')}</h4>
        <dl style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '8px 16px' }}>
          <dt style={{ color: 'var(--cpfa-muted, #64748b)' }}>{t('domainsLabel')}</dt>
          <dd>{profile.domains.join(' · ') || '—'}</dd>
          {profile.experienceYears != null ? (
            <>
              <dt style={{ color: 'var(--cpfa-muted, #64748b)' }}>{t('experienceLabel')}</dt>
              <dd>
                {profile.experienceYears} {t('experienceUnit')}
              </dd>
            </>
          ) : null}
          {profile.phone ? (
            <>
              <dt style={{ color: 'var(--cpfa-muted, #64748b)' }}>{t('phoneLabel')}</dt>
              <dd>{profile.phone}</dd>
            </>
          ) : null}
          {cvUrl ? (
            <>
              <dt style={{ color: 'var(--cpfa-muted, #64748b)' }}>{t('cvLabel')}</dt>
              <dd>
                <a href={cvUrl} target="_blank" rel="noreferrer">
                  {t('downloadCv')}
                </a>
              </dd>
            </>
          ) : null}
        </dl>
        {profile.bio ? (
          <div style={{ marginTop: 16 }}>
            <div style={{ color: 'var(--cpfa-muted, #64748b)', fontSize: 13 }}>{t('bioLabel')}</div>
            <p style={{ whiteSpace: 'pre-wrap' }}>{profile.bio}</p>
          </div>
        ) : null}
      </section>

      <section className="card" style={{ padding: 24 }}>
        <h4>{t('scheduleHeading')}</h4>
        {sessions.length === 0 ? (
          <p style={{ color: 'var(--cpfa-muted, #64748b)' }}>{t('scheduleEmpty')}</p>
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
                  {t('registrantsLabel', { count: s._count.registrations })}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card" style={{ padding: 24 }}>
        <h4>{t('resourcesHeading')}</h4>
        {resourcesWithUrls.length === 0 ? (
          <p style={{ color: 'var(--cpfa-muted, #64748b)' }}>{t('resourcesEmpty')}</p>
        ) : (
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {resourcesWithUrls.map((r) => (
              <li key={r.id}>
                {r.downloadUrl ? (
                  <a href={r.downloadUrl}>{r.title}</a>
                ) : (
                  <span>{r.title}</span>
                )}
                <span
                  style={{ marginLeft: 8, fontSize: 12, color: 'var(--cpfa-muted, #64748b)' }}
                >
                  {r.course?.title ?? ''}
                  {r.module ? ` · ${r.module.title}` : ''}
                  {' · '}
                  {Math.round(r.sizeBytes / 1024)} {t('kbUnit')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
