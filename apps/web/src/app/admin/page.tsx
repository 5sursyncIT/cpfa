import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@cpfa/db';
import { getRedis } from '@cpfa/lib/queues';

export const dynamic = 'force-dynamic';

async function probeHealth(): Promise<{ ok: boolean; label: string }> {
  const [db, redis] = await Promise.all([
    prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false),
    getRedis()
      .ping()
      .then((r) => r === 'PONG')
      .catch(() => false),
  ]);
  if (db && redis) return { ok: true, label: 'Services OK' };
  if (!db) return { ok: false, label: 'Base de données indisponible' };
  return { ok: false, label: 'File d’attente indisponible' };
}

const fmtXof = (n: number) => `${n.toLocaleString('fr-FR')} FCFA`;
const fmtDateTime = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'short',
  timeStyle: 'short',
});

const STATUS_PILL: Record<string, { label: string; className: string }> = {
  SUBMITTED: { label: 'À valider', className: 'pill-warning' },
  PAID: { label: 'Réglée', className: 'pill-orange' },
  VALIDATED: { label: 'Validée', className: 'pill-success' },
  REJECTED: { label: 'Refusée', className: '' },
  DRAFT: { label: 'Brouillon', className: '' },
  CANCELLED: { label: 'Annulée', className: '' },
};

