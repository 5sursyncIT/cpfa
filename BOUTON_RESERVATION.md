# Bouton de Réservation - Documentation

## Vue d'ensemble

Le bouton de réservation permet aux utilisateurs connectés de réserver des ressources de la bibliothèque directement depuis le catalogue Elementor.

## Fonctionnalités implémentées

### 1. Widget Catalogue (Elementor)

**Fichier**: `cpfa-core-manager/includes/elementor/widgets/class-catalogue-widget.php`

#### Nouveaux contrôles Elementor

- **`show_reserve_button`** (SWITCHER)
  - Activer/désactiver l'affichage du bouton de réservation
  - Par défaut: Oui

- **`reserve_button_text`** (TEXT)
  - Personnaliser le texte du bouton
  - Par défaut: "Réserver"

#### Logique d'affichage du bouton

Le bouton s'affiche uniquement pour les ressources (`cpfa_ressource`) et effectue les vérifications suivantes:

1. **Ressource exclue du prêt** (`_cpfa_ressource_exclu_pret`)
   - Si `oui`: Affiche "Consultation sur place uniquement"
   - Sinon: Affiche le bouton

2. **Disponibilité de la ressource**
   - Vérifie s'il existe un emprunt en cours pour cette ressource
   - Si disponible: Bouton vert cliquable
   - Si non disponible: Bouton gris désactivé "Non disponible"

### 2. Styles CSS

**Fichier**: `cpfa-core-manager/assets/css/elementor-widgets.css`

#### Classes CSS

- `.cpfa-reserve-button` - Style de base du bouton
- `.cpfa-reserve-available` - Bouton disponible (vert)
- `.cpfa-reserve-unavailable` - Bouton non disponible (gris)
- `.cpfa-reserve-excluded` - Message d'exclusion (jaune)
- `.processing` - État pendant le traitement Ajax
- `.success` - Animation de succès

#### Animations

- `cpfa-pulse` - Animation du bouton pendant le traitement
- `cpfa-success-flash` - Animation de succès après réservation

### 3. JavaScript (Frontend)

**Fichier**: `cpfa-core-manager/assets/js/elementor-widgets.js`

#### Fonction `initReserveButton()`

Gère les clics sur le bouton de réservation:

1. **Vérification de l'authentification**
   - Redirige vers la page de connexion si non connecté

2. **Confirmation de l'utilisateur**
   - Affiche une boîte de dialogue de confirmation

3. **Requête Ajax**
   - Action: `cpfa_reserve_resource`
   - Données: `resource_id`, `nonce`
   - Gère les états de chargement, succès et erreur

#### Variables JavaScript localisées

```javascript
cpfaElementor = {
    ajaxUrl: '/wp-admin/admin-ajax.php',
    restUrl: '/wp-json/cpfa/v1',
    nonce: 'security-nonce',
    isUserLoggedIn: true/false,
    loginUrl: '/wp-login.php'
}
```

### 4. Gestionnaire Ajax (Backend)

**Fichier**: `cpfa-core-manager/includes/class-ajax-handler.php`

#### Classe `Ajax_Handler`

**Actions WordPress**:
- `wp_ajax_cpfa_reserve_resource` - Utilisateurs connectés
- `wp_ajax_nopriv_cpfa_reserve_resource` - Utilisateurs non connectés (redirige vers login)

#### Méthode `reserve_resource()`

**Vérifications effectuées**:

1. **Nonce de sécurité** - Vérifie le jeton CSRF
2. **Authentification** - Utilisateur connecté
3. **ID de ressource** - Valide et existe
4. **Type de post** - Confirme que c'est une ressource
5. **Exclusion du prêt** - Vérifie si la ressource peut être empruntée
6. **Disponibilité** - Vérifie qu'il n'y a pas d'emprunt en cours
7. **Abonnement actif** - Vérifie que l'utilisateur a un abonnement valide
8. **Pénalités** - Vérifie qu'il n'y a pas de pénalités en attente

**Création de l'emprunt**:

Si toutes les vérifications passent, crée un CPT `cpfa_emprunt` avec:

```php
Meta données:
- _cpfa_emprunt_abonne_id         => ID de l'abonnement
- _cpfa_emprunt_ressource_id      => ID de la ressource
- _cpfa_emprunt_date_emprunt      => Date actuelle
- _cpfa_emprunt_date_retour_prevue => Date actuelle + 30 jours
- _cpfa_emprunt_statut            => 'en_cours'
```

**Action déclenchée**:
```php
do_action( 'cpfa_resource_reserved', $loan_id, $resource_id, $user_id, $subscription_id );
```

#### Méthodes utilitaires

- `get_active_loan_for_resource($resource_id)` - Récupère l'emprunt actif pour une ressource
- `get_active_subscription_for_user($user_id)` - Récupère l'abonnement actif d'un utilisateur
- `user_has_pending_penalties($user_id)` - Vérifie les pénalités en attente

### 5. Intégration Elementor

**Fichier**: `cpfa-core-manager/includes/elementor/class-elementor-integration.php`

Mise à jour de la localisation JavaScript pour inclure:
- `isUserLoggedIn` - État de connexion
- `loginUrl` - URL de connexion
- `nonce` - Jeton de sécurité correct

