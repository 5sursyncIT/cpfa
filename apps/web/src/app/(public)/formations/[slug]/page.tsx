import { notFound } from 'next/navigation';
import { prisma } from '@cpfa/db';
import { EnrollLauncher } from '@/components/cpfa/enroll-launcher';
import { fmtXof, durationLabel } from '@/lib/cpfa-mappers';
import { applicationStatusAt } from '@/lib/course-rules';

export const dynamic = 'force-dynamic';

const fmtDate = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });

const COURSE_CATEGORY: Record<string, string> = {
  DIPLOMANT: 'Cursus diplômant',
  CERTIFIANT: 'Certification',
  CARTE: 'Sur mesure',
  AUDITORAT: 'Auditorat',
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await prisma.course.findUnique({ where: { slug }, select: { title: true } });
  return { title: course ? `${course.title} — CPFA` : 'Formation introuvable — CPFA' };
}

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      modules: {
        orderBy: { position: 'asc' },
        include: { lessons: { orderBy: { position: 'asc' } } },
      },
      sessions: { where: { startsAt: { gte: new Date() } }, orderBy: { startsAt: 'asc' } },
    },
  });
  if (!course || !course.published) notFound();

  const category = COURSE_CATEGORY[course.kind] ?? course.kind;
  const sessionsLabel =
    course.sessions.length > 0
      ? course.sessions
          .slice(0, 2)
          .map((s) => fmtDate.format(s.startsAt))
          .join(' · ')
      : 'À programmer';

  // Admission criteria — generic, but FR-CIMA appropriate.
  const admissions = [
    'Diplôme reconnu CAMES de niveau Bac+4 minimum (toutes disciplines)',
    "Réussite au concours d'entrée — 4 épreuves écrites + entretien",
    'Expérience professionnelle bienvenue mais non obligatoire',
    'Maîtrise du français écrit et oral · niveau B2 anglais souhaitable',
  ];

  return (
    <div>
      <div className="container">
        <div className="page-head" style={{ paddingBottom: 0 }}>
          <div className="breadcrumb">
            CPFA · Formations · <span>{course.title}</span>
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
                {category}
              </span>
              <h1>{course.title}</h1>
            </div>
          </div>
        </div>

        <div className="detail-grid">
          <div>
            {course.description ? (
              <p
                className="fs-17 text-mid"
                style={{ lineHeight: 1.55, marginBottom: 32, maxWidth: 720 }}
              >
                {course.description}
              </p>
            ) : null}

            {course.modules.length > 0 ? (
              <>
                <h3 style={{ marginBottom: 24 }}>
                  Programme — <em className="italic-emph">{course.modules.length} modules</em>
                </h3>
                <div className="module-list">
                  {course.modules.map((mod) => {
                    const totalMinutes = mod.lessons.reduce(
                      (sum, l) => sum + (l.durationMinutes ?? 0),
                      0,
                    );
                    return (
                      <div key={mod.id} className="module">
                        <div className="module-num">M{String(mod.position).padStart(2, '0')}</div>
                        <div>
                          <div className="module-title">{mod.title}</div>
                          {mod.lessons.length > 0 ? (
                            <p className="module-desc">
                              {mod.lessons.map((l) => l.title).join(' · ')}
                            </p>
                          ) : null}
                        </div>
                        <div className="module-duration">
                          {totalMinutes > 0 ? `${Math.round(totalMinutes / 60)}h` : '—'}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ height: 64 }}></div>
              </>
            ) : null}

            <h3 style={{ marginBottom: 24 }}>Conditions d&apos;admission</h3>
            <div className="col gap-3" style={{ maxWidth: 720 }}>
              {admissions.map((t, i) => (
                <div
                  key={i}
                  className="row gap-3"
                  style={{
                    padding: '12px 0',
                    borderBottom: '1px solid var(--line-soft)',
                    alignItems: 'start',
                  }}
                >
                  <span className="mono fs-13 text-soft" style={{ minWidth: 28 }}>
                    0{i + 1}
                  </span>
                  <span className="fs-15">{t}</span>
                </div>
              ))}
            </div>
          </div>

          <aside className="enroll-card">
            <div>
              <div className="label">Frais de scolarité</div>
              <div className="enroll-price">
                {course.priceXof.toLocaleString('fr-FR')}{' '}
                <small>FCFA</small>
              </div>
            </div>
            <div className="enroll-stat-row">
              <span className="label">Durée</span>
              <span className="value">{durationLabel(course.durationHours)}</span>
            </div>
            <div className="enroll-stat-row">
              <span className="label">Niveau requis</span>
              <span className="value">{course.level}</span>
            </div>
            <div className="enroll-stat-row">
              <span className="label">Catégorie</span>
              <span className="value">{category}</span>
            </div>
            <div className="enroll-stat-row">
              <span className="label">Sessions</span>
              <span className="value">{sessionsLabel}</span>
            </div>
            <div
              className="enroll-stat-row"
              style={{ borderBottom: '1px solid var(--line-soft)' }}
            >
              <span className="label">Note alumni</span>
              <span className="value">★ 4,7 / 5</span>
            </div>

            <EnrollLauncher
              courseId={course.id}
              courseTitle={course.title}
              priceXof={course.priceXof}
              applicationsOpen={applicationStatusAt(course).state === 'open'}
              reopensAt={(() => {
                const s = applicationStatusAt(course);
                return s.state === 'before' ? fmtDate.format(s.opensAt) : undefined;
              })()}
              sessions={course.sessions.map((s) => ({
                id: s.id,
                label: fmtDate.format(s.startsAt),
              }))}
            />
            <button className="btn btn-ghost" type="button">
              Télécharger la brochure (PDF)
            </button>
            <p className="fs-13 text-soft" style={{ lineHeight: 1.4 }}>
              Paiement échelonné disponible · Wave, Orange Money, virement, carte.
            </p>
            <p className="fs-13 text-soft" style={{ lineHeight: 1.4 }}>
              Prix affiché : <strong>{fmtXof(course.priceXof)}</strong>.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
