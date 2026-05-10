# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository status

S1-S8 scaffolded **plus 10 lots de réponse** aux modifications demandées par
le Directeur ([`docs/modofocations _demandees.md`](<docs/modofocations _demandees.md>)).
Voir [`CHANGELOG.md`](CHANGELOG.md) pour l'inventaire détaillé de tout ce qui
a été ajouté et [`docs/release-notes-directeur.md`](docs/release-notes-directeur.md)
pour la lecture executive.

État des décisions §10 : **§10.2 (paiement) tranchée → PayTech**, **§10.3
(multilingue) tranchée → FR + EN actifs**. §10.1 (hébergement), §10.4
(mobile), §10.5 (équipe), §10.6 (souveraineté), §10.7 (budget) toujours
ouvertes — à arbitrer avant go-live.

| Sprint | What landed |
|---|---|
| S1 | Monorepo (pnpm + Turborepo), Next.js 15 + TS + Tailwind, tRPC, Auth.js v5 (edge/node split), Prisma schema, BullMQ worker, Vitest + Playwright skeletons, GitHub Actions CI |
| S2 | Public site (`/`, /a-propos, /mot-du-directeur, /partenaires, /contact, /blog, /p/[slug]), CMS reads, contact form |
| S3 | Bibliothèque (catalog, /me/abonnement, carte PDF, prêts admin, cron rappels) |
| S4 | Formations & séminaires (catalog, inscriptions, convocation PDF) |
| S5 | Concours (avis, candidatures, banque d'épreuves, uploads S3 presigned) |
| S6 | Admin & analytics (dashboard, audit, users, payments, CMS editor, exports CSV) |
| S7 | Pure-rule extraction (`lib/library-rules.ts`), 36 unit tests (28 web + 8 lib), Playwright e2e, [`SECURITY.md`](SECURITY.md) |
| S8 | Multi-stage Dockerfile, `docker-compose.prod.yml`, [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md), [`docs/USER_MANUAL.md`](docs/USER_MANUAL.md), [`docs/RUNBOOK.md`](docs/RUNBOOK.md) |
| Post-S8 | PayTech provider (§10.2), payment-webhook plumbing, full PDF worker, real `/api/health` probes, Espace formateurs (§4.6) — candidature `/devenir-formateur`, dashboard `/me/formateur`, admin review `/admin/trainers`, `TrainerStatus` workflow + `TrainerResource` model + `CourseSession.trainerId`. CMS étendu : médiathèque `/admin/media` (upload S3 presigned + grille), éditeur d'articles `/admin/articles/[id]` (block-based), blocs `image`/`quote`/`list` ajoutés au page editor, proxy public `/api/media/[...key]` (DB-gated 302 → presigned GET). Pages hardcodées (mot-du-directeur, partenaires, a-propos) → CMS-fallback via `fetchCmsPage`. Modèle `SiteSetting` (key/value JSON validé via registry zod) + `/admin/settings` pour l'édition du contenu transverse : hero, témoignages, chiffres-clés, gouvernance, partenaires, coordonnées du pied de page. |

## Workspace commands

Package manager: **pnpm 10**. Orchestrator: **Turborepo 2**.

| Command | Effect |
|---|---|
| `pnpm install` | Install all workspace deps |
| `pnpm dev` | `next dev` for `apps/web` on :3000 |
| `pnpm build` | Build every workspace package (Turbo) |
| `pnpm typecheck` | `tsc --noEmit` across all packages |
| `pnpm lint` | ESLint on each package |
| `pnpm test` | Vitest unit suite (uses `--passWithNoTests`) |
| `pnpm test:e2e` | Playwright e2e against `apps/web` |
| `pnpm format` / `format:check` | Prettier |
| `pnpm db:generate` | `prisma generate` from `packages/db` |
| `pnpm db:migrate` | `prisma migrate dev` (interactive) |
| `pnpm db:studio` | Prisma Studio |
| `pnpm db:seed` | Run `packages/db/prisma/seed.ts` |
| `pnpm worker` | BullMQ worker (`apps/web/src/worker/index.ts`) |
| `pnpm docker:up` / `docker:down` | Postgres + Redis + MinIO via `docker/docker-compose.yml` |
| `docker compose -f docker/docker-compose.prod.yml up -d --build` | Production stack (Dockerfile multi-stage build) |

To run a single Vitest test: `pnpm --filter @cpfa/web exec vitest run tests/rbac.test.ts`.
To run a single Playwright spec: `pnpm --filter @cpfa/web exec playwright test e2e/home.spec.ts`.

## Auth.js v5 split

Edge-vs-Node split is required because `argon2` (Credentials provider) is a native module:

- `apps/web/src/lib/auth/config.ts` — edge-safe config (Google + `authorized` callback). Used by `middleware.ts`.
- `apps/web/src/lib/auth/index.ts` — full config (extends `authConfig` with `PrismaAdapter` + `Credentials`). Used by route handler `/api/auth/[...nextauth]` and tRPC's `createContext`.

Don't import `@/lib/auth` from any code that may run on the edge runtime.

## RBAC

Pure logic in `apps/web/src/lib/auth/rbac.ts` (`hasPermission`). Server-only wrapper in `rbac-server.ts` (`requirePermission`). Grants table mirrors the nine roles in §3.3. Tests: `apps/web/tests/rbac.test.ts`.

In tRPC, prefer `permissionProcedure('library:manage')` over manual checks — see `apps/web/src/server/trpc.ts`.

## Library business rules (single source of truth)

[`apps/web/src/lib/library-rules.ts`](apps/web/src/lib/library-rules.ts) exports the §4.3 invariants — `LIBRARY_LOAN_DAYS=14`, `LIBRARY_MAX_CONCURRENT=3`, `LIBRARY_DAILY_PENALTY_XOF=500`, plus pure functions (`computeOverdueDays`, `computePenaltyXof`, `dueDateFromNow`, `evaluateSubscription`, `evaluateBorrowEligibility`). The tRPC routers and the BullMQ worker import from here. Don't hard-code these constants anywhere else — the duplicated copies are exactly what the S7 refactor removed.

## Production builds

`apps/web/Dockerfile` is a multi-stage build with two final targets:
- `web` — Next.js standalone output (small, runs `node apps/web/server.js`)
- `worker` — single esbuild-bundled CJS file (runs `node worker.cjs`)

Both copy `node_modules/.prisma` and `node_modules/@prisma/client` from the builder; without them the runtime can't connect to Postgres. The `outputFileTracingRoot` in `apps/web/next.config.ts` is required for pnpm workspaces — Next traces an incomplete dep set otherwise.

## Decisions still open

§10 of `docs/projet.md` lists 7 decisions. Defaults baked into the scaffold:

- **Paiement (§10.2) — décidé**: PayTech (agrégateur sénégalais — Wave, Orange Money, Free Money, Wizall, E-money, Visa, Mastercard). Implémentation : [`packages/lib/src/payments/paytech.ts`](packages/lib/src/payments/paytech.ts). `PAYMENT_PROVIDER=paytech` en prod, `static-qr` reste comme fallback manuel via `/admin/payments`. IPN HMAC-SHA256 vérifiée par `verifyWebhook`, route publique `/api/webhooks/payments/paytech`, mutation tRPC `payments.initiate` côté serveur.
- **Multilingue (§10.3) — décidé**: FR + EN actifs. Locale résolu côté serveur via cookie `NEXT_LOCALE` (puis `Accept-Language`, puis défaut FR). Pas de prefix d'URL — toutes les routes restent au même chemin, le contenu s'adapte. UI shell traduit via [`apps/web/messages/{fr,en}.json`](apps/web/messages/). CMS Pages, Articles et SiteSettings sont locale-aware avec fallback FR systématique pour les contenus pas encore localisés. Switcher dans le top-nav + footer.

Lock the other open decisions (hébergement, mobile, équipe, souveraineté, budget) before infra freeze.

When asked to scaffold further, follow the architecture in `docs/projet.md` rather than substituting a different stack — the choices there were deliberate (e.g. PostgreSQL over MongoDB, tRPC for end-to-end type-safety, BullMQ + Redis for async jobs).

## Planned architecture (from docs/projet.md)

- **Monorepo** with pnpm workspaces or Turborepo. Layout: `apps/web` (Next.js front + API), `packages/db` (Prisma), `packages/ui`, `packages/emails` (React Email), `packages/pdf` (@react-pdf), `packages/lib` (Wave/OM/QR utilities).
- **Frontend + API**: Next.js 15 App Router with React Server Components, TypeScript, Tailwind + shadcn/ui. API exposed via tRPC route handlers with Zod validation.
- **Data**: PostgreSQL 16 via Prisma. Core entities: `User`, `Role`, `Subscription`, `Resource`, `Loan`, `Course`, `Module`, `Seminar`, `Exam`, `Registration`, `Payment`, `Invoice`, `Page`, `Article`, `Media`, `AuditLog`.
- **Auth**: Auth.js (NextAuth v5) — magic link, Google, OTP SMS. Argon2 password hashing, 2FA on admin roles.
- **Async jobs**: BullMQ on Redis for PDF generation, email sending, loan reminders.
- **Files**: S3-compatible object storage (OVH / Backblaze B2 / MinIO).
- **Payments**: Wave + Orange Money APIs with static-QR fallback. Senegal-specific flows.
- **Emails**: Resend or Postmark, with React Email templates.
- **Search**: PostgreSQL full-text first; MeiliSearch later if catalog grows.
- **Tests**: Vitest (unit) + Playwright (e2e).
- **Observability**: Sentry + Better Stack/Axiom.

## RBAC model

Nine roles with distinct surfaces — keep permission checks centralized: `Visiteur`, `Candidat`, `Abonné bibliothèque`, `Formateur`, `Éditeur`, `Bibliothécaire`, `Comptable`, `Administrateur`, `Super-admin`. The library, payments, and content modules each have role-specific UIs; don't conflate them.

## Business rules worth knowing before coding

- **Library loans**: 14-day duration, max 3 concurrent loans per subscriber, 500 FCFA/day overdue penalty. Each resource has a QR code; admin scans QR on lending/return.
- **Subscriber card**: PDF generated via `@react-pdf/renderer` with embedded QR code.
- **Payments**: amounts in FCFA. Wave/OM API integration requires a merchant contract — until that's signed, the static-QR path is the default. See decision item §10.2 of `docs/projet.md`.
- **Multilingual**: FR is primary; EN readiness is planned but the FR-only-vs-FR+EN decision is still open (§10.3).
- **Audit log** is immutable and required for admin actions (paiements, validations, rôle changes).

## Working language

The product is in French and the project doc is in French. UI copy, email templates, and user-facing strings should be FR by default. Code identifiers, comments, and commit messages should stay in English unless mirroring an existing French convention in the codebase.

## Editor config

`.vscode/settings.json` enables `claudeCode.allowDangerouslySkipPermissions` for this workspace. This is a local convenience, not a project policy — don't propagate it elsewhere.