### 6. Chargement du plugin

**Fichier**: `cpfa-core-manager/cpfa-core-manager.php`

Ajout du chargement de:
- `includes/class-ajax-handler.php`
- Initialisation de `new Cpfa\Core\Ajax_Handler()`

## Règles métier

### Durée de prêt
- **30 jours** par défaut
- Date de retour prévue calculée automatiquement

### Conditions de réservation
1. Utilisateur connecté
2. Abonnement actif et valide
3. Aucune pénalité en attente
4. Ressource disponible (pas d'emprunt en cours)
5. Ressource non exclue du prêt

### États du bouton

| État | Apparence | Action |
|------|-----------|--------|
| Disponible | Bouton vert avec icône 📖 | Cliquable, ouvre confirmation |
| Non disponible | Bouton gris avec icône ⏱️ | Désactivé |
| Exclus du prêt | Badge jaune | Affichage informatif uniquement |
| En cours de traitement | Bouton avec icône ⏳ | Désactivé, opacity 0.7 |
| Réservé | Bouton vert avec icône ✅ | Désactivé, animation de succès |

## Messages utilisateur

### Succès
```
Réservation effectuée avec succès !
Vous pouvez récupérer la ressource.
Date de retour prévue : [date]
```

### Erreurs possibles

- "Vous devez être connecté pour réserver une ressource."
- "ID de ressource invalide."
- "Ressource introuvable."
- "Cette ressource est disponible uniquement en consultation sur place."
- "Cette ressource est actuellement empruntée."
- "Vous devez avoir un abonnement actif pour emprunter des ressources."
- "Vous avez des pénalités en attente. Veuillez les régler avant de pouvoir emprunter."
- "Erreur lors de la création de l'emprunt."

## Extensions possibles

### Hook personnalisé
```php
add_action( 'cpfa_resource_reserved', function( $loan_id, $resource_id, $user_id, $subscription_id ) {
    // Envoyer un email de confirmation
    // Générer un reçu PDF
    // Envoyer une notification push
    // Logger l'événement
    // Mettre à jour les statistiques
}, 10, 4 );
```

### Notifications

Utilisez le hook `cpfa_resource_reserved` pour:
1. Envoyer un email de confirmation à l'utilisateur
2. Notifier l'administration
3. Générer un PDF de reçu d'emprunt
4. Créer une notification dans l'espace utilisateur

### Statistiques

Utilisez le hook pour mettre à jour:
- Nombre d'emprunts par utilisateur
- Ressources les plus empruntées
- Taux d'occupation de la bibliothèque

## Testing

### Test manuel

1. **Non connecté**
   - Cliquer sur "Réserver"
   - Vérifier la redirection vers login

2. **Connecté sans abonnement**
   - Cliquer sur "Réserver"
   - Vérifier le message d'erreur

3. **Connecté avec abonnement actif**
   - Cliquer sur "Réserver"
   - Confirmer
   - Vérifier la création de l'emprunt dans l'admin

4. **Ressource déjà empruntée**
   - Vérifier que le bouton est désactivé

5. **Ressource exclue du prêt**
   - Vérifier l'affichage du message d'exclusion

### Test des hooks

```php
// Dans un plugin de test ou functions.php
add_action( 'cpfa_resource_reserved', function( $loan_id, $resource_id, $user_id, $subscription_id ) {
    error_log( sprintf(
        'Nouvelle réservation: Emprunt #%d, Ressource #%d, Utilisateur #%d',
        $loan_id,
        $resource_id,
        $user_id
    ) );
}, 10, 4 );
```

## Sécurité

### Mesures implémentées

1. **Vérification du nonce** - Protection CSRF
2. **Vérification de l'authentification** - Utilisateur connecté
3. **Validation des entrées** - `absint()` pour les IDs
4. **Vérification des permissions** - Abonnement actif requis
5. **Vérification de la disponibilité** - Pas de double emprunt
6. **Échappement des sorties** - `esc_attr()`, `esc_html()`

### Best practices

- Toujours vérifier le nonce avant traitement
- Valider et sanitiser toutes les données utilisateur
- Utiliser les fonctions WordPress natives (`wp_send_json_*`)
- Logger les actions sensibles pour audit
- Limiter les tentatives de réservation (rate limiting recommandé)

## Performance

### Optimisations

1. **Cache des requêtes** - Utiliser `wp_cache` pour les vérifications fréquentes
2. **Pagination** - Le catalogue utilise déjà la pagination
3. **Lazy loading** - Images du catalogue en lazy load
4. **Requêtes optimisées** - `posts_per_page` limité, meta_query optimisée

### Monitoring

- Surveiller le nombre de requêtes Ajax
- Logger les erreurs de réservation
- Monitorer les temps de réponse

## Prochaines étapes

1. **Widget Espace Utilisateur** - Afficher les emprunts en cours
2. **Formulaire d'inscription** - Créer un abonnement en ligne
3. **Notifications par email** - Confirmation et rappels
4. **Génération PDF** - Reçu d'emprunt avec QR code
5. **Historique des emprunts** - Dans l'espace utilisateur
6. **Système de réservation** - Réserver une ressource déjà empruntée pour plus tard
