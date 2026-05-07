import { z } from 'zod';
import { router, permissionProcedure } from '../trpc';

export const auditRouter = router({
  list: permissionProcedure('audit:read')
    .input(
      z
        .object({
          take: z.number().int().min(1).max(200).default(50),
          cursor: z.string().optional(),
          entity: z.string().optional(),
          actorId: z.string().cuid().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const take = input?.take ?? 50;
      const items = await ctx.prisma.auditLog.findMany({
        where: {
          ...(input?.entity ? { entity: input.entity } : {}),
          ...(input?.actorId ? { actorId: input.actorId } : {}),
        },
        take: take + 1,
        ...(input?.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        orderBy: { createdAt: 'desc' },
        include: { actor: { select: { firstName: true, lastName: true, email: true } } },
      });
      let nextCursor: string | undefined;
      if (items.length > take) nextCursor = items.pop()?.id;
      return { items, nextCursor };
    }),
});
