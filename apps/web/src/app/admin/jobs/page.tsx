import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/rbac';
import { prisma } from '@cpfa/db';
import { JobModerationActions } from './moderation-actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Job board — Admin CPFA' };

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'À modérer',
  PUBLISHED: 'Publiées',
  CLOSED: 'Closes',
  REJECTED: 'Rejetées',
};
const fmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' });

export default async function AdminJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect('/sign-in?callbackUrl=/admin/jobs');
  if (!hasPermission(session.user.roles, 'cms:write')) redirect('/admin');

  const { status } = await searchParams;
  const filter =
    status === 'PUBLISHED' || status === 'CLOSED' || status === 'REJECTED'
      ? status
      : 'DRAFT';

  const jobs = await prisma.jobPosting.findMany({
    where: { status: filter },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { applications: true } } },
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Job board</h1>
        <div className="flex gap-1 text-sm">
          {(['DRAFT', 'PUBLISHED', 'CLOSED', 'REJECTED'] as const).map((s) => (
            <a
              key={s}
              href={`/admin/jobs?status=${s}`}
              className={
                'rounded-md border px-3 py-1.5 ' +
                (s === filter ? 'bg-primary text-primary-foreground' : 'bg-background')
              }
            >
              {STATUS_LABEL[s]}
            </a>
          ))}
        </div>
      </header>

      {jobs.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune offre dans cet état.</p>
      ) : (
        <div className="space-y-3">
          {jobs.map((j) => (
            <article key={j.id} className="rounded-lg border bg-card p-5">
              <header className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <h3 className="font-semibold">{j.title}</h3>
                  <div className="text-xs text-muted-foreground">
                    {j.companyName}
                    {j.location ? ` · ${j.location}` : ''}
                    {' · '}
                    Soumis le {fmt.format(j.createdAt)}
                    {' · '}
                    Recruteur : <code>{j.recruiterEmail}</code>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="rounded-full bg-muted px-2 py-0.5">{j.type}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5">{j.level}</span>
                  {j.urgent ? (
                    <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-amber-700">
                      Urgent
                    </span>
                  ) : null}
                  <span className="rounded-full bg-muted px-2 py-0.5">
                    {j._count.applications} cand.
                  </span>
                </div>
              </header>
              <details className="mt-2">
                <summary className="cursor-pointer text-sm text-muted-foreground">
                  Voir le détail
                </summary>
                <div className="mt-2 space-y-2 text-sm">
                  <div>
                    <strong>Description</strong>
                    <p style={{ whiteSpace: 'pre-wrap', marginTop: 4 }}>{j.description}</p>
                  </div>
                  <div>
                    <strong>Profil</strong>
                    <p style={{ whiteSpace: 'pre-wrap', marginTop: 4 }}>{j.profile}</p>
                  </div>
                  <div>
                    <strong>Contact</strong>
                    <p style={{ whiteSpace: 'pre-wrap', marginTop: 4 }}>{j.contact}</p>
                  </div>
                  <div>
                    <Link href={`/admin/jobs/${j.id}`}>
                      Voir les {j._count.applications} candidature(s) →
                    </Link>
                  </div>
                </div>
              </details>
              <JobModerationActions id={j.id} status={j.status} />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
