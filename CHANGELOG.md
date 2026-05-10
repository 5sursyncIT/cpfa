# Changelog — CPFA Plateforme

Toutes les évolutions notables. Version courante : pré-prod (toutes les
migrations de S1 à L10 appliquées localement). Ordre antéchronologique.

## Lots [L1-L10] — réponse aux modifications demandées par le Directeur

Doc source : [`docs/modofocations _demandees.md`](<docs/modofocations _demandees.md>)
· Analyse comparative : [`docs/analyse-existant-vs-demande.md`](docs/analyse-existant-vs-demande.md)

### L1 — Identité réelle CPFA
- Registry SiteSettings ([`apps/web/src/lib/site-settings/registry.ts`](apps/web/src/lib/site-settings/registry.ts))
  rempli avec : phrase d'accroche officielle, eyebrow « Unité décentralisée
  IIA Yaoundé », gouvernance El Hadji Cheikhou Oumar SECK, partenaires réels
  (IIA Yaoundé · DNA · FSSA · PF2E · PNUD · CASAI), coordonnées Liberté 6
  Immeuble Dior · +221 33 859 73 70 · contact@cpfa-sn.com.
- Nouveaux settings `footer.socials` (Facebook/LinkedIn/Instagram URLs) et
  `site.brochureKey` (clé média de la brochure CPFA globale).
- Seed Page CMS (mot-du-directeur, partenaires, a-propos) repris avec le
  vrai mot du Directeur signé et la mention IIA Yaoundé / DNA.
- Fallback hardcodé `/mot-du-directeur` aligné sur le seed.

### L2 — 4 blocs home (§1.3)
- [`apps/web/src/components/cpfa/home-blocks-section.tsx`](apps/web/src/components/cpfa/home-blocks-section.tsx)
  inséré juste sous le hero :
  - **Qui sommes-nous** — brochure CPFA + lien mot du Directeur
  - **Formation** — 3 colonnes (Certifications/Diplômes/Séminaires & concours)
    avec compteurs réels et état dynamique de la fenêtre concours
  - **À venir** — fusion `CourseSession` + `Seminar` + `Exam` triés par date
  - **Découvrez la bibliothèque** — pitch + 3 formules (10k/15k/50k)
- `/formations?cat=…` honore le filtre catégorie via `FormationsCatalog`
  ([`formations-catalog.tsx`](apps/web/src/components/cpfa/formations-catalog.tsx))
  pour les liens « En savoir plus ».

### L3 — Gating concours diplômantes (§Important)
- Schema `Course.applicationsOpenAt` + `applicationsCloseAt` (DateTime
  nullable) ; migration `20260510160000_course_application_window`.
- Helper pur ([`apps/web/src/lib/course-rules.ts`](apps/web/src/lib/course-rules.ts))
  `applicationStatusAt(course, now?)` — openAt inclusif / closeAt exclusif.
- Enforcement tRPC ([`registrations.ts`](apps/web/src/server/routers/registrations.ts))
  rejette `BAD_REQUEST` hors fenêtre avec message localisé incluant date de
  réouverture.
- Mutation admin `courses.setApplicationWindow` (`admin:any`) avec
  validation cross-field (`openAt < closeAt`) + audit log.
- UI publique ([`enroll-launcher.tsx`](apps/web/src/components/cpfa/enroll-launcher.tsx))
  — encadré « Inscriptions fermées · réouverture le … » à la place du
  bouton candidature quand fermé.
- UI admin ([/admin/courses](apps/web/src/app/admin/courses/page.tsx)) — table
  filtrable avec badge statut (Ouvertes / Avant date / Fermées) et éditeur
  inline `<input type="datetime-local">` × 2 + bouton « Toujours ouvert ».
- 7 nouveaux tests `course-rules.test.ts`.

### L4 — Reçu PDF auto + email attachment
- `confirmPayment` ([`payments-confirm.ts`](apps/web/src/lib/payments-confirm.ts))
  crée l'`Invoice` row dans la transaction (idempotent — `INV-YYYY-XXXXXX`)
  puis enqueue le PDF job avec `jobId: invoice:${paymentId}` (anti-doublon
  BullMQ).
- Worker PDF ([`worker/index.ts`](apps/web/src/worker/index.ts)) : rend +
  upload S3 + persiste `pdfKey`, **chaîne** un job `email` kind `'receipt'`
  avec `attachments: [{ filename, storageKey, contentType }]`.
