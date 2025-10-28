# 📋 Formulaires Disponibles - CPFA

## Vue d'Ensemble

Le système CPFA dispose d'**1 formulaire principal** situé dans le plugin `cpfa-forms-registrations`.

---

## 📝 Formulaire d'Abonnement Bibliothèque

### Informations Générales

| Propriété | Valeur |
|-----------|--------|
| **Nom** | Formulaire d'Abonnement Bibliothèque |
| **Shortcode** | `[cpfa_abonnement_form]` |
| **Classe** | `Cpfa\Forms\Abonnement_Form` |
| **Fichier** | [cpfa-forms-registrations/includes/forms/class-abonnement-form.php](cpfa-forms-registrations/includes/forms/class-abonnement-form.php) |
| **Plugin** | CPFA Forms & Registrations |
| **Version** | 1.0.0 |

### Fonctionnalités

#### Sections du Formulaire

1. **Informations Personnelles**
   - Nom (requis)
   - Prénom (requis)
   - Email (requis)
   - Téléphone (requis)

2. **Type d'Abonnement**
   - Étudiant (prix configurable)
   - Professionnel (prix configurable)
   - Emprunt à domicile (prix + caution configurable)
   - Affichage dynamique du montant

3. **Documents Requis**
   - Photo d'identité (JPG/PNG, max 2 MB)
   - Copie CNI (PDF/JPG/PNG, max 5 MB)

4. **Paiement**
   - Support Wave (QR code + numéro + nom)
   - Support Orange Money (QR code + numéro + nom)
   - Configuration flexible (Wave seul, OM seul, ou les deux)
   - Référence de transaction optionnelle

5. **RGPD**
   - Consentement collecte de données (requis)
   - Autorisation utilisation photo (requis)

### Paramètres du Shortcode

```php
[cpfa_abonnement_form
    title="Formulaire d'abonnement bibliothèque"
    show_title="yes"
]
```

| Attribut | Type | Défaut | Description |
|----------|------|--------|-------------|
| `title` | string | "Formulaire d'abonnement bibliothèque" | Titre du formulaire |
| `show_title` | yes/no | yes | Afficher le titre |

### Assets

**CSS:**
- [frontend.css](cpfa-forms-registrations/assets/css/frontend.css) (6.3 KB) - Styles formulaire
- [admin.css](cpfa-forms-registrations/assets/css/admin.css) (5.4 KB) - Styles backend

**JavaScript:**
- [frontend.js](cpfa-forms-registrations/assets/js/frontend.js) (6.3 KB) - Logique formulaire
- [admin.js](cpfa-forms-registrations/assets/js/admin.js) (10 KB) - Validation admin

### Handlers

**Soumission:**
- Classe: `Cpfa\Forms\Form_Handler`
- Fichier: [class-form-handler.php](cpfa-forms-registrations/includes/forms/class-form-handler.php)
- Action AJAX: `cpfa_submit_abonnement`
- Méthode: POST
- Validation: Nonce `cpfa_submit_abonnement`

**Validation Admin:**
- Classe: `Cpfa\Forms\Admin\Ajax_Handlers`
- Fichier: [class-ajax-handlers.php](cpfa-forms-registrations/includes/admin/class-ajax-handlers.php)
- Action AJAX: `cpfa_validate_abonnement`

### Workflow

```
1. Utilisateur remplit le formulaire
   ↓
2. Upload des fichiers (photo + CNI)
   ↓
3. Validation côté client (frontend.js)
   ↓
4. Soumission AJAX (Form_Handler)
   ↓
5. Création post_type 'cpfa_abonnement' (statut: awaiting_validation)
   ↓
6. Envoi emails (utilisateur + admin)
   ↓
7. Génération numéro préinscription (PRE-YYYYMMDD-XXXXX)
   ↓
8. Admin valide/rejette via interface dédiée
   ↓
9. Si validé: statut → 'actif' + génération carte
   ↓
10. Notification utilisateur
```

---

## 🔧 Dépendances

### Plugin Requis
- **CPFA Core Manager** (v1.0.0+)
  - Post types: `cpfa_abonnement`
  - Services de notification
  - Gestion des emprunts

### Services Utilisés

