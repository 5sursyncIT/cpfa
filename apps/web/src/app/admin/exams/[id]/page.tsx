import { notFound } from 'next/navigation';
import { prisma } from '@cpfa/db';
import { AddPaperForm } from './add-paper-form';

export const dynamic = 'force-dynamic';

const fmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });

export default async function AdminExamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const exam = await prisma.exam.findUnique({
    where: { id },
    include: { papers: { orderBy: [{ year: 'desc' }, { createdAt: 'desc' }] } },
  });
  if (!exam) notFound();

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{exam.kind}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">{exam.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Clôture : {fmt.format(exam.closeAt)} · Frais : {exam.feeXof.toLocaleString('fr-FR')} FCFA
        </p>
      </header>

      <section className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold">Banque d’épreuves</h2>
        {exam.papers.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Aucune épreuve dans la banque.</p>
        ) : (
          <ul className="mt-4 divide-y">
            {exam.papers.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                <div>
                  <p className="font-medium">{p.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.year ? `${p.year} · ` : ''}
                    Accès : {p.accessLevel} · Clé : <span className="font-mono text-[10px]">{p.fileKey}</span>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 border-t pt-6">
          <h3 className="text-sm font-semibold">Ajouter une épreuve</h3>
          <AddPaperForm examId={exam.id} />
        </div>
      </section>
    </div>
  );
}
