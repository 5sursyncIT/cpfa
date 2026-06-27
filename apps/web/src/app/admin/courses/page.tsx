import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/rbac';
import { prisma } from '@cpfa/db';
import { applicationStatusAt } from '@/lib/course-rules';
import { ApplicationWindowEditor } from './application-window-editor';
import { CoursePublishToggle } from './course-publish-toggle';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Formations — Admin CPFA' };

const fmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short' });
const KIND_LABEL: Record<string, string> = {
  DIPLOMANT: 'Diplômant',
  CERTIFIANT: 'Certifiant',
  CARTE: 'Sur mesure',
  AUDITORAT: 'Auditorat',
};

export default async function AdminCoursesPage() {
  const session = await auth();
  if (!session?.user) redirect('/sign-in?callbackUrl=/admin/courses');
  if (!hasPermission(session.user.roles, 'admin:any')) redirect('/admin');

  const courses = await prisma.course.findMany({
    orderBy: [{ kind: 'asc' }, { title: 'asc' }],
    include: { _count: { select: { registrations: true, sessions: true } } },
  });

  return (
    <>
      <div
        className="row"
        style={{ justifyContent: 'space-between', alignItems: 'end', marginBottom: 24, gap: 24 }}
      >
        <div>
          <div className="breadcrumb">
            Admin · <span>Formations</span>
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 3vw, 36px)', marginTop: 8 }}>
            Formations · {courses.length}
          </h2>
        </div>
        <Link href="/admin/courses/new" className="btn btn-primary">
          + Nouvelle formation
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="panel">
          <p className="text-soft" style={{ padding: 24 }}>
            Aucune formation. <Link href="/admin/courses/new">Créer la première</Link>.
          </p>
        </div>
      ) : (
        <div className="panel">
          <table className="tbl">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Type · Niveau</th>
                <th>Durée · Prix</th>
                <th>Fenêtre inscriptions</th>
                <th>Inscriptions</th>
                <th>Publication</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => {
                const status = applicationStatusAt(c);
                const statusBadge =
                  status.state === 'open' ? (
                    <span className="pill pill-success">Ouvertes</span>
                  ) : status.state === 'before' ? (
                    <span className="pill pill-warning">Avant {fmt.format(status.opensAt)}</span>
                  ) : (
                    <span className="pill">Fermées</span>
                  );
                return (
                  <tr key={c.id}>
                    <td>
                      <Link
                        href={`/admin/courses/${c.id}/edit`}
                        style={{ color: 'inherit', textDecoration: 'none', fontWeight: 500 }}
                      >
                        {c.title}
                      </Link>
                    </td>
                    <td className="fs-13 text-soft">
                      {KIND_LABEL[c.kind] ?? c.kind}
                      <br />
                      <span className="mono">{c.level}</span>
                    </td>
                    <td className="fs-13 text-soft">
                      {c.durationHours}h
                      <br />
                      <span className="mono">{c.priceXof.toLocaleString('fr-FR')} FCFA</span>
                    </td>
                    <td className="fs-13">
                      {statusBadge}
                      <div className="mono fs-13 text-soft" style={{ marginTop: 4 }}>
                        {c.applicationsOpenAt ? fmt.format(c.applicationsOpenAt) : '—'} →{' '}
                        {c.applicationsCloseAt ? fmt.format(c.applicationsCloseAt) : '—'}
                      </div>
                      <div style={{ marginTop: 6 }}>
                        <ApplicationWindowEditor
                          courseId={c.id}
                          applicationsOpenAt={c.applicationsOpenAt}
                          applicationsCloseAt={c.applicationsCloseAt}
                        />
                      </div>
                    </td>
                    <td className="mono fs-13">{c._count.registrations}</td>
                    <td>
                      <CoursePublishToggle id={c.id} published={c.published} />
                    </td>
                    <td>
                      <Link
                        href={`/admin/courses/${c.id}/edit`}
                        className="btn-link fs-13"
                      >
                        Éditer →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
