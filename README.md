# CPFA — Plateforme web

Application web du **Centre Professionnel de Formation à l'Assurance**.
Voir [`docs/projet.md`](docs/projet.md) pour la proposition d'architecture détaillée.

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind + shadcn/ui · tRPC · Prisma + PostgreSQL · Auth.js v5 · BullMQ + Redis · Vitest + Playwright.

## Prérequis

- Node.js 20+ (`nvm use`)
- pnpm 10+
- Docker (Postgres, Redis, MinIO en local)

## Démarrage

```bash
# 1. Installer les dépendances
pnpm install

# 2. Variables d'environnement
cp .env.example .env

# 3. Lancer Postgres + Redis + MinIO
pnpm docker:up

# 4. Appliquer le schéma Prisma
pnpm db:migrate

# 5. (optionnel) Seed
pnpm db:seed

# 6. Lancer l'app
pnpm dev
```

L'app est servie sur http://localhost:3000.
Le worker BullMQ se lance avec `pnpm worker` (terminal séparé).

## Commandes utiles

| Commande | Description |
|---|---|
| `pnpm dev` | Démarrer Next.js en mode dev |
| `pnpm build` | Build de production |
| `pnpm typecheck` | Type-check de tous les packages |
| `pnpm lint` | ESLint |
| `pnpm test` | Tests unitaires Vitest |
| `pnpm test:e2e` | Tests Playwright |
| `pnpm db:migrate` | Appliquer les migrations Prisma |
| `pnpm db:studio` | Ouvrir Prisma Studio |
| `pnpm worker` | Lancer le worker BullMQ |
| `pnpm docker:up` | Lancer Postgres/Redis/MinIO |
| `pnpm docker:down` | Arrêter les services Docker |

## Structure (monorepo Turborepo + pnpm workspaces)

```
apps/
  web/             # Next.js (front + API + worker)
packages/
  db/              # Prisma schema + client
  ui/              # Composants partagés
  emails/          # Templates React Email
  pdf/             # Templates @react-pdf
  lib/             # Utilitaires (paiements, QR, etc.)
docker/            # docker-compose pour le dev
```

## Documentation

- Architecture : [`docs/projet.md`](docs/projet.md)
- Instructions Claude : [`CLAUDE.md`](CLAUDE.md)
