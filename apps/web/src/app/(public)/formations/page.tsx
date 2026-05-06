import Link from 'next/link';
import { prisma } from '@cpfa/db';

export const metadata = { title: 'Formations — CPFA' };
export const dynamic = 'force-dynamic';

const KIND_LABEL: Record<string, string> = {
  DIPLOMANT: 'Diplômante',
  CERTIFIANT: 'Certifiante',
  CARTE: 'À la carte',
  AUDITORAT: 'Auditorat',
};

const LEVEL_LABEL: Record<string, string> = {
  INITIATION: 'Initiation',
  INTERMEDIAIRE: 'Intermédiaire',
  AVANCE: 'Avancé',
};

const fmtXof = (n: number) => `${n.toLocaleString('fr-FR')} FCFA`;

export default async function CoursesIndexPage() {
  const courses = await prisma.course.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      slug: true,
      title: true,
      kind: true,
      level: true,
      durationHours: true,
      priceXof: true,
    },
  });

  return (
    <section className="container py-16">
      <header className="mb-10 max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight">Formations</h1>
        <p className="mt-2 text-muted-foreground">
          Diplômes (DTA, BTS), certifications professionnelles et formations à la carte adaptées
          au marché de l’assurance en zone CIMA.
        </p>
      </header>

      {courses.length === 0 ? (
        <p className="text-muted-foreground">Aucune formation publiée pour le moment.</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <li key={c.id}>
              <Link
                href={`/formations/${c.slug}`}
                className="block rounded-lg border bg-card p-6 transition-shadow hover:shadow-sm"
              >
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                  <span>{KIND_LABEL[c.kind] ?? c.kind}</span>
                  <span>·</span>
                  <span>{LEVEL_LABEL[c.level] ?? c.level}</span>
                </div>
                <h2 className="mt-3 text-lg font-semibold leading-snug">{c.title}</h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  {c.durationHours} h · {fmtXof(c.priceXof)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
