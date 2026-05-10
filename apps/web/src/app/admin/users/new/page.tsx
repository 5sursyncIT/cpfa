import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/rbac';
import { NewUserForm } from './new-user-form';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Nouvel utilisateur — Admin CPFA' };

export default async function AdminNewUserPage() {
  const session = await auth();
  if (!session?.user) redirect('/sign-in?callbackUrl=/admin/users/new');
  if (!hasPermission(session.user.roles, 'admin:any')) redirect('/admin');

  const callerIsSuperAdmin = (session.user.roles as string[]).includes('SUPER_ADMIN');

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <div className="breadcrumb">
          Admin · <Link href="/admin/users">Utilisateurs</Link> · <span>Nouveau</span>
        </div>
        <h2 style={{ fontSize: 'clamp(28px, 3vw, 36px)', marginTop: 8 }}>Nouvel utilisateur</h2>
      </div>
      <NewUserForm callerIsSuperAdmin={callerIsSuperAdmin} />
    </>
  );
}
