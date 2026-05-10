# Note de livraison — Plateforme CPFA

À l'attention de **M. El Hadji Cheikhou Oumar SECK, Directeur du CPFA**.
Date : 10 mai 2026.

---

## En bref

La plateforme couvre désormais **l'intégralité des modifications demandées
par la Direction** ([`docs/modofocations _demandees.md`](<modofocations _demandees.md>))
et plusieurs modules anticipant les évolutions §10 du cahier des charges
initial — paiement mobile, bilingue FR/EN, espace formateur, médiathèque
éditoriale.

Tout est testé (64 tests unitaires verts), build de production validé,
migrations DB additives appliquées localement. Reste **les contenus**
(photos, brochures, charte enseignant) à fournir par votre équipe pour
finaliser la mise en ligne.

---

## Réponses aux modifications demandées

### Page d'accueil

**Onglets du menu** (§1.1)

| Demande | Réalisation |
|---|---|
| + Onglet « Actualités et médias » | ✅ Onglet « Actualités » + médiathèque éditoriale `/admin/media` permettant d'illustrer les actualités |
| Renommer « Centre Ressources » → « Espaces Apprenants » | ✅ Nouvelle page `/espace-apprenants` aggregant témoignages + recrutement, lien dans la nav |
| + Onglet « Recherche » | ✅ Champ de recherche dans le top-nav + page `/recherche` qui interroge pages, formations, actualités, livres |

**Hero** (§1.2)

| Demande | Réalisation |
|---|---|
| Phrase d'accroche officielle | ✅ « Premier centre de référence au Sénégal en matière de formation dans les métiers de l'assurance (reconnu par la Direction des Assurances). » |
| Eyebrow « Unité décentralisée IIA Yaoundé » | ✅ |
| Photo de fond institutionnelle | 🟡 Champ `backgroundImageKey` prêt — photo à fournir |
| Nouvelle photo Directeur | 🟡 Image à fournir, médiathèque prête à recevoir |

**Quatre blocs** (§1.3)

| Bloc | Réalisation |
|---|---|
| **a) Qui sommes-nous** | ✅ Bouton « Brochure CPFA » (s'ouvre en nouvel onglet quand uploadée) + bouton « Mot du Directeur » |
| **b) Formation** — 3 colonnes | ✅ Certifications · Diplômes · Séminaires & concours · compteurs réels · état dynamique de la fenêtre concours |
| **c) À venir** | ✅ Fusion sessions + séminaires + concours triés par date |
| **d) Découvrez la bibliothèque** | ✅ Pitch + 3 formules tarifaires (étudiant 10k · pro 15k · emprunt domicile 50k) + boutons Catalogue / S'abonner |

**Formations diplômantes — IMPORTANT (concours)**

| Demande | Réalisation |
|---|---|
| Fermer l'inscription en dehors des périodes de concours | ✅ Page `/admin/courses` permet de fixer les dates d'ouverture/fermeture par formation. Hors période, le bouton candidature est remplacé par « Inscriptions fermées · réouverture le {date} » |
| Réactiver lors des candidatures | ✅ Idem — modifier les dates dans `/admin/courses` |

**Pour chaque formation**

| Demande | Réalisation |
|---|---|
| Brochure de présentation | ✅ Champ `brochureKey` sur `Course` ; uploader via la médiathèque |
| Formulaire d'inscription | ✅ Existait — modale 3 étapes (infos / pièces / paiement) |
| Paiement par QR | ✅ `static-qr` provider + **PayTech** (mobile money + cartes) |
| Reçu auto après paiement | ✅ **Nouveau** : à la confirmation du paiement, le système crée une facture, génère le PDF et l'envoie en pièce jointe au candidat |

**Pied de page** (§1.4)

| Demande | Réalisation |
|---|---|
| Logos PF2E / PNUD / Cabinet CASAI | ✅ Bandeau partenaires en haut du footer ; ces 3 partenaires sont déjà dans la liste par défaut, à compléter avec les vrais logos via `/admin/settings` |
| Réseaux sociaux Facebook / LinkedIn / Instagram | ✅ Pilules dans le footer ; URLs à renseigner dans `/admin/settings` |
| Colonne « Je m'inscris » | ✅ CTA mis en avant en haut du footer → `/formations` |
| Colonne « Posez vos questions » | ✅ CTA mis en avant en haut du footer → `/contact` |

