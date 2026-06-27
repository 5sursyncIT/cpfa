import { Prisma } from '@cpfa/db';
import { randomBytes } from 'node:crypto';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { buildKey, presignUpload } from '@cpfa/lib/storage';
import { router, publicProcedure, permissionProcedure } from '../trpc';

const RESOURCE_KINDS = [
  'BOOK',
  'JOURNAL',
  'THESIS',
  'AUDIO',
  'VIDEO',
  'DIGITAL',
  'OTHER',
] as const;

const resourceInputSchema = z.object({
  kind: z.enum(RESOURCE_KINDS).default('BOOK'),
  title: z.string().trim().min(1).max(300),
  subtitle: z.string().trim().max(300).optional().nullable(),
  authors: z.array(z.string().trim().min(1)).default([]),
  cote: z.string().trim().max(40).optional().nullable(),
  isbn: z.string().trim().max(32).optional().nullable(),
  publisher: z.string().trim().max(200).optional().nullable(),
  publishedYear: z.number().int().min(1500).max(3000).optional().nullable(),
  language: z.string().trim().min(2).max(8).default('fr'),
  summary: z.string().trim().max(4000).optional().nullable(),
  coverKey: z.string().trim().max(500).optional().nullable(),
  totalCopies: z.number().int().min(1).max(9999).default(1),
  keywords: z.array(z.string().trim().min(1)).default([]),
  categoryId: z.string().cuid().optional().nullable(),
});

