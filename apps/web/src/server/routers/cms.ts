import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { Prisma } from '@cpfa/db';
import { buildKey, presignUpload } from '@cpfa/lib/storage';
import { router, permissionProcedure } from '../trpc';
import {
  isKnownKey,
  settingsRegistry,
  SETTING_KEYS,
} from '@/lib/site-settings/registry';

const blockSchema = z
  .object({
    kind: z.enum(['heading', 'paragraph', 'image', 'quote', 'list']),
    text: z.string().optional(),
    level: z.number().int().min(2).max(4).optional(),
    // image: stores the storage key, not a URL — frontend resolves via /api/media/[...key]
    storageKey: z.string().optional(),
    alt: z.string().optional(),
    caption: z.string().optional(),
    // quote
    cite: z.string().optional(),
    // list
    items: z.array(z.string()).optional(),
    ordered: z.boolean().optional(),
  })
  .passthrough();

const articleInput = z.object({
  slug: z
    .string()
    .min(1)
    .max(160)
    .regex(/^[a-z0-9-]+$/, 'Slug invalide (a-z, 0-9, tirets).'),
  title: z.string().min(2).max(200),
  excerpt: z.string().max(800).optional(),
  locale: z.string().default('fr'),
  content: z.array(blockSchema),
  coverKey: z.string().min(8).max(400).optional().nullable(),
  tags: z.array(z.string().min(1).max(40)).default([]),
  published: z.boolean().default(false),
});

const pageInput = z.object({
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/, 'Slug invalide (a-z, 0-9, tirets).'),
  title: z.string().min(2).max(200),
  locale: z.string().default('fr'),
  metaTitle: z.string().max(200).optional(),
  metaDescription: z.string().max(500).optional(),
  content: z.array(blockSchema),
  published: z.boolean().default(false),
});

