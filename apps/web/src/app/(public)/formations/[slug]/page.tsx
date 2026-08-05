import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@cpfa/db';
import { formatDate, formatNumber, formatXof } from '@cpfa/lib/i18n';
import { EnrollLauncher } from '@/components/cpfa/enroll-launcher';
import { resolveLocale } from '@/i18n/request';
import { courseCategoryLabel, courseLevelLabel, durationLabel } from '@/lib/cpfa-mappers';
import { applicationStatusAt } from '@/lib/course-rules';
import { richTags } from '@/lib/i18n-tags';
import { mediaUrl } from '@/lib/media';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, t] = await Promise.all([params, getTranslations('courseDetail')]);
  const course = await prisma.course.findUnique({ where: { slug }, select: { title: true } });
  return { title: course ? `${course.title} — CPFA` : t('notFound') };
}

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, t, locale] = await Promise.all([
    params,
    getTranslations('courseDetail'),
    resolveLocale(),
  ]);
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

  const category = courseCategoryLabel(course.kind, locale);
  const coverUrl = mediaUrl(course.coverImageKey);
  // Brochure de la formation (§1.3 du Directeur) — le bouton n'apparaît que
  // si un PDF a été téléversé depuis /admin/courses.
  const brochureUrl = mediaUrl(course.brochureKey);
  const sessionsLabel =
    course.sessions.length > 0
      ? course.sessions
          .slice(0, 2)
          .map((s) => formatDate(s.startsAt, locale))
          .join(' · ')
      : t('sessionsTbd');

  // Admission criteria — per-course when set by the admin, otherwise the
  // generic CPFA criteria as a fallback. The admin-entered ones are stored in
  // whatever language they were typed in; only the fallback is localised.
  const admissions =
    course.admissionCriteria.length > 0
      ? course.admissionCriteria
      : t('genericAdmissions').split('|');

  return (
    <div>
      <div className="container">
        <div className="page-head" style={{ paddingBottom: 0 }}>
          <div className="breadcrumb">
            CPFA · {t('breadcrumb')} · <span>{course.title}</span>
          </div>
          <div className="detail-hero">
            {coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverUrl} alt="" className="detail-hero-img" />
            ) : null}
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
                  {t.rich('programmeHeading', { ...richTags, count: course.modules.length })}
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

            <h3 style={{ marginBottom: 24 }}>{t('admissionsHeading')}</h3>
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
              <div className="label">{t('tuitionLabel')}</div>
              <div className="enroll-price">
                {formatNumber(course.priceXof, locale)} <small>FCFA</small>
              </div>
            </div>
            <div className="enroll-stat-row">
              <span className="label">{t('durationLabel')}</span>
              <span className="value">{durationLabel(course.durationHours, locale)}</span>
            </div>
            <div className="enroll-stat-row">
              <span className="label">{t('levelLabel')}</span>
              <span className="value">{courseLevelLabel(course.level, locale)}</span>
            </div>
            <div className="enroll-stat-row">
              <span className="label">{t('categoryLabel')}</span>
              <span className="value">{category}</span>
            </div>
            <div className="enroll-stat-row" style={{ borderBottom: '1px solid var(--line-soft)' }}>
              <span className="label">{t('sessionsLabel')}</span>
              <span className="value">{sessionsLabel}</span>
            </div>

            <EnrollLauncher
              courseId={course.id}
              courseTitle={course.title}
              priceXof={course.priceXof}
              applicationsOpen={applicationStatusAt(course).state === 'open'}
              reopensAt={(() => {
                const s = applicationStatusAt(course);
                return s.state === 'before' ? formatDate(s.opensAt, locale) : undefined;
              })()}
              sessions={course.sessions.map((s) => ({
                id: s.id,
                label: formatDate(s.startsAt, locale),
              }))}
            />
            {brochureUrl ? (
              <a className="btn btn-ghost" href={brochureUrl} target="_blank" rel="noreferrer">
                {t('brochureCta')}
              </a>
            ) : null}
            <p className="fs-13 text-soft" style={{ lineHeight: 1.4 }}>
              {t('paymentNote')}
            </p>
            <p className="fs-13 text-soft" style={{ lineHeight: 1.4 }}>
              {t.rich('priceNote', { ...richTags, price: formatXof(course.priceXof, locale) })}
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
