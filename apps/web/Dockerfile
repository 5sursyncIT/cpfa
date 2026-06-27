# syntax=docker/dockerfile:1.7
# Multi-stage build for the CPFA web app + BullMQ worker.
# Build context = monorepo root (see docker/docker-compose.prod.yml).
# Three runtime targets:
#   - web       : Next.js standalone (CMD node apps/web/server.js)
#   - worker    : BullMQ worker bundled to a single CJS file (CMD node worker.cjs)
#   - migrate   : Prisma schema + CLI for `prisma migrate deploy` (one-shot)

ARG NODE_VERSION=20-alpine

# ── Base ─────────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS base
RUN corepack enable && apk add --no-cache libc6-compat openssl
WORKDIR /repo

# ── Deps (cached on package files only) ──────────────────────────────────────
FROM base AS deps
# The host .npmrc uses node-linker=isolated (.pnpm/ store); the COPY --from=builder
# paths below assume a flat npm-style layout. Force a hoisted (real-folder) layout
# for the prod build only, so prisma generate writes node_modules/.prisma/client
# at the project root and the COPY targets resolve.
ENV NPM_CONFIG_NODE_LINKER=hoisted
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/db/package.json ./packages/db/
COPY packages/ui/package.json ./packages/ui/
COPY packages/lib/package.json ./packages/lib/
COPY packages/emails/package.json ./packages/emails/
COPY packages/pdf/package.json ./packages/pdf/
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# ── Build ────────────────────────────────────────────────────────────────────
FROM deps AS builder
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Generate Prisma client + build Next.js + bundle worker into a single CJS file
RUN pnpm --filter @cpfa/db generate \
 && pnpm --filter @cpfa/web build \
 && pnpm --filter @cpfa/web exec esbuild src/worker/index.ts \
      --bundle --platform=node --target=node20 --format=cjs \
      --external:@prisma/client --external:.prisma/* \
      --outfile=dist-worker/index.cjs

# ── Web runtime (Next.js standalone) ─────────────────────────────────────────
FROM node:${NODE_VERSION} AS web
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000
RUN apk add --no-cache libc6-compat openssl tini && \
    addgroup -g 1001 -S nodejs && \
    adduser -S -u 1001 -G nodejs nextjs
WORKDIR /app

# Standalone bundle from the builder. The trailing slash is mandatory:
# .next/standalone is the project root for the runtime, not a sub-folder.
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/.next/standalone/ ./
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/public ./apps/web/public
# Prisma engine + generated client live outside the standalone bundle in pnpm
# layouts; copy them into the place server.js expects.
COPY --from=builder --chown=nextjs:nodejs /repo/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /repo/node_modules/@prisma/client ./node_modules/@prisma/client

# Create the storage mountpoint and hand it to the runtime user. Docker copies
# this ownership onto a freshly-created (empty) named volume mounted here, so
# the app can write uploads instead of hitting EACCES on a root-owned volume.
RUN mkdir -p /data/storage && chown -R nextjs:nodejs /data

USER nextjs
EXPOSE 3000
ENTRYPOINT ["tini", "--"]
CMD ["node", "apps/web/server.js"]

# ── Worker runtime (single bundled CJS file) ─────────────────────────────────
FROM node:${NODE_VERSION} AS worker
ENV NODE_ENV=production
RUN apk add --no-cache libc6-compat openssl tini && \
    addgroup -g 1001 -S nodejs && \
    adduser -S -u 1001 -G nodejs nodejs
WORKDIR /app
COPY --from=builder --chown=nodejs:nodejs /repo/apps/web/dist-worker/index.cjs ./worker.cjs
COPY --from=builder --chown=nodejs:nodejs /repo/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nodejs:nodejs /repo/node_modules/@prisma/client ./node_modules/@prisma/client
# Same storage mountpoint as the web tier (shared volume) — own it before dropping privileges.
RUN mkdir -p /data/storage && chown -R nodejs:nodejs /data
USER nodejs
ENTRYPOINT ["tini", "--"]
CMD ["node", "worker.cjs"]

# ── Migrate runtime (one-shot Prisma migrate deploy) ─────────────────────────
# Run via:  docker compose -f docker/docker-compose.prod.yml --profile tools run --rm migrate
# Self-contained: ships the prisma CLI, generated client, and the schema/migrations folder.
FROM node:${NODE_VERSION} AS migrate
ENV NODE_ENV=production
RUN apk add --no-cache libc6-compat openssl tini
WORKDIR /app
COPY --from=builder /repo/node_modules/prisma ./node_modules/prisma
COPY --from=builder /repo/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /repo/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /repo/packages/db/prisma ./prisma
# Invoke the prisma CLI script directly. The .bin/prisma binstub is a symlink
# whose __dirname-relative .wasm lookup breaks when Docker COPY dereferences it.
ENTRYPOINT ["tini", "--"]
CMD ["node", "node_modules/prisma/build/index.js", "migrate", "deploy", "--schema=prisma/schema.prisma"]
