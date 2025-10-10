# Guide d'installation CPFA WordPress Plugin System

## 📦 Statut du projet

**Plugin 1: CPFA Core Manager - ✅ 100% COMPLET**

Le plugin principal est entièrement fonctionnel avec:
- 20+ fichiers PHP créés
- 6 Custom Post Types avec taxonomies
- Meta boxes natives WordPress (pas de dépendance ACF)
- 3 Services essentiels (QR, Notifications, Paiements)
- REST API complet (7 endpoints)
- Pages Settings avec WordPress Settings API
- 4 Widgets Elementor fonctionnels
- CSS et JavaScript complets

## 🚀 Installation

### Étape 1: Prérequis

```bash
# Versions requises
- WordPress 6.0+
- PHP 8.0+
- MySQL 5.7+
- Composer
```

### Étape 2: Installation des dépendances

```bash
cd /home/youssoupha/project/cpfa
composer install
```

Ceci installera:
- `endroid/qr-code` (génération QR codes)
- `mpdf/mpdf` (génération PDF)
- `phpunit/phpunit` (tests)
- `squizlabs/php_codesniffer` (qualité code)

### Étape 3: Copier dans WordPress

```bash
# Copier le plugin vers WordPress
cp -r cpfa-core-manager /path/to/wordpress/wp-content/plugins/

# Ou créer un lien symbolique
ln -s /home/youssoupha/project/cpfa/cpfa-core-manager /path/to/wordpress/wp-content/plugins/
```

### Étape 4: Activer le plugin

1. Aller dans WordPress Admin > Extensions
2. Activer "CPFA Core Manager"
3. Le plugin créera automatiquement:
   - Le rôle "CPFA Manager"
   - Les 6 Custom Post Types
   - Les tâches cron
   - Les endpoints REST API

### Étape 5: Configuration initiale

1. **Réglages généraux** (CPFA > Réglages généraux):
   - Télécharger le logo
   - Renseigner les coordonnées
   - Configurer l'email expéditeur

2. **Bibliothèque** (CPFA > Bibliothèque):
   - Tarifs déjà configurés par défaut:
     - Étudiant: 10,000 FCFA
     - Professionnel: 15,000 FCFA
     - Emprunt domicile: 50,000 FCFA (caution 35,000)
   - Pénalité: 500 FCFA/jour (dès J+4)
   - Durée emprunt: 30 jours

3. **PDF & QR** (CPFA > PDF & QR):
   - Choisir les couleurs
   - Sélectionner la police

## 📋 Fonctionnalités disponibles

### Custom Post Types créés

1. **Formations** (`/formations`)
   - Champs: Type, Durée, Niveau, Prix, Brochure PDF
   - Taxonomies: Type de formation, Niveau

2. **Séminaires** (`/seminaires`)
   - Champs: Dates, Lieu, Quota, Prix, Affiche
   - Taxonomie: Thématique

3. **Concours** (`/concours`)
   - Champs: Calendrier, Conditions, Pièces requises
   - Taxonomie: Session

4. **Ressources Biblio** (`/catalogue`)
   - Champs: Cote, Auteurs, Mots-clés, Statut prêt
   - Taxonomie: Classe de ressource
   - Option: Exclu du prêt

5. **Abonnements** (admin uniquement)
   - Gestion des membres de la bibliothèque
   - Types: Étudiant / Pro / Emprunt domicile
   - Suivi caution

6. **Emprunts** (admin uniquement)
   - Suivi des prêts
   - Calcul automatique des pénalités
   - Statut retour

### REST API Endpoints

Tous les endpoints sont accessibles via `/wp-json/cpfa/v1/`

| Endpoint | Méthode | Description | Auth |
|----------|---------|-------------|------|
| `/catalogue` | GET | Liste tous les contenus | Public |
| `/formations` | GET | Liste formations | Public |
| `/seminaires` | GET | Liste séminaires | Public |
| `/concours` | GET | Liste concours | Public |
| `/formations/{id}` | GET | Détails formation | Public |
| `/verif/{token}` | GET | Vérification QR | Public |
| `/stats` | GET | Statistiques | Public |

**Exemples d'utilisation:**

```bash
# Liste des formations
curl https://votre-site.com/wp-json/cpfa/v1/formations

# Recherche dans le catalogue
curl https://votre-site.com/wp-json/cpfa/v1/catalogue?search=gestion&per_page=10

# Vérification QR code
curl https://votre-site.com/wp-json/cpfa/v1/verif/abc123def456

# Statistiques
curl https://votre-site.com/wp-json/cpfa/v1/stats
```

### Widgets Elementor

4 widgets disponibles dans Elementor sous "CPFA Widgets":

#### 1. CPFA Catalogue
Affiche formations, séminaires ou concours en grille/liste.

