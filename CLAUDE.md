# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository status

S1 (socle technique) scaffolded. Treat `docs/projet.md` as the source of truth for product scope and stack choices — §10 still has open product decisions (multilingue, paiement, hébergement, mobile, équipe, souveraineté, budget) that V1 implementation must lock down.

Sprints completed: **S1 — Socle technique** (monorepo, Next.js 15 + TS + Tailwind, tRPC, Auth.js v5, Prisma schema, BullMQ worker, Vitest + Playwright skeletons, GitHub Actions CI).
Sprints pending: S2 site institutionnel → S3 bibliothèque → S4 formations/séminaires → S5 concours → S6 admin/analytics → S7 tests/recette → S8 deploy.

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

## Decisions still open

§10 of `docs/projet.md` lists 7 decisions. Defaults baked into the scaffold:

- **Paiement (§10.2)**: `PaymentProvider` interface in `packages/lib/src/payments/`. Default `PAYMENT_PROVIDER=static-qr`. Wave/OM providers must implement `PaymentProvider` and register in the provider map.
- **Multilingue (§10.3)**: FR-only at runtime, `next-intl` wired so EN can be added without refactor. Locales in `apps/web/src/i18n/request.ts`; messages in `apps/web/messages/*.json`.

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

