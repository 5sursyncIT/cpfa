import { prisma } from '@cpfa/db';
import { RolesCell } from './roles-cell';

export const dynamic = 'force-dynamic';

const fmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' });

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const users = await prisma.user.findMany({
    where: q
      ? {
          OR: [
            { email: { contains: q, mode: 'insensitive' } },
            { firstName: { contains: q, mode: 'insensitive' } },
            { lastName: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {},
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      roles: true,
      createdAt: true,
      twoFactorEnabled: true,
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Utilisateurs</h1>
        <form className="flex items-center gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Email, prénom, nom…"
            className="w-64 rounded-md border bg-background px-3 py-1.5 text-sm"
          />
        </form>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full divide-y text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Utilisateur</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Inscrit le</th>
              <th className="px-4 py-3">2FA</th>
              <th className="px-4 py-3">Rôles</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((u) => {
              const fullName = [u.firstName, u.lastName].filter(Boolean).join(' ') || '—';
              return (
                <tr key={u.id}>
                  <td className="px-4 py-3 font-medium">{fullName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{fmt.format(u.createdAt)}</td>
                  <td className="px-4 py-3">{u.twoFactorEnabled ? '✓' : '—'}</td>
                  <td className="px-4 py-3">
                    <RolesCell userId={u.id} roles={u.roles} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
