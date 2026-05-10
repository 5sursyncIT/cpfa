# Analyse — site actuel cpfa-sn.com vs modifications demandées

Date : 2026-05-10
Sources :
- Site en production : <https://cpfa-sn.com/>
- Modifications demandées : [`docs/modofocations _demandees.md`](modofocations%20_demandees.md)
- Cahier des charges initial : [`docs/projet.md`](projet.md)

---

## 1. Identité institutionnelle (à préserver pour le seed)

| Champ | Valeur officielle |
|---|---|
| Nom complet | **Centre Professionnel de Formation en Assurance (CPFA)** |
| Statut | Unité décentralisée de l'**Institut International des Assurances (IIA) de Yaoundé** (République du Cameroun) |
| Directeur | **El Hadji Cheikhou Oumar SECK** |
| Adresse | Liberté 6, Immeuble Dior — Dakar, Sénégal |
| Téléphone | (+221) 33 859 73 70 |
| Email | contact@cpfa-sn.com |
| Reconnaissance | **Direction des Assurances (DNA)** — à mentionner dans la phrase d'accroche |

⚠️ Les valeurs actuellement codées en seed (`admin@cpfa.local`, `BP 3308`, etc.) sont à remplacer par les vraies coordonnées dès que l'éditeur a validé.

---

## 2. Inventaire du site actuel (à préserver)

### 2.1 Menu actuel
- Accueil
- Formation (parent)
  - Formations diplômantes — `/formations-diplomantes/`
  - Formations pour intermédiaires — `/formations-pour-les-intermediaires-dassurances/`
  - Certifications spécialisées — `/certifications-specialisees/`
- Enseigner au CPFA — `/enseigner-au-cpfa/`
- Centre Ressources — `/centre-ressources/`
- Contact — `/contact/`
- Connexion — `/book/index.php?p=member` (système de bibliothèque existant — PHP, séparé)

### 2.2 Phrase d'accroche actuelle
> « Premier centre de référence au Sénégal en matière de formation dans les métiers de l'assurance »

→ À remplacer (cf. §3.2).

### 2.3 Section « Pourquoi choisir le CPFA ? » (à reprendre)
- Formations diplômantes reconnues (DTA & BTS, petits groupes)
- Inscription & paiement en ligne
- Formateurs experts du terrain (cas réels marché sénégalais/africain)
- Séminaires réguliers avec certificats
- Bibliothèque & ressources (catalogue en ligne, abonnements)
- Accompagnement carrière (stages, coaching, réseau)

### 2.4 Catalogue formations actuel
| Diplôme | Durée | Prérequis | Notes |
|---|---|---|---|
| **DTA** — Diplôme de Technicien en Assurance | 2 ans | BAC | Reconnaissance IIA Yaoundé |
| **BTS** Assurance | 2 ans | BAC ou DTA | Cadres intermédiaires |

Domaines couverts (à reprendre comme tags / catégories) :
auto, santé, incendie, transport/maritime, RC, sinistres, **conformité CIMA**, distribution, gestion d'agence, finance, assurance-vie, actuariat.

### 2.5 Bibliothèque — tarifs réels
| Formule | Tarif annuel |
|---|---|
| Étudiants | **10 000 FCFA/an** |
| Professionnels | **15 000 FCFA/an** |
| Emprunt à domicile | **50 000 FCFA/an** |

⚠️ Le scaffold a une seule formule (14j/3 prêts/500 FCFA pénalité). À étendre — voir §4.4.

### 2.6 Profil enseignant (à reprendre)
- Pré-requis : pros assurance / enseignants-chercheurs / cadres conformité CIMA
- Domaines prioritaires : auto, santé, incendie, transport, RC, sinistres, conformité CIMA, distribution, gestion d'agence, finance
- Pièces : CV (2 pages), diplômes, ID, références, plan de cours, échantillon support
- Process : candidature → entretien 30-45 min → comité → onboarding
- Modalités : vacation horaire ou forfait par module

### 2.7 Partenaires actuellement affichés
- DNA — <http://www.dna.finances.gouv.sn/>
- FSSA — <https://fssa.sn/>
- IIA Yaoundé — <https://iiayaounde.com/>

---

## 3. Modifications demandées — état du scaffold

Légende : ✅ déjà couvert · 🟡 partiellement couvert · ❌ à construire · 📝 contenu/copy à fournir

### 3.1 Onglets du menu (§1.1 du doc Directeur)

