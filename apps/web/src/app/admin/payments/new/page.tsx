import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/rbac';
import { prisma } from '@cpfa/db';
import { ManualPaymentForm } from './manual-payment-form';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Enregistrer un paiement — Admin CPFA' };

export default async function NewPaymentPage() {
  const session = await auth();
  if (!session?.user) redirect('/sign-in?callbackUrl=/admin/payments/new');
  if (!hasPermission(session.user.roles, 'payment:validate')) redirect('/admin');

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 500,
    select: { id: true, firstName: true, lastName: true, email: true },
  });

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <div className="breadcrumb">
          Admin · <Link href="/admin/payments">Paiements</Link> · <span>Enregistrer</span>
        </div>
        <h2 style={{ fontSize: 'clamp(28px, 3vw, 36px)', marginTop: 8 }}>
          Enregistrer un <em className="italic-emph">paiement manuel</em>
        </h2>
        <p className="fs-15 text-soft" style={{ marginTop: 8, maxWidth: 600 }}>
          Pour les paiements reçus hors plateforme : espèces au comptoir, virement bancaire,
          Wave/OM saisis manuellement. Le paiement est enregistré comme CONFIRMÉ immédiatement.
        </p>
      </div>

      <ManualPaymentForm
        users={users.map((u) => ({
          id: u.id,
          name: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email,
          email: u.email,
        }))}
      />
    </>
  );
}
