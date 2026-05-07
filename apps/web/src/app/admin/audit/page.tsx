import { prisma } from '@cpfa/db';

export const dynamic = 'force-dynamic';

const fmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' });

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ entity?: string }>;
}) {
  const { entity } = await searchParams;
  const items = await prisma.auditLog.findMany({
    where: entity ? { entity } : {},
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: { actor: { select: { firstName: true, lastName: true, email: true } } },
  });

  const entities = ['Loan', 'Registration', 'Payment', 'Page', 'Article', 'User', 'ExamPaper'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Journal d’audit</h1>
        <div className="flex flex-wrap gap-2 text-sm">
          <a
            href="/admin/audit"
            className={`rounded-md border px-3 py-1.5 ${!entity ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
          >
            Tout
          </a>
          {entities.map((e) => (
            <a
              key={e}
              href={`/admin/audit?entity=${e}`}
              className={`rounded-md border px-3 py-1.5 ${entity === e ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
            >
              {e}
            </a>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune entrée.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full divide-y text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Quand</th>
                <th className="px-4 py-3">Acteur</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entité</th>
                <th className="px-4 py-3">Détails</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((a) => {
                const actor = a.actor
                  ? [a.actor.firstName, a.actor.lastName].filter(Boolean).join(' ') || a.actor.email
                  : 'Système';
                return (
                  <tr key={a.id}>
                    <td className="px-4 py-3 text-muted-foreground">{fmt.format(a.createdAt)}</td>
                    <td className="px-4 py-3">{actor}</td>
                    <td className="px-4 py-3 font-mono text-xs">{a.action}</td>
                    <td className="px-4 py-3">
                      {a.entity}
                      {a.entityId ? (
                        <span className="ml-1 font-mono text-[10px] text-muted-foreground">
                          {a.entityId.slice(0, 8)}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {a.diff ? (
                        <details>
                          <summary className="cursor-pointer">voir</summary>
                          <pre className="mt-1 max-w-md whitespace-pre-wrap break-words">
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
        </div>
      )}
    </div>
  );
}
