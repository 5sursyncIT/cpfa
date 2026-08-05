import { initTRPC, TRPCError } from '@trpc/server';
import type { Session } from 'next-auth';
import superjson from 'superjson';
import { ZodError } from 'zod';
import { auth } from '@/lib/auth';
import { hasPermission, type Permission } from '@/lib/auth/rbac';
import { prisma } from '@cpfa/db';
import { resolveLocale, type Locale } from '@/i18n/request';

export type Context = {
  session: Session | null;
  prisma: typeof prisma;
  /** Locale de la requête — les erreurs rendues au visiteur s'y adaptent. */
  locale: Locale;
};

export async function createContext(): Promise<Context> {
  const [session, locale] = await Promise.all([
    auth() as Promise<Session | null>,
    resolveLocale(),
  ]);
  return { session, prisma, locale };
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({ ctx: { ...ctx, session: ctx.session } });
});

export function permissionProcedure(permission: Permission) {
  return protectedProcedure.use(({ ctx, next }) => {
    if (!hasPermission(ctx.session!.user.roles, permission)) {
      throw new TRPCError({ code: 'FORBIDDEN' });
    }
    return next();
  });
}
