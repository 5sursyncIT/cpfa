import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/rbac';
import { prisma } from '@cpfa/db';
import type { Prisma } from '@cpfa/db';
import { RegistrationsTable } from './registrations-table';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Inscriptions — Admin CPFA' };

const STATUS_OPTIONS: Array<[string, string]> = [
  ['SUBMITTED', 'Soumises'],
  ['PAID', 'Réglées'],
  ['VALIDATED', 'Validées'],
  ['REJECTED', 'Refusées'],
  ['DRAFT', 'Brouillons'],
  ['CANCELLED', 'Annulées'],
];

const KIND_OPTIONS: Array<[string, string]> = [
  ['course', 'Formations'],
  ['seminar', 'Séminaires'],
  ['exam', 'Concours'],
];

export default async function AdminRegistrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; kind?: string; q?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect('/sign-in?callbackUrl=/admin/registrations');
  if (!hasPermission(session.user.roles, 'admin:any')) redirect('/admin');

  const { status, kind, q } = await searchParams;

  const where: Prisma.RegistrationWhereInput = {
    ...(status
      ? { status: status as Prisma.RegistrationWhereInput['status'] }
      : { status: { in: ['SUBMITTED', 'PAID'] } }),
    ...(kind === 'course'
      ? { courseId: { not: null } }
      : kind === 'seminar'
        ? { seminarId: { not: null } }
        : kind === 'exam'
          ? { examId: { not: null } }
          : {}),
    ...(q
      ? {
          OR: [
            { user: { email: { contains: q, mode: 'insensitive' } } },
            { user: { firstName: { contains: q, mode: 'insensitive' } } },
            { user: { lastName: { contains: q, mode: 'insensitive' } } },
            { course: { title: { contains: q, mode: 'insensitive' } } },
            { seminar: { title: { contains: q, mode: 'insensitive' } } },
            { exam: { title: { contains: q, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };

  const registrations = await prisma.registration.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
      course: { select: { title: true } },
      seminar: { select: { title: true } },
      exam: { select: { title: true } },
      payment: { select: { status: true, amountXof: true } },
    },
  });

  const counts = await Promise.all([
    prisma.registration.count({ where: { status: 'SUBMITTED' } }),
    prisma.registration.count({ where: { status: 'PAID' } }),
    prisma.registration.count({ where: { status: 'VALIDATED' } }),
    prisma.registration.count({ where: { status: 'REJECTED' } }),
  ]);

  return (
    <>
      <div
        className="row"
        style={{ justifyContent: 'space-between', alignItems: 'end', marginBottom: 24, gap: 24 }}
      >
        <div>
          <div className="breadcrumb">
            Admin · <span>Inscriptions</span>
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 3vw, 36px)', marginTop: 8 }}>
            Inscriptions · {registrations.length} affichées
          </h2>
        </div>
        <a href="/api/admin/exports/registrations.csv" className="btn btn-ghost">
          Export CSV
        </a>
      </div>

      <form className="panel" style={{ padding: 16, marginBottom: 16 }}>
        <div className="row gap-3" style={{ flexWrap: 'wrap', alignItems: 'end' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label className="label" htmlFor="filter-q">Recherche</label>
            <input
              id="filter-q"
              name="q"
              defaultValue={q ?? ''}
              placeholder="Candidat ou programme"
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="filter-status">Statut</label>
            <select id="filter-status" name="status" defaultValue={status ?? ''} className="select">
              <option value="">À traiter (SUBMITTED + PAID)</option>
              {STATUS_OPTIONS.map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="filter-kind">Type</label>
            <select id="filter-kind" name="kind" defaultValue={kind ?? ''} className="select">
              <option value="">Tous</option>
              {KIND_OPTIONS.map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-ghost btn-sm">Filtrer</button>
          {(q || status || kind) ? (
            <Link href="/admin/registrations" className="btn-link fs-13">Réinitialiser</Link>
          ) : null}
        </div>
      </form>

      <div className="row gap-2" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        {STATUS_OPTIONS.slice(0, 4).map(([k, l], i) => (
          <Link
            key={k}
            href={`/admin/registrations?status=${k}`}
            className={'pill ' + (status === k ? 'pill-orange' : '')}
            style={{ textDecoration: 'none' }}
          >
            {l} · {counts[i]}
          </Link>
        ))}
      </div>

      <RegistrationsTable registrations={registrations} />
    </>
  );
}
