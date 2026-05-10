import Link from 'next/link';
import { prisma } from '@cpfa/db';
import { fmtXof } from '@/lib/cpfa-mappers';

export const metadata = { title: 'Séminaires — CPFA' };
export const dynamic = 'force-dynamic';

const MONTH_LABEL = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];

function dayParts(d: Date): { day: string; month: string } {
  return {
    day: String(d.getDate()).padStart(2, '0'),
    month: `${MONTH_LABEL[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
  };
}

function durationLabel(start: Date, end: Date): string {
  const ms = end.getTime() - start.getTime();
  const days = Math.max(1, Math.ceil(ms / (24 * 60 * 60 * 1000)));
  return days === 1 ? '1 journée' : `${days} jours`;
}

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
      capacity: true,
      description: true,
      _count: { select: { registrations: true } },
    },
  });

  return (
    <div>
      <div className="container page-head">
        <div className="breadcrumb">
          CPFA · <span>Séminaires</span>
        </div>
        <div className="page-head-split">
          <h1>
            Séminaires &amp;
            <br />
            <em className="italic-emph">masterclass</em>.
          </h1>
          <p className="page-head-copy">
            Formats courts et intensifs pour cadres en exercice. Animés par des praticiens et
            universitaires de premier plan.
          </p>
        </div>
      </div>

      <div className="container page-body">
        {seminars.length === 0 ? (
          <p className="text-soft">Aucun séminaire programmé prochainement.</p>
        ) : (
          <div className="event-list">
            {seminars.map((s) => {
              const dp = dayParts(s.startsAt);
              const seatsLeft = Math.max(0, s.capacity - s._count.registrations);
              const seatsLabel =
                seatsLeft === 0
                  ? `${s.capacity} places · COMPLET`
                  : `${s.capacity} places · ${seatsLeft} restantes`;
              return (
                <Link key={s.id} href={`/seminaires/${s.slug}`} className="event">
                  <div className="event-date">
                    <div className="day">{dp.day}</div>
                    <div className="month">{dp.month}</div>
                  </div>
                  <div>
                    <h4>{s.title}</h4>
                    {s.description ? (
                      <p className="event-desc fs-14 text-mid">
                        {s.description}
                      </p>
                    ) : null}
                    <div className="event-pills">
                      <span className="pill">{durationLabel(s.startsAt, s.endsAt)}</span>
                      <span
                        className={
                          'pill ' +
                          (seatsLeft === 0 ? 'pill-warning' : 'pill-orange')
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
                    Détails <span className="arrow">→</span>
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
