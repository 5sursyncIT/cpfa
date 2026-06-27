import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/rbac';
import { prisma } from '@cpfa/db';
import { ResourceForm } from '../resource-form';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Nouvelle ressource — Admin CPFA' };

export default async function NewResourcePage() {
  const session = await auth();
  if (!session?.user) redirect('/sign-in?callbackUrl=/admin/library/resources/new');
  if (!hasPermission(session.user.roles, 'library:manage')) redirect('/admin');

  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <div className="breadcrumb">
          Admin · <Link href="/admin/library">Bibliothèque</Link> ·{' '}
          <Link href="/admin/library/resources">Catalogue</Link> · <span>Nouvelle ressource</span>
        </div>
        <h2 style={{ fontSize: 'clamp(28px, 3vw, 36px)', marginTop: 8 }}>
          Nouvelle <em className="italic-emph">ressource</em>
        </h2>
      </div>

      <ResourceForm
        mode="create"
        categories={categories}
        initial={{
          kind: 'BOOK',
          title: '',
          subtitle: null,
          authors: [],
          cote: null,
          isbn: null,
          publisher: null,
          publishedYear: null,
          language: 'fr',
          summary: null,
          coverKey: null,
          totalCopies: 1,
          keywords: [],
          categoryId: null,
        }}
      />
    </>
  );
}