### Onglet « Enseigner au CPFA » (§2)

| Demande | Réalisation |
|---|---|
| Blog « Devenir enseignant » par défaut | ✅ Page `/devenir-formateur` avec pitch + form candidature |
| Téléchargement de la charte enseignant | 🟡 Champ prêt — PDF à fournir et uploader |
| Formulaire de candidature avec CV | ✅ Form authentifié avec upload CV PDF (8 Mo max) |
| Blog « Témoignages » enseignants | ✅ Section témoignages (scope=TEACHER) en bas de la page |

### Onglet « Espaces Apprenants » (§3)

| Demande | Réalisation |
|---|---|
| Blog « Témoignages » multi-parties (étudiants, profs, pros, partenaires) | ✅ 4 scopes gérés via `/admin/testimonials`, affichés sur `/espace-apprenants` |
| Blog « Recrutement » avec choix entre Espace Recruteur et Offres d'emploi | ✅ Deux cartes distinctes sur `/espace-apprenants` |
| **Espace Recruteur** : form de dépôt d'offre | ✅ `/emplois/recruteur` — public, dépôt en brouillon, modération admin |
| Notif email à chaque candidature reçue | ✅ Email auto au recruteur avec coordonnées candidat + lien CV |
| Auto-masquage à la date de clôture | ✅ Logique dans la requête publique |
| **Offres d'emploi** : liste avec filtres | ✅ `/emplois` — filtres type, niveau, localisation + recherche texte |
| Mention « Récente » / « Urgent » | ✅ Badge automatique pour les < 7 jours et flag urgent manuel |
| Form candidature avec CV | ✅ Sidebar sur `/emplois/[id]` |
| Email confirmation au candidat | ✅ |

### Bibliothèque (§1.3 d)

| Demande | Réalisation |
|---|---|
| 3 formules d'abonnement | ✅ Étudiant 10k · Professionnel 15k · Emprunt domicile 50k FCFA/an. Quotas de prêts différenciés (2/3/5 prêts simultanés) |
| Carte de membre PDF | ✅ Existait — généré automatiquement après paiement |
| Recherche / filtres / catalogue | ✅ Existait |
| Règlement intérieur / fiche d'abonnement / procédure (PDFs) | 🟡 PDFs à fournir et uploader |
| Interface admin pour catalogue | ✅ Existait — admin/loans + admin/library |

---

## Modules livrés au-delà de la demande

### Paiement mobile (§10.2 verrouillée)

**PayTech** intégré comme agrégateur unique → couvre Wave, Orange Money,
Free Money, Wizall, Visa, Mastercard avec une seule API. Statut paiement
mis à jour automatiquement via webhook signé HMAC. Plus besoin de gérer
chaque opérateur séparément.

À déclencher : créer un compte sur paytech.sn, demander l'activation prod
par mail à `contact@paytech.sn`, fournir les clés API.

### Site bilingue FR + EN (§10.3 verrouillée)

Toute l'interface (navigation, footer, CTAs, formulaires) est traduite.
Sélecteur FR/EN dans le top-nav et le footer. Les contenus éditoriaux
(pages, articles, témoignages, settings) sont **par langue** : votre
équipe peut publier des versions anglaises sans toucher au code. Les
visiteurs anglophones voient automatiquement la nav en EN ; les contenus
non encore traduits affichent la version française par défaut.

### Espace formateur (§4.6 du cahier des charges)

Module complet pour gérer le réseau d'enseignants :

- Candidature publique avec CV PDF
- Modération depuis `/admin/trainers` (approuver, refuser avec motif,
  email automatique au candidat)
- Espace personnel formateur `/me/formateur` : profil, planning, ressources
  pédagogiques partagées
- Affectation des formateurs aux sessions de cours

### Système éditorial (CMS)

Toute la communication peut être pilotée sans développeur :

