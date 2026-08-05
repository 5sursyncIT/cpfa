import { auth } from '@/lib/auth';
import { prisma } from '@cpfa/db';
import { renderSubscriptionContract } from '@cpfa/pdf';
import { objectExists, readObject } from '@cpfa/lib/storage';
import { readSetting } from '@/lib/site-settings/read';
import { getLibraryTiers } from '@/lib/library-pricing';
import { buildSubscriptionContract, contractStorageKey } from '@/lib/subscription-contract';

export const dynamic = 'force-dynamic';

// Contrat d'abonnement de l'abonné(e) connecté(e).
//
// L'exemplaire archivé par le worker à l'activation fait foi : c'est celui que
// la personne a reçu et signé. On ne le régénère que s'il manque (worker en
// panne, abonnement activé avant la mise en place du contrat), pour que le
// bouton ne tombe jamais en erreur.
export async function GET() {
  const session = await auth();
  if (!session?.user) return new Response('Unauthorized', { status: 401 });

  const subscription = await prisma.subscription.findFirst({
    where: { userId: session.user.id, status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { firstName: true, lastName: true, email: true } } },
  });
  if (!subscription) return new Response('No active subscription', { status: 404 });

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