- Worker email **resigne fraîchement** chaque storageKey en presigned URL
  1h juste avant l'envoi à Resend (`path` mode) — l'URL ne périme pas en
  cas de retry tardif.
- Mailer ([`apps/web/src/lib/mailer.ts`](apps/web/src/lib/mailer.ts)) accepte
  désormais `attachments?: EmailAttachment[]` (path/content/contentType).
- Template [`receipt.tsx`](packages/emails/src/receipt.tsx) avec carte
  récap (numéro · date · objet · montant FCFA).

### L5 — Modèle Testimonial
- Schema `Testimonial { scope: STUDENT|TEACHER|PROFESSIONAL|PARTNER, … }` +
  migration `20260510170000_add_testimonials`.
- Router [`testimonials.ts`](apps/web/src/server/routers/testimonials.ts)
  (public `list` filtres scope/locale + admin CRUD + `togglePublished`).
- Admin [/admin/testimonials](apps/web/src/app/admin/testimonials/page.tsx)
  avec filtres FR/EN + scope, grille avec édition inline et publish toggle.
- Intégration sur la home (preferred → DB, fallback → SiteSetting JSON) et
  sur `/devenir-formateur` (section témoignages enseignants).

### L6 — Triple tarif bibliothèque (10k/15k/50k)
- Schema `Subscription.tier: STUDENT | PROFESSIONAL | HOME_LOAN` +
  migration `20260510180000_add_subscription_tier` (default PROFESSIONAL).
- Règles métier ([`library-rules.ts`](apps/web/src/lib/library-rules.ts))
  `LIBRARY_TIERS` registry : 10k/2 prêts · 15k/3 prêts · 50k/5 prêts.
  `evaluateBorrowEligibility` lit le tier de l'abonnement.
- Router `subscriptions.tiers` (public — liste les 3 formules) +
  `subscriptions.initiate({ tier })` calcule prix dynamiquement.
- 4 nouveaux tests `library-rules` couvrant les quotas par tier.

### L7 — Page Espaces Apprenants (§3)
- [/espace-apprenants](apps/web/src/app/(public)/espace-apprenants/page.tsx)
  agrège **Témoignages multi-voix** (4 scopes) + **Recrutement** (2 cartes
  Espace Recruteur · Offres + 4 dernières annonces).
- Lien ajouté au top-nav (remplace l'ancien « Centre Ressources » de
  cpfa-sn.com).

### L8 — Job board complet (§3.2)
- Schema `JobPosting` + `JobApplication` + 4 enums (`JobType`, `JobLevel`,
  `JobStatus`, `JobApplicationStatus`) ;
  migration `20260510190000_add_job_board`.
- Router [`jobs.ts`](apps/web/src/server/routers/jobs.ts) :
  - Public : `list` (filtres type/level/location/q), `byId`,
    `submitOffer` (DRAFT — modération admin), `submitApplication`
    (enqueue 2 emails recruteur+candidat), `requestSheetUpload` /
    `requestCvUpload` (presigned PUT).
  - Admin : `adminList`, `adminById`, `publish` / `close` / `reject` /
    `delete` (audit log + email recruteur sur publication),
    `setApplicationStatus`.
  - User : `myApplications` (suivi candidat connecté).
- 3 templates email :
  [`job-application-recruiter`](packages/emails/src/job-application-recruiter.tsx)
  · [`job-application-candidate`](packages/emails/src/job-application-candidate.tsx)
  · [`job-posted`](packages/emails/src/job-posted.tsx).
- Frontend public :
  - [/emplois](apps/web/src/app/(public)/emplois/page.tsx) — liste +
    filtres SSR, tri Urgent → récents
  - [/emplois/[id]](apps/web/src/app/(public)/emplois/%5Bid%5D/page.tsx) —
    détail avec sidebar candidature CV PDF
  - [/emplois/recruteur](apps/web/src/app/(public)/emplois/recruteur/page.tsx)
    — form recruteur public (avec fiche poste PDF optionnelle)
- Frontend admin :
  - [/admin/jobs](apps/web/src/app/admin/jobs/page.tsx) — onglets
    DRAFT/PUBLISHED/CLOSED/REJECTED + actions modération
  - [/admin/jobs/[id]](apps/web/src/app/admin/jobs/%5Bid%5D/page.tsx) —
    revue candidatures avec téléchargement CV
- Compteur DRAFT dans la sidebar admin.

