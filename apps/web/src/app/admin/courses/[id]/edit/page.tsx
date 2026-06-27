import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/rbac';
import { prisma } from '@cpfa/db';
import { CourseForm } from '../../course-form';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Éditer une formation — Admin CPFA' };

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect('/sign-in?callbackUrl=/admin/courses');
  if (!hasPermission(session.user.roles, 'admin:any')) redirect('/admin');

  const { id } = await params;
  const course = await prisma.course.findUnique({
    where: { id },
    include: { _count: { select: { registrations: true, sessions: true, modules: true } } },
  });
  if (!course) notFound();

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <div className="breadcrumb">
          Admin · <Link href="/admin/courses">Formations</Link> · <span>{course.title}</span>
        </div>
        <h2 style={{ fontSize: 'clamp(28px, 3vw, 36px)', marginTop: 8 }}>{course.title}</h2>
        <div className="fs-13 text-soft" style={{ marginTop: 4 }}>
          {course._count.registrations} inscription(s) · {course._count.sessions} session(s) ·{' '}
          {course._count.modules} module(s) ·{' '}
          {course.published ? (
            <span style={{ color: 'var(--success)' }}>publiée</span>
          ) : (
            <span style={{ color: 'var(--ink-soft)' }}>brouillon</span>
          )}
        </div>
      </div>

      <CourseForm
        mode="edit"
        initial={{
          id: course.id,
          slug: course.slug,
          title: course.title,
          kind: course.kind,
          level: course.level,
          durationHours: course.durationHours,
          priceXof: course.priceXof,
          description: course.description,
          admissionCriteria: course.admissionCriteria,
          brochureKey: course.brochureKey,
          coverImageKey: course.coverImageKey,
          published: course.published,
          applicationsOpenAt: course.applicationsOpenAt,
          applicationsCloseAt: course.applicationsCloseAt,
        }}
      />
    </>
  );
}
