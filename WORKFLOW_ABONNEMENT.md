# Workflow d'Abonnement Bibliothèque CPFA
## Guide complet du processus de validation manuelle (paiement hors ligne)

**Version:** 1.0.0
**Date:** 2025-10-10
**Mode de paiement:** Hors ligne avec QR codes statiques Wave et Orange Money

---

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Prérequis techniques](#prérequis-techniques)
3. [Workflow côté utilisateur](#workflow-côté-utilisateur)
4. [Workflow côté admin](#workflow-côté-admin)
5. [Statuts et transitions](#statuts-et-transitions)
6. [Templates d'emails](#templates-demails)
7. [Intégrations plugins](#intégrations-plugins)
8. [Scénarios d'erreur](#scénarios-derreur)
9. [Configuration initiale](#configuration-initiale)
10. [Diagrammes de flux](#diagrammes-de-flux)

---

## Vue d'ensemble

Le système d'abonnement bibliothèque CPFA fonctionne en **mode hors ligne** : les utilisateurs effectuent leur paiement via Wave ou Orange Money en scannant un QR code statique, puis un administrateur valide manuellement la préinscription après avoir vérifié la réception du paiement.

### Principes fondamentaux

- **Aucun webhook automatique** : pas d'intégration API avec Wave/Orange Money
- **Validation manuelle obligatoire** : un humain vérifie chaque paiement
- **QR codes statiques** : configurés une seule fois dans WordPress
- **Traçabilité complète** : chaque action est enregistrée avec timestamp et auteur
- **Génération automatique de carte** : dès validation, le PDF est créé et envoyé

### Types d'abonnements

| Type | Prix | Caution | Total | Durée |
|------|------|---------|-------|-------|
| **Étudiant** | 10 000 FCFA | - | 10 000 FCFA | 1 an |
| **Professionnel** | 15 000 FCFA | - | 15 000 FCFA | 1 an |
| **Emprunt domicile** | 15 000 FCFA | 35 000 FCFA | 50 000 FCFA | 1 an |

**Note** : La caution de 35 000 FCFA pour l'emprunt domicile est remboursable si le livre est retourné en bon état.

---

## Prérequis techniques

### Plugin 1: CPFA Core Manager

- ✅ **CPT `cpfa_abonnement`** avec meta boxes :
  - `_cpfa_abonnement_nom` (text)
  - `_cpfa_abonnement_prenom` (text)
  - `_cpfa_abonnement_email` (email)
  - `_cpfa_abonnement_telephone` (text)
  - `_cpfa_abonnement_type` (select: etudiant, professionnel, emprunt_domicile)
  - `_cpfa_abonnement_photo` (file upload)
  - `_cpfa_abonnement_cni` (file upload)
  - `_cpfa_abonnement_statut` (select: awaiting_validation, active, rejected, expired, suspended, ended)
  - `_cpfa_abonnement_montant` (number)
  - `_cpfa_abonnement_date_debut` (date)
  - `_cpfa_abonnement_date_fin` (date)
  - `_cpfa_abonnement_transaction_ref` (text)
  - `_cpfa_abonnement_gateway` (text: wave, orange_money)
  - `_cpfa_abonnement_motif_rejet` (textarea)
  - `_cpfa_abonnement_numero_carte` (text auto-généré)

- ✅ **Service QR Code** : `Cpfa\Core\Services\QR_Service`
- ✅ **Service Notifications** : `Cpfa\Core\Services\Notification_Service`

### Plugin 2: CPFA Forms & Registrations

- 🔄 **Formulaire d'abonnement** (Gravity Forms ou Forminator)
- 🔄 **Page admin : Préinscriptions en attente**
- 🔄 **AJAX handlers** : validation, rejet, demande justificatif
- 🔄 **Templates emails** : 5 templates HTML

### Plugin 3: CPFA PDF Generator

- 🔄 **Template carte membre** : 85.6 × 54mm, recto/verso
- 🔄 **Hook** : écoute `cpfa_abonnement_validated` pour générer PDF
- 🔄 **Storage** : `wp-content/uploads/cpfa-pdf/{année}/{mois}/carte-{ID}.pdf`

---

## Workflow côté utilisateur

### Étape 1 : Accès au formulaire

L'utilisateur accède à la page **Abonnement Bibliothèque** (exemple : `/abonnement-bibliotheque/`)

**Éléments affichés** :
- Titre : "S'abonner à la bibliothèque CPFA"
- Description des types d'abonnements et tarifs
- Formulaire d'inscription

### Étape 2 : Remplissage du formulaire

**Champs obligatoires** :
- Nom
- Prénom
- Email
- Téléphone
- Type d'abonnement (radio: Étudiant / Professionnel / Emprunt domicile)
- Upload photo d'identité (JPG/PNG, max 2MB)
- Upload CNI/passeport (PDF/JPG, max 5MB)
- ☑ J'accepte les conditions d'utilisation
- ☑ Je consens au traitement de mes données (RGPD)

**Validation côté client** :
- Format email correct
- Téléphone au format international (+221...)
- Fichiers dans les formats et tailles autorisés

### Étape 3 : Affichage des options de paiement

Dès que l'utilisateur sélectionne un type d'abonnement, le montant s'affiche dynamiquement.

**Interface de paiement** :
```
┌─────────────────────────────────────────────────────────────┐
│ 💰 MONTANT À PAYER : 15 000 FCFA                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Choisissez votre méthode de paiement :                     │
│                                                             │
│  ┌────────────────────┐    ┌────────────────────┐         │
│  │  📱 WAVE           │    │  🧡 ORANGE MONEY   │         │
│  │  ┌──────────┐      │    │  ┌──────────┐      │         │
│  │  │ [QR CODE]│      │    │  │ [QR CODE]│      │         │
│  │  └──────────┘      │    │  └──────────┘      │         │
│  │  +221 77 123 45 67 │    │  +221 70 987 65 43 │         │
│  │  CPFA Bibliothèque │    │  CPFA Bibliothèque │         │
│  └────────────────────┘    └────────────────────┘         │
│                                                             │
│  INSTRUCTIONS :                                             │
│  1. Scannez le QR code avec votre application mobile       │
│  2. Saisissez le montant : 15 000 FCFA                     │
│  3. Confirmez le paiement                                   │
│  4. Notez la référence de transaction (optionnel)          │
│  5. Cliquez sur "Soumettre ma demande" ci-dessous          │
│                                                             │
│  Référence de transaction (optionnel) : [_______________]  │
│                                                             │
│  [ Soumettre ma demande ]                                   │
└─────────────────────────────────────────────────────────────┘
```

### Étape 4 : Soumission du formulaire

Après avoir cliqué sur "Soumettre ma demande" :

1. **Validation serveur** (Plugin 2) :
   - Vérification du nonce
   - Sanitization de tous les champs
   - Vérification MIME types des fichiers
   - Vérification des doublons (email existant)

2. **Création de la préinscription** :
   ```php
   $abonnement_id = wp_insert_post([
       'post_type'   => 'cpfa_abonnement',
       'post_title'  => sanitize_text_field($_POST['prenom'] . ' ' . $_POST['nom']),
       'post_status' => 'publish'
   ]);

   update_post_meta($abonnement_id, '_cpfa_abonnement_nom', sanitize_text_field($_POST['nom']));
   update_post_meta($abonnement_id, '_cpfa_abonnement_prenom', sanitize_text_field($_POST['prenom']));
   update_post_meta($abonnement_id, '_cpfa_abonnement_email', sanitize_email($_POST['email']));
   update_post_meta($abonnement_id, '_cpfa_abonnement_telephone', sanitize_text_field($_POST['telephone']));
   update_post_meta($abonnement_id, '_cpfa_abonnement_type', sanitize_key($_POST['type']));
   update_post_meta($abonnement_id, '_cpfa_abonnement_statut', 'awaiting_validation');
   update_post_meta($abonnement_id, '_cpfa_abonnement_montant', intval($_POST['montant']));
   update_post_meta($abonnement_id, '_cpfa_abonnement_transaction_ref', sanitize_text_field($_POST['transaction_ref']));
   update_post_meta($abonnement_id, '_cpfa_abonnement_gateway', sanitize_key($_POST['gateway']));
   update_post_meta($abonnement_id, '_cpfa_abonnement_numero_preinscription', 'PRE-' . date('Ymd') . '-' . str_pad($abonnement_id, 5, '0', STR_PAD_LEFT));

   // Upload des fichiers
   $photo_id = media_handle_upload('photo', $abonnement_id);
   update_post_meta($abonnement_id, '_cpfa_abonnement_photo', $photo_id);

   $cni_id = media_handle_upload('cni', $abonnement_id);
   update_post_meta($abonnement_id, '_cpfa_abonnement_cni', $cni_id);
   ```

3. **Envoi des emails** :
   - Email à l'utilisateur : "Préinscription reçue"
   - Email à l'admin : "Nouvelle préinscription à valider"

4. **Message de confirmation** :
   ```
   ✅ Votre demande a bien été enregistrée !

   Numéro de préinscription : PRE-20251010-00042

   Vous allez recevoir un email de confirmation à l'adresse : user@example.com

   Votre abonnement sera activé sous 24-48h ouvrées après vérification de votre paiement.

   Vous recevrez votre carte membre par email dès validation.
   ```

### Étape 5 : Attente de validation

L'utilisateur reçoit l'**Email 1 : Préinscription reçue** dans sa boîte mail.

**Ce qu'il peut faire** :
- Vérifier ses spams si email non reçu
- Répondre à l'email avec la référence de transaction si demandée
- Contacter l'admin pour toute question

**Délai d'attente** : 24-48h ouvrées (configurable)

### Étape 6a : Validation (scénario positif)

L'utilisateur reçoit l'**Email 3 : Abonnement validé** avec :
- Confirmation d'activation
- Numéro de carte membre
- Dates de validité
- **Carte membre PDF en pièce jointe** (avec QR code)
- Lien de téléchargement sécurisé

**Actions possibles** :
- Télécharger et imprimer la carte
- Sauvegarder le PDF sur son téléphone
- Se rendre à la bibliothèque avec la carte (papier ou mobile)

### Étape 6b : Rejet (scénario négatif)

L'utilisateur reçoit l'**Email 4 : Préinscription rejetée** avec :
- Motif du rejet (paiement non reçu, montant incorrect, photo illisible, etc.)
- Détails additionnels
- Instructions pour régulariser
- Contact de l'admin

**Actions possibles** :
- Fournir un justificatif de paiement
- Soumettre une nouvelle demande avec les corrections

---

## Workflow côté admin

### Étape 1 : Réception de la notification

L'administrateur reçoit un **Email 2 : Nouvelle préinscription à valider** contenant :
- Nom, prénom, type, montant
- Email et téléphone du demandeur
- **Lien direct** vers la page de validation dans WordPress

### Étape 2 : Accès à l'interface de validation

L'admin se connecte à WordPress et accède à **CPFA > Préinscriptions en attente**

**Interface liste** :

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ CPFA - Préinscriptions en attente                                            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Filtres : [Tous types ▼]  [Tous statuts ▼]  [Rechercher...]  [Filtrer]   │
│                                                                              │
│  ┌────┬──────────────┬─────────────┬────────┬────────────┬─────────────┐   │
│  │ #  │ Nom          │ Type        │ Montant│ Date       │ Actions     │   │
│  ├────┼──────────────┼─────────────┼────────┼────────────┼─────────────┤   │
│  │ 42 │ Jean Dupont  │ Pro         │ 15,000 │ 10/10/2025 │ 👁️ ✅ ❌ 🔄 │   │
│  │    │ jean@mail.sn │             │ FCFA   │ 14:32      │             │   │
│  │    │ +221771234567│             │        │ 🟡 En att. │             │   │
│  ├────┼──────────────┼─────────────┼────────┼────────────┼─────────────┤   │
│  │ 41 │ Fatou Sow    │ Étudiant    │ 10,000 │ 09/10/2025 │ 👁️ ✅ ❌ 🔄 │   │
│  │    │ fatou@etu.sn │             │ FCFA   │ 09:15      │             │   │
│  │    │ +221769876543│             │        │ 🟡 En att. │             │   │
│  └────┴──────────────┴─────────────┴────────┴────────────┴─────────────┘   │
│                                                                              │
│  Légende : 👁️ Voir détails | ✅ Valider | ❌ Rejeter | 🔄 Demander justif. │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Étape 3a : Consulter les détails (clic sur 👁️)

**Modal "Détails de la préinscription"** :

```
┌─────────────────────────────────────────────────────────────────┐
│ Détails de la préinscription #PRE-20251010-00042               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ INFORMATIONS PERSONNELLES                                       │
│ Nom complet : Jean Dupont                                       │
│ Email       : jean@mail.sn                                      │
│ Téléphone   : +221 77 123 45 67                                 │
│                                                                 │
│ ABONNEMENT                                                      │
│ Type        : Professionnel                                     │
│ Montant     : 15 000 FCFA                                       │
│ Date demande: 10/10/2025 à 14:32                                │
│                                                                 │
│ PAIEMENT                                                        │
│ Gateway     : Wave                                              │
│ Réf. fournie: (aucune)                                          │
│                                                                 │
│ PIÈCES JOINTES                                                  │
│ Photo       : [Voir] [Télécharger]                             │
│               ┌──────────┐                                      │
│               │  [Photo] │                                      │
│               └──────────┘                                      │
│                                                                 │
│ CNI         : [Voir PDF] [Télécharger]                         │
│                                                                 │
│ HISTORIQUE                                                      │
│ • 10/10/2025 14:32 - Préinscription créée                       │
│                                                                 │
│ [Fermer]  [Valider]  [Rejeter]  [Demander justificatif]        │
└─────────────────────────────────────────────────────────────────┘
```

### Étape 3b : Vérifier le paiement (hors WordPress)

L'admin ouvre son **application Wave** ou **Orange Money** sur son téléphone ou son interface web :

1. Consulte l'historique des transactions
2. Cherche un paiement de **15 000 FCFA** le **10/10/2025** vers **14:30-14:35**
3. Vérifie l'expéditeur (nom ou numéro correspondant à Jean Dupont / +221771234567)
4. Note la **référence de transaction** (ex: `WAV-20251010-ABCD1234`)

**Scénario 1 : Paiement trouvé** → Passer à l'étape 4a (Validation)
**Scénario 2 : Paiement non trouvé** → Passer à l'étape 4b (Demande justificatif) ou 4c (Rejet)

### Étape 4a : Validation (clic sur ✅)

**Modal "Valider la préinscription"** :

```
┌─────────────────────────────────────────┐
│ Valider la préinscription               │
├─────────────────────────────────────────┤
│ Nom: Jean Dupont                        │
│ Type: Professionnel (15,000 FCFA)      │
│                                         │
│ Référence de transaction: [WAV-20251010-ABCD1234] │
│ Gateway: ○ Wave  ● Orange Money        │
│                                         │
│ Date de début: [11/10/2025]            │
│ Date de fin:   [11/10/2026]            │
│                                         │
│ ☑ Générer la carte membre              │
│ ☑ Envoyer email avec carte             │
│                                         │
│ [Annuler]  [Valider l'abonnement]      │
└─────────────────────────────────────────┘
```

**Actions déclenchées par le clic sur "Valider l'abonnement"** :

```php
// 1. Mise à jour du statut
update_post_meta($abonnement_id, '_cpfa_abonnement_statut', 'active');
update_post_meta($abonnement_id, '_cpfa_abonnement_transaction_ref', sanitize_text_field($_POST['transaction_ref']));
update_post_meta($abonnement_id, '_cpfa_abonnement_gateway', sanitize_key($_POST['gateway']));
update_post_meta($abonnement_id, '_cpfa_abonnement_date_debut', sanitize_text_field($_POST['date_debut']));
update_post_meta($abonnement_id, '_cpfa_abonnement_date_fin', sanitize_text_field($_POST['date_fin']));
update_post_meta($abonnement_id, '_cpfa_abonnement_valide_par', get_current_user_id());
update_post_meta($abonnement_id, '_cpfa_abonnement_valide_le', current_time('mysql'));

// 2. Génération du numéro de carte
$numero_carte = 'CPFA-' . date('Y') . '-' . str_pad($abonnement_id, 6, '0', STR_PAD_LEFT);
update_post_meta($abonnement_id, '_cpfa_abonnement_numero_carte', $numero_carte);

// 3. Hook pour générer le PDF (Plugin 3 écoute cet hook)
do_action('cpfa_abonnement_validated', $abonnement_id);

// 4. Envoi de l'email avec PDF en pièce jointe
$carte_pdf_path = get_post_meta($abonnement_id, '_cpfa_carte_pdf', true);
Cpfa\Forms\Notification_Service::send_abonnement_valide_email($abonnement_id, $carte_pdf_path);

// 5. Log dans l'historique
$history = get_post_meta($abonnement_id, '_cpfa_abonnement_historique', true) ?: [];
$history[] = [
    'date'   => current_time('mysql'),
    'action' => 'validated',
    'user'   => get_current_user_id(),
    'data'   => [
        'transaction_ref' => sanitize_text_field($_POST['transaction_ref']),
        'gateway'         => sanitize_key($_POST['gateway'])
    ]
];
update_post_meta($abonnement_id, '_cpfa_abonnement_historique', $history);
```

**Message de succès** :
```
✅ Abonnement validé avec succès !

Carte membre générée : CPFA-2025-000042
Email envoyé à : jean@mail.sn

[Voir la carte] [Fermer]
```

### Étape 4b : Demande de justificatif (clic sur 🔄)

Si le paiement n'est pas trouvé mais que l'admin veut laisser une chance à l'utilisateur :

**Modal "Demander un justificatif"** :

```
┌─────────────────────────────────────────┐
│ Demander un justificatif de paiement   │
├─────────────────────────────────────────┤
│ Nom: Jean Dupont (jean@mail.sn)        │
│                                         │
│ Un email sera envoyé pour demander :   │
│ • Capture d'écran de la transaction     │
│ • Référence de transaction              │
│ • Date et heure du paiement             │
│                                         │
│ Message personnalisé (optionnel) :     │
│ ┌─────────────────────────────────────┐ │
│ │ Nous n'avons pas trouvé votre       │ │
│ │ paiement dans notre historique.     │ │
│ │ Merci de nous transmettre...        │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Annuler]  [Envoyer la demande]         │
└─────────────────────────────────────────┘
```

**Actions déclenchées** :
- Envoi de l'**Email 5 : Justificatif de paiement demandé**
- Ajout d'une note dans l'historique
- Statut reste `awaiting_validation`

### Étape 4c : Rejet (clic sur ❌)

Si le paiement n'est vraiment pas trouvé ou si le dossier est incomplet :

**Modal "Rejeter la préinscription"** :

```
┌─────────────────────────────────────────┐
│ Rejeter la préinscription               │
├─────────────────────────────────────────┤
│ Nom: Jean Dupont                        │
│                                         │
│ Motif du rejet:                         │
│ ┌─────────────────────────────────────┐ │
│ │ ○ Paiement non reçu                 │ │
│ │ ○ Montant incorrect                 │ │
│ │ ○ Photo illisible                   │ │
│ │ ○ Informations incomplètes          │ │
│ │ ● Autre (préciser ci-dessous)       │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Détails: [____________________________] │
│ [Aucun paiement correspondant trouvé   │
│  dans l'historique Wave du 10/10]      │
│                                         │
│ ☑ Envoyer email à l'utilisateur         │
│                                         │
│ [Annuler]  [Confirmer le rejet]         │
└─────────────────────────────────────────┘
```

**Actions déclenchées** :

```php
// 1. Mise à jour du statut
update_post_meta($abonnement_id, '_cpfa_abonnement_statut', 'rejected');
update_post_meta($abonnement_id, '_cpfa_abonnement_motif_rejet', sanitize_text_field($_POST['motif']));
update_post_meta($abonnement_id, '_cpfa_abonnement_details_rejet', sanitize_textarea_field($_POST['details']));
update_post_meta($abonnement_id, '_cpfa_abonnement_rejete_par', get_current_user_id());
update_post_meta($abonnement_id, '_cpfa_abonnement_rejete_le', current_time('mysql'));

// 2. Envoi de l'email
Cpfa\Forms\Notification_Service::send_abonnement_rejete_email($abonnement_id);

// 3. Log dans l'historique
$history = get_post_meta($abonnement_id, '_cpfa_abonnement_historique', true) ?: [];
$history[] = [
    'date'   => current_time('mysql'),
    'action' => 'rejected',
    'user'   => get_current_user_id(),
    'data'   => [
        'motif'   => sanitize_text_field($_POST['motif']),
        'details' => sanitize_textarea_field($_POST['details'])
    ]
];
update_post_meta($abonnement_id, '_cpfa_abonnement_historique', $history);
```

**Message de confirmation** :
```
✅ Préinscription rejetée

Email envoyé à : jean@mail.sn
Motif : Paiement non reçu

[Fermer]
```

---

## Statuts et transitions

### Diagramme d'états

```
                    ┌───────────────────────┐
                    │ FORMULAIRE SOUMIS     │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
            ┌───────┤ awaiting_validation   │◄────────┐
            │       └───────────┬───────────┘         │
            │                   │                     │
            │      ┌────────────┼────────────┐        │
            │      │            │            │        │
            │      ▼            ▼            ▼        │
            │  ┌────────┐  ┌────────┐  ┌─────────┐   │
            │  │rejected│  │ active │  │ expired │   │
            │  └────────┘  └───┬────┘  └─────────┘   │
            │                  │                      │
            │                  ▼                      │
            │            ┌───────────┐                │
            │            │ suspended │────────────────┘
            │            └─────┬─────┘      (pénalités payées)
            │                  │
            │                  ▼
            │            ┌───────────┐
            └───────────►│   ended   │
                         └───────────┘
```

### Description des statuts

| Statut | Description | Actions possibles |
|--------|-------------|-------------------|
| **awaiting_validation** | Préinscription en attente de vérification par l'admin | Valider, Rejeter, Demander justificatif |
| **active** | Abonnement validé et actif, carte générée | Suspendre, Prolonger, Réimprimer carte |
| **rejected** | Préinscription rejetée (paiement non confirmé, dossier incomplet) | Archiver, Supprimer |
| **expired** | Préinscription non validée dans le délai (7 jours par défaut) | Réactiver, Supprimer |
| **suspended** | Abonnement suspendu (ex: pénalités impayées) | Réactiver (après paiement pénalités) |
| **ended** | Période d'abonnement terminée | Renouveler (créer nouvel abonnement) |

### Règles de transition

- `awaiting_validation` → `active` : Admin valide + paiement vérifié
- `awaiting_validation` → `rejected` : Admin rejette (paiement non trouvé, dossier incomplet)
- `awaiting_validation` → `expired` : Cron automatique après 7 jours sans action admin
- `active` → `suspended` : Pénalités d'emprunt impayées
- `active` → `ended` : Date de fin atteinte (cron automatique)
- `suspended` → `active` : Paiement des pénalités confirmé
- `rejected` → `awaiting_validation` : Réactivation manuelle par admin (rare)

---

## Templates d'emails

Voir [cahier_des_charges.md - Templates d'emails](cahier_des_charges.md#templates-demails-pour-le-workflow-dabonnement-paiement-hors-ligne) pour le contenu complet des 5 templates.

### Récapitulatif

| Email | Destinataire | Déclencheur | Pièce jointe |
|-------|--------------|-------------|--------------|
| **1. Préinscription reçue** | Utilisateur | Soumission formulaire | - |
| **2. Nouvelle préinscription** | Admin | Soumission formulaire | - |
| **3. Abonnement validé** | Utilisateur | Admin valide | Carte membre PDF |
| **4. Préinscription rejetée** | Utilisateur | Admin rejette | - |
| **5. Justificatif demandé** | Utilisateur | Admin clique "Demander justificatif" | - |

---

## Intégrations plugins

### Plugin 1 : CPFA Core Manager

**Responsabilités** :
- Fournir le CPT `cpfa_abonnement` avec toutes les meta boxes
- Fournir les services partagés (QR, Notifications)
- Exposer les hooks pour la génération PDF

**Hook à écouter** : Aucun (le Core fournit seulement)

**Hook à déclencher** :
```php
// Déclenché par Plugin 2 lors de la validation
do_action('cpfa_abonnement_validated', $abonnement_id);
```

### Plugin 2 : CPFA Forms & Registrations

**Responsabilités** :
- Créer et gérer le formulaire d'abonnement (Gravity Forms/Forminator)
- Créer la page admin "Préinscriptions en attente"
- Gérer les actions AJAX (valider, rejeter, demander justificatif)
- Envoyer tous les emails
- Déclencher le hook de génération PDF

**Hooks à déclencher** :
```php
// Lors de la validation par l'admin
do_action('cpfa_abonnement_validated', $abonnement_id);

// Lors du rejet
do_action('cpfa_abonnement_rejected', $abonnement_id, $motif, $details);

// Lors de la soumission
do_action('cpfa_abonnement_submitted', $abonnement_id);
```

**Hooks à écouter** :
```php
// Écouter la génération de PDF (Plugin 3 notifie quand c'est fait)
add_action('cpfa_carte_generated', 'cpfa_forms_send_carte_email', 10, 2);
function cpfa_forms_send_carte_email($abonnement_id, $pdf_path) {
    // Envoyer l'email avec le PDF en pièce jointe
}
```

### Plugin 3 : CPFA PDF Generator

**Responsabilités** :
- Écouter le hook `cpfa_abonnement_validated`
- Générer la carte membre PDF (85.6 × 54mm)
- Stocker le PDF dans `wp-content/uploads/cpfa-pdf/{année}/{mois}/`
- Notifier Plugin 2 que la génération est terminée

**Hooks à écouter** :
```php
add_action('cpfa_abonnement_validated', 'cpfa_pdf_generate_carte_membre', 10, 1);
function cpfa_pdf_generate_carte_membre($abonnement_id) {
    // 1. Récupérer les données de l'abonnement
    $nom = get_post_meta($abonnement_id, '_cpfa_abonnement_nom', true);
    $prenom = get_post_meta($abonnement_id, '_cpfa_abonnement_prenom', true);
    $numero_carte = get_post_meta($abonnement_id, '_cpfa_abonnement_numero_carte', true);
    $date_fin = get_post_meta($abonnement_id, '_cpfa_abonnement_date_fin', true);
    $photo_id = get_post_meta($abonnement_id, '_cpfa_abonnement_photo', true);

    // 2. Générer le QR code de vérification
    $token = Cpfa\Core\Services\QR_Service::generate_token($abonnement_id, 'abonnement');
    $verify_url = site_url('/verif/' . $token);
    $qr_png = Cpfa\Core\Services\QR_Service::generate_png($verify_url);

    // 3. Rendre le template HTML
    $html = cpfa_render_template('cards/member-card.php', [
        'nom'          => $nom,
        'prenom'       => $prenom,
        'numero_carte' => $numero_carte,
        'date_fin'     => $date_fin,
        'photo_url'    => wp_get_attachment_url($photo_id),
        'qr_code'      => $qr_png
    ]);

    // 4. Générer le PDF avec mPDF
    $mpdf = new \Mpdf\Mpdf([
        'format' => [85.6, 54], // Format carte bancaire
        'margin_left'   => 0,
        'margin_right'  => 0,
        'margin_top'    => 0,
        'margin_bottom' => 0
    ]);
    $mpdf->WriteHTML($html);

    // 5. Sauvegarder le PDF
    $upload_dir = wp_upload_dir();
    $pdf_dir = $upload_dir['basedir'] . '/cpfa-pdf/' . date('Y') . '/' . date('m');
    wp_mkdir_p($pdf_dir);

    $pdf_filename = 'carte-' . $abonnement_id . '.pdf';
    $pdf_path = $pdf_dir . '/' . $pdf_filename;
    $mpdf->Output($pdf_path, 'F');

    // 6. Stocker le chemin en post meta
    update_post_meta($abonnement_id, '_cpfa_carte_pdf', $pdf_path);
    update_post_meta($abonnement_id, '_cpfa_carte_pdf_url', $upload_dir['baseurl'] . '/cpfa-pdf/' . date('Y') . '/' . date('m') . '/' . $pdf_filename);

    // 7. Notifier Plugin 2 que c'est terminé
    do_action('cpfa_carte_generated', $abonnement_id, $pdf_path);
}
```

**Hooks à déclencher** :
```php
// Quand la carte est générée et sauvegardée
do_action('cpfa_carte_generated', $abonnement_id, $pdf_path);
```

---

## Scénarios d'erreur

### Scénario 1 : Doublons (même email)

**Problème** : Un utilisateur soumet plusieurs fois le formulaire avec le même email.

**Solution** :
```php
// Lors de la soumission, vérifier les doublons
$existing = get_posts([
    'post_type'  => 'cpfa_abonnement',
    'meta_query' => [
        [
            'key'   => '_cpfa_abonnement_email',
            'value' => sanitize_email($_POST['email'])
        ],
        [
            'key'   => '_cpfa_abonnement_statut',
            'value' => ['awaiting_validation', 'active'],
            'compare' => 'IN'
        ]
    ]
]);

if (!empty($existing)) {
    wp_send_json_error([
        'message' => 'Vous avez déjà une demande en cours avec cet email. Numéro : ' . get_post_meta($existing[0]->ID, '_cpfa_abonnement_numero_preinscription', true)
    ]);
}
```

### Scénario 2 : Fichier uploadé corrompu/illisible

**Problème** : La photo ou la CNI est floue, corrompue, ou ne s'ouvre pas.

**Solution** :
- Admin clique sur "Demander justificatif" avec message personnalisé : "Votre photo d'identité est illisible, merci de la soumettre à nouveau"
- Ou admin rejette directement avec motif "Photo illisible"

### Scénario 3 : Paiement effectué mais pas trouvé par l'admin

**Problème** : L'utilisateur a payé mais l'admin ne trouve pas la transaction.

**Solution** :
1. Admin clique sur "Demander justificatif"
2. Utilisateur répond à l'email avec capture d'écran
3. Admin vérifie à nouveau son interface mobile money avec les infos fournies
4. Si confirmé : validation manuelle + saisie de la référence

### Scénario 4 : Montant incorrect payé

**Problème** : L'utilisateur paie 10 000 FCFA au lieu de 15 000 FCFA.

**Solution** :
- Admin rejette avec motif "Montant incorrect"
- Email de rejet précise : "Vous avez payé 10 000 FCFA au lieu de 15 000 FCFA. Merci d'effectuer un paiement complémentaire de 5 000 FCFA."
- Utilisateur peut soumettre une nouvelle demande après paiement complémentaire

### Scénario 5 : Expiration automatique (pas d'action admin sous 7 jours)

**Problème** : L'admin ne traite pas la préinscription dans le délai.

**Solution** :
- Cron job quotidien vérifie les préinscriptions `awaiting_validation` créées il y a plus de 7 jours
- Passe automatiquement en statut `expired`
- Envoie un email à l'utilisateur : "Votre préinscription a expiré faute de validation. Vous pouvez soumettre une nouvelle demande."

```php
add_action('cpfa_daily', 'cpfa_expire_old_preinscriptions');
function cpfa_expire_old_preinscriptions() {
    $expire_after_days = get_option('cpfa_preinscription_expire_days', 7);
    $date_limite = date('Y-m-d H:i:s', strtotime('-' . $expire_after_days . ' days'));

    $old_preinscriptions = get_posts([
        'post_type'      => 'cpfa_abonnement',
        'date_query'     => [
            ['before' => $date_limite]
        ],
        'meta_query'     => [
            [
                'key'   => '_cpfa_abonnement_statut',
                'value' => 'awaiting_validation'
            ]
        ],
        'posts_per_page' => -1
    ]);

    foreach ($old_preinscriptions as $preinscription) {
        update_post_meta($preinscription->ID, '_cpfa_abonnement_statut', 'expired');
        Cpfa\Forms\Notification_Service::send_preinscription_expired_email($preinscription->ID);
    }
}
```

### Scénario 6 : Génération PDF échoue

**Problème** : mPDF rencontre une erreur (manque de mémoire, police manquante, etc.)

**Solution** :
```php
try {
    $mpdf = new \Mpdf\Mpdf(['format' => [85.6, 54]]);
    $mpdf->WriteHTML($html);
    $mpdf->Output($pdf_path, 'F');

    update_post_meta($abonnement_id, '_cpfa_carte_pdf', $pdf_path);
    do_action('cpfa_carte_generated', $abonnement_id, $pdf_path);

} catch (\Mpdf\MpdfException $e) {
    // Logger l'erreur
    error_log('CPFA PDF Generation Error: ' . $e->getMessage());

    // Notifier l'admin
    wp_mail(
        get_option('admin_email'),
        '[CPFA] Erreur génération carte membre',
        'La génération de la carte pour l\'abonnement #' . $abonnement_id . ' a échoué. Erreur : ' . $e->getMessage()
    );

    // Ne pas envoyer l'email à l'utilisateur, marquer pour retry
    update_post_meta($abonnement_id, '_cpfa_carte_generation_failed', true);
}
```

---

## Configuration initiale

### Étape 1 : Activer les 3 plugins

```bash
# Via WP-CLI
wp plugin activate cpfa-core-manager cpfa-forms-registrations cpfa-pdf-generator

# Ou via l'interface WordPress : Extensions > Plugins installés > Activer
```

### Étape 2 : Configurer les QR codes statiques

1. Aller dans **CPFA > Réglages > Paiements**
2. **Section "QR Code Wave"** :
   - Cliquer sur "Téléverser QR Wave"
   - Sélectionner l'image du QR code Wave (fournie par Wave après création du compte marchand)
   - Saisir le numéro Wave : `+221 77 123 45 67`
   - Saisir le nom du compte : `CPFA - Centre de Formation`
3. **Section "QR Code Orange Money"** :
   - Cliquer sur "Téléverser QR Orange Money"
   - Sélectionner l'image du QR code Orange Money
   - Saisir le numéro : `+221 70 987 65 43`
   - Saisir le nom du compte : `CPFA - Centre de Formation`
4. Personnaliser les instructions si nécessaire
5. Définir le délai d'expiration (par défaut : 7 jours)
6. Cliquer sur **Enregistrer les modifications**

### Étape 3 : Configurer les emails

1. Aller dans **CPFA > Réglages > Notifications**
2. Saisir l'email de l'administrateur qui recevra les notifications : `admin@cpfa.sn`
3. Personnaliser les templates d'emails si besoin (logo, couleurs, signature)
4. Configurer l'expéditeur :
   - Nom : `CPFA Bibliothèque`
   - Email : `bibliotheque@cpfa.sn`
5. Cliquer sur **Enregistrer**

### Étape 4 : Créer la page formulaire

1. Créer une nouvelle page : **Pages > Ajouter**
2. Titre : `Abonnement Bibliothèque`
3. Ajouter le shortcode : `[cpfa_abonnement_form]`
4. Ou utiliser Elementor et ajouter le widget "CPFA Registration Form"
5. Publier la page
6. Slug recommandé : `/abonnement-bibliotheque/`

### Étape 5 : Configurer les rôles et capacités

```php
// Donner la capability aux admins et au rôle cpfa_manager
$admin_role = get_role('administrator');
$admin_role->add_cap('manage_cpfa_biblio');

$manager_role = get_role('cpfa_manager');
if ($manager_role) {
    $manager_role->add_cap('manage_cpfa_biblio');
    $manager_role->add_cap('edit_cpfa_abonnements');
    $manager_role->add_cap('validate_cpfa_abonnements');
}
```

### Étape 6 : Tester le workflow complet

1. **Test soumission** :
   - Aller sur `/abonnement-bibliotheque/`
   - Remplir le formulaire avec des données de test
   - Uploader des fichiers de test
   - Soumettre
   - Vérifier l'email de confirmation reçu

2. **Test validation admin** :
   - Se connecter en tant qu'admin
   - Aller dans **CPFA > Préinscriptions en attente**
   - Cliquer sur 👁️ pour voir les détails
   - Cliquer sur ✅ pour valider
   - Saisir une référence de transaction fictive : `TEST-12345`
   - Valider
   - Vérifier que la carte PDF est générée
   - Vérifier l'email reçu avec la carte en pièce jointe

3. **Test rejet** :
   - Créer une autre préinscription
   - Cliquer sur ❌ pour rejeter
   - Sélectionner un motif
   - Vérifier l'email de rejet

---

## Diagrammes de flux

### Flux complet (vue d'ensemble)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         WORKFLOW ABONNEMENT BIBLIOTHÈQUE                    │
└─────────────────────────────────────────────────────────────────────────────┘

UTILISATEUR                           SYSTÈME                       ADMIN
     │                                   │                            │
     │  1. Accède au formulaire          │                            │
     ├──────────────────────────────────►│                            │
     │                                   │                            │
     │  2. Remplit les champs            │                            │
     │     + upload photo/CNI            │                            │
     │                                   │                            │
     │  3. Sélectionne type abonnement   │                            │
     ├──────────────────────────────────►│                            │
     │                                   │  Affiche QR codes          │
     │◄──────────────────────────────────┤  + montant                 │
     │                                   │                            │
     │  4. Scanne QR avec Wave/OM        │                            │
     │     (hors WordPress)              │                            │
     │                                   │                            │
     │  5. Paie via app mobile           │                            │
     │     (ex: 15,000 FCFA)             │                            │
     │                                   │                            │
     │  6. Soumet le formulaire          │                            │
     ├──────────────────────────────────►│                            │
     │                                   │  Crée cpfa_abonnement      │
     │                                   │  Statut: awaiting_validation
     │                                   │                            │
     │◄──────────────────────────────────┤  Email 1: Préinscription   │
     │  "Demande enregistrée"            │         reçue              │
     │  Email de confirmation            │                            │
     │                                   │                            │
     │                                   ├───────────────────────────►│
     │                                   │  Email 2: Nouvelle         │
     │                                   │  préinscription à valider  │
     │                                   │                            │
     │                                   │                    7. Ouvre email
     │                                   │                    8. Se connecte WP
     │                                   │                            │
     │                                   │                    9. Va dans
     │                                   │                       "Préinscriptions
     │                                   │                        en attente"
     │                                   │                            │
     │                                   │                    10. Clique 👁️
     │                                   │◄───────────────────────────┤
     │                                   │  Affiche modal détails     │
     │                                   │                            │
     │                                   │                    11. Vérifie paiement
     │                                   │                        dans Wave/OM app
     │                                   │                        (hors WP)
     │                                   │                            │
     │                                   │                    ┌───────┴────────┐
     │                                   │                    │                │
     │                                   │              Trouvé?         Pas trouvé?
     │                                   │                    │                │
     │                                   │                    ▼                ▼
     │                                   │            12a. Clique ✅    12b. Clique ❌
     │                                   │                 Valider           Rejeter
     │                                   │                    │                │
     │                                   │◄───────────────────┤                │
     │                                   │  Saisit réf. trans │                │
     │                                   │  WAV-20251010-ABC  │                │
     │                                   │                    │                │
     │                                   │  Update statut:    │◄───────────────┤
     │                                   │  → active          │  Saisit motif  │
     │                                   │                    │                │
     │                                   │  Hook: cpfa_       │  Update statut:│
     │                                   │  abonnement_       │  → rejected    │
     │                                   │  validated         │                │
     │                                   │        │           │                │
     │                                   │        ▼           │                │
     │                                   │  Plugin 3 écoute   │                │
     │                                   │  → Génère PDF      │                │
     │                                   │  → Carte membre    │                │
     │                                   │        │           │                │
     │                                   │        ▼           │                │
     │                                   │  Hook: cpfa_       │                │
     │                                   │  carte_generated   │                │
     │                                   │        │           │                │
     │                                   │        ▼           │        ▼       │
     │◄──────────────────────────────────┤  Email 3:          │   Email 4:    │
     │  Email avec carte PDF             │  Abonnement        │   Préinscription
     │  CPFA-2025-000042.pdf             │  validé            │   rejetée     │
     │                                   │                    │                │
     ▼                                   ▼                    ▼                ▼
✅ Peut utiliser la bibliothèque      Workflow terminé    ❌ Doit soumettre  Workflow terminé
   avec carte membre                                         nouvelle demande
```

### Flux de validation détaillé (côté admin)

```
ADMIN OUVRE "PRÉINSCRIPTIONS EN ATTENTE"
              │
              ▼
      ┌───────────────┐
      │ LISTE AFFICHÉE│
      │ Filtres dispo │
      └───────┬───────┘
              │
    ┌─────────┴─────────┐
    │                   │
    ▼                   ▼
CLIQUE 👁️           ACTIONS RAPIDES
Voir détails
    │
    ▼
┌─────────────────────────────────────┐
│ MODAL DÉTAILS                       │
│ • Nom, email, tel                   │
│ • Type, montant                     │
│ • Pièces jointes (photo, CNI)      │
│ • Réf. transaction si fournie      │
│ • Historique                        │
└─────────┬───────────────────────────┘
          │
    ┌─────┴─────┐
    │           │
    ▼           ▼
VALIDER      REJETER       DEMANDER JUSTIF.
  ✅           ❌                🔄
    │           │                │
    ▼           ▼                ▼
┌───────┐   ┌────────┐     ┌──────────┐
│ MODAL │   │ MODAL  │     │  MODAL   │
│ Saisir│   │Sélect. │     │ Message  │
│ réf.  │   │ motif  │     │ perso    │
│trans. │   │ rejet  │     │          │
└───┬───┘   └────┬───┘     └─────┬────┘
    │            │                │
    ▼            ▼                ▼
SOUMET       SOUMET           SOUMET
    │            │                │
    ▼            ▼                ▼
UPDATE       UPDATE           EMAIL
statut:      statut:          envoyé
active       rejected         (justif.)
    │            │                │
    ▼            │                │
HOOK             │                │
cpfa_            │                │
abonnement_      │                │
validated        │                │
    │            │                │
    ▼            │                │
PLUGIN 3         │                │
génère           │                │
carte PDF        │                │
    │            │                │
    ▼            ▼                ▼
EMAIL 3      EMAIL 4          Statut reste
(carte)      (rejet)          awaiting_validation
    │            │                │
    ▼            ▼                ▼
  ✅ FIN       ❌ FIN          Attente réponse
                                utilisateur
```

---

## Annexes

### A. Checklist de développement

#### Plugin 1 : CPFA Core Manager
- [x] CPT `cpfa_abonnement` créé
- [x] Meta boxes pour tous les champs
- [x] Service QR_Service opérationnel
- [x] Service Notification_Service opérationnel
- [ ] Hook `cpfa_abonnement_validated` documenté

#### Plugin 2 : CPFA Forms & Registrations
- [ ] Formulaire Gravity Forms/Forminator créé
- [ ] Shortcode `[cpfa_abonnement_form]` fonctionnel
- [ ] Widget Elementor "CPFA Registration Form"
- [ ] Page admin "Préinscriptions en attente"
- [ ] AJAX handler : valider
- [ ] AJAX handler : rejeter
- [ ] AJAX handler : demander justificatif
- [ ] Template email 1 : Préinscription reçue
- [ ] Template email 2 : Nouvelle préinscription (admin)
- [ ] Template email 3 : Abonnement validé
- [ ] Template email 4 : Préinscription rejetée
- [ ] Template email 5 : Justificatif demandé
- [ ] Vérification doublons email
- [ ] Upload fichiers sécurisé (MIME type)
- [ ] Cron : expiration automatique après 7 jours

#### Plugin 3 : CPFA PDF Generator
- [ ] Template HTML carte membre (85.6 × 54mm)
- [ ] Hook listener : `cpfa_abonnement_validated`
- [ ] Génération PDF avec mPDF
- [ ] Intégration QR code sur la carte
- [ ] Stockage dans wp-content/uploads/cpfa-pdf/
- [ ] Hook déclenché : `cpfa_carte_generated`
- [ ] Gestion des erreurs (try/catch)

#### Configuration système
- [ ] Page réglages "Paiements" avec upload QR codes
- [ ] Page réglages "Notifications" avec config emails
- [ ] Page formulaire créée et publiée
- [ ] Rôle `cpfa_manager` avec capabilities
- [ ] Tests E2E complets

### B. Variables PHP importantes

```php
// Meta keys pour cpfa_abonnement
$meta_keys = [
    '_cpfa_abonnement_nom',
    '_cpfa_abonnement_prenom',
    '_cpfa_abonnement_email',
    '_cpfa_abonnement_telephone',
    '_cpfa_abonnement_type', // etudiant | professionnel | emprunt_domicile
    '_cpfa_abonnement_photo', // attachment ID
    '_cpfa_abonnement_cni', // attachment ID
    '_cpfa_abonnement_statut', // awaiting_validation | active | rejected | expired | suspended | ended
    '_cpfa_abonnement_montant', // int
    '_cpfa_abonnement_date_debut', // Y-m-d
    '_cpfa_abonnement_date_fin', // Y-m-d
    '_cpfa_abonnement_transaction_ref', // string
    '_cpfa_abonnement_gateway', // wave | orange_money
    '_cpfa_abonnement_motif_rejet', // string
    '_cpfa_abonnement_details_rejet', // string
    '_cpfa_abonnement_numero_preinscription', // PRE-20251010-00042
    '_cpfa_abonnement_numero_carte', // CPFA-2025-000042
    '_cpfa_carte_pdf', // absolute path
    '_cpfa_carte_pdf_url', // URL publique
    '_cpfa_abonnement_valide_par', // user ID
    '_cpfa_abonnement_valide_le', // mysql datetime
    '_cpfa_abonnement_rejete_par', // user ID
    '_cpfa_abonnement_rejete_le', // mysql datetime
    '_cpfa_abonnement_historique', // array serialized
];

// Options WordPress
$options = [
    'cpfa_wave_qr_url',
    'cpfa_wave_number',
    'cpfa_wave_account_name',
    'cpfa_om_qr_url',
    'cpfa_om_number',
    'cpfa_om_account_name',
    'cpfa_payment_instructions',
    'cpfa_preinscription_expire_days', // default: 7
    'cpfa_admin_email',
    'cpfa_email_from_name', // "CPFA Bibliothèque"
    'cpfa_email_from_address', // "bibliotheque@cpfa.sn"
];
```

### C. Endpoints REST (futurs)

```php
// Soumettre une préinscription via API (optionnel)
POST /wp-json/cpfa/v1/abonnements
Body: {
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean@mail.sn",
    "telephone": "+221771234567",
    "type": "professionnel",
    "transaction_ref": "WAV-123",
    "gateway": "wave"
}

// Vérifier le statut d'une préinscription
GET /wp-json/cpfa/v1/abonnements/{id}/status
Response: {
    "statut": "awaiting_validation",
    "numero_preinscription": "PRE-20251010-00042",
    "date_soumission": "2025-10-10 14:32:00"
}

// Télécharger la carte (lien sécurisé avec nonce)
GET /cpfa/download-carte?id={abonnement_id}&nonce={nonce}
Response: PDF file download
```

---

## Résumé exécutif

**Workflow en 5 étapes** :

1. **Utilisateur remplit le formulaire** → Scanne QR Wave/Orange Money → Paie via app mobile → Soumet
2. **Système crée préinscription** → Statut `awaiting_validation` → Envoie emails (user + admin)
3. **Admin vérifie le paiement** → Consulte son app Wave/Orange Money (hors WordPress)
4. **Admin valide ou rejette** → Saisit référence transaction → Valide dans WordPress
5. **Système génère carte PDF** → Envoie email avec carte → Utilisateur peut utiliser bibliothèque

**Durée estimée du workflow** : 24-48h ouvrées

**Points clés** :
- ✅ Aucune intégration API automatique
- ✅ Validation 100% manuelle par humain
- ✅ QR codes statiques configurés une seule fois
- ✅ Traçabilité complète de chaque action
- ✅ Génération automatique de carte après validation

**Prochaines étapes de développement** :
1. Développer le formulaire dans Plugin 2
2. Créer l'interface admin de validation dans Plugin 2
3. Implémenter les templates d'emails dans Plugin 2
4. Créer le template de carte membre dans Plugin 3
5. Intégrer les 3 plugins ensemble
6. Tests E2E complets

---

**Document créé le** : 2025-10-10
**Auteur** : CPFA Development Team
**Version** : 1.0.0
**Statut** : Spécifications complètes - Prêt pour implémentation
