import Link from 'next/link';
import { prisma } from '@cpfa/db';

export const metadata = { title: 'Séminaires — CPFA' };
export const dynamic = 'force-dynamic';

const fmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });
const fmtXof = (n: number) => (n === 0 ? 'Gratuit' : `${n.toLocaleString('fr-FR')} FCFA`);

export default async function SeminarsIndexPage() {
  const seminars = await prisma.seminar.findMany({
    where: { published: true, startsAt: { gte: new Date() } },
    orderBy: { startsAt: 'asc' },
    take: 50,
    select: {
      id: true,
      slug: true,
      title: true,
      startsAt: true,
      endsAt: true,
      location: true,
      priceXof: true,
    },
  });

  return (
    <section className="container py-16">
      <header className="mb-10 max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight">Séminaires</h1>
        <p className="mt-2 text-muted-foreground">
          Sessions courtes animées par des praticiens, ouvertes aux professionnels en activité.
        </p>
      </header>

      {seminars.length === 0 ? (
        <p className="text-muted-foreground">Aucun séminaire programmé prochainement.</p>
      ) : (
        <ul className="space-y-4">
          {seminars.map((s) => (
            <li key={s.id}>
              <Link
                href={`/seminaires/${s.slug}`}
                className="flex items-center justify-between gap-4 rounded-lg border bg-card p-6 transition-shadow hover:shadow-sm"
              >
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    {fmt.format(s.startsAt)}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold leading-snug">{s.title}</h2>
                  {s.location ? (
                    <p className="mt-1 text-sm text-muted-foreground">{s.location}</p>
                  ) : null}
                </div>
                <p className="text-sm font-semibold">{fmtXof(s.priceXof)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