### L9 — Recherche globale (§1.1)
- Helper [`apps/web/src/lib/site-search.ts`](apps/web/src/lib/site-search.ts)
  — Postgres `ILIKE` parallèle sur `Page` · `Article` · `Course` ·
  `Resource` (titre/description/tags/auteurs/ISBN), 6 hits par type, min
  2 caractères.
- Page [/recherche](apps/web/src/app/(public)/recherche/page.tsx) —
  formulaire `<form method="get">` + résultats avec pill par type, snippet
  et meta date/auteurs.
- Champ recherche inline dans le top-nav (160 px à droite, accessible).

### L10 — Footer logos partenaires + CTA columns (§1.4)
- Setting `footer.partnerLogos: { name, logoKey?, url? }[]` (max 12) avec
  defaults pré-remplis (IIA · DNA · FSSA · PF2E · PNUD · CASAI sans
  logoKey en attendant uploads).
- Footer ([`footer.tsx`](apps/web/src/components/cpfa/footer.tsx)) refondu :
  bandeau logos en haut (filtre `brightness(0) invert(1)` sur fond sombre)
  + 2 colonnes CTA mises en avant « Je m'inscris » → `/formations` ·
  « Posez vos questions » → `/contact` + grille existante préservée.
- Translations FR/EN ajoutées (`footer.joinUs`, `footer.askQuestions`,
  `footer.partnersLabel`).

---

## Modules construits avant les lots du Directeur

### PayTech — décision §10.2 verrouillée
- Provider ([`packages/lib/src/payments/paytech.ts`](packages/lib/src/payments/paytech.ts))
  implémente `initiate` (POST `/api/payment/request-payment` avec headers
  `API_KEY`+`API_SECRET`) et `verifyWebhook` (HMAC-SHA256 constant-time).
- Schema enum `PaymentProvider.PAYTECH` ajouté ; migration
  `20260509200000_add_paytech_provider`.
- Webhook public [/api/webhooks/payments/[provider]](apps/web/src/app/api/webhooks/payments/%5Bprovider%5D/route.ts)
  vérifie HMAC puis enqueue le job `payment-webhook` (idempotent via
  `jobId: webhook:${providerRef}`).
- tRPC `payments.initiate` (owner-only) crée la PENDING + appelle
  `provider.initiate` + retourne `redirectUrl`.
- Pages [/paiement/succes](apps/web/src/app/(public)/paiement/succes/page.tsx)
  · [/paiement/annule](apps/web/src/app/(public)/paiement/annule/page.tsx).
- 10 tests `paytech.test.ts` (vector HMAC, payloads valides/altérés,
  `sale_canceled` rejeté, fake fetch sur `initiate`).

### Espace formateur — §4.6
- Schema `TrainerProfile` enrichi (status PENDING/APPROVED/REJECTED,
  experienceYears, phone, submittedAt, reviewedAt, reviewedById,
  rejectionReason) + `CourseSession.trainerId` + nouveau `TrainerResource`
  (ressources pédagogiques) ; migration
  `20260509210000_add_trainer_module`.
- Router [`trainers.ts`](apps/web/src/server/routers/trainers.ts) (12
  procedures) — submitApplication / me / mySchedule / listResources /
  approve / reject / assignToSession / requestCvUpload /
  requestResourceUpload / confirmResource / etc.
- RBAC `trainer:manage` (ADMIN + SUPER_ADMIN).
- Templates email
  [`trainer-approved`](packages/emails/src/trainer-approved.tsx) ·
  [`trainer-rejected`](packages/emails/src/trainer-rejected.tsx).
- Pages publiques :
  [/devenir-formateur](apps/web/src/app/(public)/devenir-formateur/page.tsx)
  (form auth-gated avec upload CV PDF) ·
  [/me/formateur](apps/web/src/app/me/formateur/page.tsx) (dashboard
  trainer : profil, planning, ressources).
- Page admin
  [/admin/trainers](apps/web/src/app/admin/trainers/page.tsx) (filtre
  PENDING/APPROVED/REJECTED, ouverture CV, approve/reject avec motif).

### Multilingue FR + EN — §10.3 verrouillée
- `apps/web/src/i18n/request.ts` : `locales = ['fr', 'en']` ; résolution
  cookie-driven (`NEXT_LOCALE`), Accept-Language fallback, défaut FR.
- Server action `setLocaleAction` ([`apps/web/src/app/actions/set-locale.ts`](apps/web/src/app/actions/set-locale.ts))
  pose le cookie 1 an + `revalidatePath('/', 'layout')`.
