# Manuel utilisateur — CPFA

## Pour les visiteurs

### Découvrir le centre

Site public sur la racine du domaine.

| Page | Chemin |
|---|---|
| Accueil | `/` |
| À propos | `/a-propos` |
| Mot du Directeur | `/mot-du-directeur` |
| Partenaires | `/partenaires` |
| Actualités | `/blog` |
| Contact | `/contact` |

Le formulaire de contact accepte 20 caractères minimum dans le message ; vous recevez la confirmation à l'écran et l'équipe CPFA répond sous 48 h ouvrées.

### S'inscrire à une formation, un séminaire ou un concours

1. Parcourez `/formations`, `/seminaires` ou `/concours`.
2. Sur la fiche, cliquez **S'inscrire** / **Candidater**.
3. À la première inscription, vous serez invité·e à créer un compte (Google ou email + mot de passe).
4. Vous êtes redirigé·e sur **Mes inscriptions** avec :
   - le récapitulatif (objet, date, montant)
   - les instructions de paiement (Wave/OM ou QR statique selon configuration)
   - pour les concours : un emplacement pour téléverser CV, pièce d'identité, diplôme

### Bibliothèque

L'abonnement annuel donne droit à 3 prêts simultanés, durée 14 jours.

1. **Souscrire** : `/me/abonnement` → cliquer **Souscrire**.
2. **Régler** : suivez les instructions (QR statique = paiement à l'accueil, Wave/OM = paiement en ligne).
3. **Activation** : votre carte (`CPFA-XXXXXX-XXXX`) devient active dès que la comptabilité confirme le paiement (≤ 24 h ouvrées).
4. **Carte numérique** : `/me/bibliotheque` → bouton **Télécharger ma carte** (PDF avec QR).
5. **Emprunt** : présentez votre carte (PDF ou impression) à l'accueil. La bibliothécaire scanne le QR de la carte et le QR de l'ouvrage.
6. **Retour** : avant l'échéance pour éviter la pénalité de **500 FCFA / jour de retard**.

### Banque d'épreuves (concours)

`/me/concours/[id]` après inscription :

- Sujets **publics** (PUBLIC) : visibles dès qu'on est connecté.
- Sujets **candidats** (REGISTERED) : visibles dès que vous avez ouvert un dossier.
- Sujets **banque protégée** (PAID) : visibles une fois votre paiement confirmé.

## Pour le personnel CPFA

Espace administrateur sur `/admin`. Connexion requise — chaque rôle a ses entrées de menu.

### Bibliothécaire

- `/admin/loans` — liste des prêts en cours, filtre **Tous** / **En retard**, bouton **Marquer rendu** : calcule la pénalité automatiquement et clôture le prêt.
- `/admin/exams/[id]` — gestion de la banque d'épreuves (upload PDF + niveau d'accès).

### Comptable

- `/admin/payments` — filtre **PENDING** / **CONFIRMED**, bouton **Confirmer** : valide en une transaction le paiement et active l'objet lié (abonnement, inscription).
- `/api/admin/exports/payments.csv` — export Excel/CSV.

### Éditeur

- `/admin/articles` — liste avec **Publier** / **Dépublier**.
- `/admin/cms` — liste des pages CMS, bouton **Nouvelle page**.
- `/admin/cms/[id]` — éditeur de blocs (titre, paragraphe, image), réordonner avec ↑↓, supprimer avec ×, basculer **Publier**.

### Administrateur

Accède à tous les écrans ci-dessus, plus :

- `/admin` — tableau de bord (KPIs, graphique recettes 30 j, activité récente).
- `/admin/registrations` — validation/refus des inscriptions, motif obligatoire pour un refus.
- `/admin/exams` — créer/dépublier les concours.
- `/admin/users` — édition des rôles. *Seul un Super-admin peut accorder ou retirer ADMIN/SUPER_ADMIN.*
- `/admin/audit` — journal complet, filtre par entité.

### Super-admin

Identique à Administrateur, plus la capacité de gérer les rôles privilégiés. Au moins un Super-admin doit toujours exister — la plateforme refuse de retirer le dernier.

## Bonnes pratiques

- **Mot de passe** : 8 caractères minimum (Argon2id côté serveur). Pour les rôles admin, activer le 2FA dès qu'il sera disponible (`User.twoFactorEnabled`).
- **Confirmation comptable** : toujours vérifier le numéro de carte / la référence d'inscription avant de cliquer **Confirmer** — l'action est tracée mais pas annulable en un clic.
- **Banque d'épreuves** : par défaut, classer les sujets en **PAID** (banque protégée). Réserver **PUBLIC** aux sujets d'exemple destinés à la communication.
- **Exports CSV** : le BOM UTF-8 et le séparateur virgule sont compatibles Excel français en double-clic. Pour Google Sheets, choisir « Détecter automatiquement ».
