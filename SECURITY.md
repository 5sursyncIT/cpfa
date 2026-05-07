# Security Checklist — CPFA Platform

Living checklist for the platform described in [`docs/projet.md`](docs/projet.md). Items marked `[scaffolded]` ship with the current code; items marked `[infra]` are the operator's responsibility before go-live.

## Transport & headers

- [scaffolded] HSTS, frame-ancestors, X-Content-Type-Options via Next.js defaults; review with `next-safe` or middleware before §S8.
- [infra] HTTPS only — Let's Encrypt or hosting provider TLS. Redirect `:80` → `:443` at the edge.
- [todo] CSP: tighten `script-src` and `connect-src` once Sentry / analytics endpoints are locked.

## AuthN / AuthZ

- [scaffolded] Auth.js v5 split (edge middleware uses `authConfig` only, no Prisma + no argon2 bundled to edge runtime). See [`apps/web/src/lib/auth/`](apps/web/src/lib/auth/).
- [scaffolded] Argon2id for password hashing (`argon2.argon2id` in `auth/index.ts`).
- [scaffolded] RBAC grants table in [`apps/web/src/lib/auth/rbac.ts`](apps/web/src/lib/auth/rbac.ts), enforced server-side via `permissionProcedure(...)` in tRPC.
- [scaffolded] Privilege escalation guard: `users.updateRoles` refuses ADMIN/SUPER_ADMIN changes from non-super-admins; refuses to demote the last super-admin.
- [todo] 2FA enforcement on ADMIN/SUPER_ADMIN sessions (TOTP). Schema field `User.twoFactorEnabled` exists; runtime not wired.
- [todo] Account lockout / rate-limit on `/api/auth/[...nextauth]` (e.g. Upstash Ratelimit per IP).

## Input validation

- [scaffolded] All tRPC inputs validated by Zod schemas before reaching Prisma.
- [scaffolded] Contact form: server re-validates with the same Zod schema (`apps/web/src/server/routers/contact-schema.ts`).
- [todo] HTML sanitization for CMS block content if/when rich text is enabled (currently plain strings).

## Data layer

- [scaffolded] Prisma — parameterised queries throughout, no raw SQL.
- [scaffolded] AuditLog rows written by every state-changing mutation (loans, registrations, payments, page CRUD, role updates) — see §5 of the architecture doc.
- [scaffolded] AuditLog has no `update`/`delete` API; rows can only be created.
- [todo] Database backups — encrypted, daily, 14-day retention. Run `pg_dump` from a sidecar and ship to S3 with SSE-KMS.
- [todo] Restrict Prisma binary engine permissions on the production VPS (no shell access from app user).

## File uploads

- [scaffolded] Presigned PUT URLs — the web tier never streams files. MIME allow-list (`@cpfa/lib/storage`), 25 MB cap.
- [scaffolded] Server validates ownership of the target registration / role before signing.
- [scaffolded] Download URLs are short-lived (300 s) presigned GETs; access tier re-checked just before signing.
- [todo] Bucket policy: deny public read, enforce SSE, require TLS, lifecycle rule for orphan keys.
- [todo] Antivirus scan for new uploads (ClamAV worker subscribing to S3 events).

## Payments

- [scaffolded] Provider abstraction — default `static-qr` requires a manual confirm by Comptable; no auto-confirmation.
- [scaffolded] Wave / Orange Money providers stubbed but unimplemented; webhook verification is a contract (`verifyWebhook`) that must be filled before enabling those providers (CIMA-zone merchant contracts pending, §10.2).
- [todo] When activating Wave / OM: HMAC signature verification on webhooks, idempotency keys per `providerRef`.

## Secrets

- [scaffolded] `.env.example` documents every variable; `.env` is gitignored; CI uses `AUTH_SECRET=ci-test-secret-not-real` only.
- [scaffolded] `.vscode/settings.json` (with `claudeCode.allowDangerouslySkipPermissions`) is gitignored — local convenience only.
- [todo] Production secrets via the host's secret store (Vercel env, AWS Secrets Manager, etc.). Do not check `.env` into the deployment image.

## Operational

- [scaffolded] Health endpoint `/api/health`.
- [todo] Observability — Sentry DSN wired (env var present, runtime hookup pending).
- [todo] Pen test before go-live (per §5 of the architecture doc).
- [todo] Document a key-rotation procedure (`AUTH_SECRET`, S3 keys, payment provider keys).

## Incident response

- [todo] Document an incident response playbook: who is paged, how to revoke a leaked AUTH_SECRET, how to invalidate sessions (rotate `AUTH_SECRET` invalidates JWTs at next refresh), how to disable a compromised user (set `roles=[]` and revoke active sessions).
