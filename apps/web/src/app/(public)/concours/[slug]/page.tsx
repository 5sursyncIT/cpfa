import { notFound } from 'next/navigation';
import { prisma } from '@cpfa/db';
import { ExamRegistrationCard } from '@/components/exam/exam-registration-card';

export const dynamic = 'force-dynamic';

const fmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });
const fmtXof = (n: number) => (n === 0 ? 'Gratuit' : `${n.toLocaleString('fr-FR')} FCFA`);

const KIND_LABEL: Record<string, string> = {
  CONCOURS: 'Concours',
  EXAM_BLANC: 'Examen blanc',
  CERTIFICATION: 'Certification',
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const exam = await prisma.exam.findUnique({ where: { slug }, select: { title: true } });
  return { title: exam ? `${exam.title} — CPFA` : 'Concours introuvable — CPFA' };
}

export default async function ExamPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const exam = await prisma.exam.findUnique({ where: { slug } });
  if (!exam || !exam.published) notFound();

  const now = new Date();
  const isOpen = exam.openAt <= now && exam.closeAt >= now;

  return (
    <article className="container grid gap-12 py-16 md:grid-cols-[2fr_1fr]">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          {KIND_LABEL[exam.kind] ?? exam.kind}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">{exam.title}</h1>

        {exam.description ? (
          <div className="prose prose-slate mt-6 max-w-none">
            <p>{exam.description}</p>
          </div>
        ) : null}

        <section className="mt-10 rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold">Calendrier</h2>
          <dl className="mt-4 grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Ouverture des candidatures</dt>
            <dd>{fmt.format(exam.openAt)}</dd>
            <dt className="text-muted-foreground">Clôture</dt>
            <dd>{fmt.format(exam.closeAt)}</dd>
            {exam.examAt ? (
              <>
                <dt className="text-muted-foreground">Épreuves</dt>
                <dd>{fmt.format(exam.examAt)}</dd>
              </>
            ) : null}
          </dl>
        </section>
      </div>

      <aside>
        <div className="sticky top-24 space-y-4 rounded-lg border bg-card p-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Frais</p>
            <p className="text-2xl font-bold">{fmtXof(exam.feeXof)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Statut</p>
            <p className="text-sm">{isOpen ? 'Inscriptions ouvertes' : 'Inscriptions fermées'}</p>
          </div>
          <ExamRegistrationCard examId={exam.id} disabled={!isOpen} />
        </div>
      </aside>
    </article>
  );
}
