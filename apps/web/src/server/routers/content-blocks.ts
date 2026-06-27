// CRUD routers for the editable homepage / about-page content entities:
// key figures (chiffres-clés), partners (partenaires) and governance members.
// Admin-only (cms:write). Public pages read these via the data accessors in
// lib/content-blocks.ts, not through tRPC. Ordering uses `displayOrder`; the
// `move` mutations renumber siblings so up/down arrows stay stable.

import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, permissionProcedure } from '../trpc';

const LOCALE = z.enum(['fr', 'en']);
const SECTION = z.enum(['HOME', 'ABOUT']);
const id = z.object({ id: z.string().cuid() });
const moveInput = z.object({ id: z.string().cuid(), direction: z.enum(['up', 'down']) });

const keyFigureInput = z.object({
  section: SECTION.default('HOME'),
  locale: LOCALE.default('fr'),
  value: z.string().min(1).max(20),
  sup: z.string().max(20).default(''),
  label: z.string().min(1).max(80),
});

const partnerInput = z.object({
  locale: LOCALE.default('fr'),
  name: z.string().min(1).max(120),
  logoKey: z.string().max(400).optional().nullable(),
  url: z.string().url().max(300).or(z.literal('')).optional().nullable(),
});

const governanceInput = z.object({
  locale: LOCALE.default('fr'),
  role: z.string().min(1).max(80),
  name: z.string().min(1).max(120),
  note: z.string().max(160).optional().nullable(),
});

export const keyFiguresRouter = router({
  list: permissionProcedure('cms:write')
    .input(z.object({ section: SECTION, locale: LOCALE }))
    .query(({ ctx, input }) =>
      ctx.prisma.keyFigure.findMany({
        where: { section: input.section, locale: input.locale },
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
      }),
    ),

  create: permissionProcedure('cms:write')
    .input(keyFigureInput)
    .mutation(async ({ ctx, input }) => {
      const count = await ctx.prisma.keyFigure.count({
        where: { section: input.section, locale: input.locale },
      });
      const row = await ctx.prisma.keyFigure.create({ data: { ...input, displayOrder: count } });
      await ctx.prisma.auditLog.create({
        data: { actorId: ctx.session.user.id, action: 'keyFigure.create', entity: 'KeyFigure', entityId: row.id },
      });
      return row;
    }),

  update: permissionProcedure('cms:write')
    .input(id.merge(keyFigureInput.partial()))
    .mutation(({ ctx, input }) => {
      const { id: rowId, ...rest } = input;
      return ctx.prisma.keyFigure.update({ where: { id: rowId }, data: rest });
    }),

  delete: permissionProcedure('cms:write')
    .input(id)
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.keyFigure.delete({ where: { id: input.id } });
      await ctx.prisma.auditLog.create({
        data: { actorId: ctx.session.user.id, action: 'keyFigure.delete', entity: 'KeyFigure', entityId: input.id },
      });
      return { ok: true };
    }),

  move: permissionProcedure('cms:write')
    .input(moveInput)
    .mutation(async ({ ctx, input }) => {
      const row = await ctx.prisma.keyFigure.findUnique({ where: { id: input.id } });
      if (!row) throw new TRPCError({ code: 'NOT_FOUND' });
      const siblings = await ctx.prisma.keyFigure.findMany({
        where: { section: row.section, locale: row.locale },
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
        select: { id: true },
      });
      return reorder(
        (rowId, order) => ctx.prisma.keyFigure.update({ where: { id: rowId }, data: { displayOrder: order } }),
        siblings,
        input.id,
        input.direction,
      );
    }),
});