export const cmsRouter = router({
  // Page CRUD ──────────────────────────────────────────────────────────────
  pages: router({
    list: permissionProcedure('cms:write').query(async ({ ctx }) =>
      ctx.prisma.page.findMany({
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          slug: true,
          title: true,
          locale: true,
          published: true,
          updatedAt: true,
        },
      }),
    ),

    byId: permissionProcedure('cms:write')
      .input(z.object({ id: z.string().cuid() }))
      .query(async ({ ctx, input }) => {
        const page = await ctx.prisma.page.findUnique({ where: { id: input.id } });
        if (!page) throw new TRPCError({ code: 'NOT_FOUND' });
        return page;
      }),

    create: permissionProcedure('cms:write')
      .input(pageInput)
      .mutation(async ({ ctx, input }) => {
        const page = await ctx.prisma.page
          .create({
            data: {
              ...input,
              content: input.content as Prisma.InputJsonValue,
              publishedAt: input.published ? new Date() : null,
            },
          })
          .catch((e) => {
            if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
              throw new TRPCError({
                code: 'CONFLICT',
                message: 'Une page avec ce titre existe déjà. Modifiez légèrement le titre.',
              });
            }
            throw e;
          });
        await ctx.prisma.auditLog.create({
          data: {
            actorId: ctx.session.user.id,
            action: 'page.create',
            entity: 'Page',
            entityId: page.id,
          },
        });
        return page;
      }),

    update: permissionProcedure('cms:write')
      .input(z.object({ id: z.string().cuid() }).merge(pageInput.partial()))
      .mutation(async ({ ctx, input }) => {
        const { id, content, ...rest } = input;
        const before = await ctx.prisma.page.findUnique({ where: { id } });
        if (!before) throw new TRPCError({ code: 'NOT_FOUND' });

        const next = await ctx.prisma.page
          .update({
            where: { id },
            data: {
              ...rest,
              ...(content ? { content: content as Prisma.InputJsonValue } : {}),
              ...(rest.published === true && !before.publishedAt ? { publishedAt: new Date() } : {}),
            },
          })
          .catch((e) => {
            if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
              throw new TRPCError({
                code: 'CONFLICT',
                message: 'Ce slug est déjà utilisé par une autre page.',
              });
            }
            throw e;
          });

        await ctx.prisma.auditLog.create({
          data: {
            actorId: ctx.session.user.id,
            action: 'page.update',
            entity: 'Page',
            entityId: id,
            diff: { from: before.title, to: next.title, published: next.published },
          },
        });

        return next;
      }),

    togglePublished: permissionProcedure('cms:write')
      .input(z.object({ id: z.string().cuid(), published: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        const before = await ctx.prisma.page.findUnique({
          where: { id: input.id },
          select: { publishedAt: true },
        });
        if (!before) throw new TRPCError({ code: 'NOT_FOUND' });
        await ctx.prisma.auditLog.create({
          data: {
            actorId: ctx.session.user.id,
            action: input.published ? 'page.publish' : 'page.unpublish',
            entity: 'Page',
            entityId: input.id,
          },
        });
        return ctx.prisma.page.update({
          where: { id: input.id },
          data: {
            published: input.published,
            ...(input.published && !before.publishedAt ? { publishedAt: new Date() } : {}),
          },
        });
      }),

    delete: permissionProcedure('cms:write')
      .input(z.object({ id: z.string().cuid() }))
      .mutation(async ({ ctx, input }) => {
        await ctx.prisma.page.delete({ where: { id: input.id } });
        await ctx.prisma.auditLog.create({
          data: {
            actorId: ctx.session.user.id,
            action: 'page.delete',
            entity: 'Page',
            entityId: input.id,
          },
        });
        return { ok: true };
      }),

    // Bootstrap a translation: copy the source page's slug + content into a
    // new locale as a draft. Refuses if a row with the same (slug, locale) pair
    // already exists.
    cloneFromLocale: permissionProcedure('cms:write')
      .input(
        z.object({
          sourceId: z.string().cuid(),
          targetLocale: z.string().min(2).max(8),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const source = await ctx.prisma.page.findUnique({ where: { id: input.sourceId } });
        if (!source) throw new TRPCError({ code: 'NOT_FOUND' });
        if (source.locale === input.targetLocale) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'La langue cible doit différer de la langue source.',
          });
        }
        const existing = await ctx.prisma.page.findFirst({
          where: { slug: source.slug, locale: input.targetLocale },
          select: { id: true },
        });
        if (existing) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Une page existe déjà pour ce slug dans la langue cible.',
          });
        }
        const created = await ctx.prisma.page.create({
          data: {
            slug: source.slug,
            title: source.title,
            locale: input.targetLocale,
            metaTitle: source.metaTitle,
            metaDescription: source.metaDescription,
            content: source.content as Prisma.InputJsonValue,
            published: false,
            publishedAt: null,
          },
        });
        await ctx.prisma.auditLog.create({
          data: {
            actorId: ctx.session.user.id,
            action: 'page.cloneFromLocale',
            entity: 'Page',
            entityId: created.id,
            diff: { sourceId: source.id, sourceLocale: source.locale, targetLocale: input.targetLocale },
          },
        });
        return created;
      }),
  }),

  // Article admin actions ────────────────────────────────────────────────
  articles: router({
    list: permissionProcedure('cms:write').query(async ({ ctx }) =>
      ctx.prisma.article.findMany({
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          slug: true,
          title: true,
          published: true,
          publishedAt: true,
          updatedAt: true,
        },
      }),
    ),

    byId: permissionProcedure('cms:write')
      .input(z.object({ id: z.string().cuid() }))
      .query(async ({ ctx, input }) => {
        const article = await ctx.prisma.article.findUnique({ where: { id: input.id } });
        if (!article) throw new TRPCError({ code: 'NOT_FOUND' });
        return article;
      }),

    create: permissionProcedure('cms:write')
      .input(articleInput)
      .mutation(async ({ ctx, input }) => {
        const article = await ctx.prisma.article
          .create({
            data: {
              slug: input.slug,
              title: input.title,
              excerpt: input.excerpt ?? null,
              locale: input.locale,
              tags: input.tags,
              content: input.content as Prisma.InputJsonValue,
              coverKey: input.coverKey ?? null,
              published: input.published,
              publishedAt: input.published ? new Date() : null,
              authorId: ctx.session.user.id,
            },
          })
          .catch((e) => {
            if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
              throw new TRPCError({
                code: 'CONFLICT',
                message: 'Un article avec ce titre existe déjà. Modifiez légèrement le titre.',
              });
            }
            throw e;
          });
        await ctx.prisma.auditLog.create({
          data: {
            actorId: ctx.session.user.id,
            action: 'article.create',
            entity: 'Article',
            entityId: article.id,
          },
        });
        return article;
      }),

    update: permissionProcedure('cms:write')
      .input(z.object({ id: z.string().cuid() }).merge(articleInput.partial()))
      .mutation(async ({ ctx, input }) => {
        const { id, content, coverKey, ...rest } = input;
        const before = await ctx.prisma.article.findUnique({ where: { id } });
        if (!before) throw new TRPCError({ code: 'NOT_FOUND' });

        const next = await ctx.prisma.article.update({
          where: { id },
          data: {
            ...rest,
            ...(content ? { content: content as Prisma.InputJsonValue } : {}),
            ...(coverKey !== undefined ? { coverKey: coverKey ?? null } : {}),
            ...(rest.published === true && !before.publishedAt
              ? { publishedAt: new Date() }
              : {}),
          },
        });
        await ctx.prisma.auditLog.create({
          data: {
            actorId: ctx.session.user.id,
            action: 'article.update',
            entity: 'Article',
            entityId: id,
            diff: { from: before.title, to: next.title, published: next.published },
          },
        });
        return next;
      }),

    delete: permissionProcedure('cms:write')
      .input(z.object({ id: z.string().cuid() }))
      .mutation(async ({ ctx, input }) => {
        await ctx.prisma.article.delete({ where: { id: input.id } });
        await ctx.prisma.auditLog.create({
          data: {
            actorId: ctx.session.user.id,
            action: 'article.delete',
            entity: 'Article',
            entityId: input.id,
          },
        });
        return { ok: true };
      }),

    togglePublished: permissionProcedure('cms:write')
      .input(z.object({ id: z.string().cuid(), published: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        await ctx.prisma.auditLog.create({
          data: {
            actorId: ctx.session.user.id,
            action: input.published ? 'article.publish' : 'article.unpublish',
            entity: 'Article',
            entityId: input.id,
          },
        });
        return ctx.prisma.article.update({
          where: { id: input.id },
          data: {
            published: input.published,
            ...(input.published ? { publishedAt: new Date() } : {}),
          },
        });
      }),

    cloneFromLocale: permissionProcedure('cms:write')
      .input(
        z.object({
          sourceId: z.string().cuid(),
          targetLocale: z.string().min(2).max(8),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const source = await ctx.prisma.article.findUnique({ where: { id: input.sourceId } });
        if (!source) throw new TRPCError({ code: 'NOT_FOUND' });
        if (source.locale === input.targetLocale) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'La langue cible doit différer de la langue source.',
          });
        }
        const existing = await ctx.prisma.article.findFirst({
          where: { slug: source.slug, locale: input.targetLocale },
          select: { id: true },
        });
        if (existing) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Un article existe déjà pour ce slug dans la langue cible.',
          });
        }
        const created = await ctx.prisma.article.create({
          data: {
            slug: source.slug,
            title: source.title,
            excerpt: source.excerpt,
            locale: input.targetLocale,
            tags: source.tags,
            content: source.content as Prisma.InputJsonValue,
            coverKey: source.coverKey,
            published: false,
            publishedAt: null,
            authorId: ctx.session.user.id,
          },
        });
        await ctx.prisma.auditLog.create({
          data: {
            actorId: ctx.session.user.id,
            action: 'article.cloneFromLocale',
            entity: 'Article',
            entityId: created.id,
            diff: { sourceId: source.id, sourceLocale: source.locale, targetLocale: input.targetLocale },
          },
        });
        return created;
      }),
  }),

  // Media library ─────────────────────────────────────────────────────────
  // Uploads create a Media row. Editors reference media by `storageKey` in
  // article/page content blocks; the public site resolves the key via
  // /api/media/[...key], which redirects to a fresh presigned GET URL so the
  // bucket can stay private.
  media: router({
    list: permissionProcedure('cms:write')
      .input(
        z
          .object({
            take: z.number().int().min(1).max(200).default(60),
            cursor: z.string().optional(),
          })
          .optional(),
      )
      .query(async ({ ctx, input }) => {
        const take = input?.take ?? 60;
        const items = await ctx.prisma.media.findMany({
          take: take + 1,
          ...(input?.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
          orderBy: { uploadedAt: 'desc' },
          select: {
            id: true,
            storageKey: true,
            mimeType: true,
            sizeBytes: true,
            altText: true,
            uploadedAt: true,
            uploadedBy: { select: { email: true } },
          },
        });
        let nextCursor: string | undefined;
        if (items.length > take) nextCursor = items.pop()?.id;
        return { items, nextCursor };
      }),

    requestUpload: permissionProcedure('cms:write')
      .input(
        z.object({
          fileName: z.string().min(1).max(200),
          mimeType: z.string().min(3).max(120),
          sizeBytes: z.number().int().min(1).max(25 * 1024 * 1024),
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

    confirm: permissionProcedure('cms:write')
      .input(
        z.object({
          storageKey: z.string().min(8).max(400),
          mimeType: z.string(),
          sizeBytes: z.number().int().min(1),
          altText: z.string().max(200).optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
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

    updateAlt: permissionProcedure('cms:write')
      .input(z.object({ id: z.string().cuid(), altText: z.string().max(200) }))
      .mutation(async ({ ctx, input }) => {
        return ctx.prisma.media.update({
          where: { id: input.id },
          data: { altText: input.altText },
        });
      }),

    delete: permissionProcedure('cms:write')
      .input(z.object({ id: z.string().cuid() }))
      .mutation(async ({ ctx, input }) => {
        await ctx.prisma.media.delete({ where: { id: input.id } });
        return { ok: true };
      }),
  }),

  // Site-wide settings ────────────────────────────────────────────────────
  // Each known key is validated by its registry zod schema before being
  // written. Locale-aware: rows are stored per (key, locale) so editors can
  // localise per language. Unknown keys / locales are rejected.
  settings: router({
    // Lists all known keys for a given locale. Each entry surfaces:
    //   - value: row for that locale, else FR fallback row, else registry default
    //   - source: 'locale' | 'fallback' | 'default' (so the UI can warn the
    //     editor that EN content is currently inheriting from FR)
    list: permissionProcedure('cms:write')
      .input(z.object({ locale: z.enum(['fr', 'en']).default('fr') }).optional())
      .query(async ({ ctx, input }) => {
        const locale = input?.locale ?? 'fr';
        const rows = await ctx.prisma.siteSetting.findMany({
          select: {
            key: true,
            locale: true,
            value: true,
            updatedAt: true,
            updatedBy: { select: { email: true } },
          },
        });
        const localeRows = new Map(rows.filter((r) => r.locale === locale).map((r) => [r.key, r]));
        const frRows = new Map(rows.filter((r) => r.locale === 'fr').map((r) => [r.key, r]));
        return SETTING_KEYS.map((key) => {
          const entry = settingsRegistry[key];
          const own = localeRows.get(key);
          const fallback = locale === 'fr' ? null : frRows.get(key) ?? null;
          const row = own ?? fallback;
          const source: 'locale' | 'fallback' | 'default' = own
            ? 'locale'
            : fallback
              ? 'fallback'
              : 'default';
          return {
            key,
            locale,
            label: entry.label,
            kind: entry.kind,
            value: row?.value ?? entry.default,
            source,
            updatedAt: own?.updatedAt ?? null,
            updatedByEmail: own?.updatedBy?.email ?? null,
          };
        });
      }),

    set: permissionProcedure('cms:write')
      .input(
        z.object({
          key: z.string(),
          locale: z.enum(['fr', 'en']).default('fr'),
          value: z.unknown(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        if (!isKnownKey(input.key)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Clé inconnue: ${input.key}`,
          });
        }
        const entry = settingsRegistry[input.key];
        const parsed = entry.schema.safeParse(input.value);
        if (!parsed.success) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Valeur invalide: ${parsed.error.message}`,
          });
        }
        const value = parsed.data as Prisma.InputJsonValue;
        const next = await ctx.prisma.siteSetting.upsert({
          where: { key_locale: { key: input.key, locale: input.locale } },
          create: {
            key: input.key,
            locale: input.locale,
            value,
            updatedById: ctx.session.user.id,
          },
          update: { value, updatedById: ctx.session.user.id },
        });
        await ctx.prisma.auditLog.create({
          data: {
            actorId: ctx.session.user.id,
            action: 'siteSetting.update',
            entity: 'SiteSetting',
            entityId: `${input.key}:${input.locale}`,
          },
        });
        return next;
      }),

    // Reset by deleting the (key, locale) row so reads fall back to FR /
    // registry default.
    reset: permissionProcedure('cms:write')
      .input(z.object({ key: z.string(), locale: z.enum(['fr', 'en']).default('fr') }))
      .mutation(async ({ ctx, input }) => {
        if (!isKnownKey(input.key)) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: `Clé inconnue: ${input.key}` });
        }
        await ctx.prisma.siteSetting.deleteMany({
          where: { key: input.key, locale: input.locale },
        });
        await ctx.prisma.auditLog.create({
          data: {
            actorId: ctx.session.user.id,
            action: 'siteSetting.reset',
            entity: 'SiteSetting',
            entityId: `${input.key}:${input.locale}`,
          },
        });
        return { ok: true };
      }),
  }),
});
