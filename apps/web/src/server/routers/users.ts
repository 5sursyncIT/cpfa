import argon2 from 'argon2';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { Prisma, Role } from '@cpfa/db';
import { router, permissionProcedure } from '../trpc';

const ROLE_VALUES = Object.values(Role) as [Role, ...Role[]];
const PRIVILEGED: Role[] = [Role.ADMIN, Role.SUPER_ADMIN];

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

  // ── Create a new account from the admin UI ──────────────────────────────
  // SUPER_ADMIN only when granting ADMIN/SUPER_ADMIN. Marks the email as
  // verified (admin-vouched) so the user can sign in immediately. If a
  // password is provided it's hashed with argon2id; otherwise the user
  // signs in via magic link or Google.
  create: permissionProcedure('admin:any')
    .input(
      z.object({
        email: z.string().email().toLowerCase().trim(),
        firstName: z.string().trim().max(120).optional(),
        lastName: z.string().trim().max(120).optional(),
        phone: z.string().trim().max(40).optional(),
        locale: z.string().trim().min(2).max(8).default('fr'),
        roles: z.array(z.enum(ROLE_VALUES)).min(1).max(9),
        password: z.string().min(8).max(128).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const callerIsSuperAdmin = ctx.session.user.roles.includes(Role.SUPER_ADMIN);
      const grantsPrivileged = input.roles.some((r) => PRIVILEGED.includes(r));
      if (grantsPrivileged && !callerIsSuperAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Seul un Super-admin peut créer un compte ADMIN ou SUPER_ADMIN.',
        });
      }

      const existing = await ctx.prisma.user.findUnique({
        where: { email: input.email },
        select: { id: true },
      });
      if (existing) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Un compte existe déjà pour cet email.' });
      }

      const passwordHash = input.password
        ? await argon2.hash(input.password, { type: argon2.argon2id })
        : null;

      const created = await ctx.prisma.user.create({
        data: {
          email: input.email,
          firstName: input.firstName?.trim() || null,
          lastName: input.lastName?.trim() || null,
          phone: input.phone?.trim() || null,
          locale: input.locale,
          roles: input.roles,
          passwordHash,
          // Admin-created accounts skip email verification.
          emailVerifiedAt: new Date(),
        },
        select: { id: true, email: true, roles: true },
      });

      await ctx.prisma.auditLog.create({
        data: {
          actorId: ctx.session.user.id,
          action: 'user.create',
          entity: 'User',
          entityId: created.id,
          diff: {
            email: created.email,
            roles: created.roles,
            hasPassword: passwordHash !== null,
          },
        },
      });

      return created;
    }),

  // ── Hard delete ──────────────────────────────────────────────────────────
  // Refuses to delete a user that has business records (subscriptions, loans,
  // registrations, payments, trainer profile). The admin should use
  // revokeAccess instead in that case to preserve the audit trail.
  // Auth Account/Session rows cascade automatically; AuditLog.actorId is
  // optional so it nulls out (we keep the action history but lose the actor).
  delete: permissionProcedure('admin:any')
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      if (input.id === ctx.session.user.id) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Impossible de supprimer ton propre compte.',
        });
      }

      const callerIsSuperAdmin = ctx.session.user.roles.includes(Role.SUPER_ADMIN);
      const target = await ctx.prisma.user.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          email: true,
          roles: true,
          _count: {
            select: {
              subscriptions: true,
              loans: true,
              registrations: true,
              payments: true,
            },
          },
          trainerProfile: { select: { id: true } },
        },
      });
      if (!target) throw new TRPCError({ code: 'NOT_FOUND' });

      const hasPrivileged = target.roles.some((r) => PRIVILEGED.includes(r));
      if (hasPrivileged && !callerIsSuperAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Seul un Super-admin peut supprimer un compte ADMIN ou SUPER_ADMIN.',
        });
      }

      // Don't delete the last super-admin.
      if (target.roles.includes(Role.SUPER_ADMIN)) {
        const otherSuperAdmins = await ctx.prisma.user.count({
          where: { id: { not: target.id }, roles: { has: Role.SUPER_ADMIN } },
        });
        if (otherSuperAdmins === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Impossible de supprimer le dernier Super-admin.',
          });
        }
      }

      const dependents: string[] = [];
      if (target._count.subscriptions > 0) dependents.push(`${target._count.subscriptions} abonnement(s)`);
      if (target._count.loans > 0) dependents.push(`${target._count.loans} prêt(s)`);
      if (target._count.registrations > 0) dependents.push(`${target._count.registrations} inscription(s)`);
      if (target._count.payments > 0) dependents.push(`${target._count.payments} paiement(s)`);
      if (target.trainerProfile) dependents.push('un profil formateur');
      if (dependents.length > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            `Suppression refusée : ce compte est lié à ${dependents.join(', ')}. ` +
            "Utilise plutôt « Révoquer l'accès » pour préserver l'historique.",
        });
      }

      try {
        await ctx.prisma.user.delete({ where: { id: target.id } });
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message:
              "Suppression refusée : il reste des enregistrements liés à ce compte. Utilise plutôt « Révoquer l'accès ».",
          });
        }
        throw err;
      }

      await ctx.prisma.auditLog.create({
        data: {
          actorId: ctx.session.user.id,
          action: 'user.delete',
          entity: 'User',
          entityId: target.id,
          diff: { email: target.email, roles: target.roles },
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
