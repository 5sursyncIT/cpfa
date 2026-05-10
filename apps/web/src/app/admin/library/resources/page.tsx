import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/rbac';
import { prisma } from '@cpfa/db';
import type { Prisma } from '@cpfa/db';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Catalogue — Admin CPFA' };

const fmtDate = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short' });

const KIND_LABEL: Record<string, string> = {
  BOOK: 'Livre',
  JOURNAL: 'Revue',
  THESIS: 'Mémoire',
  AUDIO: 'Audio',
  VIDEO: 'Vidéo',
  DIGITAL: 'Numérique',
  OTHER: 'Autre',
};

export default async function AdminResourcesListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; kind?: string; categoryId?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect('/sign-in?callbackUrl=/admin/library/resources');
  if (!hasPermission(session.user.roles, 'library:manage')) redirect('/admin');

  const { q, kind, categoryId } = await searchParams;
  const where: Prisma.ResourceWhereInput = {
    ...(kind && KIND_LABEL[kind]
      ? { kind: kind as Prisma.ResourceWhereInput['kind'] }
      : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { subtitle: { contains: q, mode: 'insensitive' } },
            { authors: { hasSome: [q] } },
            { isbn: q.length >= 10 ? { equals: q } : undefined },
          ].filter(Boolean) as Prisma.ResourceWhereInput[],
        }
      : {}),
  };

  const [resources, categories] = await Promise.all([
    prisma.resource.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      take: 100,
      include: {
        category: { select: { name: true } },
        _count: { select: { loans: { where: { status: 'ACTIVE' } } } },
      },
    }),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
  ]);

  return (
    <>
      <div
        className="row"
        style={{ justifyContent: 'space-between', alignItems: 'end', marginBottom: 24, gap: 24 }}
      >
        <div>
          <div className="breadcrumb">
            Admin · <Link href="/admin/library">Bibliothèque</Link> · <span>Catalogue</span>
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 3vw, 36px)', marginTop: 8 }}>
            Catalogue · {resources.length} ressource{resources.length > 1 ? 's' : ''}
          </h2>
        </div>
        <div className="row gap-2">
          <Link href="/admin/library/categories" className="btn btn-ghost">
            Catégories
          </Link>
          <Link href="/admin/library/resources/new" className="btn btn-primary">
            + Nouvelle ressource
          </Link>
        </div>
      </div>

      <form className="panel" style={{ padding: 16, marginBottom: 24 }}>
        <div className="row gap-3" style={{ flexWrap: 'wrap', alignItems: 'end' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label className="label" htmlFor="filter-q">Recherche</label>
            <input
              id="filter-q"
              name="q"
              defaultValue={q ?? ''}
              placeholder="Titre, auteur, ISBN…"
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="filter-kind">Type</label>
            <select id="filter-kind" name="kind" defaultValue={kind ?? ''} className="select">
              <option value="">Tous</option>
              {Object.entries(KIND_LABEL).map(([k, l]) => (
                <option key={k} value={k}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="filter-cat">Catégorie</label>
            <select id="filter-cat" name="categoryId" defaultValue={categoryId ?? ''} className="select">
              <option value="">Toutes</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-ghost btn-sm">Filtrer</button>
          {(q || kind || categoryId) ? (
            <Link href="/admin/library/resources" className="btn-link fs-13">Réinitialiser</Link>
          ) : null}
        </div>
      </form>

      <div className="panel">
        {resources.length === 0 ? (
          <p className="text-soft" style={{ padding: 24 }}>
            Aucune ressource. <Link href="/admin/library/resources/new">Ajoute la première</Link>.
          </p>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Type</th>
                <th>Auteurs</th>
                <th>Catégorie</th>
                <th>Exemplaires</th>
                <th>Ajout</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {resources.map((r) => {
                const onLoan = r._count.loans;
                const available = Math.max(0, r.totalCopies - onLoan);
                return (
                  <tr key={r.id}>
                    <td>
                      <Link
                        href={`/admin/library/resources/${r.id}/edit`}
                        style={{ color: 'inherit', textDecoration: 'none', fontWeight: 500 }}
                      >
                        {r.title}
                      </Link>
                      {r.subtitle ? <div className="fs-13 text-soft">{r.subtitle}</div> : null}
                    </td>
                    <td><span className="pill">{KIND_LABEL[r.kind] ?? r.kind}</span></td>
                    <td className="text-soft fs-13">{r.authors.join(', ') || '—'}</td>
                    <td className="text-soft fs-13">{r.category?.name ?? '—'}</td>
                    <td className="mono fs-13">
                      {available}/{r.totalCopies}
                      {onLoan > 0 ? <span className="text-soft"> · {onLoan} prêt(s)</span> : null}
                    </td>
                    <td className="text-soft fs-13">{fmtDate.format(r.createdAt)}</td>
                    <td>
                      <Link
                        href={`/admin/library/resources/${r.id}/edit`}
                        className="btn-link fs-13"
                      >
                        Éditer →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
