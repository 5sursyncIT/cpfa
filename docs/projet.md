# Proposition d'architecture — Application web CPFA (Stack JavaScript)

**Projet** : Plateforme web du Centre Professionnel de Formation à l'Assurance (CPFA)
**Date** : 6 mai 2026
**Version** : 1.0
**Auteur** : Sync IT — pour Youssoupha DIOP

---

## 1. Pourquoi abandonner WordPress

WordPress reste un excellent CMS pour des sites vitrines simples, mais le projet CPFA va bien au-delà :

- **Logique métier complexe** (abonnements bibliothèque, prêts, pénalités, génération de cartes, workflows de validation, paiements mobiles Wave/OM) qui finit par être bricolée à coups de plugins fragiles.
- **Performance** : montée en charge limitée, dépendance au cache, lenteurs sur l'admin avec beaucoup d'extensions.
- **Sécurité** : surface d'attaque importante (plugins tiers, brute force wp-admin).
- **Maintenance** : conflits de plugins lors des mises à jour, dette technique qui s'accumule.
- **Évolutivité** : difficile de proposer plus tard une **app mobile**, des **APIs**, ou de l'**IA** (recommandation, OCR de pièces jointes, chatbot).

Un produit JavaScript moderne offre un socle propre, typé, testable, et prêt pour 5 à 10 ans d'évolution.

---

## 2. Stack recommandée

| Couche | Choix | Justification |
|---|---|---|
| **Frontend** | **Next.js 15** (React + TypeScript) | SSR/SSG pour le SEO, App Router, Server Components, écosystème mature, équipe rapidement formable |
| **UI** | **Tailwind CSS** + **shadcn/ui** | Design system cohérent, composants accessibles, rapidité de développement |
| **Backend / API** | **Next.js API Routes** + **tRPC** *(ou NestJS si on veut séparer)* | Type-safety bout en bout, moins de duplication de code |
| **Base de données** | **PostgreSQL 16** | Relationnel robuste, transactions, JSONB pour flexibilité |
| **ORM** | **Prisma** | Migrations versionnées, type-safety, productivité |
| **Authentification** | **Auth.js (NextAuth v5)** | Multi-providers (email magic link, Google, OTP SMS), sessions JWT |
| **Stockage fichiers** | **S3-compatible** (OVH Object Storage / Backblaze B2 / MinIO auto-hébergé) | Photos, PDF, brochures, pièces justificatives |
| **Email transactionnel** | **Resend** ou **Postmark** | Confirmations, notifications, magic links |
| **Génération PDF** | **@react-pdf/renderer** + **qrcode** | Cartes d'abonné, reçus, certificats, attestations |
| **Paiement mobile** | **Wave API** + **Orange Money API** + fallback **QR code statique** | Flux natif au Sénégal |
| **Recherche** | **PostgreSQL Full-Text** *(puis MeiliSearch si volume)* | Catalogue bibliothèque, articles |
| **File d'attente** | **BullMQ** + **Redis** | Génération PDF, envoi email, rappels d'échéance |
| **Logs / Monitoring** | **Sentry** + **Better Stack / Axiom** | Erreurs, métriques, audit |
| **Tests** | **Vitest** (unitaires) + **Playwright** (e2e) | Robustesse |
| **CI/CD** | **GitHub Actions** | Tests automatiques, déploiement |
| **Hébergement** | **VPS OVH/Scaleway** (Docker) **ou** **Vercel + Neon** | Selon budget et contraintes de souveraineté |

---

## 3. Architecture applicative

### 3.1 Schéma global

```
┌────────────────────────────────────────────────────────────────┐
│                    Visiteurs / Abonnés / Admin                 │
│                  (Web responsive, mobile-first)                │
└───────────────────────────┬────────────────────────────────────┘
                            │ HTTPS
                            ▼
┌────────────────────────────────────────────────────────────────┐
│                    NEXT.JS 15 (App Router)                      │
│  ┌──────────────────────┐  ┌──────────────────────────────┐    │
│  │  Pages publiques     │  │  Espace administrateur       │    │
│  │  - Accueil, About    │  │  - Dashboard                 │    │
│  │  - Formations        │  │  - Gestion contenus          │    │
│  │  - Séminaires        │  │  - Validation inscriptions   │    │
│  │  - Bibliothèque      │  │  - Catalogue biblio          │    │
│  │  - Concours          │  │  - Stats & exports           │    │
│  │  - Contact           │  │  ┌──────────────────────┐   │    │
│  └──────────────────────┘  │  │ Espace abonné/membre │   │    │
│                            │  │ - Mes prêts          │   │    │
│                            │  │ - Ma carte           │   │    │
│                            │  │ - Mes inscriptions   │   │    │
│                            │  └──────────────────────┘   │    │
│                            └──────────────────────────────┘    │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Couche API (tRPC / Route Handlers)                    │    │
│  │  Auth, validations Zod, RBAC                           │    │
│  └────────────────────────────────────────────────────────┘    │
└───────────────────────────┬────────────────────────────────────┘
                            │
       ┌────────────────────┼────────────────────┐
       ▼                    ▼                    ▼
┌────────────┐      ┌──────────────┐      ┌──────────────┐
│ PostgreSQL │      │ Redis +      │      │ S3 Storage   │
│ (Prisma)   │      │ BullMQ       │      │ (médias,PDF) │
└────────────┘      │ (jobs async) │      └──────────────┘
                    └──────────────┘
                            │
                            ▼
       ┌────────────────────┼────────────────────┐
       ▼                    ▼                    ▼
┌────────────┐      ┌──────────────┐      ┌──────────────┐
│ Wave API   │      │ Orange Money │      │ Email        │
│ (paiement) │      │ API          │      │ (Resend)     │
└────────────┘      └──────────────┘      └──────────────┘
```

