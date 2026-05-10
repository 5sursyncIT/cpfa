import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/rbac';
import { prisma } from '@cpfa/db';
import { BorrowFlow } from './borrow-flow';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Prêter un ouvrage — Admin CPFA' };

export default async function AdminBorrowPage() {
  const session = await auth();
  if (!session?.user) redirect('/sign-in?callbackUrl=/admin/library/borrow');
  if (!hasPermission(session.user.roles, 'library:manage')) redirect('/admin');

  const [activeSubs, recentResources] = await Promise.all([
    prisma.subscription.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
    }),
    prisma.resource.findMany({
      orderBy: { title: 'asc' },
      take: 200,
      include: { _count: { select: { loans: { where: { status: 'ACTIVE' } } } } },
    }),
  ]);

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <div className="breadcrumb">
          Admin · <Link href="/admin/library">Bibliothèque</Link> · <span>Prêter un ouvrage</span>
        </div>
        <h2 style={{ fontSize: 'clamp(28px, 3vw, 36px)', marginTop: 8 }}>
          Prêter <em className="italic-emph">un ouvrage</em>
        </h2>
        <p className="fs-15 text-soft" style={{ marginTop: 8 }}>
          Sélectionne l&apos;abonné et l&apos;ouvrage. Les règles métier (3 prêts max selon
          formule, 14 jours, exemplaires disponibles) sont vérifiées côté serveur.
        </p>
      </div>

      <BorrowFlow
        subscriptions={activeSubs.map((s) => ({
          id: s.id,
          cardNumber: s.cardNumber,
          tier: s.tier,
          name:
            [s.user.firstName, s.user.lastName].filter(Boolean).join(' ') || s.user.email,
          email: s.user.email,
        }))}
        resources={recentResources.map((r) => ({
          id: r.id,
          title: r.title,
          authors: r.authors,
          totalCopies: r.totalCopies,
          activeLoans: r._count.loans,
        }))}
      />
    </>
  );
}