| Demande | État |
|---|---|
| + Onglet **« Actualités et médias »** | 🟡 — la route `/blog` existe avec articles+médias, mais le label nav dit « Actualités ». Renommer + l'amener au top niveau. |
| Remplacer **« Centre de ressources »** par **« Espace Apprenants »** | ❌ — concept entièrement nouveau (témoignages multi-parties + recrutement). Voir §3.7. |
| + Onglet **« recherche »** (loupe globale) | ❌ — pas de search global dans le scaffold. La biblio a sa propre recherche FTS Postgres ; il faut une route `/recherche` qui interroge Pages + Articles + Resources + Courses + Seminars. |

### 3.2 Hero accueil (§1.2)

| Demande | État |
|---|---|
| Phrase d'accroche : « Premier centre de référence au Sénégal en matière de formation dans les métiers de l'assurance (reconnu par la Direction des Assurances). » | ✅ — `home.hero` est dans SiteSettings. À éditer via `/admin/settings`. |
| Photo de fond institutionnelle (livres + parapluie + icônes diplômes) | 📝 — image à fournir, puis upload via `/admin/media` et référence dans hero. Le hero JSX actuel n'a pas de champ `backgroundImage` — petite extension à ajouter au schéma `home.hero`. |
| Photo du Directeur mise à jour | 📝 — nouvelle photo à fournir. Stocker via `/admin/media`. |

### 3.3 Quatre blocs après l'accroche (§1.3)

#### a) « Qui sommes-nous »
Bouton → brochure CPFA (PDF) + mot du directeur.
| Demande | État |
|---|---|
| Brochure PDF téléchargeable | 🟡 — `/admin/media` accepte PDF jusqu'à 25 Mo. Il manque un champ « brochure CPFA » dédié dans SiteSettings + un composant qui l'affiche sur la home. |
| Lien mot du directeur | ✅ — `/mot-du-directeur` existe (CMS-driven via slug `mot-du-directeur`). |

#### b) « Formation » — 3 colonnes (Certifications / Diplômes / Séminaires & concours)
| Demande | État |
|---|---|
| 3 colonnes avec photo de fond + bouton « En savoir plus » | ❌ — la home actuelle a un bloc « Programmes phares » qui liste 3 formations mais pas la structure 3 catégories demandée. À refaire en composant. |
| Page Certifications listant tous les certifiants + brochure + inscription + paiement QR | 🟡 — la table `Course.kind = CERTIFICATION` existe ; route `/formations` filtre déjà. À enrichir avec brochure par formation et flow QR par item. |
| Page Diplômes idem | 🟡 — `Course.kind = DIPLOMANT`, idem. |
| **Gating concours** : fermer l'inscription en dehors des périodes d'ouverture | ❌ — **critique**. Aujourd'hui un `Course` n'a pas de champ « ouvert/fermé ». Il faut ajouter `Course.applicationsOpenAt` + `applicationsCloseAt` (DateTime nullable) et bloquer la mutation `registrations.create` quand on est hors fenêtre. Schema + migration + UI. |
| Page Séminaires & concours | 🟡 — routes `/seminaires` et `/concours` existent. À harmoniser dans une page « Séminaires & concours » groupée si demandé. |

#### Pour chaque formation
| Demande | État |
|---|---|
| Brochure PDF | 🟡 — `Course.brochureKey` existe en schéma. UI d'upload manquante côté admin. |
| Formulaire d'inscription / réservation | ✅ — `registrations.submit` couvre courses + seminars + exams. |
| Paiement par QR | ✅ — `static-qr` provider en place (fallback). |
| **Paiement mobile money réel** | ✅ — **PayTech intégré**. Reste contrat marchand. |
| Reçu auto après paiement | 🟡 — modèle `Invoice` + `renderInvoice` PDF en place ; le worker PDF rend déjà la facture mais aucun envoi email automatique au visiteur. À brancher : sur `confirmPayment`, enqueue un job qui rend le PDF, l'upload S3 puis envoie un mail au client avec le PDF en pièce jointe. |

#### c) « À venir »
Séminaires + concours + formations à venir par date.
| Demande | État |
|---|---|
| Bloc home triant les CourseSession + Seminar + Exam à venir | ❌ — composant à écrire. Donnée déjà disponible (`startsAt`, `examAt`). |

