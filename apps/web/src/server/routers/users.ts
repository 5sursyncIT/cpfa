import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { Role } from '@cpfa/db';
import { router, permissionProcedure } from '../trpc';

const ROLE_VALUES = Object.values(Role) as [Role, ...Role[]];

export const usersRouter = router({
  list: permissionProcedure('admin:any')
    .input(
      z
        .object({
          q: z.string().trim().min(1).max(120).optional(),
          take: z.number().int().min(1).max(100).default(50),
          cursor: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const take = input?.take ?? 50;
      const items = await ctx.prisma.user.findMany({
        where: input?.q
          ? {
              OR: [
                { email: { contains: input.q, mode: 'insensitive' } },
                { firstName: { contains: input.q, mode: 'insensitive' } },
                { lastName: { contains: input.q, mode: 'insensitive' } },
              ],
            }
          : {},
        take: take + 1,
        ...(input?.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          roles: true,
          createdAt: true,
          twoFactorEnabled: true,
        },
      });
      let nextCursor: string | undefined;
      if (items.length > take) nextCursor = items.pop()?.id;
      return { items, nextCursor };
    }),

  // Only Super-admin can grant or revoke ADMIN/SUPER_ADMIN. Non-super-admins can
  // touch other roles. This protects against privilege escalation by a regular admin.
  updateRoles: permissionProcedure('admin:any')
    .input(z.object({ id: z.string().cuid(), roles: z.array(z.enum(ROLE_VALUES)).max(9) }))
    .mutation(async ({ ctx, input }) => {
      const callerIsSuperAdmin = ctx.session.user.roles.includes('SUPER_ADMIN');
      const target = await ctx.prisma.user.findUnique({
        where: { id: input.id },
        select: { id: true, roles: true },
      });
      if (!target) throw new TRPCError({ code: 'NOT_FOUND' });

      const wouldGrantPrivileged = input.roles.some(
        (r) => (r === 'ADMIN' || r === 'SUPER_ADMIN') && !target.roles.includes(r),
      );
      const wouldRevokePrivileged = target.roles.some(
        (r) => (r === 'ADMIN' || r === 'SUPER_ADMIN') && !input.roles.includes(r),
      );
      if (!callerIsSuperAdmin && (wouldGrantPrivileged || wouldRevokePrivileged)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Seul un Super-admin peut accorder ou retirer ADMIN / SUPER_ADMIN.',
        });
      }

      // Don't let the last super-admin demote themselves.
      if (target.id === ctx.session.user.id && target.roles.includes('SUPER_ADMIN') && !input.roles.includes('SUPER_ADMIN')) {
        const otherSuperAdmins = await ctx.prisma.user.count({
          where: { id: { not: target.id }, roles: { has: 'SUPER_ADMIN' } },
        });
        if (otherSuperAdmins === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Impossible de retirer le dernier Super-admin.',
          });
        }
      }

      await ctx.prisma.auditLog.create({
        data: {
          actorId: ctx.session.user.id,
          action: 'user.updateRoles',
          entity: 'User',
          entityId: target.id,
          diff: { from: target.roles, to: input.roles },
        },
      });

      return ctx.prisma.user.update({
        where: { id: target.id },
        data: { roles: input.roles },
        select: { id: true, roles: true },
      });
    }),

  // ── Admin detail + management actions ───────────────────────────────────
  adminGet: permissionProcedure('admin:any')
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.id },
        include: {
          subscriptions: {
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
              id: true,
              cardNumber: true,
              tier: true,
              status: true,
              startedAt: true,
              expiresAt: true,
            },
          },
          registrations: {
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
              course: { select: { title: true } },
              seminar: { select: { title: true } },
              exam: { select: { title: true } },
            },
          },
          payments: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          loans: {
            orderBy: { borrowedAt: 'desc' },
            take: 10,
            include: { resource: { select: { title: true } } },
          },
          _count: {
            select: {
              subscriptions: true,
              registrations: true,
              loans: true,
              payments: true,
            },
          },
        },
      });
      if (!user) throw new TRPCError({ code: 'NOT_FOUND' });
      return user;
    }),

  updateProfile: permissionProcedure('admin:any')
    .input(
      z.object({
        id: z.string().cuid(),
        firstName: z.string().trim().max(120).nullable().optional(),
        lastName: z.string().trim().max(120).nullable().optional(),
        phone: z.string().trim().max(40).nullable().optional(),
        locale: z.string().trim().min(2).max(8).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const updated = await ctx.prisma.user.update({
        where: { id },
        data: {
          ...(data.firstName !== undefined ? { firstName: data.firstName } : {}),
          ...(data.lastName !== undefined ? { lastName: data.lastName } : {}),
          ...(data.phone !== undefined ? { phone: data.phone } : {}),
          ...(data.locale !== undefined ? { locale: data.locale } : {}),
        },
      });
      await ctx.prisma.auditLog.create({
        data: {
          actorId: ctx.session.user.id,
          action: 'user.updateProfile',
          entity: 'User',
          entityId: id,
          diff: data,
        },
      });
      return updated;
    }),

  reset2FA: permissionProcedure('admin:any')
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.user.update({
        where: { id: input.id },
        data: { twoFactorEnabled: false, twoFactorSecret: null },
      });
      await ctx.prisma.auditLog.create({
        data: {
          actorId: ctx.session.user.id,
          action: 'user.reset2FA',
          entity: 'User',
          entityId: input.id,
        },
      });
      return { ok: true };
    }),

  // Clears the password hash, forcing the user to use magic link on next sign-in.
  forcePasswordReset: permissionProcedure('admin:any')
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.user.update({
        where: { id: input.id },
        data: { passwordHash: null },
      });
      await ctx.prisma.auditLog.create({
        data: {
          actorId: ctx.session.user.id,
          action: 'user.forcePasswordReset',
          entity: 'User',
          entityId: input.id,
        },
      });
      return { ok: true };
    }),

  // Soft "disable" — strips all roles down to VISITEUR. The user keeps their
  // data and history; they just lose access to anything beyond the public site.
  revokeAccess: permissionProcedure('admin:any')
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const callerIsSuperAdmin = ctx.session.user.roles.includes('SUPER_ADMIN');
      const target = await ctx.prisma.user.findUnique({
        where: { id: input.id },
        select: { id: true, roles: true },
      });
      if (!target) throw new TRPCError({ code: 'NOT_FOUND' });
      const hasPrivileged = target.roles.some((r) => r === 'ADMIN' || r === 'SUPER_ADMIN');
      if (hasPrivileged && !callerIsSuperAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Seul un Super-admin peut révoquer un autre admin.',
        });
      }
      if (target.id === ctx.session.user.id) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Impossible de te révoquer toi-même.' });
      }
      await ctx.prisma.user.update({
        where: { id: input.id },
        data: { roles: [Role.VISITEUR] },
      });
      await ctx.prisma.auditLog.create({
        data: {
          actorId: ctx.session.user.id,
          action: 'user.revokeAccess',
          entity: 'User',
          entityId: input.id,
          diff: { from: target.roles },
        },
      });
      return { ok: true };
    }),
});
