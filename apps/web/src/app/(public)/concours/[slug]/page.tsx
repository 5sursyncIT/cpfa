import { notFound } from 'next/navigation';
import { prisma } from '@cpfa/db';
import { ExamRegistrationCard } from '@/components/exam/exam-registration-card';
import { Countdown } from '@/components/cpfa/countdown';
import { fmtXof } from '@/lib/cpfa-mappers';

export const dynamic = 'force-dynamic';

const fmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });

const KIND_LABEL: Record<string, string> = {
  CONCOURS: 'Concours',
  EXAM_BLANC: 'Examen blanc',
  CERTIFICATION: 'Certification',
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const exam = await prisma.exam.findUnique({ where: { slug }, select: { title: true } });
  return { title: exam ? `${exam.title} — CPFA` : 'Concours introuvable — CPFA' };
}

export default async function ExamPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const exam = await prisma.exam.findUnique({ where: { slug } });
  if (!exam || !exam.published) notFound();

  const now = new Date();
  const isOpen = exam.openAt <= now && exam.closeAt >= now;

  return (
    <div>
      <div className="container">
        <div className="page-head" style={{ paddingBottom: 0 }}>
          <div className="breadcrumb">
            CPFA · Concours · <span>{exam.title}</span>
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
                {KIND_LABEL[exam.kind] ?? exam.kind}
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
                  Clôture des candidatures dans
                </span>
                <Countdown deadline={exam.closeAt} />
              </>
            ) : null}

            <h3 style={{ marginTop: 48, marginBottom: 24 }}>
              Calendrier <em className="italic-emph">officiel</em>
            </h3>
            <div className="col gap-3" style={{ maxWidth: 640 }}>
              <div className="enroll-stat-row" style={{ borderTop: '1px solid var(--line)' }}>
                <span className="label">Ouverture des candidatures</span>
                <span className="value">{fmt.format(exam.openAt)}</span>
              </div>
              <div className="enroll-stat-row">
                <span className="label">Clôture</span>
                <span className="value">{fmt.format(exam.closeAt)}</span>
              </div>
              {exam.examAt ? (
                <div
                  className="enroll-stat-row"
                  style={{ borderBottom: '1px solid var(--line-soft)' }}
                >
                  <span className="label">Épreuves</span>
                  <span className="value">{fmt.format(exam.examAt)}</span>
                </div>
              ) : null}
            </div>
          </div>

          <aside className="enroll-card">
            <div>
              <div className="label">Frais de candidature</div>
              <div className="enroll-price">
                {exam.feeXof === 0 ? 'Gratuit' : exam.feeXof.toLocaleString('fr-FR')}{' '}
                {exam.feeXof === 0 ? null : <small>FCFA</small>}
              </div>
            </div>
            <div className="enroll-stat-row">
              <span className="label">Statut</span>
              <span className="value">
                {isOpen ? 'Inscriptions ouvertes' : 'Inscriptions fermées'}
              </span>
            </div>
            {exam.examAt ? (
              <div
                className="enroll-stat-row"
                style={{ borderBottom: '1px solid var(--line-soft)' }}
              >
                <span className="label">Date des épreuves</span>
                <span className="value">{fmt.format(exam.examAt)}</span>
              </div>
            ) : null}
            <ExamRegistrationCard examId={exam.id} disabled={!isOpen} />
            <p className="fs-13 text-soft" style={{ lineHeight: 1.4 }}>
              Frais payables : <strong>{fmtXof(exam.feeXof)}</strong>. Wave, Orange Money ou
              virement.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