1. **Payment_Config_Service**
   - Fichier: [class-payment-config-service.php](cpfa-forms-registrations/includes/services/class-payment-config-service.php)
   - Fonction: Configuration des prix et moyens de paiement
   - Options WordPress:
     - `cpfa_wave_qr_url`
     - `cpfa_wave_number`
     - `cpfa_wave_account_name`
     - `cpfa_om_qr_url`
     - `cpfa_om_number`
     - `cpfa_om_account_name`
     - `cpfa_payment_instructions`
     - `cpfa_abonnement_etudiant_price`
     - `cpfa_abonnement_professionnel_price`
     - `cpfa_abonnement_emprunt_domicile_price`

2. **Notification_Service** (CPFA Core)
   - Emails automatiques
   - Templates personnalisables

### Technologies
- WordPress 6.0+
- PHP 8.0+
- AJAX (wp_ajax)
- File Upload API
- Custom Post Types

---

## 📤 Exportabilité

### ✅ Hautement Exportable

Ce formulaire est **très facilement exportable** vers d'autres projets WordPress avec adaptations minimales.

### Fichiers à Exporter

#### **Core (Obligatoire)**
```
cpfa-forms-registrations/
├── cpfa-forms-registrations.php         # Plugin principal
├── includes/
│   ├── forms/
│   │   ├── class-abonnement-form.php    # Rendu formulaire
│   │   └── class-form-handler.php       # Traitement soumission
│   ├── services/
│   │   └── class-payment-config-service.php  # Config paiement
│   └── admin/
│       └── class-ajax-handlers.php      # Validation admin
├── assets/
│   ├── css/
│   │   ├── frontend.css                 # Styles formulaire
│   │   └── admin.css                    # Styles admin
│   └── js/
│       ├── frontend.js                  # Logique formulaire
│       └── admin.js                     # Scripts admin
└── languages/                            # i18n
```

#### **Configuration (Recommandé)**
- Page de configuration des prix
- Page de configuration des QR codes
- Templates d'emails

### Adaptations Nécessaires

#### 1. **Personnalisation du Post Type**

**Actuel:** `cpfa_abonnement`

**À adapter:**
```php
// Dans class-form-handler.php, ligne ~269
$post_data = array(
    'post_type'   => 'votre_custom_post_type',  // ← Changer ici
    'post_title'  => sprintf( '%s %s', $prenom, $nom ),
    'post_status' => 'draft',  // ou 'pending'
);
```

#### 2. **Personnalisation des Meta Keys**

**Actuel:** Préfixe `_cpfa_abonnement_*`

**À adapter:**
```php
// Rechercher et remplacer dans class-form-handler.php
_cpfa_abonnement_nom           → _votre_prefix_nom
_cpfa_abonnement_prenom        → _votre_prefix_prenom
_cpfa_abonnement_email         → _votre_prefix_email
_cpfa_abonnement_statut        → _votre_prefix_statut
// etc.
```

#### 3. **Personnalisation des Options**

**Actuel:** Préfixe `cpfa_*`

**À adapter dans Payment_Config_Service:**
```php
cpfa_wave_qr_url              → votre_prefix_wave_qr_url
cpfa_abonnement_etudiant_price → votre_prefix_type1_price
// etc.
```

#### 4. **Personnalisation du Text Domain**

**Actuel:** `cpfa-forms`

**Rechercher/remplacer:**
```php
__( 'Texte', 'cpfa-forms' )  →  __( 'Texte', 'votre-domain' )
```

#### 5. **Suppression des Dépendances CPFA Core (Optionnel)**

**Si vous n'utilisez pas CPFA Core Manager:**

```php
// Dans cpfa-forms-registrations.php, supprimer:
private function check_dependencies() {
    // Supprimer cette vérification ou adapter
}
```

**Remplacer les services CPFA Core:**
- `Notification_Service` → Votre système d'emails
- Post type registration → Créer votre propre CPT

### Modifications Recommandées

#### **Pour Usage Générique**

1. **Rendre les Types Configurables**
```php
// Au lieu de hardcoder etudiant/professionnel/emprunt_domicile
$types = get_option( 'your_form_types', [] );
foreach ( $types as $type_key => $type_data ) {
    // Génération dynamique des radio buttons
}
```

2. **Champs Personnalisables**
```php
// Permettre d'ajouter/retirer des champs via admin
$custom_fields = get_option( 'your_custom_fields', [] );
```

3. **Gateway de Paiement Modulaire**
```php
// Support pour d'autres moyens de paiement
// Stripe, PayPal, etc.
```

4. **Hooks d'Extension**
```php
// Avant soumission
do_action( 'your_form_before_submit', $data );

// Après validation
do_action( 'your_form_after_validation', $abonnement_id );
```

