import { auth } from '@/lib/auth';
import { prisma } from '@cpfa/db';
import { renderSubscriberCard } from '@cpfa/pdf';
import { qrToDataUrl } from '@cpfa/lib/qr';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const subscription = await prisma.subscription.findFirst({
    where: { userId: session.user.id, status: 'ACTIVE' },
    include: { user: { select: { firstName: true, lastName: true, email: true } } },
  });
  if (!subscription) {
    return new Response('No active subscription', { status: 404 });
  }

  const fullName =
    [subscription.user.firstName, subscription.user.lastName].filter(Boolean).join(' ') ||
    subscription.user.email ||
    'Abonné CPFA';

  const validUntil = subscription.expiresAt
    ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(subscription.expiresAt)
    : '—';

  const qrDataUrl = await qrToDataUrl(subscription.qrPayload);
  const pdf = await renderSubscriberCard({
    fullName,
    cardNumber: subscription.cardNumber,
    validUntil,
    qrDataUrl,
  });

  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="carte-cpfa-${subscription.cardNumber}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