- LocaleSwitcher ([`apps/web/src/components/cpfa/locale-switcher.tsx`](apps/web/src/components/cpfa/locale-switcher.tsx))
  — 2 pilules FR/EN, server component, zéro JS client. Présent dans le
  top-nav et le footer.
- Messages JSON ([`messages/fr.json`](apps/web/messages/fr.json) ·
  [`messages/en.json`](apps/web/messages/en.json)) — namespaces `common`,
  `nav`, `footer`, `auth`, `blog`.
- CMS Pages, Articles, SiteSettings tous **locale-aware** (cf. ci-dessous).
- Top-nav, footer, /blog, /devenir-formateur, etc. utilisent
  `getTranslations()`.

### CMS Pages + médiathèque
- Modèle Page existant + nouveau modèle `Media` exploitable.
- Router `cms.media.list / requestUpload / confirm / updateAlt / delete`
  ([`cms.ts`](apps/web/src/server/routers/cms.ts)).
- Router `cms.articles` étendu : `byId / create / update / delete /
  togglePublished` (au-delà du toggle initial).
- Schéma de blocs CMS étendu : heading · paragraph · **image** · **quote**
  · **list**.
- Composants partagés :
  - [`block-editor.tsx`](apps/web/src/components/cms/block-editor.tsx) —
    éditeur unifié pour pages et articles
  - [`media-picker.tsx`](apps/web/src/components/cms/media-picker.tsx) —
    modale de sélection d'un média uploadé
  - [`block-renderer.tsx`](apps/web/src/components/cms/block-renderer.tsx)
    — server component public unique pour `/p/[slug]` + `/blog/[slug]`
- Admin :
  - [/admin/media](apps/web/src/app/admin/media/page.tsx) — bibliothèque
    avec multi-upload, copie de clé, édition d'alt-text, suppression
  - [/admin/articles/[id]](apps/web/src/app/admin/articles/%5Bid%5D/page.tsx)
    — éditeur complet avec block-editor, cover via media picker,
    tags, publish, delete
- Proxy public
  [/api/media/[...key]](apps/web/src/app/api/media/%5B...key%5D/route.ts)
  — DB-gated 302 vers presigned GET (5 min) + Cache-Control 4 min ; pas
  d'open redirect.

### Site Settings locale-aware
- Modèle `SiteSetting { key, locale, value Json, updatedAt, updatedById? }`
  avec PK composite `(key, locale)` ; migration
  `20260510140000_site_setting_locale`.
- Registry typé ([`apps/web/src/lib/site-settings/registry.ts`](apps/web/src/lib/site-settings/registry.ts))
  — 9 clés (`home.hero`, `home.testimonials`, `home.stats`,
  `about.governance`, `about.partners`, `about.stats`, `footer.contact`,
  `footer.socials`, `site.brochureKey`, `footer.partnerLogos`) avec schémas
  zod et valeurs par défaut.
- Accesseur [`get.ts`](apps/web/src/lib/site-settings/get.ts) cascade :
  locale courante → row demandée → row FR (fallback) → registry default.
  Tolère DB unreachable (build-time safe).
- Router `cms.settings.list / set / reset` retourne `source: 'locale' |
  'fallback' | 'default'` pour le badge admin.
- Admin [/admin/settings](apps/web/src/app/admin/settings/page.tsx) avec
  onglets FR/EN ; bandeau « Hérite du français » sur les clés non
  localisées ; reset = supprimer la version localisée.

---

## Sprints scaffold initial — S1 à S8

Cf. [`CLAUDE.md`](CLAUDE.md) pour le détail. En une ligne :

