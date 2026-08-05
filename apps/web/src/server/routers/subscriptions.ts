import { Prisma } from '@cpfa/db';
import { TRPCError } from '@trpc/server';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { buildQrPayload } from '@cpfa/lib/qr';
import { getPaymentProvider } from '@cpfa/lib/payments';
import { router, protectedProcedure, publicProcedure, permissionProcedure } from '../trpc';
import {
  LIBRARY_SUBSCRIPTION_DAYS,
  priceForTier,
  type SubscriptionTier,
} from '@/lib/library-rules';
import { enqueueSubscriptionContract } from '@/lib/subscription-contract';
import { getLibraryTiers } from '@/lib/library-pricing';
import { getQueue, type EmailJob } from '@cpfa/lib/queues';
import { getSetting } from '@/lib/site-settings/get';
import { serverError } from '@/lib/server-errors';

const SUBSCRIPTION_STATUSES = ['PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED'] as const;
const tierSchema = z.enum(['STUDENT', 'PROFESSIONAL', 'HOME_LOAN']);

export const subscriptionsRouter = router({
  // Public price list — used to render the 3 formules before sign-up.
  tiers: publicProcedure.query(async () => {
    const tiers = await getLibraryTiers();
    return (Object.keys(tiers) as SubscriptionTier[]).map((tier) => ({ tier, ...tiers[tier] }));
  }),

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
      // Grille lue au moment de la souscription : le montant encaissé est
      // exactement celui que l'abonné vient de voir à l'écran.
      const tiers = await getLibraryTiers();
      const amountXof = priceForTier(tier, tiers);

      const existing = await ctx.prisma.subscription.findFirst({
        where: { userId: ctx.session.user.id, status: 'ACTIVE' },
      });
      if (existing) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: serverError('subscriptionAlreadyActive', ctx.locale),
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
        description: `Abonnement bibliothèque CPFA — ${tiers[tier].label}`,
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

      // Consignes de paiement par e-mail : QR Wave / Orange Money en pièces
      // jointes, montant et référence à rappeler. Tolérant à la panne — l'écran
      // « paiement en attente » porte les mêmes informations.
      if (ctx.session.user.email) {
        const mobileMoney = await getSetting('payments.mobileMoney', 'fr');
        const attachments = [
          { key: mobileMoney.waveQrKey, filename: 'qr-wave.png' },
          { key: mobileMoney.orangeQrKey, filename: 'qr-orange-money.png' },
        ]
          .filter((a) => a.key)
          .map((a) => ({ filename: a.filename, storageKey: a.key }));
        try {
          await getQueue<EmailJob>('email').add(
            'payment-instructions',
            {
              to: ctx.session.user.email,
              template: 'payment-instructions',
              data: {
                payerName: ctx.session.user.name ?? ctx.session.user.email,
                amountXof,
                reference: cardNumber,
                tierLabel: tiers[tier].label,
                waveNumber: mobileMoney.waveNumber,
                orangeNumber: mobileMoney.orangeNumber,
                instructions: mobileMoney.instructions,
              },
              locale: ctx.locale,
              ...(attachments.length > 0 ? { attachments } : {}),
            },
            { jobId: `payment-instructions:${payment.id}` },
          );
        } catch (err) {
          console.warn('[subscriptions.initiate] payment instructions enqueue failed', err);
        }
      }

      return {
        subscriptionId: subscription.id,
        paymentId: payment.id,
        tier,
        amountXof,
        durationDays: LIBRARY_SUBSCRIPTION_DAYS,
        ...init,
      };
    }),

  // Comptable confirms a static-QR payment manually, which activates the subscription.
  // Gated by payment:validate — confirming a payment must never be self-serve.
  confirmPayment: permissionProcedure('payment:validate')
    .input(z.object({ paymentId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const payment = await ctx.prisma.payment.findUnique({
        where: { id: input.paymentId },
        include: { subscription: true },
      });
      if (!payment?.subscription) throw new TRPCError({ code: 'NOT_FOUND' });
      if (payment.status === 'CONFIRMED') return payment;

      const expiresAt = new Date(Date.now() + LIBRARY_SUBSCRIPTION_DAYS * 24 * 60 * 60 * 1000);

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
      await enqueueSubscriptionContract(payment.subscription.id);
      return confirmed;
    }),

  // ── Admin / librarian operations ─────────────────────────────────────────
  adminList: permissionProcedure('library:manage')
    .input(
      z
        .object({
          q: z.string().trim().max(120).optional(),
          status: z.enum(SUBSCRIPTION_STATUSES).optional(),
          take: z.number().int().min(1).max(100).default(50),
          cursor: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const q = input?.q?.trim();
      const where: Prisma.SubscriptionWhereInput = {
        ...(input?.status ? { status: input.status } : {}),
        ...(q
          ? {
              OR: [
                { cardNumber: { contains: q, mode: 'insensitive' } },
                { user: { email: { contains: q, mode: 'insensitive' } } },
                { user: { firstName: { contains: q, mode: 'insensitive' } } },
                { user: { lastName: { contains: q, mode: 'insensitive' } } },
              ],
            }
          : {}),
      };
      const take = input?.take ?? 50;
      const items = await ctx.prisma.subscription.findMany({
        where,
        take: take + 1,
        ...(input?.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        orderBy: [{ createdAt: 'desc' }],
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });
      let nextCursor: string | undefined;
      if (items.length > take) nextCursor = items.pop()?.id;
      return { items, nextCursor };
    }),

  adminGet: permissionProcedure('library:manage')
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const sub = await ctx.prisma.subscription.findUnique({
        where: { id: input.id },
        include: {
          user: true,
          payments: { orderBy: { createdAt: 'desc' }, take: 20 },
        },
      });
      if (!sub) throw new TRPCError({ code: 'NOT_FOUND' });
      return sub;
    }),

  // Manually create a subscription for an existing user — typical workflow
  // when a member pays in cash at the front desk.
  adminCreate: permissionProcedure('library:manage')
    .input(
      z.object({
        userId: z.string().cuid(),
        tier: z.enum(['STUDENT', 'PROFESSIONAL', 'HOME_LOAN']).default('PROFESSIONAL'),
        durationDays: z.number().int().min(30).max(730).default(LIBRARY_SUBSCRIPTION_DAYS),
        activate: z.boolean().default(true),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const exists = await ctx.prisma.subscription.findFirst({
        where: { userId: input.userId, status: 'ACTIVE' },
      });
      if (exists) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cet utilisateur a déjà un abonnement actif.',
        });
      }
      const cardNumber = `CPFA-${Date.now().toString(36).toUpperCase().slice(-6)}-${randomBytes(2).toString('hex').toUpperCase()}`;
      const qrSecret = randomBytes(16).toString('hex');
      const startedAt = input.activate ? new Date() : null;
      const expiresAt = input.activate
        ? new Date(Date.now() + input.durationDays * 24 * 60 * 60 * 1000)
        : null;
      const sub = await ctx.prisma.subscription.create({
        data: {
          userId: input.userId,
          cardNumber,
          tier: input.tier,
          status: input.activate ? 'ACTIVE' : 'PENDING',
          startedAt,
          expiresAt,
          qrPayload: buildQrPayload('subscription', cardNumber, qrSecret),
        },
      });
      await ctx.prisma.auditLog.create({
        data: {
          actorId: ctx.session?.user.id,
          action: 'subscription.adminCreate',
          entity: 'Subscription',
          entityId: sub.id,
          diff: { tier: input.tier, activate: input.activate },
        },
      });
      if (input.activate) await enqueueSubscriptionContract(sub.id);
      return sub;
    }),

  adminActivate: permissionProcedure('library:manage')
    .input(
      z.object({
        id: z.string().cuid(),
        durationDays: z.number().int().min(30).max(730).default(LIBRARY_SUBSCRIPTION_DAYS),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const sub = await ctx.prisma.subscription.findUnique({ where: { id: input.id } });
      if (!sub) throw new TRPCError({ code: 'NOT_FOUND' });
      const startedAt = sub.startedAt ?? new Date();
      const expiresAt = new Date(Date.now() + input.durationDays * 24 * 60 * 60 * 1000);
      const updated = await ctx.prisma.subscription.update({
        where: { id: input.id },
        data: { status: 'ACTIVE', startedAt, expiresAt },
      });
      await ctx.prisma.auditLog.create({
        data: {
          actorId: ctx.session?.user.id,
          action: 'subscription.activate',
          entity: 'Subscription',
          entityId: input.id,
          diff: { expiresAt },
        },
      });
      await enqueueSubscriptionContract(input.id);
      return updated;
    }),

  adminExtend: permissionProcedure('library:manage')
    .input(
      z.object({
        id: z.string().cuid(),
        days: z.number().int().min(1).max(730),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const sub = await ctx.prisma.subscription.findUnique({ where: { id: input.id } });
      if (!sub) throw new TRPCError({ code: 'NOT_FOUND' });
      const base = sub.expiresAt && sub.expiresAt > new Date() ? sub.expiresAt : new Date();
      const expiresAt = new Date(base.getTime() + input.days * 24 * 60 * 60 * 1000);
      const updated = await ctx.prisma.subscription.update({
        where: { id: input.id },
        data: { expiresAt, status: 'ACTIVE' },
      });
      await ctx.prisma.auditLog.create({
        data: {
          actorId: ctx.session?.user.id,
          action: 'subscription.extend',
          entity: 'Subscription',
          entityId: input.id,
          diff: { addedDays: input.days, newExpiresAt: expiresAt },
        },
      });
      return updated;
    }),

  adminCancel: permissionProcedure('library:manage')
    .input(z.object({ id: z.string().cuid(), reason: z.string().trim().max(500).optional() }))
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.prisma.subscription.update({
        where: { id: input.id },
        data: { status: 'CANCELLED' },
      });
      await ctx.prisma.auditLog.create({
        data: {
          actorId: ctx.session?.user.id,
          action: 'subscription.cancel',
          entity: 'Subscription',
          entityId: input.id,
          diff: { reason: input.reason ?? null },
        },
      });
      return updated;
    }),
});
