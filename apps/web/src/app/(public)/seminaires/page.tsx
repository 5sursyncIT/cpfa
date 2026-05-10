import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@cpfa/db';
import { fmtXof } from '@/lib/cpfa-mappers';
import { richTags } from '@/lib/i18n-tags';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const t = await getTranslations('seminars');
  return { title: t('metaTitle') };
}

function dayParts(d: Date, monthsShort: string[]): { day: string; month: string } {
  return {
    day: String(d.getDate()).padStart(2, '0'),
    month: `${monthsShort[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
  };
}

export default async function SeminarsIndexPage() {
  const [seminars, t] = await Promise.all([
    prisma.seminar.findMany({
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
        capacity: true,
        description: true,
        _count: { select: { registrations: true } },
      },
    }),
    getTranslations('seminars'),
  ]);

  const monthsShort = t('monthsShort').split(',');

  const durationLabel = (start: Date, end: Date): string => {
    const ms = end.getTime() - start.getTime();
    const days = Math.max(1, Math.ceil(ms / (24 * 60 * 60 * 1000)));
    return days === 1 ? t('dayOne') : t('daysOther', { count: days });
  };

  return (
    <div>
      <div className="container page-head">
        <div className="breadcrumb">
          CPFA · <span>{t('title')}</span>
        </div>
        <div className="page-head-split">
          <h1>{t.rich('h1', richTags)}</h1>
          <p className="page-head-copy">{t('intro')}</p>
        </div>
      </div>

      <div className="container page-body">
        {seminars.length === 0 ? (
          <p className="text-soft">{t('empty')}</p>
        ) : (
          <div className="event-list">
            {seminars.map((s) => {
              const dp = dayParts(s.startsAt, monthsShort);
              const seatsLeft = Math.max(0, s.capacity - s._count.registrations);
              const seatsLabel =
                seatsLeft === 0
                  ? t('seatsFull', { capacity: s.capacity })
                  : t('seatsLeft', { capacity: s.capacity, seatsLeft });
              return (
                <Link key={s.id} href={`/seminaires/${s.slug}`} className="event">
                  <div className="event-date">
                    <div className="day">{dp.day}</div>
                    <div className="month">{dp.month}</div>
                  </div>
                  <div>
                    <h4>{s.title}</h4>
                    {s.description ? (
                      <p className="event-desc fs-14 text-mid">{s.description}</p>
                    ) : null}
                    <div className="event-pills">
                      <span className="pill">{durationLabel(s.startsAt, s.endsAt)}</span>
                      <span
                        className={
                          'pill ' + (seatsLeft === 0 ? 'pill-warning' : 'pill-orange')
                        }
                      >
                        {seatsLabel}
                      </span>
                    </div>
                  </div>
                  <div className="event-meta">
                    <span>{fmtXof(s.priceXof)}</span>
                  </div>
                  <span className="btn btn-ghost btn-sm">
                    {t('details')} <span className="arrow">→</span>
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
