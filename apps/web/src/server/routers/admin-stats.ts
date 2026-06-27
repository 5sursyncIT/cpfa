import { z } from 'zod';
import { router, permissionProcedure } from '../trpc';

export const adminStatsRouter = router({
  // Dashboard KPIs — single round-trip.
  kpis: permissionProcedure('admin:any').query(async ({ ctx }) => {
    const now = new Date();
    const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      activeSubscribers,
      pendingRegistrations,
      pendingPayments,
      revenueLast30Sum,
      newRegistrationsLast30,
    ] = await Promise.all([
      ctx.prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      ctx.prisma.registration.count({ where: { status: { in: ['SUBMITTED', 'PAID'] } } }),
      ctx.prisma.payment.count({ where: { status: 'PENDING' } }),
      ctx.prisma.payment.aggregate({
        _sum: { amountXof: true },
        where: { status: 'CONFIRMED', receivedAt: { gte: last30 } },
      }),
      ctx.prisma.registration.count({ where: { createdAt: { gte: last30 } } }),
    ]);

    return {
      activeSubscribers,
      pendingRegistrations,
      pendingPayments,
      revenueLast30Xof: revenueLast30Sum._sum.amountXof ?? 0,
      newRegistrationsLast30,
    };
  }),

  // Daily revenue series for inline charting.
  revenueSeries: permissionProcedure('admin:any')
    .input(z.object({ days: z.number().int().min(7).max(120).default(30) }).optional())
    .query(async ({ ctx, input }) => {
      const days = input?.days ?? 30;
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const payments = await ctx.prisma.payment.findMany({
        where: { status: 'CONFIRMED', receivedAt: { gte: since } },
        select: { receivedAt: true, amountXof: true, purpose: true },
        orderBy: { receivedAt: 'asc' },
      });

      const buckets = new Map<string, number>();
      for (const p of payments) {
        if (!p.receivedAt) continue;
        const key = p.receivedAt.toISOString().slice(0, 10);
        buckets.set(key, (buckets.get(key) ?? 0) + p.amountXof);
      }
      return Array.from(buckets.entries()).map(([date, totalXof]) => ({ date, totalXof }));
    }),
});