export const libraryRouter = router({
  search: publicProcedure
    .input(
      z.object({
        q: z.string().trim().min(1).max(120).optional(),
        kind: z
          .enum(['BOOK', 'JOURNAL', 'THESIS', 'AUDIO', 'VIDEO', 'DIGITAL', 'OTHER'])
          .optional(),
        take: z.number().int().min(1).max(50).default(20),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Full-text search via PG `to_tsvector` once we have the GIN index migration.
      // For now, fall back to ILIKE across title/authors/isbn — covers ~80% of queries
      // and works without a generated tsvector column.
      const q = input.q?.trim();
      const where: Prisma.ResourceWhereInput = {
        ...(input.kind ? { kind: input.kind } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { subtitle: { contains: q, mode: 'insensitive' } },
                { authors: { hasSome: [q] } },
                { keywords: { hasSome: [q] } },
                { cote: { contains: q, mode: 'insensitive' } },
                { isbn: q.length >= 10 ? { equals: q } : undefined },
              ].filter(Boolean) as Prisma.ResourceWhereInput[],
            }
          : {}),
      };

      const items = await ctx.prisma.resource.findMany({
        where,
        take: input.take + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        orderBy: [{ createdAt: 'desc' }],
        select: {
          id: true,
          title: true,
          subtitle: true,
          authors: true,
          kind: true,
          publishedYear: true,
          coverKey: true,
          totalCopies: true,
        },
      });

      let nextCursor: string | undefined;
      if (items.length > input.take) nextCursor = items.pop()?.id;
      return { items, nextCursor };
    }),

  byId: publicProcedure.input(z.object({ id: z.string().cuid() })).query(async ({ ctx, input }) => {
    const resource = await ctx.prisma.resource.findUnique({
      where: { id: input.id },
      include: { category: true },
    });
    if (!resource) throw new TRPCError({ code: 'NOT_FOUND' });
    return resource;
  }),

  // ── Admin CRUD on resources ─────────────────────────────────────────────
  adminList: permissionProcedure('library:manage')
    .input(
      z.object({
        q: z.string().trim().max(120).optional(),
        kind: z.enum(RESOURCE_KINDS).optional(),
        categoryId: z.string().cuid().optional(),
        take: z.number().int().min(1).max(100).default(50),
        cursor: z.string().optional(),
      }).optional(),
    )
    .query(async ({ ctx, input }) => {
      const q = input?.q?.trim();
      const where: Prisma.ResourceWhereInput = {
        ...(input?.kind ? { kind: input.kind } : {}),
        ...(input?.categoryId ? { categoryId: input.categoryId } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { subtitle: { contains: q, mode: 'insensitive' } },
                { authors: { hasSome: [q] } },
                { cote: { contains: q, mode: 'insensitive' } },
                { isbn: q.length >= 10 ? { equals: q } : undefined },
              ].filter(Boolean) as Prisma.ResourceWhereInput[],
            }
          : {}),
      };
      const take = input?.take ?? 50;
      const items = await ctx.prisma.resource.findMany({
        where,
        take: take + 1,
        ...(input?.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        orderBy: [{ createdAt: 'desc' }],
        include: {
          category: { select: { id: true, name: true, slug: true } },
        },
      });
      let nextCursor: string | undefined;
      if (items.length > take) nextCursor = items.pop()?.id;
      return { items, nextCursor };
    }),

  adminGet: permissionProcedure('library:manage')
    .input(z.object({ id: z.string().cuid() }))
    .query(({ ctx, input }) =>
      ctx.prisma.resource.findUniqueOrThrow({
        where: { id: input.id },
        include: { category: true },
      }),
    ),

  adminCreate: permissionProcedure('library:manage')
    .input(resourceInputSchema)
    .mutation(async ({ ctx, input }) => {
      const qrSecret = randomBytes(16).toString('hex');
      const qrPayload = `cpfa:resource:${randomBytes(8).toString('hex')}:${qrSecret.slice(0, 12)}`;
      const created = await ctx.prisma.resource.create({
        data: {
          ...input,
          subtitle: input.subtitle ?? null,
          cote: input.cote ?? null,
          isbn: input.isbn ?? null,
          publisher: input.publisher ?? null,
          publishedYear: input.publishedYear ?? null,
          summary: input.summary ?? null,
          coverKey: input.coverKey ?? null,
          categoryId: input.categoryId ?? null,
          qrPayload,
        },
      });
      await ctx.prisma.auditLog.create({
        data: {
          actorId: ctx.session?.user.id,
          action: 'resource.create',
          entity: 'Resource',
          entityId: created.id,
          diff: { title: created.title, kind: created.kind },
        },
      });
      return created;
    }),

  adminUpdate: permissionProcedure('library:manage')
    .input(z.object({ id: z.string().cuid() }).merge(resourceInputSchema.partial()))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const updated = await ctx.prisma.resource.update({
        where: { id },
        data: {
          ...data,
          subtitle: data.subtitle === undefined ? undefined : (data.subtitle ?? null),
          cote: data.cote === undefined ? undefined : (data.cote ?? null),
          isbn: data.isbn === undefined ? undefined : (data.isbn ?? null),
          publisher: data.publisher === undefined ? undefined : (data.publisher ?? null),
          publishedYear:
            data.publishedYear === undefined ? undefined : (data.publishedYear ?? null),
          summary: data.summary === undefined ? undefined : (data.summary ?? null),
          coverKey: data.coverKey === undefined ? undefined : (data.coverKey ?? null),
          categoryId: data.categoryId === undefined ? undefined : (data.categoryId ?? null),
        },
      });
      await ctx.prisma.auditLog.create({
        data: {
          actorId: ctx.session?.user.id,
          action: 'resource.update',
          entity: 'Resource',
          entityId: id,
          diff: data as Prisma.InputJsonValue,
        },
      });
      return updated;
    }),

  adminDelete: permissionProcedure('library:manage')
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.resource.delete({ where: { id: input.id } });
      await ctx.prisma.auditLog.create({
        data: {
          actorId: ctx.session?.user.id,
          action: 'resource.delete',
          entity: 'Resource',
          entityId: input.id,
        },
      });
      return { ok: true };
    }),

  // ── Categories ───────────────────────────────────────────────────────────
  categoriesList: permissionProcedure('library:manage').query(({ ctx }) =>
    ctx.prisma.category.findMany({
      orderBy: [{ name: 'asc' }],
      include: { _count: { select: { resources: true, children: true } } },
    }),
  ),

  categoryCreate: permissionProcedure('library:manage')
    .input(
      z.object({
        slug: z.string().trim().min(1).max(80).regex(/^[a-z0-9-]+$/),
        name: z.string().trim().min(1).max(120),
        parentId: z.string().cuid().optional().nullable(),
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.prisma.category.create({
        data: {
          slug: input.slug,
          name: input.name,
          parentId: input.parentId ?? null,
        },
      }),
    ),

  categoryUpdate: permissionProcedure('library:manage')
    .input(
      z.object({
        id: z.string().cuid(),
        name: z.string().trim().min(1).max(120).optional(),
        parentId: z.string().cuid().nullable().optional(),
      }),
    )
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.category.update({
        where: { id },
        data: {
          ...(data.name !== undefined ? { name: data.name } : {}),
          ...(data.parentId !== undefined ? { parentId: data.parentId } : {}),
        },
      });
    }),

  categoryDelete: permissionProcedure('library:manage')
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const cnt = await ctx.prisma.resource.count({ where: { categoryId: input.id } });
      if (cnt > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `${cnt} ressource(s) utilisent cette catégorie. Réaffectez-les avant suppression.`,
        });
      }
      const childCnt = await ctx.prisma.category.count({ where: { parentId: input.id } });
      if (childCnt > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `${childCnt} sous-catégorie(s) actives.`,
        });
      }
      await ctx.prisma.category.delete({ where: { id: input.id } });
      return { ok: true };
    }),

  // ── Cover upload (presigned + Media row) ─────────────────────────────────
  // Lets a librarian upload a book cover directly from the resource form,
  // without granting the BIBLIOTHECAIRE role broad cms:write rights. The Media
  // row is required so /api/media/[...key] proxy lets the browser fetch the
  // image (it gates on `Media.storageKey` existence by design).
  requestCoverUpload: permissionProcedure('library:manage')
    .input(
      z.object({
        fileName: z.string().min(1).max(200),
        mimeType: z
          .string()
          .regex(/^image\/(png|jpe?g|webp|avif|gif)$/, 'Type d’image non supporté.'),
        sizeBytes: z.number().int().min(1).max(8 * 1024 * 1024),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const key = buildKey('media', ctx.session.user.id, input.fileName);
      const presigned = await presignUpload({
        key,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
      });
      return { ...presigned, key };
    }),

  confirmCoverUpload: permissionProcedure('library:manage')
    .input(
      z.object({
        storageKey: z.string().min(8).max(400),
        mimeType: z.string(),
        sizeBytes: z.number().int().min(1),
        altText: z.string().max(200).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Create the Media row so /api/media/[...key] resolves it.
      // Idempotent on storageKey: skip if already exists.
      const existing = await ctx.prisma.media.findUnique({
        where: { storageKey: input.storageKey },
      });
      if (existing) return existing;
      return ctx.prisma.media.create({
        data: {
          storageKey: input.storageKey,
          mimeType: input.mimeType,
          sizeBytes: input.sizeBytes,
          altText: input.altText ?? null,
          uploadedById: ctx.session.user.id,
        },
      });
    }),
});
