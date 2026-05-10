import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@cpfa/db';
import { presignDownload } from '@cpfa/lib/storage';
import { JobApplicationForm } from './application-form';
import { resolveLocale } from '@/i18n/request';

export const dynamic = 'force-dynamic';

async function safePresign(key: string | null): Promise<string | null> {
  if (!key) return null;
  try {
    return await presignDownload(key, 600);
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [job, t] = await Promise.all([
    prisma.jobPosting.findUnique({
      where: { id },
      select: { title: true, companyName: true, status: true },
    }),
    getTranslations('jobDetail'),
  ]);
  if (!job || job.status !== 'PUBLISHED') return { title: t('missingTitle') };
  return { title: `${job.title} — ${job.companyName} · CPFA` };
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [job, t, tJobs, tLearners, locale] = await Promise.all([
    prisma.jobPosting.findUnique({ where: { id } }),
    getTranslations('jobDetail'),
    getTranslations('jobs'),
    getTranslations('learners'),
    resolveLocale(),
  ]);
  if (!job) notFound();

  const now = new Date();
  const open = job.status === 'PUBLISHED' && (!job.closesAt || job.closesAt >= now);
  if (!open) notFound();

  const TYPE_LABEL: Record<string, string> = {
    CDI: tJobs('typeCDI'),
    CDD: tJobs('typeCDD'),
    STAGE: tJobs('typeSTAGE'),
    FREELANCE: tJobs('typeFREELANCE'),
    ALTERNANCE: tJobs('typeALTERNANCE'),
  };
  const LEVEL_LABEL: Record<string, string> = {
    JUNIOR: tJobs('levelJUNIOR'),
    INTERMEDIAIRE: tJobs('levelINTERMEDIAIRE'),
    SENIOR: tJobs('levelSENIOR'),
    EXECUTIVE: tJobs('levelEXECUTIVE'),
  };

  const fmt = new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'fr-FR', { dateStyle: 'long' });

  const fileSheetUrl = await safePresign(job.fileSheetKey);

  return (
    <div className="container" style={{ padding: '64px 0', maxWidth: 880 }}>
      <div className="breadcrumb">
        CPFA · {tLearners('title')} ·{' '}
        <Link href="/emplois">{t('offersBreadcrumb')}</Link> · <span>{job.title}</span>
      </div>

      <header style={{ marginBottom: 32 }}>
        <div className="row" style={{ alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
          <span className="pill" style={{ fontSize: 11, padding: '2px 8px' }}>
            {TYPE_LABEL[job.type]}
          </span>
          <span className="pill" style={{ fontSize: 11, padding: '2px 8px' }}>
            {LEVEL_LABEL[job.level]}
          </span>
          {job.urgent ? (
            <span
              className="pill"
              style={{
                fontSize: 11,
                padding: '2px 8px',
                background: 'var(--orange-soft, #fff7ed)',
                color: 'var(--orange-deep, #c2410c)',
              }}
            >
              {t('urgent')}
            </span>
          ) : null}
        </div>
        <h1 style={{ fontSize: 'clamp(36px, 4.5vw, 56px)', marginBottom: 8 }}>{job.title}</h1>
        <div className="fs-15 text-mid">
          <strong>{job.companyName}</strong>
          {job.location ? ` · ${job.location}` : ''}
          {job.publishedAt ? ` · ${t('publishedOn', { date: fmt.format(job.publishedAt) })}` : ''}
          {job.closesAt ? ` · ${t('closesOn', { date: fmt.format(job.closesAt) })}` : ''}
        </div>
      </header>

      <div
        className="row gap-7"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.6fr) minmax(280px, 1fr)',
          gap: 32,
        }}
      >
        <article>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>{t('descriptionHeading')}</h2>
          <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, marginBottom: 24 }}>
            {job.description}
          </p>

          <h2 style={{ fontSize: 18, marginBottom: 8 }}>{t('profileHeading')}</h2>
          <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, marginBottom: 24 }}>
            {job.profile}
          </p>

          {fileSheetUrl ? (
            <p>
              <a
                href={fileSheetUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-ghost"
              >
                {t('downloadSheet')} →
              </a>
            </p>
          ) : null}

          <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 8 }}>
            {t('contactHeading')}
          </h2>
          <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{job.contact}</p>
        </article>

        <aside>
          <div
            className="card"
            style={{
              padding: 20,
              position: 'sticky',
              top: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <h3 style={{ fontSize: 16, marginBottom: 0 }}>{t('applyHeading')}</h3>
            <p className="fs-13 text-soft">{t('applyHelp')}</p>
            <JobApplicationForm jobId={job.id} jobTitle={job.title} />
          </div>
        </aside>
      </div>
    </div>
  );
}
