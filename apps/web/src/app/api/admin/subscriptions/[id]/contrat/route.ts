import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/rbac';
import { prisma } from '@cpfa/db';
import { renderSubscriptionContract } from '@cpfa/pdf';
import { objectExists, readObject } from '@cpfa/lib/storage';
import { readSetting } from '@/lib/site-settings/read';
import { getLibraryTiers } from '@/lib/library-pricing';
import { buildSubscriptionContract, contractStorageKey } from '@/lib/subscription-contract';

export const dynamic = 'force-dynamic';

// Même contrat que celui de l'abonné(e), pour le comptoir : réimprimer un
// exemplaire à signer sans avoir à demander à la personne de se connecter.
// L'exemplaire archivé prime ; à défaut il est rendu à la volée.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return new Response('Unauthorized', { status: 401 });
  if (!hasPermission(session.user.roles, 'library:manage')) {
    return new Response('Forbidden', { status: 403 });
  }

  const { id } = await params;
  const subscription = await prisma.subscription.findUnique({
    where: { id },
    include: { user: { select: { firstName: true, lastName: true, email: true } } },
  });
  if (!subscription) return new Response('Not found', { status: 404 });

  const key = contractStorageKey(subscription.id, subscription.cardNumber);
  const pdf = (await objectExists(key))
    ? await readObject(key)
    : await renderSubscriptionContract(
        buildSubscriptionContract({
          subscription,
          user: subscription.user,
          mentions: await readSetting('library.contract', 'fr'),
          tiers: await getLibraryTiers('fr'),
        }),
      );

  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="contrat-abonnement-${subscription.cardNumber}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
