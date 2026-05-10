import { TRPCError } from '@trpc/server';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { buildQrPayload } from '@cpfa/lib/qr';
import { getPaymentProvider } from '@cpfa/lib/payments';
import { router, protectedProcedure, publicProcedure } from '../trpc';
import { LIBRARY_TIERS, priceForTier, type SubscriptionTier } from '@/lib/library-rules';

const LIBRARY_SUBSCRIPTION_DURATION_DAYS = 365;
const tierSchema = z.enum(['STUDENT', 'PROFESSIONAL', 'HOME_LOAN']);

export const subscriptionsRouter = router({
  // Public price list — used to render the 3 formules before sign-up.
  tiers: publicProcedure.query(() =>
    (Object.keys(LIBRARY_TIERS) as SubscriptionTier[]).map((tier) => ({
      tier,
      ...LIBRARY_TIERS[tier],
    })),
  ),

  mine: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.subscription.findFirst({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: 'desc' },
    });
  }),

  // Initiate a library subscription. Creates a PENDING subscription + Payment,
  // returns provider-specific data (QR payload or redirect URL) for the UI.
  // The chosen tier drives both the price and the per-tier loan quota
  // enforced later by `evaluateBorrowEligibility`.
  initiate: protectedProcedure
    .input(z.object({ tier: tierSchema.default('PROFESSIONAL') }).optional())
    .mutation(async ({ ctx, input }) => {
      const tier = input?.tier ?? 'PROFESSIONAL';
      const amountXof = priceForTier(tier);

      const existing = await ctx.prisma.subscription.findFirst({
        where: { userId: ctx.session.user.id, status: 'ACTIVE' },
      });
      if (existing) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Un abonnement actif existe déjà.',
        });
      }

      const cardNumber = `CPFA-${Date.now().toString(36).toUpperCase().slice(-6)}-${randomBytes(2).toString('hex').toUpperCase()}`;
      const qrSecret = randomBytes(16).toString('hex');

      const subscription = await ctx.prisma.subscription.create({
        data: {
          userId: ctx.session.user.id,
          cardNumber,
          tier,
          status: 'PENDING',
          qrPayload: buildQrPayload('subscription', cardNumber, qrSecret),
        },
      });

      const provider = getPaymentProvider();
      const init = await provider.initiate({
        amountXof,
        reference: subscription.id,
        customer: {
          id: ctx.session.user.id,
          email: ctx.session.user.email ?? undefined,
        },
        description: `Abonnement bibliothèque CPFA — ${LIBRARY_TIERS[tier].label}`,
      });

      const payment = await ctx.prisma.payment.create({
        data: {
          userId: ctx.session.user.id,
          subscriptionId: subscription.id,
          amountXof,
          provider:
            init.provider === 'wave'
              ? 'WAVE'
              : init.provider === 'orange-money'
                ? 'ORANGE_MONEY'
                : init.provider === 'paytech'
                  ? 'PAYTECH'
                  : 'STATIC_QR',
          status: 'PENDING',
          purpose: 'LIBRARY_SUBSCRIPTION',
          providerRef: init.providerRef,
          metadata: {
            redirectUrl: init.redirectUrl,
            qrPayload: init.qrPayload,
            tier,
          },
        },
      });

      return {
        subscriptionId: subscription.id,
        paymentId: payment.id,
        tier,
        amountXof,
        durationDays: LIBRARY_SUBSCRIPTION_DURATION_DAYS,
        ...init,
      };
    }),

  // Comptable confirms a static-QR payment manually, which activates the subscription.
  confirmPayment: protectedProcedure
    .input(z.object({ paymentId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const payment = await ctx.prisma.payment.findUnique({
        where: { id: input.paymentId },
        include: { subscription: true },
      });
      if (!payment?.subscription) throw new TRPCError({ code: 'NOT_FOUND' });
      if (payment.status === 'CONFIRMED') return payment;

      const expiresAt = new Date(
        Date.now() + LIBRARY_SUBSCRIPTION_DURATION_DAYS * 24 * 60 * 60 * 1000,
      );

      const [confirmed] = await ctx.prisma.$transaction([
        ctx.prisma.payment.update({
          where: { id: input.paymentId },
          data: { status: 'CONFIRMED', receivedAt: new Date() },
        }),
        ctx.prisma.subscription.update({
          where: { id: payment.subscription.id },
          data: { status: 'ACTIVE', startedAt: new Date(), expiresAt },
        }),
        ctx.prisma.auditLog.create({
          data: {
            actorId: ctx.session.user.id,
            action: 'payment.confirm',
            entity: 'Payment',
            entityId: payment.id,
            diff: { subscriptionId: payment.subscription.id },
          },
        }),
      ]);
      return confirmed;
    }),
});
