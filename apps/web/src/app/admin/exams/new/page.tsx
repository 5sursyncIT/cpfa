import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/rbac';
import { ExamForm } from '../exam-form';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Nouveau concours — Admin CPFA' };

export default async function NewExamPage() {
  const session = await auth();
  if (!session?.user) redirect('/sign-in?callbackUrl=/admin/exams/new');
  if (!hasPermission(session.user.roles, 'admin:any')) redirect('/admin');

  const now = new Date();
  const oneMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <div className="breadcrumb">
          Admin · <Link href="/admin/exams">Concours</Link> · <span>Nouveau</span>
        </div>
        <h2 style={{ fontSize: 'clamp(28px, 3vw, 36px)', marginTop: 8 }}>
          Nouveau <em className="italic-emph">concours</em>
        </h2>
      </div>

      <ExamForm
        mode="create"
        initial={{
          slug: '',
          kind: 'CONCOURS',
          title: '',
          openAt: now,
          closeAt: oneMonth,
          examAt: null,
          feeXof: 0,
          description: null,
          noticeKey: null,
          published: false,
        }}
      />
    </>
  );
}
