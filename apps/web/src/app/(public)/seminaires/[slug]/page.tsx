import { notFound } from 'next/navigation';
import { prisma } from '@cpfa/db';
import { RegisterSeminarButton } from '@/components/training/register-seminar-button';

export const dynamic = 'force-dynamic';

const fmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' });
const fmtXof = (n: number) => (n === 0 ? 'Gratuit' : `${n.toLocaleString('fr-FR')} FCFA`);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const seminar = await prisma.seminar.findUnique({ where: { slug }, select: { title: true } });
  return { title: seminar ? `${seminar.title} — CPFA` : 'Séminaire introuvable — CPFA' };
}

export default async function SeminarPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const seminar = await prisma.seminar.findUnique({
    where: { slug },
    include: { speakers: true },
  });
  if (!seminar || !seminar.published) notFound();

  const taken = await prisma.registration.count({
    where: { seminarId: seminar.id, status: { in: ['SUBMITTED', 'PAID', 'VALIDATED'] } },
  });
  const seatsLeft = Math.max(0, seminar.capacity - taken);

  return (
    <article className="container grid gap-12 py-16 md:grid-cols-[2fr_1fr]">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Séminaire · {fmt.format(seminar.startsAt)}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">{seminar.title}</h1>
        {seminar.description ? (
          <div className="prose prose-slate mt-6 max-w-none">
            <p>{seminar.description}</p>
          </div>
        ) : null}

        {seminar.speakers.length > 0 ? (
          <section className="mt-10">
            <h2 className="text-xl font-semibold">Intervenant·e·s</h2>
            <ul className="mt-4 grid gap-4 md:grid-cols-2">
              {seminar.speakers.map((sp) => (
                <li key={sp.id} className="rounded-lg border bg-card p-4">
                  <h3 className="text-base font-semibold">{sp.fullName}</h3>
                  {sp.title ? <p className="text-sm text-muted-foreground">{sp.title}</p> : null}
                  {sp.bio ? <p className="mt-2 text-sm">{sp.bio}</p> : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      <aside>
        <div className="sticky top-24 space-y-4 rounded-lg border bg-card p-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Quand</p>
            <p className="text-base font-medium">{fmt.format(seminar.startsAt)}</p>
            {seminar.location ? (
              <p className="text-sm text-muted-foreground">{seminar.location}</p>
            ) : null}
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Frais</p>
            <p className="text-2xl font-bold">{fmtXof(seminar.priceXof)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Disponibilité</p>
            <p className="text-sm">{seatsLeft > 0 ? `${seatsLeft} place(s) restante(s)` : 'Complet'}</p>
          </div>
          <RegisterSeminarButton seminarId={seminar.id} disabled={seatsLeft === 0} />
        </div>
      </aside>
    </article>
  );
}
