import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/rbac';
import { prisma } from '@cpfa/db';
import { applicationStatusAt } from '@/lib/course-rules';
import { ApplicationWindowEditor } from './application-window-editor';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Formations — Admin CPFA' };

const fmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' });
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
    select: {
      id: true,
      slug: true,
      title: true,
      kind: true,
      published: true,
      applicationsOpenAt: true,
      applicationsCloseAt: true,
    },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Formations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestion des fenêtres d&apos;inscription. Pour les diplômantes, fermez l&apos;accès au
          formulaire en dehors des périodes de concours et rouvrez-le pour les sessions de
          recrutement.
        </p>
      </header>

      {courses.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune formation.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full divide-y text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Titre</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Inscriptions</th>
                <th className="px-4 py-3">Fenêtre</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {courses.map((c) => {
                const status = applicationStatusAt(c);
                const statusBadge =
                  status.state === 'open' ? (
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-700">
                      Ouvertes
                    </span>
                  ) : status.state === 'before' ? (
                    <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-700">
                      Avant {fmt.format(status.opensAt)}
                    </span>
                  ) : (
                    <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-xs text-rose-700">
                      Fermées
                    </span>
                  );
                return (
                  <tr key={c.id}>
                    <td className="px-4 py-3 font-medium">{c.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {KIND_LABEL[c.kind] ?? c.kind}
                      {!c.published ? ' · brouillon' : ''}
                    </td>
                    <td className="px-4 py-3">{statusBadge}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {c.applicationsOpenAt ? fmt.format(c.applicationsOpenAt) : '—'}
                      {' → '}
                      {c.applicationsCloseAt ? fmt.format(c.applicationsCloseAt) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <ApplicationWindowEditor
                        courseId={c.id}
                        applicationsOpenAt={c.applicationsOpenAt}
                        applicationsCloseAt={c.applicationsCloseAt}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