#### d) « Découvrez la bibliothèque »
| Demande | État |
|---|---|
| Bouton « En savoir + » ouvre **fenêtre hors site** | 🟡 — actuellement le bouton va vers `/bibliotheque` (intégré). Le doc demande explicitement « hors site comme convenu ». **Décision à confirmer** : on intègre tout dans la nouvelle plateforme (cohérent avec notre scaffold) OU on conserve le `/book/index.php?p=member` actuel comme système séparé. Recommandation : intégrer (sinon le scaffold S3 est inutile). |
| Règlement intérieur PDF | ❌ — pas de modèle dédié. À ajouter une SiteSetting `library.regulation` (storage key) + page de téléchargement. |
| Procédure d'abonnement + fiche d'abonnement | ❌ — fiche PDF à fournir + page CMS pour la décrire. |
| Catalogue par catégorie | ✅ — `Resource.kind` + `Resource.tags` + recherche FTS Postgres en place. |
| Recherche par auteur / titre / catégorie | ✅ — déjà dans `library.list` (router tRPC). |
| Abonnement en ligne avec paiement QR | ✅ — flow PayTech. |
| Génération auto carte PDF après paiement | ✅ — `/api/me/card/route.ts` rend le PDF à la volée + worker upload S3. |
| Téléchargement direct fiche d'abonnement & carte | ✅ — carte = `/api/me/card`. Fiche PDF = à uploader comme média. |
| Règlement + procédures téléchargeables PDF | ❌ — voir ci-dessus. |
| **3 formules tarifaires** (étudiants 10k / pros 15k / emprunt domicile 50k) | ❌ — schéma actuel n'a qu'**une** formule. Voir §4.4. |
| Interface admin biblio (CRUD livres + docs officiels) | 🟡 — `library.create/update/delete` existent côté router mais aucune UI admin (`/admin/library` à créer). |

### 3.4 Pied de page (§1.4)

| Demande | État |
|---|---|
| Logos : **PF2E, PNUD, Cabinet CASAI** | 📝 — nouveaux partenaires à ajouter dans `about.partners` (et à uploader les logos via `/admin/media`). Schéma actuel = `string[]`, ne stocke pas l'URL du logo. À étendre en `{ name, logoKey?, url? }[]` si on veut afficher des logos vrais. |
| Icônes Facebook / LinkedIn / Instagram | ❌ — `footer.contact` n'a pas de champ social. À ajouter `footer.socials` à la registry. |
| Colonnes « Je m'inscris » + « Posez vos questions » | ❌ — refonte mineure du footer (ajout de 2 colonnes / boutons). |

### 3.5 Onglet « Enseigner au CPFA » (§2)

| Demande | État |
|---|---|
| Affichage automatique du blog **« Devenir enseignant »** | 🟡 — `/devenir-formateur` existe mais c'est une page de candidature, pas un blog éditorial. Restructurer en page hybride : pitch + témoignages + bouton candidature. |
| Téléchargement de la **charte de l'enseignant** (PDF) | ❌ — fichier à uploader via `/admin/media` + lien sur la page. |
| Formulaire de candidature avec upload CV | ✅ — déjà dans `/devenir-formateur` (composant `apply-form.tsx`, upload PDF presigned). |
| Blog **« Témoignages »** | ❌ — modèle dédié `Testimonial` à créer (avec scope=trainer | learner | partner | professor) ou réutiliser `Article` avec un tag spécial. Recommandation : nouveau modèle `Testimonial` propre (auteur, rôle, citation, photo optionnelle, scope). |

### 3.6 Onglet « Espaces Apprenants » (§3)

Cet onglet remplace « Centre Ressources » et **n'existe pas** dans le scaffold actuel.

#### 3.6.1 Blog Témoignages
Multi-parties : étudiants / professeurs / professionnels / partenaires.
→ Le modèle `Testimonial` à créer (cf. ci-dessus) doit avoir `scope: 'student' | 'teacher' | 'professional' | 'partner'`.

#### 3.6.2 Blog Recrutement — Job board complet ❌

C'est une **fonctionnalité majeure** non couverte par le scaffold.

##### Espace Recruteur (entreprise)
- Formulaire dépôt d'offre :
  - Nom entreprise · Intitulé poste · Description · Profil · Contact
  - Upload fiche de poste PDF
  - Bouton publier
- Email auto à l'entreprise pour chaque candidature reçue
- Offre auto-masquée après date de clôture

##### Offres d'emploi (candidats)
- Liste avec filtres : type de poste, niveau, localisation
- Mention « Récente » / « Urgent »
- Détail offre + formulaire candidature :
  - Nom/prénom · Email/tél · Poste visé · Motivation · Upload CV
- Email confirmation au candidat après dépôt
- Email à l'entreprise avec CV joint

##### Tables nécessaires (estimation)
```
JobPosting { id, recruiterId, companyName, title, description, profile,
             contact, fileSheetKey?, type, level, location, urgent,
             closesAt, status, createdAt }

JobApplication { id, jobPostingId, candidateUserId?, firstName, lastName,
                 email, phone, motivation, cvKey, status, createdAt }
```

