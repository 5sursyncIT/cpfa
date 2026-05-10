import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/rbac';
import { prisma } from '@cpfa/db';
import { SeminarPublishToggle } from './seminar-publish-toggle';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Séminaires — Admin CPFA' };

const fmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' });

export default async function AdminSeminarsPage() {
  const session = await auth();
  if (!session?.user) redirect('/sign-in?callbackUrl=/admin/seminars');
  if (!hasPermission(session.user.roles, 'admin:any')) redirect('/admin');

  const seminars = await prisma.seminar.findMany({
    orderBy: { startsAt: 'desc' },
    include: { _count: { select: { registrations: true } } },
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
            Admin · <span>Séminaires</span>
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 3vw, 36px)', marginTop: 8 }}>
            Séminaires · {seminars.length}
          </h2>
        </div>
        <Link href="/admin/seminars/new" className="btn btn-primary">
          + Nouveau séminaire
        </Link>
      </div>

      {seminars.length === 0 ? (
        <div className="panel">
          <p className="text-soft" style={{ padding: 24 }}>
            Aucun séminaire. <Link href="/admin/seminars/new">Créer le premier</Link>.
          </p>
        </div>
      ) : (
        <div className="panel">
          <table className="tbl">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Date</th>
                <th>Lieu</th>
                <th>Prix</th>
                <th>Capacité</th>
                <th>Inscrits</th>
                <th>Publication</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {seminars.map((s) => {
                const past = s.startsAt.getTime() < now;
                return (
                  <tr key={s.id}>
                    <td>
                      <Link
                        href={`/admin/seminars/${s.id}/edit`}
                        style={{ color: 'inherit', textDecoration: 'none', fontWeight: 500 }}
                      >
                        {s.title}
                      </Link>
                      <div className="mono fs-13 text-soft">{s.slug}</div>
                    </td>
                    <td className="fs-13">
                      <span className={'pill ' + (past ? '' : 'pill-success')}>
                        {past ? 'Passé' : 'À venir'}
                      </span>
                      <div className="mono fs-13 text-soft" style={{ marginTop: 4 }}>
                        {fmt.format(s.startsAt)}
                      </div>
                    </td>
                    <td className="fs-13 text-soft">{s.location ?? '—'}</td>
                    <td className="mono fs-13">
                      {s.priceXof === 0 ? 'Gratuit' : `${s.priceXof.toLocaleString('fr-FR')} FCFA`}
                    </td>
                    <td className="mono fs-13">{s.capacity}</td>
                    <td className="mono fs-13">{s._count.registrations}</td>
                    <td>
                      <SeminarPublishToggle id={s.id} published={s.published} />
                    </td>
                    <td>
                      <Link href={`/admin/seminars/${s.id}/edit`} className="btn-link fs-13">
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
