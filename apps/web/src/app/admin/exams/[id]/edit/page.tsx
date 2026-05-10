import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/rbac';
import { prisma } from '@cpfa/db';
import { ExamForm } from '../../exam-form';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Éditer le concours — Admin CPFA' };

export default async function EditExamPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect('/sign-in?callbackUrl=/admin/exams');
  if (!hasPermission(session.user.roles, 'admin:any')) redirect('/admin');

  const { id } = await params;
  const exam = await prisma.exam.findUnique({
    where: { id },
    include: { _count: { select: { registrations: true, papers: true } } },
  });
  if (!exam) notFound();

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <div className="breadcrumb">
          Admin · <Link href="/admin/exams">Concours</Link> ·{' '}
          <Link href={`/admin/exams/${exam.id}`}>{exam.title}</Link> · <span>Éditer</span>
        </div>
        <h2 style={{ fontSize: 'clamp(28px, 3vw, 36px)', marginTop: 8 }}>{exam.title}</h2>
        <div className="fs-13 text-soft" style={{ marginTop: 4 }}>
          {exam._count.registrations} candidature(s) · {exam._count.papers} épreuve(s) ·{' '}
          {exam.published ? (
            <span style={{ color: 'var(--success)' }}>publié</span>
          ) : (
            <span style={{ color: 'var(--ink-soft)' }}>brouillon</span>
          )}
        </div>
      </div>

      <ExamForm
        mode="edit"
        initial={{
          id: exam.id,
          slug: exam.slug,
          kind: exam.kind,
          title: exam.title,
          openAt: exam.openAt,
          closeAt: exam.closeAt,
          examAt: exam.examAt,
          feeXof: exam.feeXof,
          description: exam.description,
          noticeKey: exam.noticeKey,
          published: exam.published,
        }}
      />
    </>
  );
}
