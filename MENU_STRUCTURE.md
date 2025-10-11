# Structure du Menu Admin CPFA

## Organisation

Tous les éléments du menu CPFA sont regroupés sous une seule section "CPFA" dans le menu admin WordPress. Le menu principal pointe vers le **tableau de bord de la bibliothèque** qui affiche les statistiques détaillées (ressources totales, disponibles, abonnés actifs, emprunts en cours, retards, pénalités).

### Hiérarchie du Menu

```
CPFA (menu principal → Gestion Bibliothèque)
├── 📚 Gestion Bibliothèque (tableau de bord avec statistiques)
├── ➕ Emprunter
├── ↩️ Retours
├── 💰 Pénalités
├── [Formations] (Custom Post Types de WordPress)
├── [Séminaires] (Custom Post Types de WordPress)
├── [Concours] (Custom Post Types de WordPress)
├── [Ressources] (Custom Post Types de WordPress)
├── [Abonnements] (Custom Post Types de WordPress)
├── [Emprunts] (Custom Post Types de WordPress)
├── 📋 Préinscriptions
├── ⚙️ Réglages généraux
├── 📚 Réglages Bibliothèque
├── 💳 Réglages Paiements (Core)
├── 💳 Réglages Paiements (Forms)
└── 📄 PDF & QR
```

## Priorités des Hooks

Pour contrôler l'ordre d'apparition des éléments dans le menu, nous utilisons des priorités sur le hook `admin_menu`:

1. **Priorité 6** - Gestion Bibliothèque (PREMIER - apparaît en haut)
   - Fichier: `cpfa-core-manager/includes/class-library-manager.php`
   - Ajoute le tableau de bord bibliothèque et ses sous-menus (Emprunter, Retours, Pénalités)

2. **Priorité 50** - Préinscriptions
   - Fichier: `cpfa-forms-registrations/includes/admin/class-preinscriptions-page.php`
   - Ajoute la page de gestion des préinscriptions (après les CPTs)

3. **Priorité 100** - Réglages généraux (Settings)
   - Fichier: `cpfa-core-manager/includes/settings/class-settings.php`
   - Crée le menu principal "CPFA" et ajoute les sous-menus de réglages (généraux, bibliothèque, paiements, PDF)

4. **Priorité 110** - Réglages Paiements (Forms)
   - Fichier: `cpfa-forms-registrations/includes/admin/class-settings-page.php`
   - Ajoute les réglages de paiements du plugin Forms (en dernier)

## Custom Post Types

Les Custom Post Types (CPT) sont automatiquement ajoutés par WordPress entre le menu principal et les sous-menus personnalisés. Ils sont déclarés avec `'show_in_menu' => 'cpfa-library'` dans leur configuration.

CPTs inclus:
- **Formations** (`cpfa_formation`)
- **Séminaires** (`cpfa_seminaire`)
- **Concours** (`cpfa_concours`)
- **Ressources** (`cpfa_ressource`) - Ouvrages de la bibliothèque
- **Abonnements** (`cpfa_abonnement`) - Abonnements bibliothèque
- **Emprunts** (`cpfa_emprunt`) - Emprunts en cours/terminés

## Icônes et Emojis

Pour une meilleure lisibilité, des emojis sont utilisés dans les titres des sous-menus:
- 📊 Tableau de bord
- 📋 Préinscriptions
- 📚 Bibliothèque / Gestion Biblio
- ⚙️ Réglages généraux
- 💳 Paiements
- 📄 PDF & QR

## Capabilities (Permissions)

Les pages utilisent différentes capabilities WordPress:
- `manage_options` - Réglages et configuration (administrateurs)
- `manage_cpfa_biblio` - Gestion bibliothèque (rôle personnalisé)
- `edit_cpfa_formation` - Modification des formations
- `edit_cpfa_ressource` - Modification des ressources bibliothèque

## Modification de la Structure

### Pour ajouter un nouveau sous-menu

1. Créer une classe avec une méthode qui ajoute le sous-menu
2. Utiliser `add_submenu_page()` avec `'cpfa-library'` comme parent
3. Définir une priorité appropriée sur le hook `admin_menu`

Exemple:
```php
add_action( 'admin_menu', array( $this, 'add_menu' ), 12 );

public function add_menu() {
    add_submenu_page(
        'cpfa-library',                      // Parent slug (IMPORTANT!)
        __( 'Mon Titre', 'cpfa-core' ),     // Page title
        __( '🎯 Mon Menu', 'cpfa-core' ),    // Menu title
        'manage_options',                     // Capability
        'cpfa-mon-menu',                      // Menu slug
        array( $this, 'render_page' )        // Callback
    );
}
```

### Pour modifier l'ordre des éléments

Ajuster les priorités dans les fichiers concernés:
- Priorité plus basse = apparaît plus tôt dans le menu
- Priorité plus haute = apparaît plus tard dans le menu

## Plugins Concernés

1. **cpfa-core-manager** - Plugin principal
   - Gère le menu principal CPFA
   - CPTs (formations, séminaires, ressources, etc.)
   - Gestion bibliothèque
   - Réglages généraux

2. **cpfa-forms-registrations** - Gestion des inscriptions
   - Préinscriptions
   - Réglages paiements

3. **cpfa-pdf-generator** - Génération de PDF
   - (À venir) Gestion des templates PDF