### 3.2 Modèle de données (extrait)

```
User ─< Subscription ─< Loan >─ Resource
User ─< Registration >─ Course / Seminar / Exam
User ─< Payment
Resource ─< Category
Course ─< Module ─< Lesson
Seminar ─< Speaker
Page (CMS interne) ─ Block ─ Media
```

**Entités principales** : `User`, `Role`, `Subscription`, `Resource` (livres/médias), `Loan`, `Course`, `Module`, `Seminar`, `Exam`, `Registration`, `Payment`, `Invoice`, `Page`, `Article`, `Media`, `AuditLog`.

### 3.3 Rôles et permissions (RBAC)

- **Visiteur** — consulte le site public
- **Candidat** — s'inscrit à une formation/séminaire/concours
- **Abonné bibliothèque** — espace personnel, prêts, carte de membre
- **Formateur** — accès ressources pédagogiques, gestion de ses sessions
- **Éditeur** — gestion de contenu (actualités, pages, médias)
- **Bibliothécaire** — gestion catalogue, prêts, retours
- **Comptable** — validation paiements, exports financiers
- **Administrateur** — toutes permissions
- **Super-admin** — gestion des rôles et configuration système

---

## 4. Modules métier

### 4.1 Site institutionnel
Pages CMS éditables (Accueil, À propos, Mot du Directeur, Partenaires, Contact), slider dynamique, blog/actualités, équipe et organigramme, multilingue prêt (FR/EN).

### 4.2 Catalogue de formations
Formations diplômantes (DTA, BTS), certifications, séminaires, formations à la carte, auditorat. Filtres par type, durée, niveau. Fiche détaillée avec brochure PDF, formulaire d'inscription, paiement, calendrier des sessions.

### 4.3 Bibliothèque
Catalogue avec recherche full-text (titre, auteur, ISBN, mots-clés), QR code par ouvrage, gestion des emprunts (prêt 14 jours, max 3, pénalité 500 FCFA/jour), génération automatique de la carte d'abonné PDF avec QR, scan QR pour emprunt/retour côté admin, rappels d'échéance par email.

### 4.4 Inscriptions & Paiements
Formulaire d'inscription multi-étapes avec upload de pièces, paiement Wave/Orange Money/QR statique, réservation sans engagement, validation manuelle ou automatique, envoi automatique de la convocation et du reçu PDF.

### 4.5 Concours & Examens
Avis et communiqués, formulaire avec pièces justificatives, paiement des frais, convocation automatique, banque d'épreuves protégée (accessible uniquement aux candidats inscrits).

### 4.6 Espace formateurs
Formulaire candidature formateur, fiche formateur (CV, domaines), planning, ressources pédagogiques.

### 4.7 Admin & analytics
Dashboard temps réel (abonnés actifs, prêts en cours, retards, inscriptions, revenus), exports CSV/Excel, journal d'audit, gestion des rôles.

### 4.8 Communications
Emails transactionnels (confirmation, reçu, rappel), notifications in-app, module flottant "Posez votre question" (chat ou ticket).

---

## 5. Sécurité & conformité

