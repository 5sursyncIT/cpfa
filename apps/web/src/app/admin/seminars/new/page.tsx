import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/rbac';
import { SeminarForm } from '../seminar-form';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Nouveau séminaire — Admin CPFA' };

export default async function NewSeminarPage() {
  const session = await auth();
  if (!session?.user) redirect('/sign-in?callbackUrl=/admin/seminars/new');
  if (!hasPermission(session.user.roles, 'admin:any')) redirect('/admin');

  const now = new Date();
  const endsAt = new Date(now.getTime() + 3 * 60 * 60 * 1000);

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <div className="breadcrumb">
          Admin · <Link href="/admin/seminars">Séminaires</Link> · <span>Nouveau</span>
        </div>
        <h2 style={{ fontSize: 'clamp(28px, 3vw, 36px)', marginTop: 8 }}>
          Nouveau <em className="italic-emph">séminaire</em>
        </h2>
      </div>

      <SeminarForm
        mode="create"
        initial={{
          slug: '',
          title: '',
          startsAt: now,
          endsAt,
          location: null,
          priceXof: 0,
          capacity: 50,
          description: null,
          brochureKey: null,
          published: false,
        }}
      />
    </>
  );
}
