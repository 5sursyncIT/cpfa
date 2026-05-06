import { notFound } from 'next/navigation';
import { prisma } from '@cpfa/db';
import { RegisterCourseButton } from '@/components/training/register-course-button';

export const dynamic = 'force-dynamic';

const fmtDate = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });
const fmtXof = (n: number) => `${n.toLocaleString('fr-FR')} FCFA`;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await prisma.course.findUnique({ where: { slug }, select: { title: true } });
  return { title: course ? `${course.title} — CPFA` : 'Formation introuvable — CPFA' };
}

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      modules: { orderBy: { position: 'asc' }, include: { lessons: { orderBy: { position: 'asc' } } } },
      sessions: { where: { startsAt: { gte: new Date() } }, orderBy: { startsAt: 'asc' } },
    },
  });
  if (!course || !course.published) notFound();

  return (
    <article className="container grid gap-12 py-16 md:grid-cols-[2fr_1fr]">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{course.kind} · {course.level}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">{course.title}</h1>
        {course.description ? (
          <div className="prose prose-slate mt-6 max-w-none">
            <p>{course.description}</p>
          </div>
        ) : null}

        {course.modules.length > 0 ? (
          <section className="mt-10">
            <h2 className="text-xl font-semibold">Programme</h2>
            <ol className="mt-4 space-y-4">
              {course.modules.map((mod) => (
                <li key={mod.id} className="rounded-lg border bg-card p-4">
                  <h3 className="text-base font-semibold">
                    Module {mod.position}. {mod.title}
                  </h3>
                  {mod.lessons.length > 0 ? (
                    <ul className="mt-2 ml-4 list-disc text-sm text-muted-foreground">
                      {mod.lessons.map((l) => (
                        <li key={l.id}>{l.title}</li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ol>
          </section>
        ) : null}
      </div>

      <aside>
        <div className="sticky top-24 space-y-4 rounded-lg border bg-card p-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Durée</p>
            <p className="text-2xl font-bold">{course.durationHours} h</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Frais d’inscription</p>
            <p className="text-2xl font-bold">{fmtXof(course.priceXof)}</p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Sessions à venir</p>
            {course.sessions.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">À programmer.</p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm">
                {course.sessions.map((s) => (
                  <li key={s.id}>
                    <strong>{fmtDate.format(s.startsAt)}</strong>
                    {s.location ? ` · ${s.location}` : ''}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <RegisterCourseButton
            courseId={course.id}
            sessions={course.sessions.map((s) => ({ id: s.id, label: fmtDate.format(s.startsAt) }))}
          />
        </div>
      </aside>
    </article>
  );
}
