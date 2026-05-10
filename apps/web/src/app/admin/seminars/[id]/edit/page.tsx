import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/rbac';
import { prisma } from '@cpfa/db';
import { SeminarForm } from '../../seminar-form';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Éditer un séminaire — Admin CPFA' };

export default async function EditSeminarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect('/sign-in?callbackUrl=/admin/seminars');
  if (!hasPermission(session.user.roles, 'admin:any')) redirect('/admin');

  const { id } = await params;
  const seminar = await prisma.seminar.findUnique({
    where: { id },
    include: { _count: { select: { registrations: true, speakers: true } } },
  });
  if (!seminar) notFound();

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <div className="breadcrumb">
          Admin · <Link href="/admin/seminars">Séminaires</Link> · <span>{seminar.title}</span>
        </div>
        <h2 style={{ fontSize: 'clamp(28px, 3vw, 36px)', marginTop: 8 }}>{seminar.title}</h2>
        <div className="fs-13 text-soft" style={{ marginTop: 4 }}>
          {seminar._count.registrations} inscription(s) · {seminar._count.speakers} intervenant(s) ·{' '}
          {seminar.published ? (
            <span style={{ color: 'var(--success)' }}>publié</span>
          ) : (
            <span style={{ color: 'var(--ink-soft)' }}>brouillon</span>
          )}
        </div>
      </div>

      <SeminarForm
        mode="edit"
        initial={{
          id: seminar.id,
          slug: seminar.slug,
          title: seminar.title,
          startsAt: seminar.startsAt,
          endsAt: seminar.endsAt,
          location: seminar.location,
          priceXof: seminar.priceXof,
          capacity: seminar.capacity,
          description: seminar.description,
          brochureKey: seminar.brochureKey,
          published: seminar.published,
        }}
      />
    </>
  );
}