export default async function AdminHomePage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const session = (await auth())!;
  const now = new Date();
  const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // ── Year filter ───────────────────────────────────────────────────────────
  // Scopes the headline figures (active registrations, revenue, programme
  // breakdown) to a calendar year. The list of years is derived from the data.
  const currentYear = now.getFullYear();
  const firstRecord = await prisma.registration.findFirst({
    orderBy: { createdAt: 'asc' },
    select: { createdAt: true },
  });
  const minYear = firstRecord ? firstRecord.createdAt.getFullYear() : currentYear;
  const availableYears: number[] = [];
  for (let y = currentYear; y >= minYear; y--) availableYears.push(y);

  const requestedYear = Number((await searchParams).year);
  const selectedYear = availableYears.includes(requestedYear) ? requestedYear : currentYear;
  const yearStart = new Date(selectedYear, 0, 1);
  const yearEnd = new Date(selectedYear + 1, 0, 1);
  const yearRange = { gte: yearStart, lt: yearEnd };

  const [
    health,
    activeRegs,
    pendingApplicants,
    revenueYear,
    activeSubscribers,
    last30Regs,
    courseStats,
    payments,
    revenueRows,
  ] = await Promise.all([
    probeHealth(),
    prisma.registration.count({
      where: { status: { in: ['PAID', 'VALIDATED'] }, createdAt: yearRange },
    }),
    prisma.registration.count({
      where: { status: 'SUBMITTED', examId: { not: null } },
    }),
    prisma.payment.aggregate({
      _sum: { amountXof: true },
      where: { status: 'CONFIRMED', receivedAt: yearRange },
    }),
    prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    prisma.registration.findMany({
      where: { createdAt: { gte: last30 } },
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        course: { select: { title: true } },
        seminar: { select: { title: true } },
        exam: { select: { title: true } },
      },
    }),
    prisma.course.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        _count: {
          select: {
            registrations: {
              where: { status: { in: ['PAID', 'VALIDATED'] }, createdAt: yearRange },
            },
          },
        },
      },
    }),
    prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 4,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        registration: {
          include: {
            course: { select: { title: true } },
            seminar: { select: { title: true } },
            exam: { select: { title: true } },
          },
        },
      },
    }),
    prisma.payment.findMany({
      where: { status: 'CONFIRMED', receivedAt: { gte: last30 } },
      select: { receivedAt: true, amountXof: true },
      orderBy: { receivedAt: 'asc' },
    }),
  ]);

  // Scale the programme bars to the busiest programme so they stay meaningful
  // whatever the cohort size (Course has no fixed capacity).
  const programMax = Math.max(1, ...courseStats.map((c) => c._count.registrations));

  // Revenue series for header
  const buckets = new Map<string, number>();
  for (const p of revenueRows) {
    if (!p.receivedAt) continue;
    const key = p.receivedAt.toISOString().slice(0, 10);
    buckets.set(key, (buckets.get(key) ?? 0) + p.amountXof);
  }

  const firstName = (session.user.name ?? '').split(' ')[0] || 'Admin';

  return (
    <>
      <div
        className="row"
        style={{ justifyContent: 'space-between', alignItems: 'end', marginBottom: 32, gap: 24 }}
      >
        <div>
          <div className="breadcrumb">
            Admin · <span>Vue d&apos;ensemble</span>
          </div>
          <h2 style={{ fontSize: 'clamp(36px, 4vw, 52px)', marginTop: 8 }}>
            Bonjour, <em className="italic-emph">{firstName}</em>.
          </h2>
        </div>
        <div className="row gap-2">
          <form method="get" className="row gap-2">
            <select
              name="year"
              className="select"
              defaultValue={String(selectedYear)}
              style={{ width: 160 }}
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  Année {y}
                </option>
              ))}
            </select>
            <button type="submit" className="btn btn-ghost">
              Afficher
            </button>
          </form>
          <Link href="/api/admin/exports/registrations.csv" className="btn btn-primary">
            Exporter CSV
          </Link>
        </div>
      </div>

      <div className="kpi-row">
        <div className="kpi">
          <div className="label">Inscriptions actives</div>
          <div className="value">{activeRegs}</div>
          <div className="delta up">Réglées / validées · {selectedYear}</div>
        </div>
        <div className="kpi">
          <div className="label">Candidatures concours</div>
          <div className="value">{pendingApplicants}</div>
          <div className="delta up">À examiner</div>
        </div>
        <div className="kpi">
          <div className="label">Recettes {selectedYear}</div>
          <div className="value">
            {((revenueYear._sum.amountXof ?? 0) / 1_000_000).toFixed(1)}M
          </div>
          <div className="delta up">FCFA · {fmtXof(revenueYear._sum.amountXof ?? 0)}</div>
        </div>
        <div className="kpi">
          <div className="label">Abonnés bibliothèque actifs</div>
          <div className="value">{activeSubscribers}</div>
          <div className="delta up">Abonnements en cours</div>
        </div>
      </div>

      <div className="admin-grid-2">
        <div className="panel">
          <div className="panel-head">
            <h4>Candidatures à valider</h4>
            <Link href="/admin/registrations" className="btn btn-ghost btn-sm">
              Tout voir
            </Link>
          </div>
          {last30Regs.length === 0 ? (
            <p className="text-soft" style={{ padding: 24 }}>
              Aucune candidature reçue ces 30 derniers jours.
            </p>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Réf</th>
                  <th>Candidat</th>
                  <th>Programme</th>
                  <th>Statut</th>
                  <th>Reçue</th>
                </tr>
              </thead>
              <tbody>
                {last30Regs.map((r) => {
                  const target =
                    r.course?.title ?? r.seminar?.title ?? r.exam?.title ?? '—';
                  const fullName =
                    [r.user.firstName, r.user.lastName].filter(Boolean).join(' ') ||
                    r.user.email;
                  const pill = STATUS_PILL[r.status] ?? { label: r.status, className: '' };
                  return (
                    <tr key={r.id}>
                      <td className="mono text-soft">
                        CPFA-{r.id.slice(-4).toUpperCase()}
                      </td>
                      <td style={{ fontWeight: 500 }}>{fullName}</td>
                      <td className="text-mid">{target}</td>
                      <td>
                        <span className={'pill ' + pill.className}>{pill.label}</span>
                      </td>
                      <td className="text-soft mono fs-13">
                        {fmtDateTime.format(r.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="panel">
          <div className="panel-head">
            <h4>Inscriptions par programme</h4>
            <span className="text-soft fs-13 mono">Année {selectedYear}</span>
          </div>
          <div style={{ padding: 24 }} className="col gap-4">
            {courseStats.length === 0 ? (
              <p className="text-soft">Aucune formation publiée.</p>
            ) : (
              courseStats.map((c) => {
                const max = programMax;
                const val = c._count.registrations;
                const pct = Math.min(100, Math.round((val / max) * 100));
                return (
                  <div key={c.id}>
                    <div
                      className="row"
                      style={{ justifyContent: 'space-between', marginBottom: 6 }}
                    >
                      <span className="fs-13">{c.title}</span>
                      <span className="mono fs-13 text-soft">
                        {val}/{max}
                      </span>
                    </div>
                    <div
                      style={{
                        height: 6,
                        background: 'var(--bg-soft)',
                        borderRadius: 3,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: pct + '%',
                          background: pct >= 90 ? 'var(--orange)' : 'var(--ink)',
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div style={{ height: 24 }}></div>

      <div>
        <div className="panel">
          <div className="panel-head">
            <h4>Paiements récents</h4>
            <span className={'pill ' + (health.ok ? 'pill-success' : 'pill-warning')}>
              <span className="dot"></span>
              {health.label}
            </span>
          </div>
          {payments.length === 0 ? (
            <p className="text-soft" style={{ padding: 24 }}>
              Aucun paiement.
            </p>
          ) : (
            <table className="tbl">
              <tbody>
                {payments.map((p) => {
                  const target =
                    p.registration?.course?.title ??
                    p.registration?.seminar?.title ??
                    p.registration?.exam?.title ??
                    p.purpose;
                  const fullName =
                    [p.user.firstName, p.user.lastName].filter(Boolean).join(' ') ||
                    p.user.email;
                  return (
                    <tr key={p.id}>
                      <td className="mono text-soft fs-13">
                        {p.provider}-{p.id.slice(-4).toUpperCase()}
                      </td>
                      <td>
                        <div className="fs-14" style={{ fontWeight: 500 }}>
                          {fullName}
                        </div>
                        <div className="fs-13 text-soft">{target}</div>
                      </td>
                      <td className="serif" style={{ fontSize: 18, textAlign: 'right' }}>
                        {p.amountXof.toLocaleString('fr-FR')}
                        <span className="mono fs-13 text-soft" style={{ marginLeft: 4 }}>
                          FCFA
                        </span>
                      </td>
                      <td>
                        <span
                          className={
                            'pill ' +
                            (p.status === 'CONFIRMED' ? 'pill-success' : 'pill-warning')
                          }
                        >
                          {p.status === 'CONFIRMED' ? 'Réglé' : p.status === 'PENDING' ? 'Attente' : p.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
