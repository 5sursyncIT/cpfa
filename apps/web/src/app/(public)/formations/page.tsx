import { getTranslations } from 'next-intl/server';
import { prisma } from '@cpfa/db';
import { FormationsCatalog } from '@/components/cpfa/formations-catalog';
import { courseToCard } from '@/lib/cpfa-mappers';
import { richTags } from '@/lib/i18n-tags';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const t = await getTranslations('formations');
  return { title: t('metaTitle') };
}

export default async function CoursesIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const [{ cat }, t, courses] = await Promise.all([
    searchParams,
    getTranslations('formations'),
    prisma.course.findMany({
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
        coverImageKey: true,
      },
    }),
  ]);

  const cards = courses.map(courseToCard);

  return (
    <div>
      <div className="container page-head">
        <div className="breadcrumb">
          CPFA · <span>{t('title')}</span>
        </div>
        <div className="page-head-split">
          <h1 className="page-head-title">{t.rich('h1', richTags)}</h1>
          <p className="page-head-copy">{t('intro')}</p>
        </div>
      </div>

      <div className="container page-body">
        <FormationsCatalog cards={cards} initialCategory={cat} />
      </div>
    </div>
  );
}