- **Pages** (`/admin/cms`) : éditeur de blocs avec titres, paragraphes,
  images, citations, listes
- **Articles** (`/admin/articles`) : même éditeur + image de couverture +
  tags + brouillon/publication
- **Médiathèque** (`/admin/media`) : upload PDF/PNG/JPG avec gestion
  d'alt-text, tous les uploads vont sur stockage privé S3 et sont servis
  via une URL publique sécurisée
- **Paramètres du site** (`/admin/settings`) : 10 réglages typés (hero,
  témoignages, gouvernance, partenaires, footer, etc.) éditables par
  langue
- **Témoignages** (`/admin/testimonials`) : par scope (étudiant /
  enseignant / pro / partenaire) avec ordre d'affichage
- **Job board** (`/admin/jobs`) : modération des offres déposées par les
  recruteurs

---

## Avant la mise en ligne

### À fournir par votre équipe

| Item | Format | Pour |
|---|---|---|
| Photo institutionnelle hero (livres + parapluie + icônes) | JPG/PNG/WebP | Page d'accueil |
| Photo Directeur | JPG/PNG | `/mot-du-directeur` |
| Brochure CPFA globale | PDF | Bloc « Qui sommes-nous » + footer |
| Charte de l'enseignant | PDF | `/devenir-formateur` |
| Règlement intérieur bibliothèque | PDF | Bloc bibliothèque |
| Procédure d'abonnement biblio | PDF | Bloc bibliothèque |
| Brochure par formation (DTA, BTS, certifs, séminaires) | PDF | Fiche formation |
| Logos PF2E / PNUD / Cabinet CASAI | PNG transparent fond clair | Footer |
| URLs des comptes Facebook / LinkedIn / Instagram CPFA | URL | Footer |
| Témoignages initiaux — étudiants, profs, pros, partenaires | Texte + photo optionnelle | Carrousel home + Espace Apprenants |
| Liste des certifications spécialisées (titres, durées, prix) | Texte structuré | Catalogue certifs |
| Calendrier des séminaires + dates | Texte structuré | Catalogue séminaires |

### Décisions à arbitrer

1. **Hébergement** (§10.1) : Vercel + Neon (zéro DevOps) ou VPS Docker
   au Sénégal (souveraineté §10.6) ?
2. **Compte PayTech** : signer le contrat marchand pour activer
   l'environnement de production
3. **Domaine email** : configurer Resend pour `cpfa-sn.com` (envoi des
   reçus, notifications, magic link de connexion)
4. **Migration de l'ancien site** `cpfa-sn.com` : redirections 301 à
   prévoir (ex. `/centre-ressources` → `/espace-apprenants`)
5. **Bibliothèque actuelle** `/book/index.php` : on conserve en parallèle
   ou bascule complète sur la nouvelle plateforme intégrée ?

---

## Les 3 priorités, classées

1. **Fournir les contenus** (PDFs, photos, témoignages, logos) — c'est ce
   qui débloque l'apparence finale
2. **Activer PayTech prod** + Resend email — c'est ce qui débloque le
   paiement réel et les notifications
3. **Choisir l'hébergement** — c'est ce qui débloque la mise en ligne sur
   un domaine définitif

Tout le reste (intégrations, code, migrations, tests) est prêt et testé.

---

## Annexes

- [`CHANGELOG.md`](../CHANGELOG.md) — détail technique exhaustif des 10 lots livrés
- [`docs/analyse-existant-vs-demande.md`](analyse-existant-vs-demande.md)
  — comparaison cpfa-sn.com vs modifications demandées (point de départ)
- [`docs/modofocations _demandees.md`](<modofocations _demandees.md>) — note
  initiale du Directeur
- [`docs/projet.md`](projet.md) — cahier des charges initial
- [`docs/DEPLOYMENT.md`](DEPLOYMENT.md) — instructions de mise en production
- [`docs/RUNBOOK.md`](RUNBOOK.md) — procédures opérationnelles
- [`docs/USER_MANUAL.md`](USER_MANUAL.md) — manuel utilisateur

---

_Préparé par l'équipe technique pour M. SECK, Directeur du CPFA._