Plus :
- 2 templates email (`job-application-recruiter`, `job-application-candidate`)
- 2 nouveaux rôles probables : `RECRUTEUR` (pas dans la liste 9 rôles actuelle) — ou contourner en autorisant tout `Visiteur` à publier (à valider avec le Directeur, anti-spam = captcha + modération).
- 6 routes admin/public + 3 components

C'est un module à part entière. Travail estimé : 1-2 jours focus.

---

## 4. Manques transverses identifiés

### 4.1 Recherche globale (§1.1)
Implémenter `/recherche?q=...` interrogeant : Page (title, content), Article (title, excerpt, content), Resource (title, authors, tags), Course/Seminar/Exam (title, description). Postgres FTS suffit pour V1.

### 4.2 Gating concours (§1.3 « IMPORTANT !!! »)
Schéma : `Course` reçoit deux nouvelles colonnes optionnelles `applicationsOpenAt` / `applicationsCloseAt`. Procédure tRPC `registrations.create` jette `BAD_REQUEST` si on est hors fenêtre. Le visiteur voit un badge « Inscriptions fermées — réouverture le … » sur la fiche.

### 4.3 Reçu PDF auto après paiement (§Pour chaque formation)
Sur `confirmPayment` (helper existant), enqueue un job `pdf` kind `invoice` avec en plus un job `email` kind `receipt` qui attache le PDF. Le worker PDF crée déjà l'Invoice ; il faut juste relier les jobs et créer un template email `receipt`.

### 4.4 Triple tarif bibliothèque (§d.1)
Soit on étend `Subscription` avec un champ `tier: 'STUDENT' | 'PRO' | 'HOME_LOAN'` + `priceXof` calculé selon le tier, soit on garde une seule formule et on ajuste les règles (max prêts, durée, pénalité) selon le tier.
Décision : ajouter `tier` enum + `LIBRARY_TIERS` constants dans `lib/library-rules.ts`. Migration additive.

### 4.5 Footer
- Champ `footer.brochureKey` (brochure CPFA globale)
- Champ `footer.socials` ({ facebook?, linkedin?, instagram? })
- Champ `footer.partnerLogos` ({ name, logoKey, url }[])

### 4.6 Modèle `Testimonial`
```
Testimonial { id, scope, authorName, authorRole?, authorPhotoKey?,
              quote, locale, published, createdAt }
```
+ 1 router CRUD + 1 admin page + composants d'affichage (carrousel home + grille dans `/enseigner-au-cpfa` et `/espaces-apprenants`).

### 4.7 Job board (§3.6.2)
Voir §3.6.2 — module distinct.

---

## 5. Priorités proposées

Vu l'ampleur, voici un ordre raisonné — chaque lot peut être livré indépendamment :

| Lot | Contenu | Effort | Bloquant ? |
|---|---|---|---|
| **L1 — Identité & coordonnées** | Seed avec vraies infos (Directeur, adresse, tél, email), partenaires (DNA/FSSA/IIA + PF2E/PNUD/CASAI), socials | 1 h | Pré-requis pour tout le reste |
| **L2 — Hero & 4 blocs home** | Phrase d'accroche, image de fond, blocs Qui sommes-nous / Formation 3 cols / À venir / Bibliothèque | 0,5 j | Demande explicite §1.2-1.3 |
| **L3 — Gating concours + brochures** | Schéma `Course.applicationsOpenAt/CloseAt` + UI admin + badge public + UI upload brochure | 0,5 j | **CRITIQUE** §IMPORTANT |
| **L4 — Reçu PDF + email** | Job email `receipt` + lien PDF dans `confirmPayment` | 0,5 j | Demande explicite |
| **L5 — Modèle Testimonial** | Schéma + router + admin + composants `/enseigner-au-cpfa` & `/espaces-apprenants` | 0,5 j | Demande explicite §2.2 + §3.1 |
| **L6 — Triple tarif biblio** | Enum `tier` + règles différenciées + UI | 0,5 j | Demande §d.1 |
| **L7 — Espace Apprenants** | Renommage onglet + nouvelle page + intégration testimonials | 0,5 j | Demande §3 |
| **L8 — Job board complet** | JobPosting + JobApplication + emails + 4 pages | 1-2 j | Demande §3.2 |
| **L9 — Recherche globale** | Route `/recherche` + FTS Postgres | 0,5 j | Demande §1.1 |
| **L10 — Polish footer** | Logos partenaires uploadés + socials + 2 colonnes | 0,5 j | Demande §1.4 |
| **L11 — Charte enseignant + brochure CPFA** | Upload PDFs + références dans les pages | 0,5 j | Demande §a + §2 |
| **L12 — Fenêtre biblio externe ?** | Décision : tout intégrer (notre scaffold) ou pointer vers `/book/` PHP existant | — | Décision Directeur |

