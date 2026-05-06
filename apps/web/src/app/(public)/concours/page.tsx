import Link from 'next/link';
import { prisma } from '@cpfa/db';

export const metadata = { title: 'Concours & examens — CPFA' };
export const dynamic = 'force-dynamic';

const fmtDate = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });
const fmtXof = (n: number) => (n === 0 ? 'Gratuit' : `${n.toLocaleString('fr-FR')} FCFA`);

const KIND_LABEL: Record<string, string> = {
  CONCOURS: 'Concours',
  EXAM_BLANC: 'Examen blanc',
  CERTIFICATION: 'Certification',
};

export default async function ExamsIndexPage() {
  const now = new Date();
  const exams = await prisma.exam.findMany({
    where: { published: true, closeAt: { gte: now } },
    orderBy: { closeAt: 'asc' },
    take: 50,
  });

  return (
    <section className="container py-16">
      <header className="mb-10 max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight">Concours & examens</h1>
        <p className="mt-2 text-muted-foreground">
          Avis officiels, dossiers de candidature, paiement des frais et accès à la banque
          d’épreuves protégée pour les candidats inscrits.
        </p>
      </header>

      {exams.length === 0 ? (
        <p className="text-muted-foreground">Aucun avis ouvert pour le moment.</p>
      ) : (
        <ul className="space-y-4">
          {exams.map((e) => (
            <li key={e.id}>
              <Link
                href={`/concours/${e.slug}`}
                className="flex items-start justify-between gap-4 rounded-lg border bg-card p-6 transition-shadow hover:shadow-sm"
              >
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    {KIND_LABEL[e.kind] ?? e.kind} · clôture le {fmtDate.format(e.closeAt)}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold leading-snug">{e.title}</h2>
                  {e.examAt ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Épreuves : {fmtDate.format(e.examAt)}
                    </p>
                  ) : null}
                </div>
                <p className="text-sm font-semibold">{fmtXof(e.feeXof)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