- HTTPS obligatoire (Let's Encrypt)
- Hashage des mots de passe (Argon2)
- 2FA pour les rôles admin
- Rate limiting sur les endpoints sensibles
- Validation stricte des entrées (Zod)
- CSRF, CSP, headers sécurité (Helmet)
- Logs d'audit horodatés et immuables
- RGPD friendly : consentement cookies, droit à l'effacement, export des données, politique de confidentialité
- Sauvegardes quotidiennes chiffrées (DB + storage)
- Tests d'intrusion avant mise en production

---

## 6. Découpage du projet

### Structure du dépôt (monorepo recommandé avec **pnpm workspaces** ou **Turborepo**)

```
cpfa-platform/
├── apps/
│   ├── web/              # Next.js (front + API)
│   └── admin/            # (optionnel, sinon dans /web/admin)
├── packages/
│   ├── db/               # Prisma schema + migrations
│   ├── ui/               # Composants partagés
│   ├── emails/           # Templates React Email
│   ├── pdf/              # Templates @react-pdf
│   └── lib/              # Utilitaires (Wave, OM, QR, etc.)
├── docker/
│   ├── docker-compose.yml
│   └── Dockerfile
├── .github/workflows/    # CI/CD
└── README.md
```

---

## 7. Planning prévisionnel

| Sprint | Durée | Livrables |
|---|---|---|
| **S0 — Cadrage** | 1 sem | Wireframes, charte graphique, schéma DB définitif, choix infra |
| **S1 — Socle technique** | 2 sem | Repo, CI/CD, auth, RBAC, layout, design system |
| **S2 — Site institutionnel** | 2 sem | Pages publiques, CMS interne, blog, slider, contact |
| **S3 — Module Bibliothèque** | 3 sem | Catalogue, abonnement, paiement, carte PDF, prêts |
| **S4 — Formations & Séminaires** | 2 sem | Catalogue, inscriptions, paiement, calendrier |
| **S5 — Concours & Examens** | 2 sem | Avis, dossier candidature, banque d'épreuves |
| **S6 — Admin & Analytics** | 2 sem | Dashboard, exports, audit, rôles |
| **S7 — Tests & Recette** | 1 sem | Tests e2e, audit sécu, correctifs |
| **S8 — Déploiement & Formation** | 1 sem | Mise en prod, formation équipe, manuel utilisateur |
| **TOTAL** | **~16 semaines** | Plateforme complète |

À comparer aux 6 semaines du devis WordPress initial : on triple la durée mais on livre un vrai produit, plus solide et évolutif.

---

## 8. Hébergement et coûts d'infrastructure (estimation mensuelle)

| Option | Description | Coût estimé |
|---|---|---|
| **A — Cloud managé** | Vercel (front) + Neon (Postgres) + Upstash (Redis) + Resend + Backblaze | 60 à 120 € / mois |
| **B — VPS auto-hébergé** | VPS OVH 8GB + Docker (Postgres, Redis, app, MinIO) + sauvegardes | 35 à 70 € / mois |
| **C — Souverain Sénégal** | Hébergeur local (Sonatel, ARC, etc.) | À chiffrer selon offre |

**Recommandation** : démarrer en **option A** pendant le développement et la première année (zéro DevOps), basculer vers B ou C ensuite si besoin de souveraineté.

---

## 9. Migration et reprise des données

- Reprise des contenus existants (Mot du Directeur, Brochure, Catalogue ressources, Statuts, Liste mails) via un script d'import.
- Reprise des QR codes Wave/OM existants via la fiche de configuration paiement.
- Conservation du domaine et des adresses mail CPFA (déjà configurées).

---

## 10. Décisions à prendre avant démarrage

1. **Hébergement** : option A, B ou C ?
2. **Paiement** : on intègre Wave + Orange Money via API (nécessite contrat marchand) ou on reste sur QR statique pour démarrer ?
3. **Multilingue** : FR seul, ou FR + EN dès le départ ?
4. **App mobile** : on prévoit une appli mobile (React Native) en V2 ou V3 ?
5. **Équipe de dev** : développement interne, externalisé, ou mixte ?
6. **Souveraineté** : exigence d'hébergement au Sénégal ?
7. **Budget global** : enveloppe à confirmer pour cadrer le périmètre du V1.

---

## 11. Avantages clés vs WordPress

| Critère | WordPress + plugins | Stack JS proposée |
|---|---|---|
| Performance | Moyenne, dépend du cache | Excellente (SSR/SSG) |
| Sécurité | Nombreuses CVE plugins | Surface réduite, code maîtrisé |
| Type-safety | Aucune (PHP non typé) | TypeScript bout en bout |
| SEO | Bon (Yoast) | Excellent natif |
| Évolutivité mobile | Difficile | App React Native partage 60-70 % du code |
| API | Plugin REST limité | API native, prête pour intégrations |
| Maintenance | Mises à jour risquées | Versions verrouillées, tests auto |
| Coût plugins premium | 300-500 €/an | Open source |
| Time-to-market initial | Plus court | Plus long, mais maintenabilité ×3 |

---

## 12. Prochaines étapes proposées

1. Validation de cette proposition d'architecture.
2. Atelier de cadrage fonctionnel détaillé (1 journée) pour figer le périmètre du MVP.
3. Production des wireframes et de la charte graphique.
4. Mise en place du dépôt et du socle technique (S1).
5. Démarrage des sprints fonctionnels.

---