**Total estimé** (hors L12) : ~6-7 jours dev focus, sans compter le contenu (copy, photos, brochures) à fournir par le CPFA.

---

## 6. Décisions à confirmer avec le Directeur

1. **Bibliothèque externe vs intégrée** (§3.3 d) : on conserve `/book/index.php` ou on bascule sur la nouvelle plateforme intégrée ? Recommandation : basculer (sinon S3 du scaffold est gaspillé) — en gardant l'URL `/book/...` en redirect le temps de la transition.
2. **Statut du job board** (§3.6.2) : qui peut publier une offre ? N'importe quelle entreprise (avec captcha + modération admin) OU uniquement entreprises pré-inscrites ?
3. **Gating concours diplômes** (§Important) : critère de période. Une date d'ouverture + clôture par formation suffit, ou il faut aussi un statut « brouillon / publié / archivé » ?
4. **Onglet « Recherche »** (§1.1) : icône loupe ou onglet visible ? Doit-il chercher dans la biblio + formations + actualités OU uniquement dans le contenu éditorial ?
5. **Témoignages** : avec photo ? Anonymisation possible ? Validation modérée par admin avant affichage public ?
6. **Email transactionnel** : `RESEND_API_KEY` à fournir + nom de domaine `cpfa-sn.com` à vérifier sur Resend (ou alternative).
7. **PayTech** : compte à créer, contrat marchand à signer, `PAYTECH_API_KEY` + `PAYTECH_API_SECRET` à fournir.
8. **Hébergement** (§10.1 du projet.md, encore ouvert) : Vercel + Neon (option A) ou VPS Sénégal (option B) ?

---

## 7. Contenu éditorial à collecter du CPFA

| Item | Format | Pour |
|---|---|---|
| Brochure CPFA globale | PDF | Bloc « Qui sommes-nous » + footer |
| Photo institutionnelle hero (livres + parapluie + icônes) | JPG/PNG/WebP | Hero accueil |
| Nouvelle photo Directeur | JPG/PNG | Mot du directeur |
| Charte de l'enseignant | PDF | `/enseigner-au-cpfa` |
| Règlement intérieur bibliothèque | PDF | Bloc bibliothèque |
| Procédure d'abonnement + fiche | PDF | Bloc bibliothèque |
| Brochure par formation (DTA, BTS, certifs, séminaires) | PDF | Fiche formation |
| Logos PF2E, PNUD, Cabinet CASAI | PNG transparent | Footer |
| URLs réseaux sociaux | Texte | Footer |
| Témoignages initiaux (étudiants, profs, pros, partenaires) | Texte + photo optionnelle | Carrousel + page Espace Apprenants |
| Liste réelle des certifications spécialisées (titres, durées, prix, dates) | Texte structuré | Catalogue certifs |
| Liste réelle des séminaires + dates | Texte structuré | Catalogue séminaires |

---

## Annexe — modules déjà solides dans le scaffold (à mettre en valeur)

- ✅ Auth.js v5 + magic link via Resend + RBAC 9 rôles
- ✅ tRPC end-to-end type-safe avec Zod
- ✅ Bibliothèque : catalogue, recherche FTS, prêts, QR codes, carte PDF, rappels cron
- ✅ Formations : catalogue, sessions, inscriptions, convocation PDF
- ✅ Concours : avis, candidatures, banque d'épreuves (PUBLIC/REGISTERED/PAID)
- ✅ Paiements : PayTech (Wave/Orange Money/Free/Visa/Mastercard) + static-QR fallback + IPN HMAC + audit
- ✅ Espace formateurs : candidature, dashboard, planning, ressources pédagogiques (peut être adapté pour §2)
- ✅ CMS : Pages + Articles (block editor avec image/quote/list) + Médiathèque + SiteSettings locale-aware
- ✅ Multilingue FR + EN (cookie-driven, fallback FR systématique)
- ✅ Admin : audit log immuable, exports CSV, dashboard KPIs, gestion users
- ✅ Worker BullMQ : email, PDF, rappels prêts, webhooks paiement
- ✅ Tests Vitest 52/52 + Playwright e2e skeleton
- ✅ Production : Dockerfile multi-stage (web + worker + migrate), docker-compose.prod.yml, healthcheck DB+Redis, backup script age+S3
