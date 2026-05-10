import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/rbac';
import { prisma } from '@cpfa/db';
import { presignDownload } from '@cpfa/lib/storage';

export const dynamic = 'force-dynamic';

const fmt = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

async function safePresign(key: string | null): Promise<string | null> {
  if (!key) return null;
  try {
    return await presignDownload(key, 600);
  } catch {
    return null;
  }
}

export default async function AdminJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect('/sign-in?callbackUrl=/admin/jobs');
  if (!hasPermission(session.user.roles, 'cms:write')) redirect('/admin');

  const { id } = await params;
  const job = await prisma.jobPosting.findUnique({
    where: { id },
    include: {
      applications: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!job) notFound();

  const apps = await Promise.all(
    job.applications.map(async (a) => ({ ...a, cvUrl: await safePresign(a.cvKey) })),
  );

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          <Link href="/admin/jobs">← Job board</Link>
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">{job.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {job.companyName} · Recruteur : <code>{job.recruiterEmail}</code> ·{' '}
          {job.applications.length} candidature(s)
        </p>
      </header>

      {apps.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune candidature pour le moment.</p>
      ) : (
        <div className="space-y-3">
          {apps.map((a) => (
            <article key={a.id} className="rounded-lg border bg-card p-5">
              <header className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <strong>
                    {a.firstName} {a.lastName}
                  </strong>
                  <div className="text-xs text-muted-foreground">
                    {a.email}
                    {a.phone ? ` · ${a.phone}` : ''}
                    {' · soumise le '}
                    {fmt.format(a.createdAt)}
                  </div>
                </div>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                  {a.status}
                </span>
              </header>
              <p style={{ whiteSpace: 'pre-wrap' }} className="text-sm">
                {a.motivation}
              </p>
              {a.cvUrl ? (
                <p className="mt-2">
                  <a href={a.cvUrl} target="_blank" rel="noreferrer" className="text-sm">
                    Télécharger le CV (PDF) →
                  </a>
                </p>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