**Options:**
- Type de contenu (tout, formations, séminaires, concours)
- Nombre d'éléments par page
- Mise en page (grille/liste)
- Filtres dynamiques (Ajax)
- Pagination Ajax
- Colonnes responsives

#### 2. CPFA Recherche
Barre de recherche avancée avec filtres.

**Options:**
- Placeholder personnalisable
- Filtres avancés (type, prix, niveau)
- Résultats en temps réel (Ajax)

#### 3. CPFA Statistiques
Compteurs animés pour les statistiques.

**Options:**
- Choix des stats à afficher
- Durée d'animation
- Séparateur de milliers
- Colonnes responsives

#### 4. CPFA Événements à venir
Liste des prochains événements avec compte à rebours.

**Options:**
- Types d'événements
- Nombre d'événements
- Compte à rebours activable
- Lien inscription rapide

### Services disponibles

#### QR Service
```php
use Cpfa\Core\Services\QR_Service;

// Générer QR code PNG
$qr_png = QR_Service::generate_png( 'https://example.com/verify/token123' );

// Générer QR code SVG
$qr_svg = QR_Service::generate_svg( 'https://example.com/verify/token123' );

// Sauvegarder QR code
$file_path = QR_Service::save_to_file( 'https://example.com/verify/token123', 'membre-123', 'png' );

// Générer token de vérification
$token = QR_Service::generate_token( $post_id, 'abonnement' );

// Vérifier token
$result = QR_Service::verify_token( $token );
```

#### Notification Service
```php
use Cpfa\Core\Services\Notification_Service;

// Envoyer email
Notification_Service::send_email(
    'membre@example.com',
    'Confirmation inscription',
    '<p>Votre inscription est confirmée!</p>',
    array( 'template' => 'confirmation' )
);

// Rappel emprunt
Notification_Service::send_loan_reminder( $loan_id, 'upcoming' );

// Expiration abonnement
Notification_Service::send_subscription_expiry_reminder( $subscription_id, 7 );
```

#### Payment Gateway Registry
```php
use Cpfa\Core\Services\Payment_Gateway_Registry;

// Enregistrer une passerelle
Payment_Gateway_Registry::register( new Wave_Gateway() );

// Récupérer une passerelle
$gateway = Payment_Gateway_Registry::get( 'wave' );

// Créer un paiement
$result = $gateway->create_payment([
    'amount' => 10000,
    'currency' => 'XOF',
    'description' => 'Abonnement étudiant'
]);
```

## 🔄 Tâches Cron automatiques

### Quotidiennes (`cpfa_daily`)
- ✅ Rappels emprunts (J-3, J+1, J+4)
- ✅ Vérification abonnements expirés (J-30, J-7, J-1)
- ✅ Calcul pénalités retard (500 FCFA/jour dès J+4)

### Horaires (`cpfa_hourly`)
- ✅ Nettoyage transients expirés

## 📊 Admin UI

### Menu CPFA
Le plugin ajoute un menu principal "CPFA" avec:

1. **Tableau de bord**
   - Statistiques rapides
   - Liens rapides
   - Vue d'ensemble

2. **Sous-menus:**
   - Formations
   - Séminaires
   - Concours
   - Bibliothèque (Ressources)
   - Abonnements
   - Emprunts
   - Réglages généraux
   - Bibliothèque (config)
   - Paiements
   - PDF & QR

## 🧪 Tests et qualité

### Vérifier les standards WordPress
```bash
vendor/bin/phpcs --standard=WordPress cpfa-core-manager/
```

### Tests unitaires (à venir)
```bash
vendor/bin/phpunit
```

### Générer traductions
```bash
wp i18n make-pot cpfa-core-manager cpfa-core-manager/languages/cpfa-core.pot
```

## 🔐 Sécurité

### Bonnes pratiques implémentées:
- ✅ Tous les formulaires utilisent des nonces
- ✅ Vérification des capabilities avant chaque action
- ✅ Sanitisation de tous les inputs (`sanitize_text_field`, etc.)
- ✅ Échappement de tous les outputs (`esc_html`, `esc_attr`, etc.)
- ✅ Requêtes SQL préparées (`$wpdb->prepare`)
- ✅ Validation des webhooks de paiement
- ✅ Tokens de vérification sécurisés

### Rôles et capabilities

**Rôle CPFA Manager** (créé automatiquement):
- Gère toutes les formations, séminaires, concours
- Gère la bibliothèque (ressources, abonnements, emprunts)
- Accès aux réglages CPFA
- Capabilities custom: `manage_cpfa_biblio`, `manage_cpfa_finance`

## 📖 Documentation développeur

### Hooks disponibles

#### Actions
```php
// Événement paiement
do_action( 'cpfa_payment_event', $gateway, $event );

// Rappel emprunt
do_action( 'cpfa_send_loan_reminder', $loan_id, $type );

// Expiration abonnement
do_action( 'cpfa_send_subscription_expiry_reminder', $subscription_id, $days );

// Envoi SMS (placeholder)
do_action( 'cpfa_send_sms', $phone, $message );
```

