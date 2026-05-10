import { prisma } from '@cpfa/db';
import { FormationsCatalog } from '@/components/cpfa/formations-catalog';
import { courseToCard } from '@/lib/cpfa-mappers';

export const metadata = { title: 'Formations — CPFA' };
export const dynamic = 'force-dynamic';

export default async function CoursesIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat } = await searchParams;
  const courses = await prisma.course.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      slug: true,
      title: true,
      kind: true,
      level: true,
      durationHours: true,
      priceXof: true,
      description: true,
    },
  });

  const cards = courses.map(courseToCard);

  return (
    <div>
      <div className="container page-head">
        <div className="breadcrumb">
          CPFA · <span>Formations</span>
        </div>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'end', gap: 32 }}>
          <h1 style={{ fontSize: 'clamp(48px, 6vw, 84px)' }}>
            Le <em className="italic-emph">catalogue</em>
            <br />
            2026 — 2027.
          </h1>
          <p
            className="fs-17 text-mid"
            style={{ maxWidth: 380, paddingBottom: 12 }}
          >
            Six programmes diplômants, certifications professionnelles, séminaires courts et
            formations sur mesure pour vos équipes.
          </p>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: 96 }}>
        <FormationsCatalog cards={cards} initialCategory={cat} />
      </div>
    </div>
  );
}