| Sprint | Surface |
|---|---|
| S1 | Monorepo pnpm/Turborepo, Next.js 15, tRPC, Prisma, Auth.js v5, BullMQ, Vitest+Playwright, CI |
| S2 | Site institutionnel public + CMS reads + contact form |
| S3 | Bibliothèque (catalogue, /me/abonnement, carte PDF, prêts admin, cron rappels) |
| S4 | Formations & séminaires (catalogue, inscriptions, convocation PDF) |
| S5 | Concours (avis, candidatures, banque d'épreuves PUBLIC/REGISTERED/PAID) |
| S6 | Admin & analytics (dashboard, audit, users, payments, CMS editor, exports CSV) |
| S7 | Pure-rule extraction (`library-rules.ts`), tests unit + Playwright e2e, SECURITY.md |
| S8 | Multi-stage Dockerfile (web/worker/migrate), `docker-compose.prod.yml`, DEPLOYMENT.md, RUNBOOK.md, USER_MANUAL.md |

---

## État des décisions §10 du `projet.md`

| # | Décision | État | Verrouillage |
|---|---|---|---|
| §10.1 | Hébergement A/B/C | ⏳ Ouverte — Vercel+Neon (A) ou VPS Docker (B) supporté ; à arbitrer pour la prod |
| §10.2 | Paiement Wave/OM | ✅ Tranchée — **PayTech** (agrégateur Wave + OM + Free + Wizall + Visa + Mastercard) |
| §10.3 | Multilingue | ✅ Tranchée — **FR + EN actifs**, cookie-driven, fallback FR systématique |
| §10.4 | App mobile (V2/V3) | ⏳ Ouverte — pas de code mobile |
| §10.5 | Équipe dev | ⏳ Ouverte (RH) |
| §10.6 | Souveraineté Sénégal | ⏳ Ouverte — DEPLOYMENT.md référence Neon US/EU |
| §10.7 | Budget global | ⏳ Ouverte (finance) |

---

## Chiffres-clés

- **64 tests** unitaires passants (46 web + 18 lib · Vitest)
- **9 migrations** Prisma additives appliquées
- **9 nouvelles routes publiques** depuis l'analyse : `/recherche`,
  `/devenir-formateur`, `/me/formateur`, `/espace-apprenants`, `/emplois`,
  `/emplois/[id]`, `/emplois/recruteur`, `/paiement/succes`, `/paiement/annule`
- **9 nouvelles routes admin** : `/admin/courses`, `/admin/jobs`,
  `/admin/jobs/[id]`, `/admin/media`, `/admin/settings`, `/admin/testimonials`,
  `/admin/trainers`, `/api/media/[...key]`, `/api/webhooks/payments/[provider]`
- **8 templates email** au total (3 anciens + 5 nouveaux : trainer-approved /
  rejected, job-application-recruiter / candidate, job-posted, receipt)
- **5 nouveaux blocs CMS** : heading · paragraph · image · quote · list
- **30+ fichiers TS** créés ou refondus dans `apps/web/src/`

---

## À faire côté ops avant go-live

1. **PayTech** : créer compte e-commerce sur paytech.sn, demander
   activation prod par email à `contact@paytech.sn`, fournir
   `PAYTECH_API_KEY` + `PAYTECH_API_SECRET`, configurer l'IPN sur
   `https://<domaine>/api/webhooks/payments/paytech`.
2. **Resend** : `RESEND_API_KEY` + domaine `cpfa-sn.com` vérifié.
3. **S3-compatible** : Backblaze B2 ou OVH ou MinIO sur VPS — fournir
   `S3_ENDPOINT/REGION/BUCKET/ACCESS_KEY/SECRET_KEY/FORCE_PATH_STYLE`.
4. **`PAYMENT_PROVIDER=paytech`** + `PAYTECH_ENV=prod` dans
   `.env.production`.
5. Run `pnpm db:migrate:deploy` (toutes les migrations sont additives,
   aucune perte de donnée).
6. Uploader via `/admin/media` :
   - Photo institutionnelle hero (livres + parapluie + icônes)
   - Brochure CPFA globale (PDF)
   - Photo Directeur
   - Charte enseignant (PDF)
   - Règlement bibliothèque + procédure abonnement (PDF)
   - Brochures par formation
   - Logos PF2E / PNUD / Cabinet CASAI (PNG transparent)
7. Renseigner via `/admin/settings` : URLs réseaux sociaux, brochure CPFA,
   et localiser les valeurs en EN si visiteurs anglophones attendus.
8. Créer les premiers Témoignages via `/admin/testimonials` (4 scopes).
9. Décider §10.1 (hébergement) et §10.6 (souveraineté).

---

## Migrations Prisma appliquées

```
20260507074714_init                               (S1 schema initial)
20260509200000_add_paytech_provider               (PaymentProvider enum)
20260509210000_add_trainer_module                 (TrainerStatus, TrainerResource, CourseSession.trainerId)
20260510120000_add_site_settings                  (SiteSetting model)
20260510140000_site_setting_locale                (PK composite key+locale)
20260510160000_course_application_window          (Course.applicationsOpen/CloseAt)
20260510170000_add_testimonials                   (Testimonial + scope enum)
20260510180000_add_subscription_tier              (Subscription.tier)
20260510190000_add_job_board                      (JobPosting + JobApplication + 4 enums)
```
