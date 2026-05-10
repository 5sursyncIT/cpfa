import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/rbac';
import { prisma } from '@cpfa/db';
import { ExamPublishToggle } from './exam-publish-toggle';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Concours & examens — Admin CPFA' };

const fmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short' });
const KIND_LABEL: Record<string, string> = {
  CONCOURS: 'Concours',
  EXAM_BLANC: 'Examen blanc',
  CERTIFICATION: 'Certification',
};

export default async function AdminExamsPage() {
  const session = await auth();
  if (!session?.user) redirect('/sign-in?callbackUrl=/admin/exams');
  if (!hasPermission(session.user.roles, 'admin:any')) redirect('/admin');

  const exams = await prisma.exam.findMany({
    orderBy: { closeAt: 'desc' },
    include: { _count: { select: { registrations: true, papers: true } } },
  });

  const now = Date.now();

  return (
    <>
      <div
        className="row"
        style={{ justifyContent: 'space-between', alignItems: 'end', marginBottom: 24, gap: 24 }}
      >
        <div>
          <div className="breadcrumb">
            Admin · <span>Concours</span>
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 3vw, 36px)', marginTop: 8 }}>
            Concours · {exams.length}
          </h2>
        </div>
        <Link href="/admin/exams/new" className="btn btn-primary">
          + Nouveau concours
        </Link>
      </div>

      {exams.length === 0 ? (
        <div className="panel">
          <p className="text-soft" style={{ padding: 24 }}>
            Aucun concours créé. <Link href="/admin/exams/new">Créer le premier</Link>.
          </p>
        </div>
      ) : (
        <div className="panel">
          <table className="tbl">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Type</th>
                <th>Période</th>
                <th>Frais</th>
                <th>Candidatures</th>
                <th>Épreuves</th>
                <th>Publication</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {exams.map((e) => {
                const open = e.openAt.getTime() <= now && e.closeAt.getTime() >= now;
                const closed = e.closeAt.getTime() < now;
                return (
                  <tr key={e.id}>
                    <td>
                      <Link
                        href={`/admin/exams/${e.id}`}
                        style={{ color: 'inherit', textDecoration: 'none', fontWeight: 500 }}
                      >
                        {e.title}
                      </Link>
                      <div className="mono fs-13 text-soft">{e.slug}</div>
                    </td>
                    <td className="fs-13">{KIND_LABEL[e.kind] ?? e.kind}</td>
                    <td className="fs-13">
                      <span
                        className={
                          'pill ' +
                          (open ? 'pill-success' : closed ? '' : 'pill-warning')
                        }
                      >
                        {open ? 'Ouvert' : closed ? 'Fermé' : 'À venir'}
                      </span>
                      <div className="mono fs-13 text-soft" style={{ marginTop: 4 }}>
                        {fmt.format(e.openAt)} → {fmt.format(e.closeAt)}
                      </div>
                    </td>
                    <td className="mono fs-13">{e.feeXof.toLocaleString('fr-FR')} FCFA</td>
                    <td className="mono fs-13">{e._count.registrations}</td>
                    <td className="mono fs-13">{e._count.papers}</td>
                    <td>
                      <ExamPublishToggle id={e.id} published={e.published} />
                    </td>
                    <td>
                      <div className="row gap-2">
                        <Link href={`/admin/exams/${e.id}/edit`} className="btn-link fs-13">
                          Éditer
                        </Link>
                        <Link href={`/admin/exams/${e.id}`} className="btn-link fs-13">
                          Épreuves →
                        </Link>
                      </div>
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
