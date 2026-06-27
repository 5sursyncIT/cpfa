import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/rbac';
import { prisma } from '@cpfa/db';
import { ResourceForm } from '../../resource-form';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Éditer une ressource — Admin CPFA' };

export default async function EditResourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect('/sign-in?callbackUrl=/admin/library/resources');
  if (!hasPermission(session.user.roles, 'library:manage')) redirect('/admin');

  const { id } = await params;
  const [resource, categories] = await Promise.all([
    prisma.resource.findUnique({ where: { id } }),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
  ]);
  if (!resource) notFound();

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <div className="breadcrumb">
          Admin · <Link href="/admin/library">Bibliothèque</Link> ·{' '}
          <Link href="/admin/library/resources">Catalogue</Link> · <span>{resource.title}</span>
        </div>
        <h2 style={{ fontSize: 'clamp(28px, 3vw, 36px)', marginTop: 8 }}>{resource.title}</h2>
        <div className="fs-13 text-soft" style={{ marginTop: 4 }}>
          QR : <code className="mono">{resource.qrPayload}</code>
        </div>
      </div>

      <ResourceForm
        mode="edit"
        categories={categories}
        initial={{
          id: resource.id,
          kind: resource.kind,
          title: resource.title,
          subtitle: resource.subtitle,
          authors: resource.authors,
          cote: resource.cote,
          isbn: resource.isbn,
          publisher: resource.publisher,
          publishedYear: resource.publishedYear,
          language: resource.language,
          summary: resource.summary,
          coverKey: resource.coverKey,
          totalCopies: resource.totalCopies,
          keywords: resource.keywords,
          categoryId: resource.categoryId,
        }}
      />
    </>
  );
}
