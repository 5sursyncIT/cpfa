import Link from 'next/link';
import { prisma } from '@cpfa/db';
import { Countdown } from '@/components/cpfa/countdown';
import { fmtXof } from '@/lib/cpfa-mappers';

export const metadata = { title: "Concours d'entrée — CPFA" };
export const dynamic = 'force-dynamic';

const fmtDate = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });
const fmtShortDate = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' });

const EPREUVES = [
  { num: '01', title: 'Culture économique et financière', desc: 'QCM 90 minutes · coefficient 2' },
  {
    num: '02',
    title: 'Mathématiques financières & probabilités',
    desc: 'Composition 3 heures · coefficient 3',
  },
  {
    num: '03',
    title: 'Anglais des affaires',
    desc: 'Compréhension écrite 60 minutes · coefficient 1',
  },
  {
    num: '04',
    title: 'Entretien de motivation',
    desc: 'Jury de 3 personnes · 25 minutes · coefficient 2',
  },
];

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

  // Pick a featured exam (next-closing CONCOURS) for the headline countdown.
  const featured = exams.find((e) => e.kind === 'CONCOURS') ?? exams[0];
  const others = featured ? exams.filter((e) => e.id !== featured.id) : [];

  return (
    <div>
      <div className="container page-head">
        <div className="breadcrumb">
          CPFA · <span>Concours d&apos;entrée</span>
        </div>
        <h1>
          Concours d&apos;entrée
          <br />
          <em className="italic-emph">2026 — 2027.</em>
        </h1>
      </div>

      <div className="container" style={{ paddingBottom: 96 }}>
        {!featured ? (
          <p className="text-soft">Aucun avis ouvert pour le moment.</p>
        ) : (
          <>
            <div className="concours-card" style={{ marginBottom: 48 }}>
              <div>
                <span className="eyebrow" style={{ marginBottom: 16 }}>
                  Clôture des candidatures dans
                </span>
                <Countdown deadline={featured.closeAt} />
                <div className="row gap-3">
                  <Link href={`/concours/${featured.slug}`} className="btn btn-orange btn-lg">
                    Déposer mon dossier <span className="arrow">→</span>
                  </Link>
                  <button type="button" className="btn btn-ghost btn-lg">
                    Annales 2018-2025
                  </button>
                </div>
                <p className="fs-13 text-soft" style={{ marginTop: 24 }}>
                  {KIND_LABEL[featured.kind] ?? featured.kind} ·{' '}
                  <strong>{featured.title}</strong> · frais{' '}
                  <span className="mono">{fmtXof(featured.feeXof)}</span>
                </p>
              </div>
              <div>
                <h3 style={{ marginBottom: 16 }}>
                  Quatre épreuves, une <em className="italic-emph">trajectoire</em>.
                </h3>
                <div className="col gap-4">
                  {EPREUVES.map((e) => (
                    <div
                      key={e.num}
                      className="row gap-4"
                      style={{ paddingTop: 16, borderTop: '1px solid var(--line)' }}
                    >
                      <span className="mono fs-13 text-soft" style={{ minWidth: 28 }}>
                        {e.num}
                      </span>
                      <div>
                        <div className="fs-15" style={{ fontWeight: 500, marginBottom: 4 }}>
                          {e.title}
                        </div>
                        <div className="fs-13 text-soft">{e.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="row gap-4" style={{ flexWrap: 'wrap' }}>
              <div className="card" style={{ flex: 1, minWidth: 220 }}>
                <div
                  className="serif"
                  style={{ fontSize: 36, lineHeight: 1, marginBottom: 8 }}
                >
                  {fmtShortDate.format(featured.closeAt)}
                </div>
                <div className="fs-14" style={{ fontWeight: 500, marginBottom: 4 }}>
                  Clôture inscriptions
                </div>
                <div className="fs-13 text-soft">Dépôt en ligne</div>
              </div>
              {featured.examAt ? (
                <div className="card" style={{ flex: 1, minWidth: 220 }}>
                  <div
                    className="serif"
                    style={{ fontSize: 36, lineHeight: 1, marginBottom: 8 }}
                  >
                    {fmtShortDate.format(featured.examAt)}
                  </div>
                  <div className="fs-14" style={{ fontWeight: 500, marginBottom: 4 }}>
                    Épreuves écrites
                  </div>
                  <div className="fs-13 text-soft">Centre Dakar</div>
                </div>
              ) : null}
              <div className="card" style={{ flex: 1, minWidth: 220 }}>
                <div className="serif" style={{ fontSize: 36, lineHeight: 1, marginBottom: 8 }}>
                  {featured.examAt
                    ? fmtShortDate.format(
                        new Date(featured.examAt.getTime() + 8 * 24 * 60 * 60 * 1000),
                      )
                    : '—'}
                </div>
                <div className="fs-14" style={{ fontWeight: 500, marginBottom: 4 }}>
                  Entretiens
                </div>
                <div className="fs-13 text-soft">Convocation par email</div>
              </div>
              <div className="card" style={{ flex: 1, minWidth: 220 }}>
                <div className="serif" style={{ fontSize: 36, lineHeight: 1, marginBottom: 8 }}>
                  {featured.examAt
                    ? fmtShortDate.format(
                        new Date(featured.examAt.getTime() + 13 * 24 * 60 * 60 * 1000),
                      )
                    : '—'}
                </div>
                <div className="fs-14" style={{ fontWeight: 500, marginBottom: 4 }}>
                  Résultats
                </div>
                <div className="fs-13 text-soft">Affichage public</div>
              </div>
            </div>

            {others.length > 0 ? (
              <>
                <h3 style={{ marginTop: 64, marginBottom: 24 }}>
                  Autres avis <em className="italic-emph">ouverts</em>
                </h3>
                <div className="event-list">
                  {others.map((e) => (
                    <Link
                      key={e.id}
                      href={`/concours/${e.slug}`}
                      className="event"
                      style={{ gridTemplateColumns: '110px 1fr auto auto' }}
                    >
                      <div className="event-date">
                        <div className="day">{String(e.closeAt.getDate()).padStart(2, '0')}</div>
                        <div className="month">
                          {new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(e.closeAt)}{' '}
                          {String(e.closeAt.getFullYear()).slice(2)}
                        </div>
                      </div>
                      <div>
                        <h4>{e.title}</h4>
                        <p className="fs-14 text-mid" style={{ marginTop: 6 }}>
                          {KIND_LABEL[e.kind] ?? e.kind} · clôture le {fmtDate.format(e.closeAt)}
                        </p>
                      </div>
                      <div className="event-meta">
                        <span>{fmtXof(e.feeXof)}</span>
                      </div>
                      <span className="btn btn-ghost btn-sm">
                        Détails <span className="arrow">→</span>
                      </span>
                    </Link>
                  ))}
                </div>
              </>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
