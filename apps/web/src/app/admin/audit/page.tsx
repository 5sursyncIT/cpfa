import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/rbac';
import { prisma } from '@cpfa/db';
import type { Prisma } from '@cpfa/db';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Audit — Admin CPFA' };

const fmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' });

const ENTITIES = [
  'Loan',
  'Subscription',
  'Resource',
  'Registration',
  'Payment',
  'Course',
  'Seminar',
  'Exam',
  'ExamPaper',
  'Page',
  'Article',
  'User',
  'TrainerProfile',
];

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ entity?: string; action?: string; q?: string; from?: string; to?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect('/sign-in?callbackUrl=/admin/audit');
  if (!hasPermission(session.user.roles, 'admin:any')) redirect('/admin');

  const { entity, action, q, from, to } = await searchParams;
  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to + 'T23:59:59') : null;

  const where: Prisma.AuditLogWhereInput = {
    ...(entity ? { entity } : {}),
    ...(action ? { action: { contains: action } } : {}),
    ...(q
      ? {
          OR: [
            { actor: { email: { contains: q, mode: 'insensitive' } } },
            { entityId: { contains: q } },
          ],
        }
      : {}),
    ...(fromDate || toDate
      ? {
          createdAt: {
            ...(fromDate ? { gte: fromDate } : {}),
            ...(toDate ? { lte: toDate } : {}),
          },
        }
      : {}),
  };

  const items = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 300,
    include: { actor: { select: { firstName: true, lastName: true, email: true } } },
  });

  const exportQs = new URLSearchParams();
  if (entity) exportQs.set('entity', entity);
  if (action) exportQs.set('action', action);
  if (q) exportQs.set('q', q);
  if (from) exportQs.set('from', from);
  if (to) exportQs.set('to', to);

  return (
    <>
      <div
        className="row"
        style={{ justifyContent: 'space-between', alignItems: 'end', marginBottom: 24, gap: 24 }}
      >
        <div>
          <div className="breadcrumb">
            Admin · <span>Audit</span>
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 3vw, 36px)', marginTop: 8 }}>
            Journal d&apos;audit · {items.length} affichés
          </h2>
        </div>
        <a
          href={`/api/admin/exports/audit.csv${exportQs.toString() ? `?${exportQs.toString()}` : ''}`}
          className="btn btn-ghost"
        >
          Export CSV
        </a>
      </div>

      <form className="panel" style={{ padding: 16, marginBottom: 16 }}>
        <div className="row gap-3" style={{ flexWrap: 'wrap', alignItems: 'end' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label className="label" htmlFor="filter-q">Acteur ou entité</label>
            <input
              id="filter-q"
              name="q"
              defaultValue={q ?? ''}
              placeholder="email, ID"
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="filter-entity">Entité</label>
            <select id="filter-entity" name="entity" defaultValue={entity ?? ''} className="select">
              <option value="">Toutes</option>
              {ENTITIES.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="filter-action">Action contient</label>
            <input
              id="filter-action"
              name="action"
              defaultValue={action ?? ''}
              placeholder="ex: create, return"
              className="input"
              style={{ width: 160 }}
            />
          </div>
          <div>
            <label className="label" htmlFor="filter-from">Du</label>
            <input
              id="filter-from"
              name="from"
              type="date"
              defaultValue={from ?? ''}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="filter-to">Au</label>
            <input
              id="filter-to"
              name="to"
              type="date"
              defaultValue={to ?? ''}
              className="input"
            />
          </div>
          <button type="submit" className="btn btn-ghost btn-sm">Filtrer</button>
          {(q || entity || action || from || to) ? (
            <Link href="/admin/audit" className="btn-link fs-13">Réinitialiser</Link>
          ) : null}
        </div>
      </form>

      <div className="panel">
        {items.length === 0 ? (
          <p className="text-soft" style={{ padding: 24 }}>Aucune entrée ne correspond.</p>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Quand</th>
                <th>Acteur</th>
                <th>Action</th>
                <th>Entité</th>
                <th>Détails</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => {
                const actor = a.actor
                  ? [a.actor.firstName, a.actor.lastName].filter(Boolean).join(' ') ||
                    a.actor.email
                  : 'Système';
                return (
                  <tr key={a.id}>
                    <td className="mono fs-13 text-soft">{fmt.format(a.createdAt)}</td>
                    <td className="fs-13">{actor}</td>
                    <td className="mono fs-13">{a.action}</td>
                    <td className="fs-13">
                      {a.entity}
                      {a.entityId ? (
                        <div className="mono fs-13 text-soft">
                          {a.entityId.slice(0, 8)}
                        </div>
                      ) : null}
                    </td>
                    <td className="fs-13 text-soft">
                      {a.diff ? (
                        <details>
                          <summary style={{ cursor: 'pointer' }}>voir</summary>
                          <pre
                            className="mono"
                            style={{
                              fontSize: 11,
                              marginTop: 4,
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              maxWidth: 480,
                            }}
                          >
                            {JSON.stringify(a.diff, null, 2)}
                          </pre>
                        </details>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