### Cas d'Usage Adaptables

✅ **Formulaires d'Inscription:**
- Inscription événements
- Inscription formations
- Inscription clubs/associations

✅ **Formulaires d'Abonnement:**
- Abonnement salles de sport
- Abonnement services
- Abonnement newsletters premium

✅ **Formulaires avec Paiement Offline:**
- Validation manuelle requise
- QR codes multiples
- Upload de justificatifs

✅ **Workflows de Validation:**
- Demandes nécessitant approbation
- Gestion de statuts (en attente, validé, rejeté)
- Notifications automatiques

---

## 🔐 Sécurité Implémentée

- ✅ Nonce verification
- ✅ Capability checks
- ✅ Sanitization inputs (sanitize_text_field, sanitize_email)
- ✅ Validation MIME types uploads
- ✅ Limitation taille fichiers (2 MB photo, 5 MB CNI)
- ✅ Échappement outputs (esc_html, esc_url, esc_attr)
- ✅ CSRF protection

---

## 📊 Statistiques

| Métrique | Valeur |
|----------|--------|
| **Lignes de code PHP** | ~1,500 lignes |
| **Lignes CSS** | ~300 lignes |
| **Lignes JS** | ~400 lignes |
| **Champs formulaire** | 9 champs + 2 uploads + 2 checkboxes |
| **Actions AJAX** | 2 (submit, validate) |
| **Meta keys** | 17 par abonnement |

---

## 🚀 Utilisation

### Installation
```bash
# Copier le plugin
cp -r cpfa-forms-registrations /path/to/wordpress/wp-content/plugins/

# Activer via wp-cli
wp plugin activate cpfa-forms-registrations
```

### Intégration dans une Page
```php
// Via shortcode
[cpfa_abonnement_form]

// Via PHP
<?php echo do_shortcode('[cpfa_abonnement_form]'); ?>
```

### Configuration Requise (WordPress Admin)
1. **Réglages → CPFA Payment Config**
   - Upload QR codes Wave/Orange Money
   - Configurer numéros et noms
   - Définir les prix par type

2. **Réglages → Privacy Policy**
   - Créer page politique de confidentialité
   - Lien auto-généré dans formulaire

---

## 📝 Notes Techniques

### Gestion des Renouvellements
Le formulaire supporte les **renouvellements automatiques**:
- Si email existant avec abonnement expiré → mise à jour
- Si email existant avec abonnement actif → erreur
- Historique conservé dans meta `_cpfa_abonnement_historique`

### Génération Numéro Préinscription
```php
PRE-YYYYMMDD-XXXXX
// Exemple: PRE-20251012-00068
```

### Cache
- Statuts invalidés lors de la validation
- Transient: `cpfa_stats` (durée: 5 minutes)

---

## 🎨 Personnalisation Visuelle

### CSS Classes Principales
```css
.cpfa-abonnement-form-container  /* Container principal */
.cpfa-form                       /* Formulaire */
.cpfa-form-section               /* Section */
.cpfa-form-field                 /* Champ */
.cpfa-radio-group                /* Groupe radio */
.cpfa-payment-methods            /* Méthodes paiement */
.cpfa-qr-code                    /* Image QR code */
.cpfa-submit-button              /* Bouton submit */
```

### Surcharge des Styles
```php
// Dans votre thème
wp_enqueue_style(
    'cpfa-custom-forms',
    get_template_directory_uri() . '/css/cpfa-forms-custom.css',
    array( 'cpfa-frontend-css' )
);
```

---

## ✅ Conclusion

### Exportabilité: **9/10**

**Avantages:**
- ✅ Code modulaire et bien structuré
- ✅ Aucune dépendance externe (composer)
- ✅ PSR-4 autoloading
- ✅ Hooks WordPress standard
- ✅ i18n ready
- ✅ Documentation inline
- ✅ Assets séparés

**Limitations:**
- ⚠️ Dépend de CPFA Core (facilement contournable)
- ⚠️ Post type hardcodé (modification simple)
- ⚠️ Types d'abonnement hardcodés (modification simple)

**Temps d'Adaptation Estimé:**
- Export basique: **1-2 heures**
- Personnalisation complète: **4-6 heures**
- Adaptation avancée (types dynamiques, hooks): **8-12 heures**

---

**Date:** 12 octobre 2025
**Version du document:** 1.0
**Auteur:** Claude Code