#### Filtres
```php
// Modifier email destinataire
add_filter( 'cpfa_email_to', function( $to, $args ) {
    return $to;
}, 10, 2 );

// Modifier contenu email
add_filter( 'cpfa_email_message', function( $message, $args ) {
    return $message;
}, 10, 2 );

// Modifier données REST API
add_filter( 'cpfa_rest_prepare_item', function( $data, $post ) {
    return $data;
}, 10, 2 );
```

### Accès aux meta données

```php
// Formations
$type = get_post_meta( $post_id, '_cpfa_formation_type', true );
$duree = get_post_meta( $post_id, '_cpfa_formation_duree', true );
$prix = get_post_meta( $post_id, '_cpfa_formation_prix', true );

// Séminaires
$dates = get_post_meta( $post_id, '_cpfa_seminaire_dates', true );
$lieu = get_post_meta( $post_id, '_cpfa_seminaire_lieu', true );
$quota = get_post_meta( $post_id, '_cpfa_seminaire_quota', true );

// Ressources
$cote = get_post_meta( $post_id, '_cpfa_ressource_cote', true );
$statut = get_post_meta( $post_id, '_cpfa_ressource_statut_pret', true );
$exclu = get_post_meta( $post_id, '_cpfa_ressource_exclu_pret', true );

// Abonnements
$type = get_post_meta( $post_id, '_cpfa_abonnement_type', true );
$statut = get_post_meta( $post_id, '_cpfa_abonnement_statut', true );
$caution = get_post_meta( $post_id, '_cpfa_abonnement_caution', true );

// Emprunts
$date_retour = get_post_meta( $post_id, '_cpfa_emprunt_date_retour_prevue', true );
$penalite = get_post_meta( $post_id, '_cpfa_emprunt_penalite', true );
```

### Accès aux settings

```php
// Général
$logo = get_option( 'cpfa_logo' );
$coordonnees = get_option( 'cpfa_coordonnees' );

// Bibliothèque
$tarif_etudiant = get_option( 'cpfa_library_tarif_etudiant', 10000 );
$penalite_jour = get_option( 'cpfa_library_penalite_jour', 500 );
$duree_emprunt = get_option( 'cpfa_library_duree_emprunt', 30 );

// PDF
$primary_color = get_option( 'cpfa_pdf_primary_color', '#2c5aa0' );
$font_family = get_option( 'cpfa_pdf_font_family', 'dejavusans' );
```

## 🎨 Personnalisation CSS

Les widgets Elementor peuvent être personnalisés via CSS custom:

```css
/* Personnaliser les couleurs */
.cpfa-catalogue-widget {
    --cpfa-primary: #your-color;
    --cpfa-accent: #your-accent;
}

/* Modifier les cartes */
.cpfa-catalogue-item {
    border: 2px solid #ccc;
    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
}

/* Changer le style des boutons */
.cpfa-item-link {
    background: linear-gradient(45deg, #667eea, #764ba2);
    border-radius: 25px;
}
```

## 🐛 Dépannage

### Les CPTs n'apparaissent pas
1. Aller dans Réglages > Permaliens
2. Cliquer sur "Enregistrer les modifications" (flush rewrite rules)

### Les widgets Elementor ne s'affichent pas
1. Vérifier qu'Elementor est installé et activé
2. Vider le cache Elementor
3. Régénérer les fichiers CSS d'Elementor

### Les cron jobs ne s'exécutent pas
1. Installer WP Crontrol pour débugger
2. Vérifier que WP_CRON est activé
3. Ou configurer un vrai cron système:
```bash
* * * * * wget -q -O - https://votre-site.com/wp-cron.php?doing_wp_cron > /dev/null 2>&1
```

### Problèmes de permissions
1. Vérifier que l'utilisateur a le rôle "Administrator" ou "CPFA Manager"
2. Réactiver le plugin pour recréer les capabilities

## 📈 Prochaines étapes

Le Plugin 1 est complet. Pour continuer le développement:

### Plugin 2: CPFA Forms & Registrations
- Intégration Gravity Forms/Forminator
- Passerelles de paiement (Wave, Orange Money, PayDunya)
- Webhooks
- 4 widgets Elementor supplémentaires

### Plugin 3: CPFA PDF Generator
- Génération PDF avec mPDF
- Templates (cartes, reçus, certificats)
- 2 widgets Elementor supplémentaires

## 📞 Support

- Documentation: `CLAUDE.md`
- Spécifications: `cahier_des_charges.md`
- Statut: `PROJECT_STATUS.md`

---

**Version:** 1.0.0
**Date:** 2025-10-09
**Statut:** Plugin 1 - Production Ready ✅
