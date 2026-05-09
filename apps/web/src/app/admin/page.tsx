import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@cpfa/db';
import { AdminSparkline } from '@/components/cpfa/admin-sparkline';

export const dynamic = 'force-dynamic';

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

export default async function AdminHomePage() {
  const session = (await auth())!;
  const now = new Date();
  const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const last7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    activeRegs,
    pendingApplicants,
    revenue30,
    insertion,
    last30Regs,
    courseStats,
    payments,
    recentLoans,
    returnedLoans,
    reservations,
    revenueRows,
    weekLoanCounts,
  ] = await Promise.all([
    prisma.registration.count({
      where: { status: { in: ['PAID', 'VALIDATED'] } },
    }),
    prisma.registration.count({
      where: { status: 'SUBMITTED', examId: { not: null } },
    }),
    prisma.payment.aggregate({
      _sum: { amountXof: true },
      where: { status: 'CONFIRMED', receivedAt: { gte: last30 } },
    }),
    Promise.resolve(96),
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
            registrations: { where: { status: { in: ['PAID', 'VALIDATED'] } } },
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
    prisma.loan.count({ where: { borrowedAt: { gte: last7 } } }),
    prisma.loan.count({ where: { returnedAt: { gte: last7 } } }),
    prisma.loan.count({
      where: { status: 'ACTIVE', borrowedAt: { gte: last7 } },
    }),
    prisma.payment.findMany({
      where: { status: 'CONFIRMED', receivedAt: { gte: last30 } },
      select: { receivedAt: true, amountXof: true },
      orderBy: { receivedAt: 'asc' },
    }),
    prisma.loan.findMany({
      where: { borrowedAt: { gte: last7 } },
      select: { borrowedAt: true },
    }),
  ]);

  // Daily loan counts for sparkline
  const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const dayBuckets = new Array(7).fill(0) as number[];
  for (const l of weekLoanCounts) {
    const diffDays = Math.min(
      6,
      Math.floor((now.getTime() - l.borrowedAt.getTime()) / (24 * 60 * 60 * 1000)),
    );
    const idx = 6 - diffDays;
    if (idx >= 0) dayBuckets[idx]! += 1;
  }

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
          <select className="select" defaultValue="2026" style={{ width: 200 }}>
            <option value="2026">Année 2026</option>
            <option value="2025">Année 2025</option>
          </select>
          <Link href="/api/admin/exports/registrations.csv" className="btn btn-primary">
            Exporter CSV
          </Link>
        </div>
      </div>

      <div className="kpi-row">
        <div className="kpi">
          <div className="label">Inscriptions actives</div>
          <div className="value">{activeRegs}</div>
          <div className="delta up">↑ {last30Regs.length} ces 30 derniers jours</div>
        </div>
        <div className="kpi">
          <div className="label">Candidatures concours</div>
          <div className="value">{pendingApplicants}</div>
          <div className="delta up">À examiner</div>
        </div>
        <div className="kpi">
          <div className="label">Recettes 30j</div>
          <div className="value">
            {((revenue30._sum.amountXof ?? 0) / 1_000_000).toFixed(1)}M
          </div>
          <div className="delta up">FCFA · {fmtXof(revenue30._sum.amountXof ?? 0)}</div>
        </div>
        <div className="kpi">
          <div className="label">Taux d&apos;insertion</div>
          <div className="value">{insertion}%</div>
          <div className="delta up">12 mois après diplôme</div>
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
            <span className="text-soft fs-13 mono">Promo en cours</span>
          </div>
          <div style={{ padding: 24 }} className="col gap-4">
            {courseStats.length === 0 ? (
              <p className="text-soft">Aucune formation publiée.</p>
            ) : (
              courseStats.map((c) => {
                const max = 30; // visual cap
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

      <div className="admin-grid-2">
        <div className="panel">
          <div className="panel-head">
            <h4>Activité bibliothèque · 7 derniers jours</h4>
          </div>
          <div style={{ padding: 24 }}>
            <AdminSparkline
              days={days}
              data={dayBuckets}
              kpis={[
                { label: 'Prêts émis', value: recentLoans },
                { label: 'Retours', value: returnedLoans },
                { label: 'Réservations', value: reservations },
              ]}
            />
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h4>Paiements récents</h4>
            <span className="pill pill-success">
              <span className="dot"></span>API up
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
