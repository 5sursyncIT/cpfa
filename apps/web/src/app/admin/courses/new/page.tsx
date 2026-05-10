import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/rbac';
import { CourseForm } from '../course-form';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Nouvelle formation — Admin CPFA' };

export default async function NewCoursePage() {
  const session = await auth();
  if (!session?.user) redirect('/sign-in?callbackUrl=/admin/courses/new');
  if (!hasPermission(session.user.roles, 'admin:any')) redirect('/admin');

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <div className="breadcrumb">
          Admin · <Link href="/admin/courses">Formations</Link> · <span>Nouvelle</span>
        </div>
        <h2 style={{ fontSize: 'clamp(28px, 3vw, 36px)', marginTop: 8 }}>
          Nouvelle <em className="italic-emph">formation</em>
        </h2>
      </div>

      <CourseForm
        mode="create"
        initial={{
          slug: '',
          title: '',
          kind: 'DIPLOMANT',
          level: 'INITIATION',
          durationHours: 1,
          priceXof: 0,
          description: null,
          brochureKey: null,
          coverImageKey: null,
          published: false,
          applicationsOpenAt: null,
          applicationsCloseAt: null,
        }}
      />
    </>
  );
}
