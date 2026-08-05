import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@cpfa/db';
import { formatDate, formatNumber, formatXof } from '@cpfa/lib/i18n';
import { ExamRegistrationCard } from '@/components/exam/exam-registration-card';
import { Countdown } from '@/components/cpfa/countdown';
import { resolveLocale } from '@/i18n/request';
import { richTags } from '@/lib/i18n-tags';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, t] = await Promise.all([params, getTranslations('examDetail')]);
  const exam = await prisma.exam.findUnique({ where: { slug }, select: { title: true } });
  return { title: exam ? `${exam.title} — CPFA` : t('notFound') };
}

export default async function ExamPage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, t, tExams, locale] = await Promise.all([
    params,
    getTranslations('examDetail'),
    getTranslations('examsPage'),
    resolveLocale(),
  ]);
  const exam = await prisma.exam.findUnique({ where: { slug } });
  if (!exam || !exam.published) notFound();

  // Les libellés de type d'épreuve vivent déjà dans `examsPage`, partagés avec
  // la page index — on les réutilise plutôt que d'en maintenir un second jeu.
  const KIND_KEY: Record<string, 'kindConcours' | 'kindExamBlanc' | 'kindCertification'> = {
    CONCOURS: 'kindConcours',
    EXAM_BLANC: 'kindExamBlanc',
    CERTIFICATION: 'kindCertification',
  };
  const kindKey = KIND_KEY[exam.kind];

  const now = new Date();
  const isOpen = exam.openAt <= now && exam.closeAt >= now;

  return (
    <div>
      <div className="container">
        <div className="page-head" style={{ paddingBottom: 0 }}>
          <div className="breadcrumb">
            CPFA · {t('breadcrumb')} · <span>{exam.title}</span>
          </div>
          <div className="detail-hero">
            <div>
              <span
                className="pill"
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  color: 'white',
                  borderColor: 'transparent',
                  marginBottom: 16,
                }}
              >
                {kindKey ? tExams(kindKey) : exam.kind}
              </span>
              <h1>{exam.title}</h1>
            </div>
          </div>
        </div>

        <div className="detail-grid">
          <div>
            {exam.description ? (
              <p
                className="fs-17 text-mid"
                style={{ lineHeight: 1.55, marginBottom: 32, maxWidth: 720 }}
              >
                {exam.description}
              </p>
            ) : null}

            {isOpen ? (
              <>
                <span className="eyebrow" style={{ marginBottom: 16 }}>
                  {t('deadlineEyebrow')}
                </span>
                <Countdown deadline={exam.closeAt} />
              </>
            ) : null}

            <h3 style={{ marginTop: 48, marginBottom: 24 }}>
              {t.rich('calendarHeading', richTags)}
            </h3>
            <div className="col gap-3" style={{ maxWidth: 640 }}>
              <div className="enroll-stat-row" style={{ borderTop: '1px solid var(--line)' }}>
                <span className="label">{t('opensLabel')}</span>
                <span className="value">{formatDate(exam.openAt, locale)}</span>
              </div>
              <div className="enroll-stat-row">
                <span className="label">{t('closesLabel')}</span>
                <span className="value">{formatDate(exam.closeAt, locale)}</span>
              </div>
              {exam.examAt ? (
                <div
                  className="enroll-stat-row"
                  style={{ borderBottom: '1px solid var(--line-soft)' }}
                >
                  <span className="label">{t('examsLabel')}</span>
                  <span className="value">{formatDate(exam.examAt, locale)}</span>
                </div>
              ) : null}
            </div>
          </div>

          <aside className="enroll-card">
            <div>
              <div className="label">{t('feeLabel')}</div>
              <div className="enroll-price">
                {exam.feeXof === 0 ? formatXof(0, locale) : formatNumber(exam.feeXof, locale)}{' '}
                {exam.feeXof === 0 ? null : <small>FCFA</small>}
              </div>
            </div>
            <div className="enroll-stat-row">
              <span className="label">{t('statusLabel')}</span>
              <span className="value">{isOpen ? t('statusOpen') : t('statusClosed')}</span>
            </div>
            {exam.examAt ? (
              <div
                className="enroll-stat-row"
                style={{ borderBottom: '1px solid var(--line-soft)' }}
              >
                <span className="label">{t('examDateLabel')}</span>
                <span className="value">{formatDate(exam.examAt, locale)}</span>
              </div>
            ) : null}
            <ExamRegistrationCard examId={exam.id} disabled={!isOpen} />
            <p className="fs-13 text-soft" style={{ lineHeight: 1.4 }}>
              {t.rich('feeNote', { ...richTags, price: formatXof(exam.feeXof, locale) })}
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
