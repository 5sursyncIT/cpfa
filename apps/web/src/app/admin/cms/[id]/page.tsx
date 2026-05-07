import { notFound } from 'next/navigation';
import { prisma } from '@cpfa/db';
import { PageEditor } from './page-editor';

export const dynamic = 'force-dynamic';

export default async function AdminCmsPageEdit({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const page = await prisma.page.findUnique({ where: { id } });
  if (!page) notFound();

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Page CMS</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">{page.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          /p/{page.slug} · {page.published ? 'Publiée' : 'Brouillon'}
        </p>
      </header>

      <PageEditor
        id={page.id}
        initial={{
          title: page.title,
          slug: page.slug,
          metaTitle: page.metaTitle ?? '',
          metaDescription: page.metaDescription ?? '',
          published: page.published,
          content: Array.isArray(page.content) ? (page.content as unknown[]) : [],
        }}
      />
    </div>
  );
}
