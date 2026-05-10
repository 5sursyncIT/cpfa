import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/rbac';
import { prisma } from '@cpfa/db';
import { RolesCell } from './roles-cell';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Utilisateurs — Admin CPFA' };

const fmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' });

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect('/sign-in?callbackUrl=/admin/users');
  if (!hasPermission(session.user.roles, 'admin:any')) redirect('/admin');

  const { q, role } = await searchParams;
  const users = await prisma.user.findMany({
    where: {
      ...(role
        ? { roles: { has: role as Parameters<typeof prisma.user.findMany>[0] extends infer T ? T : never } as never }
        : {}),
      ...(q
        ? {
            OR: [
              { email: { contains: q, mode: 'insensitive' } },
              { firstName: { contains: q, mode: 'insensitive' } },
              { lastName: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      roles: true,
      createdAt: true,
      twoFactorEnabled: true,
      passwordHash: true,
    },
  });

  const ROLES = [
    'VISITEUR',
    'CANDIDAT',
    'ABONNE_BIBLIOTHEQUE',
    'FORMATEUR',
    'EDITEUR',
    'BIBLIOTHECAIRE',
    'COMPTABLE',
    'ADMIN',
    'SUPER_ADMIN',
  ];

  return (
    <>
      <div
        className="row"
        style={{ justifyContent: 'space-between', alignItems: 'end', marginBottom: 24, gap: 24 }}
      >
        <div>
          <div className="breadcrumb">
            Admin · <span>Utilisateurs</span>
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 3vw, 36px)', marginTop: 8 }}>
            Utilisateurs · {users.length}
          </h2>
        </div>
        <a href="/api/admin/exports/users.csv" className="btn btn-ghost">
          Export CSV
        </a>
      </div>

      <form className="panel" style={{ padding: 16, marginBottom: 24 }}>
        <div className="row gap-3" style={{ flexWrap: 'wrap', alignItems: 'end' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label className="label" htmlFor="filter-q">Recherche</label>
            <input
              id="filter-q"
              name="q"
              defaultValue={q ?? ''}
              placeholder="Email, prénom, nom"
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="filter-role">Rôle</label>
            <select id="filter-role" name="role" defaultValue={role ?? ''} className="select">
              <option value="">Tous</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-ghost btn-sm">Filtrer</button>
          {(q || role) ? (
            <Link href="/admin/users" className="btn-link fs-13">Réinitialiser</Link>
          ) : null}
        </div>
      </form>

      <div className="panel">
        {users.length === 0 ? (
          <p className="text-soft" style={{ padding: 24 }}>Aucun utilisateur ne correspond.</p>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Inscrit le</th>
                <th>2FA / Pwd</th>
                <th>Rôles</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const fullName = [u.firstName, u.lastName].filter(Boolean).join(' ') || '—';
                return (
                  <tr key={u.id}>
                    <td>
                      <Link
                        href={`/admin/users/${u.id}`}
                        style={{ color: 'inherit', textDecoration: 'none' }}
                      >
                        <div style={{ fontWeight: 500 }}>{fullName}</div>
                        <div className="fs-13 text-soft">{u.email}</div>
                        {u.phone ? <div className="fs-13 text-soft mono">{u.phone}</div> : null}
                      </Link>
                    </td>
                    <td className="fs-13 text-soft">{fmt.format(u.createdAt)}</td>
                    <td className="fs-13">
                      {u.twoFactorEnabled ? (
                        <span className="pill pill-success">2FA</span>
                      ) : (
                        <span className="text-soft">—</span>
                      )}
                      {' '}
                      {u.passwordHash ? (
                        <span className="text-soft">pwd ✓</span>
                      ) : (
                        <span className="text-soft">pwd ✕</span>
                      )}
                    </td>
                    <td>
                      <RolesCell userId={u.id} roles={u.roles} />
                    </td>
                    <td>
                      <Link href={`/admin/users/${u.id}`} className="btn-link fs-13">
                        Détail →
                      </Link>
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
