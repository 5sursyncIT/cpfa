import Link from 'next/link';
import { prisma } from '@cpfa/db';
import { ExamPublishToggle } from './exam-publish-toggle';

export const dynamic = 'force-dynamic';

const fmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' });

export default async function AdminExamsPage() {
  const exams = await prisma.exam.findMany({
    orderBy: { closeAt: 'desc' },
    take: 100,
    include: { _count: { select: { registrations: true, papers: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Concours & examens</h1>
      </div>

      {exams.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun concours créé.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full divide-y text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Titre</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Clôture</th>
                <th className="px-4 py-3">Candidats</th>
                <th className="px-4 py-3">Épreuves</th>
                <th className="px-4 py-3">Publié</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {exams.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/admin/exams/${e.id}`} className="hover:underline">
                      {e.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{e.kind}</td>
                  <td className="px-4 py-3 text-muted-foreground">{fmt.format(e.closeAt)}</td>
                  <td className="px-4 py-3">{e._count.registrations}</td>
                  <td className="px-4 py-3">{e._count.papers}</td>
                  <td className="px-4 py-3">
                    <ExamPublishToggle id={e.id} published={e.published} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
