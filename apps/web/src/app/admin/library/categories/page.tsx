import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/rbac';
import { prisma } from '@cpfa/db';
import { CategoriesEditor } from './categories-editor';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Catégories — Admin CPFA' };

export default async function AdminCategoriesPage() {
  const session = await auth();
  if (!session?.user) redirect('/sign-in?callbackUrl=/admin/library/categories');
  if (!hasPermission(session.user.roles, 'library:manage')) redirect('/admin');

  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { resources: true, children: true } } },
  });

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <div className="breadcrumb">
          Admin · <Link href="/admin/library">Bibliothèque</Link> · <span>Catégories</span>
        </div>
        <h2 style={{ fontSize: 'clamp(28px, 3vw, 36px)', marginTop: 8 }}>
          Catégories <em className="italic-emph">du catalogue</em>
        </h2>
      </div>

      <CategoriesEditor
        initial={categories.map((c) => ({
          id: c.id,
          slug: c.slug,
          name: c.name,
          parentId: c.parentId,
          resourceCount: c._count.resources,
          childCount: c._count.children,
        }))}
      />
    </>
  );
}