export const partnersRouter = router({
  list: permissionProcedure('cms:write')
    .input(z.object({ locale: LOCALE }))
    .query(({ ctx, input }) =>
      ctx.prisma.partner.findMany({
        where: { locale: input.locale },
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
      }),
    ),

  create: permissionProcedure('cms:write')
    .input(partnerInput)
    .mutation(async ({ ctx, input }) => {
      const count = await ctx.prisma.partner.count({ where: { locale: input.locale } });
      const row = await ctx.prisma.partner.create({
        data: {
          locale: input.locale,
          name: input.name,
          logoKey: input.logoKey || null,
          url: input.url || null,
          displayOrder: count,
        },
      });
      await ctx.prisma.auditLog.create({
        data: { actorId: ctx.session.user.id, action: 'partner.create', entity: 'Partner', entityId: row.id },
      });
      return row;
    }),

  update: permissionProcedure('cms:write')
    .input(id.merge(partnerInput.partial()))
    .mutation(({ ctx, input }) => {
      const { id: rowId, logoKey, url, ...rest } = input;
      return ctx.prisma.partner.update({
        where: { id: rowId },
        data: {
          ...rest,
          ...(logoKey !== undefined ? { logoKey: logoKey || null } : {}),
          ...(url !== undefined ? { url: url || null } : {}),
        },
      });
    }),

  delete: permissionProcedure('cms:write')
    .input(id)
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.partner.delete({ where: { id: input.id } });
      await ctx.prisma.auditLog.create({
        data: { actorId: ctx.session.user.id, action: 'partner.delete', entity: 'Partner', entityId: input.id },
      });
      return { ok: true };
    }),

  move: permissionProcedure('cms:write')
    .input(moveInput)
    .mutation(async ({ ctx, input }) => {
      const row = await ctx.prisma.partner.findUnique({ where: { id: input.id } });
      if (!row) throw new TRPCError({ code: 'NOT_FOUND' });
      const siblings = await ctx.prisma.partner.findMany({
        where: { locale: row.locale },
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
        select: { id: true },
      });
      return reorder(
        (rowId, order) => ctx.prisma.partner.update({ where: { id: rowId }, data: { displayOrder: order } }),
        siblings,
        input.id,
        input.direction,
      );
    }),
});

export const governanceRouter = router({
  list: permissionProcedure('cms:write')
    .input(z.object({ locale: LOCALE }))
    .query(({ ctx, input }) =>
      ctx.prisma.governanceMember.findMany({
        where: { locale: input.locale },
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
      }),
    ),

  create: permissionProcedure('cms:write')
    .input(governanceInput)
    .mutation(async ({ ctx, input }) => {
      const count = await ctx.prisma.governanceMember.count({ where: { locale: input.locale } });
      const row = await ctx.prisma.governanceMember.create({
        data: {
          locale: input.locale,
          role: input.role,
          name: input.name,
          note: input.note || null,
          displayOrder: count,
        },
      });
      await ctx.prisma.auditLog.create({
        data: { actorId: ctx.session.user.id, action: 'governance.create', entity: 'GovernanceMember', entityId: row.id },
      });
      return row;
    }),

  update: permissionProcedure('cms:write')
    .input(id.merge(governanceInput.partial()))
    .mutation(({ ctx, input }) => {
      const { id: rowId, note, ...rest } = input;
      return ctx.prisma.governanceMember.update({
        where: { id: rowId },
        data: { ...rest, ...(note !== undefined ? { note: note || null } : {}) },
      });
    }),

  delete: permissionProcedure('cms:write')
    .input(id)
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.governanceMember.delete({ where: { id: input.id } });
      await ctx.prisma.auditLog.create({
        data: { actorId: ctx.session.user.id, action: 'governance.delete', entity: 'GovernanceMember', entityId: input.id },
      });
      return { ok: true };
    }),

  move: permissionProcedure('cms:write')
    .input(moveInput)
    .mutation(async ({ ctx, input }) => {
      const row = await ctx.prisma.governanceMember.findUnique({ where: { id: input.id } });
      if (!row) throw new TRPCError({ code: 'NOT_FOUND' });
      const siblings = await ctx.prisma.governanceMember.findMany({
        where: { locale: row.locale },
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
        select: { id: true },
      });
      return reorder(
        (rowId, order) => ctx.prisma.governanceMember.update({ where: { id: rowId }, data: { displayOrder: order } }),
        siblings,
        input.id,
        input.direction,
      );
    }),
});

// Swap an item with its neighbour and renumber the whole sibling list 0..n so
// displayOrder stays gap-free. `setOrder` persists one row's new position.
async function reorder(
  setOrder: (id: string, order: number) => Promise<unknown>,
  siblings: { id: string }[],
  targetId: string,
  direction: 'up' | 'down',
) {
  const ids = siblings.map((s) => s.id);
  const i = ids.indexOf(targetId);
  const j = direction === 'up' ? i - 1 : i + 1;
  if (i === -1 || j < 0 || j >= ids.length) return { ok: true };
  [ids[i], ids[j]] = [ids[j]!, ids[i]!];
  await Promise.all(ids.map((rowId, order) => setOrder(rowId, order)));
  return { ok: true };
}
