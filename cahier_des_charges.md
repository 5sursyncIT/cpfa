Voici un **cahier des charges techniques** complet pour vos 3 plugins WordPress modulaires. J'ai gardé un niveau "ingénierie" concret (données, hooks, endpoints, sécurité, exemples de code) pour que l'équipe puisse démarrer sans friction.

> **⚠️ MODIFICATIONS IMPORTANTES - VERSION SANS ACF PRO**
> 
> Ce cahier des charges a été modifié pour **supprimer toutes les dépendances à ACF Pro** et utiliser exclusivement les **fonctionnalités natives de WordPress**. Les principales modifications incluent :
> 
> - **Remplacement d'ACF Pro** par des **Meta Boxes natives WordPress**
> - **Pages d'options ACF** remplacées par **WordPress Settings API**
> - **get_field()** remplacé par **get_post_meta()** et **get_option()**
> - **Schémas ACF JSON** remplacés par des **schémas de meta boxes (JSON)**
> - Ajout du support **'custom-fields'** aux Custom Post Types
> - Exemples de code complets pour l'implémentation des meta boxes
> 
> Toutes les fonctionnalités essentielles sont conservées avec une approche 100% WordPress natif.

# Vue d’ensemble

* **WP**: 6.0+ | **PHP**: 8.0+ | **Encoding**: UTF-8 | **i18n**: .pot + textdomain par plugin
* **Qualité**: WP Coding Standards (phpcs), PHPUnit, WP-CLI, Composer autoload (PSR-4)
* **Sécurité**: `current_user_can`, `wp_nonce_*`, `sanitize_*`, `esc_*`, prepared statements, REST auth (nonce/cookies)
* **Perf**: CPT indexés, transients/`wp_object_cache`, batch/cron pour tâches lourdes
* **RGPD**: export/erase data providers, consent logs, durée de rétention configurable
* **Compat**: Meta Boxes natives WordPress, Gravity Forms (ou Forminator), Polylang/WPML-ready

## JavaScript et interactions

```javascript
// Script principal pour les widgets CPFA Elementor
(function($) {
    'use strict';

    // Initialisation des widgets CPFA
    var CpfaElementorWidgets = {
        
        init: function() {
            this.initCatalogueWidget();
            this.initSearchWidget();
            this.initStatsWidget();
            this.initPaymentWidget();
            this.initQrScanner();
        },

        // Widget Catalogue avec Ajax
        initCatalogueWidget: function() {
            $('.cpfa-catalogue-widget').each(function() {
                var $widget = $(this);
                var $loadMore = $widget.find('.cpfa-load-more');
                var $filters = $widget.find('.cpfa-catalogue-filters');

                // Pagination Ajax
                $loadMore.on('click', function(e) {
                    e.preventDefault();
                    var $btn = $(this);
                    var page = parseInt($btn.data('page')) + 1;
                    var maxPages = parseInt($btn.data('max'));

                    if (page <= maxPages) {
                        CpfaElementorWidgets.loadMoreItems($widget, page);
                        $btn.data('page', page);
                    }

                    if (page >= maxPages) {
                        $btn.hide();
                    }
                });

                // Filtres en temps réel
                $filters.find('select, input').on('change keyup', function() {
                    CpfaElementorWidgets.filterCatalogue($widget);
                });
            });
        },

        // Widget Recherche
        initSearchWidget: function() {
            $('.cpfa-search-widget').each(function() {
                var $widget = $(this);
                var $searchInput = $widget.find('.cpfa-search-input');
                var searchTimeout;

                $searchInput.on('keyup', function() {
                    clearTimeout(searchTimeout);
                    var query = $(this).val();
                    
                    searchTimeout = setTimeout(function() {
                        if (query.length >= 3 || query.length === 0) {
                            CpfaElementorWidgets.performSearch($widget, query);
                        }
                    }, 300);
                });
            });
        },

        // Widget Statistiques avec animation
        initStatsWidget: function() {
            $('.cpfa-stats-widget').each(function() {
                var $widget = $(this);
                
                // Observer pour déclencher l'animation au scroll
                if ('IntersectionObserver' in window) {
                    var observer = new IntersectionObserver(function(entries) {
                        entries.forEach(function(entry) {
                            if (entry.isIntersecting) {
                                CpfaElementorWidgets.animateCounters($widget);
                                observer.unobserve(entry.target);
                            }
                        });
                    });
                    
                    observer.observe($widget[0]);
                }
            });
        },

        // Widget Paiement
        initPaymentWidget: function() {
            $('.cpfa-payment-widget').each(function() {
                var $widget = $(this);
                var $gatewaySelect = $widget.find('.cpfa-gateway-select');
                var $qrCode = $widget.find('.cpfa-qr-code');

                $gatewaySelect.on('change', function() {
                    var gateway = $(this).val();
                    CpfaElementorWidgets.updatePaymentMethod($widget, gateway);
                });

                // Vérification du statut de paiement
                CpfaElementorWidgets.startPaymentStatusCheck($widget);
            });
        },

        // Scanner QR
        initQrScanner: function() {
            $('.cpfa-qr-verify-widget').each(function() {
                var $widget = $(this);
                var $scanBtn = $widget.find('.cpfa-start-scan');
                var $video = $widget.find('.cpfa-scanner-video');

                $scanBtn.on('click', function() {
                    CpfaElementorWidgets.startQrScan($widget);
                });
            });
        },

        // Méthodes utilitaires
        loadMoreItems: function($widget, page) {
            var settings = $widget.data('settings');
            
            $.ajax({
                url: cpfa_ajax.ajax_url,
                type: 'POST',
                data: {
                    action: 'cpfa_load_more_catalogue',
                    page: page,
                    settings: settings,
                    nonce: cpfa_ajax.nonce
                },
                beforeSend: function() {
                    $widget.find('.cpfa-load-more').addClass('loading');
                },
                success: function(response) {
                    if (response.success) {
                        $widget.find('.cpfa-catalogue-grid').append(response.data.html);
                    }
                },
                complete: function() {
                    $widget.find('.cpfa-load-more').removeClass('loading');
                }
            });
        },

        filterCatalogue: function($widget) {
            var filters = {};
            $widget.find('.cpfa-catalogue-filters').find('select, input').each(function() {
                var name = $(this).attr('name');
                var value = $(this).val();
                if (value) {
                    filters[name] = value;
                }
            });

            $.ajax({
                url: cpfa_ajax.ajax_url,
                type: 'POST',
                data: {
                    action: 'cpfa_filter_catalogue',
                    filters: filters,
                    nonce: cpfa_ajax.nonce
                },
                success: function(response) {
                    if (response.success) {
                        $widget.find('.cpfa-catalogue-grid').html(response.data.html);
                    }
                }
            });
        },

        animateCounters: function($widget) {
            $widget.find('.cpfa-counter').each(function() {
                var $counter = $(this);
                var target = parseInt($counter.data('target'));
                var duration = parseInt($counter.data('duration')) || 2000;
                var separator = $counter.data('separator') || '';

                $({ count: 0 }).animate({ count: target }, {
                    duration: duration,
                    easing: 'swing',
                    step: function() {
                        var formatted = Math.floor(this.count).toString();
                        if (separator) {
                            formatted = formatted.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
                        }
                        $counter.text(formatted);
                    },
                    complete: function() {
                        var formatted = target.toString();
                        if (separator) {
                            formatted = formatted.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
                        }
                        $counter.text(formatted);
                    }
                });
            });
        },

        startPaymentStatusCheck: function($widget) {
            var paymentId = $widget.data('payment-id');
            if (!paymentId) return;

            var checkInterval = setInterval(function() {
                $.ajax({
                    url: cpfa_ajax.ajax_url,
                    type: 'POST',
                    data: {
                        action: 'cpfa_check_payment_status',
                        payment_id: paymentId,
                        nonce: cpfa_ajax.nonce
                    },
                    success: function(response) {
                        if (response.success) {
                            var status = response.data.status;
                            $widget.find('.cpfa-payment-status').text(status);
                            
                            if (status === 'paid' || status === 'failed') {
                                clearInterval(checkInterval);
                                if (status === 'paid') {
                                    CpfaElementorWidgets.handlePaymentSuccess($widget);
                                }
                            }
                        }
                    }
                });
            }, 5000); // Vérification toutes les 5 secondes
        },

        startQrScan: function($widget) {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                navigator.mediaDevices.getUserMedia({ video: true })
                    .then(function(stream) {
                        var video = $widget.find('.cpfa-scanner-video')[0];
                        video.srcObject = stream;
                        video.play();
                        
                        // Initialiser le scanner QR (nécessite une bibliothèque comme jsQR)
                        CpfaElementorWidgets.processQrScan($widget, video);
                    })
                    .catch(function(err) {
                        console.error('Erreur d\'accès à la caméra:', err);
                        $widget.find('.cpfa-scanner-error').show();
                    });
            }
        }
    };

    // Initialisation au chargement de la page
    $(document).ready(function() {
        CpfaElementorWidgets.init();
    });

    // Réinitialisation après édition Elementor
    $(window).on('elementor/frontend/init', function() {
        elementorFrontend.hooks.addAction('frontend/element_ready/widget', function($scope) {
            if ($scope.find('.cpfa-catalogue-widget, .cpfa-search-widget, .cpfa-stats-widget, .cpfa-payment-widget, .cpfa-qr-verify-widget').length) {
                CpfaElementorWidgets.init();
            }
        });
    });

})(jQuery);
```

## Styles CSS responsifs

```css
/* Variables CSS pour la cohérence */
:root {
    --cpfa-primary: #2c5aa0;
    --cpfa-secondary: #f8f9fa;
    --cpfa-accent: #28a745;
    --cpfa-danger: #dc3545;
    --cpfa-warning: #ffc107;
    --cpfa-border-radius: 8px;
    --cpfa-box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    --cpfa-transition: all 0.3s ease;
}

/* Styles communs pour tous les widgets CPFA */
.cpfa-widget-base {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
}

/* Widget Catalogue */
.cpfa-catalogue-widget {
    margin-bottom: 2rem;
}

.cpfa-catalogue-filters {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
    flex-wrap: wrap;
}

.cpfa-catalogue-filters select,
.cpfa-catalogue-filters input {
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: var(--cpfa-border-radius);
    font-size: 1rem;
    transition: var(--cpfa-transition);
}

.cpfa-catalogue-filters select:focus,
.cpfa-catalogue-filters input:focus {
    outline: none;
    border-color: var(--cpfa-primary);
    box-shadow: 0 0 0 3px rgba(44, 90, 160, 0.1);
}

.cpfa-catalogue-grid {
    display: grid;
    gap: 2rem;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.cpfa-catalogue-item {
    background: white;
    border-radius: var(--cpfa-border-radius);
    overflow: hidden;
    box-shadow: var(--cpfa-box-shadow);
    transition: var(--cpfa-transition);
}

.cpfa-catalogue-item:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(0,0,0,0.15);
}

.cpfa-item-image img {
    width: 100%;
    height: 200px;
    object-fit: cover;
}

.cpfa-item-content {
    padding: 1.5rem;
}

.cpfa-item-title {
    color: var(--cpfa-primary);
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
}

.cpfa-item-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 1rem 0;
    font-size: 0.9rem;
    color: #666;
}

.cpfa-price {
    font-weight: 600;
    color: var(--cpfa-accent);
}

.cpfa-item-link {
    display: inline-block;
    background: var(--cpfa-primary);
    color: white;
    padding: 0.75rem 1.5rem;
    text-decoration: none;
    border-radius: var(--cpfa-border-radius);
    transition: var(--cpfa-transition);
    font-weight: 500;
}

.cpfa-item-link:hover {
    background: var(--cpfa-accent);
    transform: translateY(-2px);
}

/* Widget Statistiques */
.cpfa-stats-widget {
    display: grid;
    gap: 2rem;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

.cpfa-stat-item {
    text-align: center;
    padding: 2rem;
    background: white;
    border-radius: var(--cpfa-border-radius);
    box-shadow: var(--cpfa-box-shadow);
}

.cpfa-counter {
    display: block;
    font-size: 3rem;
    font-weight: 700;
    color: var(--cpfa-primary);
    margin-bottom: 0.5rem;
}

.cpfa-stat-label {
    font-size: 1.1rem;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

/* Widget Paiement */
.cpfa-payment-widget {
    max-width: 500px;
    margin: 0 auto;
    background: white;
    padding: 2rem;
    border-radius: var(--cpfa-border-radius);
    box-shadow: var(--cpfa-box-shadow);
}

.cpfa-payment-methods {
    display: grid;
    gap: 1rem;
    margin-bottom: 2rem;
}

.cpfa-payment-method {
    display: flex;
    align-items: center;
    padding: 1rem;
    border: 2px solid #eee;
    border-radius: var(--cpfa-border-radius);
    cursor: pointer;
    transition: var(--cpfa-transition);
}

.cpfa-payment-method:hover,
.cpfa-payment-method.active {
    border-color: var(--cpfa-primary);
    background: rgba(44, 90, 160, 0.05);
}

.cpfa-qr-code {
    text-align: center;
    padding: 2rem;
    border: 2px dashed #ddd;
    border-radius: var(--cpfa-border-radius);
    margin: 1rem 0;
}

/* Widget Scanner QR */
.cpfa-qr-verify-widget {
    max-width: 600px;
    margin: 0 auto;
    text-align: center;
}

.cpfa-scanner-container {
    position: relative;
    margin: 2rem 0;
}

.cpfa-scanner-video {
    width: 100%;
    max-width: 400px;
    border-radius: var(--cpfa-border-radius);
}

.cpfa-scanner-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 200px;
    height: 200px;
    border: 3px solid var(--cpfa-primary);
    border-radius: 10px;
    pointer-events: none;
}

/* Animations */
@keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
}

.cpfa-loading {
    animation: pulse 1.5s infinite;
}

/* Responsive Design */
@media (max-width: 768px) {
    .cpfa-catalogue-filters {
        flex-direction: column;
    }
    
    .cpfa-catalogue-grid {
        grid-template-columns: 1fr;
    }
    
    .cpfa-stats-widget {
        grid-template-columns: repeat(2, 1fr);
    }
    
    .cpfa-item-meta {
        flex-direction: column;
        gap: 0.5rem;
    }
}

@media (max-width: 480px) {
    .cpfa-stats-widget {
        grid-template-columns: 1fr;
    }
    
    .cpfa-counter {
        font-size: 2.5rem;
    }
    
    .cpfa-payment-widget {
        padding: 1rem;
    }
}

/* Mode sombre */
@media (prefers-color-scheme: dark) {
    :root {
        --cpfa-secondary: #2d3748;
        --cpfa-box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    }
    
    .cpfa-catalogue-item,
    .cpfa-stat-item,
    .cpfa-payment-widget {
        background: var(--cpfa-secondary);
        color: white;
    }
    
    .cpfa-catalogue-filters select,
    .cpfa-catalogue-filters input {
        background: var(--cpfa-secondary);
        color: white;
        border-color: #4a5568;
    }
}

/* Accessibilité */
.cpfa-widget-base *:focus {
    outline: 2px solid var(--cpfa-primary);
    outline-offset: 2px;
}

.cpfa-sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}
```

## Guide d'utilisation pour les développeurs

### Installation et activation

1. **Vérification des dépendances**:
```php
// Vérifier qu'Elementor est actif
if (!did_action('elementor/loaded')) {
    add_action('admin_notices', function() {
        echo '<div class="notice notice-warning"><p>';
        echo __('Les widgets CPFA nécessitent Elementor pour fonctionner.', 'cpfa-core');
        echo '</p></div>';
    });
    return;
}
```

2. **Enregistrement automatique**:
```php
// Auto-enregistrement des widgets au chargement d'Elementor
add_action('elementor/widgets/register', 'cpfa_register_elementor_widgets');

function cpfa_register_elementor_widgets($widgets_manager) {
    // Chargement automatique des widgets depuis chaque plugin
    $widget_files = glob(CPFA_PLUGIN_PATH . 'includes/elementor/widgets/*.php');
    
    foreach ($widget_files as $file) {
        require_once $file;
        $class_name = 'Cpfa\\Elementor\\Widgets\\' . basename($file, '.php');
        if (class_exists($class_name)) {
            $widgets_manager->register(new $class_name());
        }
    }
}
```

### Personnalisation des widgets

Les widgets CPFA sont conçus pour être facilement personnalisables :

1. **Hooks et filtres disponibles**:
```php
// Modifier les options d'un widget
add_filter('cpfa_catalogue_widget_options', function($options) {
    $options['custom_option'] = 'valeur';
    return $options;
});

// Personnaliser le rendu d'un widget
add_action('cpfa_before_catalogue_render', function($settings) {
    // Code personnalisé avant le rendu
});
```

2. **Templates personnalisés**:
```php
// Utiliser un template personnalisé
add_filter('cpfa_widget_template_path', function($path, $widget_name) {
    if ($widget_name === 'catalogue') {
        return get_template_directory() . '/cpfa/catalogue-custom.php';
    }
    return $path;
}, 10, 2);
```

---

# Implémentation des Meta Boxes WordPress Natives

## Structure recommandée pour les meta boxes

Chaque CPT aura ses meta boxes personnalisées suivant ce modèle :

### 1. Formations (`cpfa_formation`)
- **Meta Box** : "Détails de la formation"
- **Champs** : `_cpfa_formation_type`, `_cpfa_formation_duree`, `_cpfa_formation_niveau`, `_cpfa_formation_prix`, `_cpfa_formation_brochure`

### 2. Séminaires (`cpfa_seminaire`)  
- **Meta Box** : "Détails du séminaire"
- **Champs** : `_cpfa_seminaire_dates`, `_cpfa_seminaire_lieu`, `_cpfa_seminaire_quota`, `_cpfa_seminaire_prix`, `_cpfa_seminaire_affiche`

### 3. Concours (`cpfa_concours`)
- **Meta Box** : "Détails du concours"  
- **Champs** : `_cpfa_concours_calendrier`, `_cpfa_concours_conditions`, `_cpfa_concours_pieces`

### 4. Ressources (`cpfa_ressource`)
- **Meta Box** : "Informations bibliographiques"
- **Champs** : `_cpfa_ressource_cote`, `_cpfa_ressource_auteurs`, `_cpfa_ressource_mots_cles`, `_cpfa_ressource_statut_pret`

### 5. Abonnements (`cpfa_abonnement`)
- **Meta Box** : "Détails de l'abonnement"
- **Champs** : `_cpfa_abonnement_membre`, `_cpfa_abonnement_type`, `_cpfa_abonnement_date_debut`, `_cpfa_abonnement_date_fin`, `_cpfa_abonnement_statut`, `_cpfa_abonnement_caution`

### 6. Emprunts (`cpfa_emprunt`)
- **Meta Box** : "Détails de l'emprunt"
- **Champs** : `_cpfa_emprunt_abonne`, `_cpfa_emprunt_ressource`, `_cpfa_emprunt_date_sortie`, `_cpfa_emprunt_date_retour_prevue`, `_cpfa_emprunt_date_retour_effective`, `_cpfa_emprunt_penalite`

## Pages d'options avec WordPress Settings API

Remplacement des ACF Options Pages par des pages d'administration natives :

```php
// Exemple d'implémentation pour les réglages généraux
add_action('admin_menu', function() {
  add_options_page(
    __('Réglages CPFA', 'cpfa-core'),
    __('CPFA', 'cpfa-core'),
    'manage_options',
    'cpfa-settings',
    'cpfa_settings_page'
  );
});

add_action('admin_init', function() {
  register_setting('cpfa_settings', 'cpfa_logo');
  register_setting('cpfa_settings', 'cpfa_coordonnees');
  register_setting('cpfa_settings', 'cpfa_rgpd_retention');
  
  add_settings_section(
    'cpfa_general_section',
    __('Réglages généraux', 'cpfa-core'),
    null,
    'cpfa-settings'
  );
  
  add_settings_field(
    'cpfa_logo',
    __('Logo', 'cpfa-core'),
    'cpfa_logo_field_callback',
    'cpfa-settings',
    'cpfa_general_section'
  );
});

function cpfa_settings_page() {
  ?>
  <div class="wrap">
    <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
    <form action="options.php" method="post">
      <?php
      settings_fields('cpfa_settings');
      do_settings_sections('cpfa-settings');
      submit_button();
      ?>
    </form>
  </div>
  <?php
}
```

---

# PLUGIN 1 — CPFA Core Manager

**Slug**: `cpfa-core-manager` • **Ver.** 1.0.0 • **Dépendances**: Aucune (WordPress natif)

## Rôle

Base de données métier : **Custom Post Types**, taxonomies, capacités/roles, meta boxes personnalisées, options globales, REST endpoints communs, services partagés (QR, paiements, notifications).

## Données (CPT & taxonomies)

| CPT                           | Clé               | Champs clés (Meta Boxes)                                        | Taxonomies                 |
| ----------------------------- | ----------------- | --------------------------------------------------------------- | -------------------------- |
| Formations                    | `cpfa_formation`  | type (diplômante/certif), durée, niveau, brochure PDF, prix     | `formation_type`, `niveau` |
| Séminaires                    | `cpfa_seminaire`  | dates, lieu, quota, prix, affiche, galerie                      | `thematique`               |
| Concours                      | `cpfa_concours`   | calendrier, conditions, pièces à fournir                        | `session`                  |
| Ressources biblio             | `cpfa_ressource`  | cote, auteurs, mots-clés, statut prêt                           | `ressource_classe`         |
| Abonnements                   | `cpfa_abonnement` | membre, type (étudiant/pro/pro+emprunt), dates, statut, caution | —                          |
| Emprunts                      | `cpfa_emprunt`    | abonné, ressource, date sortie/retour, pénalité                 | —                          |
| Témoignages/Actus (optionnel) | `cpfa_media`      | vidéo/texte, formé(e), formation liée                           | —                          |

> Remarque : les **abonnements** et **emprunts** sont gérés ici pour centraliser la logique bibliothèque (tarifs, pénalités).

## Capabilities & rôles

* Rôle `cpfa_manager`: gère tout le domaine CPFA (éditer formations/séminaires/concours, valider abonnements, emprunts, remboursements de caution).
* Map des caps fines (ex. `edit_cpfa_formation`, `manage_cpfa_biblio`, `manage_cpfa_finance`).

## Pages d'options (WordPress Settings API)

* **CPFA > Réglages généraux**: identité visuelle, coordonnées, RGPD (durées de rétention).
* **CPFA > Bibliothèque**: tarifs, pénalités (500 FCFA/jour > J+3), horaires, livres "exclus du prêt".
* **CPFA > Paiements**: clés sandbox/live + URLs webhook (voir plugin 2).
* **CPFA > PDF & QR**: logo, couleurs, polices, format carte membre, URL de vérification.

## Services partagés

* **QR**: génération (SVG/PNG) via `endroid/qr-code` (Composer) pour tickets, cartes, reçus.
* **Notifications**: abstraction e-mail (wp_mail) + provider SMS optionnel (interface + adaptateurs).
* **Paiements**: abstraction passerelle (Wave/OM/PayDunya/Free Money). Le Core expose l'interface & le registre; l'intégration est implémentée dans Forms (plugin 2).

### Templates d'emails pour le workflow d'abonnement (paiement hors ligne)

Le plugin Forms (Plugin 2) doit inclure les templates d'emails suivants pour le processus de validation manuelle:

**1. Email: Préinscription reçue (envoyé à l'utilisateur)**
- **Objet**: `[CPFA] Votre préinscription a bien été reçue - Validation en cours`
- **Déclencheur**: Soumission du formulaire d'abonnement
- **Variables**: `{nom}`, `{prenom}`, `{type_abonnement}`, `{montant}`, `{numero_preinscription}`, `{date_soumission}`
- **Contenu**:
  ```
  Bonjour {prenom} {nom},

  Nous avons bien reçu votre demande d'abonnement bibliothèque:
  - Type: {type_abonnement}
  - Montant: {montant} FCFA
  - Numéro de préinscription: {numero_preinscription}
  - Date de soumission: {date_soumission}

  Votre préinscription est actuellement EN ATTENTE DE VALIDATION.
  Notre équipe vérifie la réception de votre paiement.

  Vous recevrez un email de confirmation sous 24-48h ouvrées.

  Si vous avez effectué le paiement et conservé une référence de transaction,
  vous pouvez la communiquer en répondant à cet email.

  Cordialement,
  L'équipe CPFA
  ```

**2. Email: Nouvelle préinscription (envoyé à l'admin)**
- **Objet**: `[CPFA Admin] Nouvelle préinscription à valider - {nom} {prenom}`
- **Déclencheur**: Soumission du formulaire d'abonnement
- **Variables**: `{nom}`, `{prenom}`, `{type_abonnement}`, `{montant}`, `{email}`, `{telephone}`, `{lien_admin}`
- **Contenu**:
  ```
  Nouvelle préinscription bibliothèque à valider:

  NOM: {nom} {prenom}
  TYPE: {type_abonnement} ({montant} FCFA)
  EMAIL: {email}
  TÉLÉPHONE: {telephone}

  ACTION REQUISE:
  1. Vérifier la réception du paiement dans votre interface Wave/Orange Money
  2. Cliquer sur le lien ci-dessous pour valider ou rejeter

  {lien_admin}

  Rappel: Délai de validation recommandé sous 24-48h ouvrées.
  ```

**3. Email: Abonnement validé (envoyé à l'utilisateur)**
- **Objet**: `[CPFA] Votre abonnement bibliothèque a été activé !`
- **Déclencheur**: Admin valide la préinscription
- **Variables**: `{nom}`, `{prenom}`, `{type_abonnement}`, `{date_debut}`, `{date_fin}`, `{numero_carte}`, `{carte_pdf_url}`
- **Pièce jointe**: Carte membre PDF avec QR code
- **Contenu**:
  ```
  Bonjour {prenom} {nom},

  Excellente nouvelle ! Votre abonnement bibliothèque a été VALIDÉ.

  DÉTAILS DE VOTRE ABONNEMENT:
  - Type: {type_abonnement}
  - Numéro de carte: {numero_carte}
  - Valable du {date_debut} au {date_fin}

  CARTE MEMBRE:
  Votre carte membre est en pièce jointe de cet email (format PDF).
  Vous pouvez également la télécharger via ce lien: {carte_pdf_url}

  Présentez cette carte (imprimée ou sur mobile) à chaque visite.
  Le QR code permet de vérifier instantanément votre abonnement.

  HORAIRES D'OUVERTURE:
  Lundi - Vendredi: 08:00 - 17:00

  Bienvenue à la bibliothèque CPFA !

  Cordialement,
  L'équipe CPFA
  ```

**4. Email: Préinscription rejetée (envoyé à l'utilisateur)**
- **Objet**: `[CPFA] Votre préinscription nécessite une action de votre part`
- **Déclencheur**: Admin rejette la préinscription
- **Variables**: `{nom}`, `{prenom}`, `{motif_rejet}`, `{details_rejet}`, `{contact_email}`, `{contact_telephone}`
- **Contenu**:
  ```
  Bonjour {prenom} {nom},

  Nous avons examiné votre demande d'abonnement bibliothèque.

  STATUT: REJETÉE
  MOTIF: {motif_rejet}
  {details_rejet}

  PROCHAINES ÉTAPES:
  - Si vous avez effectué le paiement, merci de nous transmettre la référence de transaction
  - Vous pouvez nous contacter pour régulariser votre dossier

  CONTACT:
  Email: {contact_email}
  Téléphone: {contact_telephone}

  Nous restons à votre disposition pour toute clarification.

  Cordialement,
  L'équipe CPFA
  ```

**5. Email: Justificatif de paiement demandé (envoyé à l'utilisateur)**
- **Objet**: `[CPFA] Justificatif de paiement requis pour votre abonnement`
- **Déclencheur**: Admin clique sur "Demander justificatif"
- **Variables**: `{nom}`, `{prenom}`, `{numero_preinscription}`, `{contact_email}`
- **Contenu**:
  ```
  Bonjour {prenom} {nom},

  Concernant votre préinscription n°{numero_preinscription},

  Nous n'avons pas encore pu confirmer la réception de votre paiement.

  MERCI DE NOUS TRANSMETTRE:
  - Capture d'écran de la transaction Wave ou Orange Money
  - Référence de transaction
  - Date et heure du paiement

  Vous pouvez répondre directement à cet email avec ces éléments.

  Une fois le justificatif reçu, nous validerons votre abonnement sous 24h.

  Cordialement,
  L'équipe CPFA
  ```

**Configuration des templates**:
- Templates HTML stockés dans `cpfa-forms-registrations/templates/emails/`
- Variables remplacées via `str_replace()` ou shortcode parser
- Styling inline CSS pour compatibilité clients mail
- Option d'envoi de copie à l'admin (configurable)
- Logs d'envoi stockés en post meta pour traçabilité
* **Vérification publique**: route `/verif/{token}` (page publique + endpoint REST) pour valider une carte/inscription par QR.

## REST API (lecture publique & interne)

* `GET /cpfa/v1/catalogue` (filtres: classe/mots-clés, pagination)
* `GET /cpfa/v1/formations`, `.../seminaires`, `.../concours`
* `GET /cpfa/v1/verif/{token}` → statut d’inscription/abonnement
* Auth requise pour tout ce qui est personnel (membre, paiements).

## Cron & automatisations

* `cpfa_daily`: rappels échéances emprunts, expirations d’abonnements (J–30, J–7, J–1).
* `cpfa_hourly`: nettoyage transients, relance webhooks “en attente”.

## Exemple — en-tête & CPT avec Meta Boxes

```php
<?php
/**
 * Plugin Name: CPFA Core Manager
 * Text Domain: cpfa-core
 */

add_action('init', function () {
  register_post_type('cpfa_formation', [
    'label' => __('Formations', 'cpfa-core'),
    'public' => true,
    'show_in_rest' => true,
    'supports' => ['title','editor','thumbnail','excerpt','custom-fields'],
    'capability_type' => ['cpfa_formation', 'cpfa_formations'],
    'map_meta_cap' => true,
    'rewrite' => ['slug' => 'formations'],
  ]);
});

// Ajout des meta boxes pour les formations
add_action('add_meta_boxes', function() {
  add_meta_box(
    'cpfa_formation_details',
    __('Détails de la formation', 'cpfa-core'),
    'cpfa_formation_meta_box_callback',
    'cpfa_formation',
    'normal',
    'high'
  );
});

function cpfa_formation_meta_box_callback($post) {
  wp_nonce_field('cpfa_formation_meta_box', 'cpfa_formation_meta_box_nonce');
  
  $type = get_post_meta($post->ID, '_cpfa_formation_type', true);
  $duree = get_post_meta($post->ID, '_cpfa_formation_duree', true);
  $niveau = get_post_meta($post->ID, '_cpfa_formation_niveau', true);
  $prix = get_post_meta($post->ID, '_cpfa_formation_prix', true);
  
  echo '<table class="form-table">';
  echo '<tr><th><label for="cpfa_formation_type">' . __('Type', 'cpfa-core') . '</label></th>';
  echo '<td><select name="cpfa_formation_type" id="cpfa_formation_type">';
  echo '<option value="diplomante"' . selected($type, 'diplomante', false) . '>' . __('Diplômante', 'cpfa-core') . '</option>';
  echo '<option value="certifiante"' . selected($type, 'certifiante', false) . '>' . __('Certifiante', 'cpfa-core') . '</option>';
  echo '</select></td></tr>';
  
  echo '<tr><th><label for="cpfa_formation_duree">' . __('Durée (heures)', 'cpfa-core') . '</label></th>';
  echo '<td><input type="number" name="cpfa_formation_duree" id="cpfa_formation_duree" value="' . esc_attr($duree) . '" /></td></tr>';
  
  echo '<tr><th><label for="cpfa_formation_niveau">' . __('Niveau', 'cpfa-core') . '</label></th>';
  echo '<td><input type="text" name="cpfa_formation_niveau" id="cpfa_formation_niveau" value="' . esc_attr($niveau) . '" /></td></tr>';
  
  echo '<tr><th><label for="cpfa_formation_prix">' . __('Prix (FCFA)', 'cpfa-core') . '</label></th>';
  echo '<td><input type="number" name="cpfa_formation_prix" id="cpfa_formation_prix" value="' . esc_attr($prix) . '" /></td></tr>';
  echo '</table>';
}

// Sauvegarde des meta données
add_action('save_post', function($post_id) {
  if (!isset($_POST['cpfa_formation_meta_box_nonce']) || 
      !wp_verify_nonce($_POST['cpfa_formation_meta_box_nonce'], 'cpfa_formation_meta_box')) {
    return;
  }
  
  if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
  if (!current_user_can('edit_post', $post_id)) return;
  
  $fields = ['cpfa_formation_type', 'cpfa_formation_duree', 'cpfa_formation_niveau', 'cpfa_formation_prix'];
  foreach ($fields as $field) {
    if (isset($_POST[$field])) {
      update_post_meta($post_id, '_' . $field, sanitize_text_field($_POST[$field]));
    }
  }
});
```

---

# PLUGIN 2 — CPFA Forms & Registrations

**Slug**: `cpfa-forms-registrations` • **Ver.** 1.0.0
**Dépendances**: `cpfa-core-manager`, Gravity Forms (ou Forminator)

## Rôle

Formulaires **inscriptions** (formations, séminaires, concours), **réservations sans engagement**, **abonnement bibliothèque** (+ uploads), **paiements** (QR/mobile money), **réponses automatiques**, **webhooks**.

## Flux cibles

1. **Formation/Séminaire**

   * Form → validation → devis/inscription → paiement → reçu + QR → (option) génération certificat/attestation (plugin 3).
2. **Concours**

   * Form + **pièces jointes** → paiement frais → reçu + convocation PDF (plugin 3) → banque d’épreuves (si inscrit).
3. **Bibliothèque** (Mode hors ligne avec validation manuelle)

   * **Étape 1**: Form (identité, photo, type d'abonnement choisi)
   * **Étape 2**: Affichage page de paiement avec QR codes statiques Wave/Orange Money + montant (10k/15k/50k selon type)
   * **Étape 3**: Utilisateur scanne le QR code via son application mobile et effectue le paiement
   * **Étape 4**: Soumission formulaire → création CPT `cpfa_abonnement` avec statut `awaiting_validation`
   * **Étape 5**: Email automatique à l'utilisateur: "Demande reçue, en attente de validation"
   * **Étape 6**: Notification email à l'admin: "Nouvelle préinscription à valider"
   * **Étape 7**: Admin vérifie le paiement dans Wave/Orange Money
   * **Étape 8**: Admin valide dans WordPress (saisit référence transaction) OU rejette (avec motif)
   * **Étape 9** (si validé): Statut → `active` + génération **carte membre PDF + QR** (plugin 3) + email avec carte
   * **Étape 10** (si rejeté): Statut → `rejected` + email à l'utilisateur avec motif du rejet
4. **Réservation sans engagement**

   * Form → e-mail de confirmation + marqueur “pending” (sans paiement).

## Paiements (Mode hors ligne avec QR codes statiques)

**⚠️ MODE DE PAIEMENT: HORS LIGNE - VALIDATION MANUELLE**

Le système utilise des **QR codes statiques** Wave et Orange Money affichés sur la page de paiement. L'utilisateur scanne le QR code via son application mobile pour effectuer le paiement, puis l'admin valide manuellement la préinscription après vérification de la réception du paiement.

### Workflow de paiement

1. **Affichage des options de paiement**
   - QR code statique Wave (configuré dans CPFA > Paiements)
   - QR code statique Orange Money (configuré dans CPFA > Paiements)
   - Montant affiché selon le type d'abonnement sélectionné
   - Instructions: "Scannez ce QR code avec votre application Wave/Orange Money"

2. **Action utilisateur**
   - Scan du QR code via l'app mobile (Wave ou Orange Money)
   - Paiement effectué directement dans l'application
   - Utilisateur note la référence de transaction

3. **Création préinscription**
   - Statut initial: `awaiting_validation`
   - Email automatique à l'utilisateur: "Votre demande est en attente de validation"
   - Notification email à l'admin: "Nouvelle préinscription à valider"

4. **Validation manuelle par l'admin**
   - Admin vérifie la réception du paiement dans son interface Wave/Orange Money
   - Admin saisit la référence de transaction dans WordPress
   - Admin valide ou rejette la préinscription
   - Si validé → Statut: `active` → Génération carte membre PDF + QR
   - Si rejeté → Statut: `rejected` → Email avec motif

### Configuration (CPFA > Paiements)

* **QR Code Wave**: Upload/génération du QR code statique
* **QR Code Orange Money**: Upload/génération du QR code statique
* **Numéro marchand Wave**: Pour affichage sous le QR
* **Numéro marchand Orange Money**: Pour affichage sous le QR
* **Instructions de paiement**: Texte personnalisable affiché sur la page
* **Délai de validation**: Nombre de jours avant expiration d'une préinscription non validée

### Statuts des préinscriptions/abonnements

* `awaiting_validation`: En attente de vérification du paiement par l'admin
* `active`: Validé, carte membre générée, utilisateur peut emprunter
* `rejected`: Paiement non reçu ou invalide
* `expired`: Préinscription non validée dans le délai imparti
* `suspended`: Abonnement suspendu (pénalités impayées)
* `ended`: Période d'abonnement terminée

### Configuration des QR Codes statiques (Admin)

**CPFA > Réglages > Paiements**

Cette page permet de configurer les QR codes qui seront affichés sur les formulaires d'inscription:

* **Section "QR Code Wave"**:
  - Upload d'image: [Téléverser QR Wave] (PNG/JPG, max 2MB)
  - Numéro Wave: [__________________] (ex: +221 77 123 45 67)
  - Nom du compte: [__________________] (ex: CPFA - Centre de Formation)
  - Prévisualisation du QR actuel avec option "Supprimer"

* **Section "QR Code Orange Money"**:
  - Upload d'image: [Téléverser QR Orange Money] (PNG/JPG, max 2MB)
  - Numéro Orange Money: [__________________] (ex: +221 70 987 65 43)
  - Nom du compte: [__________________] (ex: CPFA - Centre de Formation)
  - Prévisualisation du QR actuel avec option "Supprimer"

* **Instructions affichées sur les formulaires**:
  - Textarea personnalisable avec instructions par défaut:
    ```
    1. Scannez le QR code avec votre application mobile (Wave ou Orange Money)
    2. Saisissez le montant indiqué ci-dessus
    3. Confirmez le paiement dans l'application
    4. Notez la référence de transaction (vous pourrez la fournir si demandée)
    5. Votre préinscription sera validée sous 24-48h ouvrées
    ```

* **Options avancées**:
  - ☑ Afficher les deux options (Wave + Orange Money) simultanément
  - ☑ Permettre à l'utilisateur de saisir la référence de transaction (optionnel)
  - Délai d'expiration des préinscriptions non validées: [___7___] jours

**Stockage**:
- Images QR stockées dans `wp-content/uploads/cpfa-qr/wave.png` et `orange-money.png`
- Options WordPress: `cpfa_wave_qr_url`, `cpfa_wave_number`, `cpfa_om_qr_url`, `cpfa_om_number`

### Webhooks (optionnels - pour future intégration API)

**Note**: Les webhooks ne sont **pas utilisés** dans le workflow actuel car les paiements se font hors ligne. Cette interface est conservée pour une éventuelle intégration future avec les API Wave/Orange Money.

* Interface: `Cpfa\Payments\GatewayInterface` (non critique actuellement)
* Route REST: `POST /cpfa/v1/payments/{gateway}/webhook` (conservée pour compatibilité)
* Si webhook reçu → validation automatique possible (à implémenter ultérieurement)

## Intégration Gravity Forms (ou Forminator)

* **Feeds** par formulaire: mapping champs → entités CPFA.
* Validation serveur (formats, pièces, taille).
* **Anti-spam**: reCAPTCHA/hCaptcha + honeypot + rate limit.
* **E-mails**: modèles HTML (branding Core) + variables (nom, événement, date, reçu, liens PDF).

## Admin UI

### Interface de validation manuelle des préinscriptions

**CPFA > Préinscriptions en attente** (page dédiée)

* **Liste des préinscriptions**:
  - Filtres: type (étudiant/pro/emprunt), statut, date de soumission
  - Colonnes: Nom, Type, Montant, Date, Statut, Actions
  - Badge visuel par statut (jaune: en attente, vert: validé, rouge: rejeté)
  - Tri par date (plus récentes en premier)

* **Actions rapides par ligne**:
  - 👁️ **Voir détails**: Modal avec toutes les infos + photo uploadée
  - ✅ **Valider**: Ouvre modal pour saisir référence transaction
  - ❌ **Rejeter**: Ouvre modal pour saisir motif du rejet
  - 🔄 **Demander justificatif**: Envoie email à l'utilisateur

* **Modal de validation**:
  ```
  ┌─────────────────────────────────────────┐
  │ Valider la préinscription               │
  ├─────────────────────────────────────────┤
  │ Nom: Jean Dupont                        │
  │ Type: Professionnel (15,000 FCFA)      │
  │                                         │
  │ Référence de transaction: [_________]  │
  │ Gateway: ○ Wave  ● Orange Money        │
  │                                         │
  │ ☑ Générer la carte membre              │
  │ ☑ Envoyer email avec carte             │
  │                                         │
  │ [Annuler]  [Valider l'abonnement]      │
  └─────────────────────────────────────────┘
  ```

* **Modal de rejet**:
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
  │                                         │
  │ ☑ Envoyer email à l'utilisateur         │
  │                                         │
  │ [Annuler]  [Confirmer le rejet]         │
  └─────────────────────────────────────────┘
  ```

* **Historique des validations**:
  - Tab "Historique" sur chaque fiche
  - Timestamp + nom de l'admin qui a validé/rejeté
  - Référence de transaction saisie
  - Traçabilité complète

### CPFA > Abonnements actifs

* **Liste des abonnements validés**: filtres (type, date expiration)
* **Fiches**: détails, pièces, historique, actions (suspendre, réimprimer carte, prolonger)
* **Bibliothèque**: onglet cartes délivrées, réimpression, renouvellement (crée nouvelle période)

### CPFA > Inscriptions (formations/séminaires/concours)

* **Liste unifiée**: filtres (type, statut paiement, date)
* **Fiches**: détails, pièces, historique, actions (valider, rembourser, renvoyer reçu)

## REST API (création via front SPA si besoin)

* `POST /cpfa/v1/forms/{slug}` → crée une demande (vérifie nonce).
* `POST /cpfa/v1/payments/{gateway}/webhook` → callback provider.
* `GET /cpfa/v1/inscriptions/{id}` (auth) → statut + liens PDF.

## Rappels & pénalités (bibliothèque)

* Sur paiement **emprunt domicile** (50 000 incluant caution 35 000): crée `cpfa_abonnement` avec “droit emprunt”.
* **Cron** applique **500 FCFA/jour** à partir de J+4 de la date de retour prévue; blocage d’un nouvel emprunt si pénalité due.

## Exemple — Webhook REST & paiement

```php
add_action('rest_api_init', function () {
  register_rest_route('cpfa/v1', '/payments/(?P<gateway>[a-z0-9_-]+)/webhook', [
    'methods'  => 'POST',
    'callback' => 'cpfa_handle_webhook',
    'permission_callback' => '__return_true'
  ]);
});

function cpfa_handle_webhook(WP_REST_Request $req) {
  $gateway = sanitize_key($req['gateway']);
  $payload = $req->get_body();
  $sig     = $req->get_header('X-Signature');

  $gw = Cpfa\Payments\GatewayRegistry::get($gateway);
  if (!$gw || !$gw->verifyWebhook($payload, $sig)) {
    return new WP_REST_Response(['ok'=>false], 403);
  }

  $event = $gw->parseEvent($payload);
  do_action('cpfa_payment_event', $gateway, $event);
  return ['ok'=>true];
}
```

---

# PLUGIN 3 — CPFA PDF Generator ✅

**Slug**: `cpfa-pdf-generator` • **Ver.** 1.0.0
**Dépendances**: `cpfa-core-manager`, **mPDF** recommandé (UTF-8 / CJK / RTL OK)

## Rôle

Génère des **PDF**: carte membre, reçu de paiement, convocation, certificat d’inscription, **attestations** (post-séminaire), **brochures automatisées**.

## Moteur & templates

* **Moteur**: mPDF via Composer, polices embarquées (DejaVu, Noto).
* **Templates**: Twig-like (ou PHP views) + variables → ex. `templates/cards/member-card.php`.
* **Branding**: logo, couleurs, entêtes/pieds depuis **Core > PDF & QR**.
* **QR**: image injectée (token de vérif public), texte alternatif.

## Événements qui déclenchent un PDF

* `cpfa_payment_event` status=`paid`:

  * **Formation/Séminaire**: reçu + certificat d’inscription.
  * **Concours**: reçu + **convocation**.
  * **Bibliothèque**: reçu + **carte membre** (format carte: 85.6×54mm, recto/verso).
* Sur **retour d’emprunt**: reçu pénalité (si dû).
* Sur **fin de séminaire**: **attestation de participation** (batch, liste de présence).

## Stockage & accès

* Fichiers dans `wp-content/uploads/cpfa-pdf/{année}/{mois}/…`
* Métas liés à l’objet (post/user), liens signés en front (expirables via nonce/transient).
* Option “attacher au mail” + lien de **téléchargement sécurisé**.

## Exemple — génération carte membre

```php
$member = get_post($abonnement_id);
$qrPng  = \Cpfa\Core\Qr::makePng($verifyUrl); // service Core
$html   = cpfa_render_template('cards/member-card.php', [
  'nom' => get_post_meta($member->ID, '_cpfa_nom', true),
  'id'  => $member->ID,
  'expire' => get_post_meta($member->ID, '_cpfa_date_expiration', true),
  'qr' => $qrPng,
]);

$mpdf = new \Mpdf\Mpdf(['format' => [85.6, 54]]);
$mpdf->WriteHTML($html);
$path = Cpfa\Pdf\Storage::save("carte-{$member->ID}.pdf", $mpdf->Output('', 'S'));
update_post_meta($member->ID, '_cpfa_carte_pdf', $path);
```

---

# Spécificités Bibliothèque (règles métier intégrées)

* **Tarifs**: Étudiant 10 000, Pro 15 000, Emprunt domicile 50 000 (inclut 35 000 caution).
* **Pièces**: CNI (scan), 2 photos, formulaire.
* **Horaires**: Lun-Ven 08:00–17:00 (affichable/éditable).
* **Prêts**: durée 30 jours, **pas de double emprunt même ouvrage**, certains ouvrages **exclus du prêt** (liste Core).
* **Sanctions**:

  * Consultation sur place: détérioration → remplacement/paiement.
  * Emprunt: **amende 500 FCFA/jour** à partir de J+4 si retard; caution non remboursée si dernier emprunt non restitué ou perte/détérioration.
* **Automatisation**: rappels J-3 / J+1 / J+4 / hebdo jusqu’au retour; blocage emprunt si dû.

---

# Sécurité, RGPD, i18n

* **Sécurité**:

  * Nonces sur toutes les actions admin & AJAX/REST en écriture.
  * Vérifications `current_user_can('manage_cpfa_biblio')` etc.
  * Uploads (concours, identité): tailles max, MIMEs whitelist, scan basique.
* **RGPD**:

  * Export/Erase: providers pour inscriptions/abonnements/emprunts (WP Tools).
  * Durées: justificatifs & pièces concours X mois/années (option Core).
  * Finalités documentées dans les pages légales; case consentement sur formulaires.
* **i18n**: textdomain par plugin, `load_plugin_textdomain`, fichiers `.pot`.

---

# Admin UX (résumé)

* Menu **CPFA** (top-level)

  * **Réglages** (Core): Général, PDF & QR, Bibliothèque, Paiements, Notifications, RGPD.
  * **Inscriptions** (Forms): tableau unifié, exports CSV, filtres multi-critères.
  * **Bibliothèque** (Core): Abonnements, Emprunts, Pénalités, Cartes, Livres exclus.
  * **Documents** (PDF): Templates, Aperçus, Historiques de génération.

---

# Tests & Qualité

* **Unitaires**: services (QR, PDF, pénalités), calcul échéances, tokens vérif.
* **E2E** (Playwright/Cypress côté front): scénarios de paiement (mock), génération PDF, webhook.
* **Performance**: pagination REST, `fields=...` minimal, cache transients sur catalogues.
* **CI**: phpcs + phpunit + build Composer.

---

# Roadmap d’implémentation (proposée)

1. **Semaine 1–2** – Core : CPT/Taxo, rôles, meta boxes personnalisées, services (QR, notifications), REST public, pages options.
2. **Semaine 3–4** – Forms : intégration Gravity Forms, mapping, abstraction paiements, webhooks, UI Inscriptions.
3. **Semaine 5** – PDF : mPDF, templates (reçu, convocation, carte), hooks post-paiement, stockage & e-mails.
4. **Semaine 6** – Bibliothèque : abonnements, emprunts, pénalités, rappels cron, blocages.
5. **Semaine 7** – QA/Tests, accessibilité, i18n, docs d'admin (manuel utilisateur).

---

# Intégration Elementor - Widgets CPFA

## Vue d'ensemble

Chaque plugin CPFA inclut des **widgets Elementor personnalisés** pour une intégration fluide et une personnalisation facile. Ces widgets sont optimisés pour Elementor et offrent une expérience utilisateur intuitive avec des contrôles visuels avancés.

## Architecture des Widgets

### Structure commune
```php
<?php
namespace Cpfa\Elementor\Widgets;

use Elementor\Widget_Base;
use Elementor\Controls_Manager;
use Elementor\Group_Control_Typography;
use Elementor\Group_Control_Background;
use Elementor\Group_Control_Border;

abstract class CpfaBaseWidget extends Widget_Base {
    
    protected function register_style_controls() {
        // Contrôles de style communs (couleurs, typographie, espacement)
    }
    
    protected function register_layout_controls() {
        // Contrôles de mise en page communs
    }
}
```

---

## PLUGIN 1 - Widgets Core Manager

### 1. Widget "CPFA Catalogue"
**Nom**: `cpfa-catalogue`
**Catégorie**: CPFA Widgets

**Fonctionnalités**:
- Affichage des formations, séminaires, concours avec filtres
- Mise en page grid/liste personnalisable
- Pagination Ajax
- Recherche en temps réel

**Contrôles Elementor**:
```php
// Contenu
$this->add_control('content_type', [
    'label' => __('Type de contenu', 'cpfa-core'),
    'type' => Controls_Manager::SELECT,
    'options' => [
        'formations' => __('Formations', 'cpfa-core'),
        'seminaires' => __('Séminaires', 'cpfa-core'),
        'concours' => __('Concours', 'cpfa-core'),
        'all' => __('Tout', 'cpfa-core'),
    ],
    'default' => 'all',
]);

$this->add_control('posts_per_page', [
    'label' => __('Nombre d\'éléments', 'cpfa-core'),
    'type' => Controls_Manager::NUMBER,
    'default' => 6,
    'min' => 1,
    'max' => 20,
]);

$this->add_control('layout', [
    'label' => __('Mise en page', 'cpfa-core'),
    'type' => Controls_Manager::SELECT,
    'options' => [
        'grid' => __('Grille', 'cpfa-core'),
        'list' => __('Liste', 'cpfa-core'),
        'carousel' => __('Carrousel', 'cpfa-core'),
    ],
    'default' => 'grid',
]);

// Style
$this->add_group_control(Group_Control_Typography::get_type(), [
    'name' => 'title_typography',
    'label' => __('Typographie du titre', 'cpfa-core'),
    'selector' => '{{WRAPPER}} .cpfa-item-title',
]);

$this->add_control('card_background', [
    'label' => __('Couleur de fond des cartes', 'cpfa-core'),
    'type' => Controls_Manager::COLOR,
    'selectors' => [
        '{{WRAPPER}} .cpfa-catalogue-item' => 'background-color: {{VALUE}}',
    ],
]);
```

### 2. Widget "CPFA Recherche"
**Nom**: `cpfa-search`

**Fonctionnalités**:
- Barre de recherche avec filtres avancés
- Recherche Ajax en temps réel
- Filtres par catégorie, niveau, prix

**Contrôles Elementor**:
```php
$this->add_control('search_placeholder', [
    'label' => __('Texte de placeholder', 'cpfa-core'),
    'type' => Controls_Manager::TEXT,
    'default' => __('Rechercher formations, séminaires...', 'cpfa-core'),
]);

$this->add_control('show_advanced_filters', [
    'label' => __('Filtres avancés', 'cpfa-core'),
    'type' => Controls_Manager::SWITCHER,
    'default' => 'yes',
]);

$this->add_control('filter_by_price', [
    'label' => __('Filtre par prix', 'cpfa-core'),
    'type' => Controls_Manager::SWITCHER,
    'default' => 'yes',
    'condition' => [
        'show_advanced_filters' => 'yes',
    ],
]);

$this->add_control('filter_by_level', [
    'label' => __('Filtre par niveau', 'cpfa-core'),
    'type' => Controls_Manager::SWITCHER,
    'default' => 'yes',
    'condition' => [
        'show_advanced_filters' => 'yes',
    ],
]);

$this->add_control('results_per_page', [
    'label' => __('Résultats par page', 'cpfa-core'),
    'type' => Controls_Manager::NUMBER,
    'default' => 10,
    'min' => 5,
    'max' => 50,
]);
```

### 3. Widget "CPFA Statistiques"
**Nom**: `cpfa-stats`

**Fonctionnalités**:
- Compteurs animés (formations, membres, certificats)
- Graphiques de progression
- Données en temps réel via REST API

**Contrôles Elementor**:
```php
$this->add_control('stats_to_show', [
    'label' => __('Statistiques à afficher', 'cpfa-core'),
    'type' => Controls_Manager::SELECT2,
    'multiple' => true,
    'options' => [
        'formations' => __('Nombre de formations', 'cpfa-core'),
        'seminaires' => __('Nombre de séminaires', 'cpfa-core'),
        'membres' => __('Membres actifs', 'cpfa-core'),
        'certificats' => __('Certificats délivrés', 'cpfa-core'),
        'emprunts' => __('Livres empruntés', 'cpfa-core'),
    ],
    'default' => ['formations', 'membres', 'certificats'],
]);

$this->add_control('animation_duration', [
    'label' => __('Durée d\'animation (ms)', 'cpfa-core'),
    'type' => Controls_Manager::NUMBER,
    'default' => 2000,
    'min' => 500,
    'max' => 5000,
]);

$this->add_control('counter_separator', [
    'label' => __('Séparateur de milliers', 'cpfa-core'),
    'type' => Controls_Manager::TEXT,
    'default' => ' ',
]);

$this->add_responsive_control('stats_columns', [
    'label' => __('Colonnes', 'cpfa-core'),
    'type' => Controls_Manager::SELECT,
    'options' => [
        '1' => '1',
        '2' => '2',
        '3' => '3',
        '4' => '4',
    ],
    'default' => '4',
    'tablet_default' => '2',
    'mobile_default' => '1',
]);
```

### 4. Widget "CPFA Événements à venir"
**Nom**: `cpfa-upcoming-events`

**Fonctionnalités**:
- Affichage des prochaines formations/séminaires
- Compte à rebours pour les événements
- Boutons d'inscription rapide
- Calendrier intégré

**Contrôles Elementor**:
```php
$this->add_control('event_types', [
    'label' => __('Types d\'événements', 'cpfa-core'),
    'type' => Controls_Manager::SELECT2,
    'multiple' => true,
    'options' => [
        'formations' => __('Formations', 'cpfa-core'),
        'seminaires' => __('Séminaires', 'cpfa-core'),
        'concours' => __('Concours', 'cpfa-core'),
    ],
    'default' => ['formations', 'seminaires'],
]);

$this->add_control('events_limit', [
    'label' => __('Nombre d\'événements', 'cpfa-core'),
    'type' => Controls_Manager::NUMBER,
    'default' => 5,
    'min' => 1,
    'max' => 20,
]);

$this->add_control('show_countdown', [
    'label' => __('Afficher le compte à rebours', 'cpfa-core'),
    'type' => Controls_Manager::SWITCHER,
    'default' => 'yes',
]);

$this->add_control('show_quick_register', [
    'label' => __('Bouton inscription rapide', 'cpfa-core'),
    'type' => Controls_Manager::SWITCHER,
    'default' => 'yes',
]);
```

---

## PLUGIN 2 - Widgets Forms & Registrations

### 1. Widget "CPFA Formulaire d'inscription"
**Nom**: `cpfa-registration-form`

**Fonctionnalités**:
- Intégration Gravity Forms/Forminator
- Sélection dynamique des formations/séminaires
- Prévisualisation des prix
- Validation en temps réel

**Contrôles Elementor**:
```php
$this->add_control('form_type', [
    'label' => __('Type de formulaire', 'cpfa-forms'),
    'type' => Controls_Manager::SELECT,
    'options' => [
        'formation' => __('Formation', 'cpfa-forms'),
        'seminaire' => __('Séminaire', 'cpfa-forms'),
        'concours' => __('Concours', 'cpfa-forms'),
        'bibliotheque' => __('Bibliothèque', 'cpfa-forms'),
    ],
]);

$this->add_control('show_price_preview', [
    'label' => __('Afficher l\'aperçu des prix', 'cpfa-forms'),
    'type' => Controls_Manager::SWITCHER,
    'default' => 'yes',
]);

$this->add_control('enable_ajax_validation', [
    'label' => __('Validation Ajax', 'cpfa-forms'),
    'type' => Controls_Manager::SWITCHER,
    'default' => 'yes',
]);
```

### 2. Widget "CPFA Statut d'inscription"
**Nom**: `cpfa-registration-status`

**Fonctionnalités**:
- Vérification du statut par token/email
- Affichage des documents PDF
- Historique des paiements

**Contrôles Elementor**:
```php
$this->add_control('verification_method', [
    'label' => __('Méthode de vérification', 'cpfa-forms'),
    'type' => Controls_Manager::SELECT,
    'options' => [
        'token' => __('Par token', 'cpfa-forms'),
        'email' => __('Par email', 'cpfa-forms'),
        'both' => __('Token ou email', 'cpfa-forms'),
    ],
    'default' => 'both',
]);

$this->add_control('show_payment_history', [
    'label' => __('Afficher l\'historique des paiements', 'cpfa-forms'),
    'type' => Controls_Manager::SWITCHER,
    'default' => 'yes',
]);

$this->add_control('show_pdf_downloads', [
    'label' => __('Liens de téléchargement PDF', 'cpfa-forms'),
    'type' => Controls_Manager::SWITCHER,
    'default' => 'yes',
]);

$this->add_control('auto_refresh', [
    'label' => __('Actualisation automatique (secondes)', 'cpfa-forms'),
    'type' => Controls_Manager::NUMBER,
    'default' => 30,
    'min' => 10,
    'max' => 300,
]);
```

### 3. Widget "CPFA Paiement"
**Nom**: `cpfa-payment-widget`

**Fonctionnalités**:
- Interface de paiement unifiée
- Support Wave/Orange Money/PayDunya
- QR codes de paiement
- Suivi en temps réel

**Contrôles Elementor**:
```php
$this->add_control('payment_gateways', [
    'label' => __('Passerelles de paiement', 'cpfa-forms'),
    'type' => Controls_Manager::SELECT2,
    'multiple' => true,
    'options' => [
        'wave' => __('Wave', 'cpfa-forms'),
        'orange_money' => __('Orange Money', 'cpfa-forms'),
        'paydunya' => __('PayDunya', 'cpfa-forms'),
    ],
    'default' => ['wave', 'orange_money'],
]);

$this->add_control('show_qr_code', [
    'label' => __('Afficher le QR code', 'cpfa-forms'),
    'type' => Controls_Manager::SWITCHER,
    'default' => 'yes',
]);

$this->add_control('payment_timeout', [
    'label' => __('Timeout de paiement (minutes)', 'cpfa-forms'),
    'type' => Controls_Manager::NUMBER,
    'default' => 15,
    'min' => 5,
    'max' => 60,
]);

$this->add_control('success_redirect', [
    'label' => __('Page de redirection (succès)', 'cpfa-forms'),
    'type' => Controls_Manager::URL,
    'placeholder' => __('https://votre-site.com/merci', 'cpfa-forms'),
]);
```

### 4. Widget "CPFA Tableau de bord utilisateur"
**Nom**: `cpfa-user-dashboard`

**Fonctionnalités**:
- Vue d'ensemble des inscriptions de l'utilisateur
- Statuts des paiements
- Documents téléchargeables
- Historique complet

**Contrôles Elementor**:
```php
$this->add_control('dashboard_sections', [
    'label' => __('Sections à afficher', 'cpfa-forms'),
    'type' => Controls_Manager::SELECT2,
    'multiple' => true,
    'options' => [
        'inscriptions' => __('Mes inscriptions', 'cpfa-forms'),
        'paiements' => __('Mes paiements', 'cpfa-forms'),
        'documents' => __('Mes documents', 'cpfa-forms'),
        'bibliotheque' => __('Mes emprunts', 'cpfa-forms'),
        'profil' => __('Mon profil', 'cpfa-forms'),
    ],
    'default' => ['inscriptions', 'paiements', 'documents'],
]);

$this->add_control('items_per_section', [
    'label' => __('Éléments par section', 'cpfa-forms'),
    'type' => Controls_Manager::NUMBER,
    'default' => 5,
    'min' => 3,
    'max' => 20,
]);

$this->add_control('enable_profile_edit', [
    'label' => __('Permettre la modification du profil', 'cpfa-forms'),
    'type' => Controls_Manager::SWITCHER,
    'default' => 'yes',
]);
```

---

## PLUGIN 3 - Widgets PDF Generator

### 1. Widget "CPFA Téléchargement PDF"
**Nom**: `cpfa-pdf-download`

**Fonctionnalités**:
- Liens de téléchargement sécurisés
- Aperçu PDF intégré
- Génération à la demande

### 2. Widget "CPFA Vérification QR"
**Nom**: `cpfa-qr-verify`

**Fonctionnalités**:
- Scanner QR intégré (caméra)
- Vérification instantanée des documents
- Affichage des informations validées

**Contrôles Elementor**:
```php
$this->add_control('verification_types', [
    'label' => __('Types de documents à vérifier', 'cpfa-pdf'),
    'type' => Controls_Manager::SELECT2,
    'multiple' => true,
    'options' => [
        'carte_membre' => __('Cartes de membre', 'cpfa-pdf'),
        'certificat' => __('Certificats', 'cpfa-pdf'),
        'attestation' => __('Attestations', 'cpfa-pdf'),
        'recu' => __('Reçus', 'cpfa-pdf'),
        'convocation' => __('Convocations', 'cpfa-pdf'),
    ],
    'default' => ['carte_membre', 'certificat', 'attestation'],
]);

$this->add_control('enable_camera_scan', [
    'label' => __('Scanner par caméra', 'cpfa-pdf'),
    'type' => Controls_Manager::SWITCHER,
    'default' => 'yes',
]);

$this->add_control('enable_manual_input', [
    'label' => __('Saisie manuelle du token', 'cpfa-pdf'),
    'type' => Controls_Manager::SWITCHER,
    'default' => 'yes',
]);

$this->add_control('show_verification_history', [
    'label' => __('Historique des vérifications', 'cpfa-pdf'),
    'type' => Controls_Manager::SWITCHER,
    'default' => 'no',
]);

$this->add_control('verification_sound', [
    'label' => __('Son de confirmation', 'cpfa-pdf'),
    'type' => Controls_Manager::SWITCHER,
    'default' => 'yes',
]);
```

### 3. Widget "CPFA Galerie de documents"
**Nom**: `cpfa-document-gallery`

**Fonctionnalités**:
- Affichage des templates PDF disponibles
- Aperçu des documents générés
- Statistiques de génération
- Filtres par type de document

**Contrôles Elementor**:
```php
$this->add_control('document_types', [
    'label' => __('Types de documents', 'cpfa-pdf'),
    'type' => Controls_Manager::SELECT2,
    'multiple' => true,
    'options' => [
        'carte_membre' => __('Cartes de membre', 'cpfa-pdf'),
        'certificat' => __('Certificats', 'cpfa-pdf'),
        'attestation' => __('Attestations', 'cpfa-pdf'),
        'recu' => __('Reçus', 'cpfa-pdf'),
        'convocation' => __('Convocations', 'cpfa-pdf'),
        'brochure' => __('Brochures', 'cpfa-pdf'),
    ],
    'default' => ['carte_membre', 'certificat', 'recu'],
]);

$this->add_control('gallery_layout', [
    'label' => __('Mise en page', 'cpfa-pdf'),
    'type' => Controls_Manager::SELECT,
    'options' => [
        'grid' => __('Grille', 'cpfa-pdf'),
        'masonry' => __('Mosaïque', 'cpfa-pdf'),
        'carousel' => __('Carrousel', 'cpfa-pdf'),
    ],
    'default' => 'grid',
]);

$this->add_control('show_preview', [
    'label' => __('Aperçu des documents', 'cpfa-pdf'),
    'type' => Controls_Manager::SWITCHER,
    'default' => 'yes',
]);

$this->add_control('show_download_stats', [
    'label' => __('Statistiques de téléchargement', 'cpfa-pdf'),
    'type' => Controls_Manager::SWITCHER,
    'default' => 'no',
]);
```

### 4. Widget "CPFA Générateur de certificats"
**Nom**: `cpfa-certificate-generator`

**Fonctionnalités**:
- Interface de génération de certificats personnalisés
- Prévisualisation en temps réel
- Templates multiples
- Génération par lot

**Contrôles Elementor**:
```php
$this->add_control('certificate_templates', [
    'label' => __('Templates disponibles', 'cpfa-pdf'),
    'type' => Controls_Manager::SELECT2,
    'multiple' => true,
    'options' => [
        'formation_standard' => __('Formation standard', 'cpfa-pdf'),
        'seminaire_participation' => __('Séminaire participation', 'cpfa-pdf'),
        'concours_reussite' => __('Concours réussite', 'cpfa-pdf'),
        'bibliotheque_membre' => __('Membre bibliothèque', 'cpfa-pdf'),
    ],
    'default' => ['formation_standard', 'seminaire_participation'],
]);

$this->add_control('enable_preview', [
    'label' => __('Prévisualisation temps réel', 'cpfa-pdf'),
    'type' => Controls_Manager::SWITCHER,
    'default' => 'yes',
]);

$this->add_control('enable_batch_generation', [
    'label' => __('Génération par lot', 'cpfa-pdf'),
    'type' => Controls_Manager::SWITCHER,
    'default' => 'no',
]);

$this->add_control('auto_email_delivery', [
    'label' => __('Envoi automatique par email', 'cpfa-pdf'),
    'type' => Controls_Manager::SWITCHER,
    'default' => 'yes',
]);

$this->add_control('watermark_enabled', [
    'label' => __('Filigrane de sécurité', 'cpfa-pdf'),
    'type' => Controls_Manager::SWITCHER,
    'default' => 'yes',
]);
```

---

## Exemple d'implémentation - Widget Catalogue

```php
<?php
namespace Cpfa\Core\Elementor\Widgets;

use Cpfa\Elementor\Widgets\CpfaBaseWidget;
use Elementor\Controls_Manager;
use Elementor\Group_Control_Typography;

class CatalogueWidget extends CpfaBaseWidget {

    public function get_name() {
        return 'cpfa-catalogue';
    }

    public function get_title() {
        return __('CPFA Catalogue', 'cpfa-core');
    }

    public function get_icon() {
        return 'eicon-posts-grid';
    }

    public function get_categories() {
        return ['cpfa-widgets'];
    }

    protected function register_controls() {
        
        // Section Contenu
        $this->start_controls_section('content_section', [
            'label' => __('Contenu', 'cpfa-core'),
            'tab' => Controls_Manager::TAB_CONTENT,
        ]);

        $this->add_control('content_type', [
            'label' => __('Type de contenu', 'cpfa-core'),
            'type' => Controls_Manager::SELECT,
            'options' => [
                'formations' => __('Formations', 'cpfa-core'),
                'seminaires' => __('Séminaires', 'cpfa-core'),
                'concours' => __('Concours', 'cpfa-core'),
                'all' => __('Tout', 'cpfa-core'),
            ],
            'default' => 'all',
        ]);

        $this->add_control('posts_per_page', [
            'label' => __('Nombre d\'éléments', 'cpfa-core'),
            'type' => Controls_Manager::NUMBER,
            'default' => 6,
            'min' => 1,
            'max' => 20,
        ]);

        $this->add_control('layout', [
            'label' => __('Mise en page', 'cpfa-core'),
            'type' => Controls_Manager::SELECT,
            'options' => [
                'grid' => __('Grille', 'cpfa-core'),
                'list' => __('Liste', 'cpfa-core'),
                'carousel' => __('Carrousel', 'cpfa-core'),
            ],
            'default' => 'grid',
        ]);

        $this->add_control('show_filters', [
            'label' => __('Afficher les filtres', 'cpfa-core'),
            'type' => Controls_Manager::SWITCHER,
            'default' => 'yes',
        ]);

        $this->add_control('enable_ajax', [
            'label' => __('Chargement Ajax', 'cpfa-core'),
            'type' => Controls_Manager::SWITCHER,
            'default' => 'yes',
        ]);

        $this->end_controls_section();

        // Section Style
        $this->start_controls_section('style_section', [
            'label' => __('Style', 'cpfa-core'),
            'tab' => Controls_Manager::TAB_STYLE,
        ]);

        $this->add_group_control(Group_Control_Typography::get_type(), [
            'name' => 'title_typography',
            'label' => __('Typographie du titre', 'cpfa-core'),
            'selector' => '{{WRAPPER}} .cpfa-item-title',
        ]);

        $this->add_control('card_background', [
            'label' => __('Couleur de fond des cartes', 'cpfa-core'),
            'type' => Controls_Manager::COLOR,
            'selectors' => [
                '{{WRAPPER}} .cpfa-catalogue-item' => 'background-color: {{VALUE}}',
            ],
        ]);

        $this->add_responsive_control('columns', [
            'label' => __('Colonnes', 'cpfa-core'),
            'type' => Controls_Manager::SELECT,
            'options' => [
                '1' => '1',
                '2' => '2',
                '3' => '3',
                '4' => '4',
            ],
            'default' => '3',
            'tablet_default' => '2',
            'mobile_default' => '1',
            'selectors' => [
                '{{WRAPPER}} .cpfa-catalogue-grid' => 'grid-template-columns: repeat({{VALUE}}, 1fr)',
            ],
            'condition' => [
                'layout' => 'grid',
            ],
        ]);

        $this->end_controls_section();
    }

    protected function render() {
        $settings = $this->get_settings_for_display();
        
        $args = [
            'post_type' => $this->get_post_types($settings['content_type']),
            'posts_per_page' => $settings['posts_per_page'],
            'post_status' => 'publish',
        ];

        $query = new \WP_Query($args);

        if ($query->have_posts()) {
            echo '<div class="cpfa-catalogue-widget cpfa-layout-' . esc_attr($settings['layout']) . '">';
            
            if ($settings['show_filters'] === 'yes') {
                $this->render_filters($settings);
            }

            echo '<div class="cpfa-catalogue-' . esc_attr($settings['layout']) . '">';
            
            while ($query->have_posts()) {
                $query->the_post();
                $this->render_item($settings);
            }
            
            echo '</div>';
            
            if ($settings['enable_ajax'] === 'yes') {
                $this->render_pagination($query);
            }
            
            echo '</div>';
        }

        wp_reset_postdata();
    }

    private function get_post_types($content_type) {
        switch ($content_type) {
            case 'formations':
                return ['cpfa_formation'];
            case 'seminaires':
                return ['cpfa_seminaire'];
            case 'concours':
                return ['cpfa_concours'];
            default:
                return ['cpfa_formation', 'cpfa_seminaire', 'cpfa_concours'];
        }
    }

    private function render_item($settings) {
        $post_type = get_post_type();
        $price = get_post_meta(get_the_ID(), '_cpfa_' . str_replace('cpfa_', '', $post_type) . '_prix', true);
        $duration = get_post_meta(get_the_ID(), '_cpfa_' . str_replace('cpfa_', '', $post_type) . '_duree', true);
        
        ?>
        <div class="cpfa-catalogue-item">
            <?php if (has_post_thumbnail()) : ?>
                <div class="cpfa-item-image">
                    <?php the_post_thumbnail('medium'); ?>
                </div>
            <?php endif; ?>
            
            <div class="cpfa-item-content">
                <h3 class="cpfa-item-title"><?php the_title(); ?></h3>
                <div class="cpfa-item-excerpt"><?php the_excerpt(); ?></div>
                
                <div class="cpfa-item-meta">
                    <?php if ($price) : ?>
                        <span class="cpfa-price"><?php echo number_format($price); ?> FCFA</span>
                    <?php endif; ?>
                    
                    <?php if ($duration) : ?>
                        <span class="cpfa-duration"><?php echo $duration; ?>h</span>
                    <?php endif; ?>
                </div>
                
                <a href="<?php the_permalink(); ?>" class="cpfa-item-link">
                    <?php _e('En savoir plus', 'cpfa-core'); ?>
                </a>
            </div>
        </div>
        <?php
    }

    private function render_filters($settings) {
        ?>
        <div class="cpfa-catalogue-filters">
            <select class="cpfa-filter-type">
                <option value=""><?php _e('Tous les types', 'cpfa-core'); ?></option>
                <option value="formations"><?php _e('Formations', 'cpfa-core'); ?></option>
                <option value="seminaires"><?php _e('Séminaires', 'cpfa-core'); ?></option>
                <option value="concours"><?php _e('Concours', 'cpfa-core'); ?></option>
            </select>
            
            <input type="text" class="cpfa-filter-search" placeholder="<?php _e('Rechercher...', 'cpfa-core'); ?>">
        </div>
        <?php
    }

    private function render_pagination($query) {
        if ($query->max_num_pages > 1) {
            ?>
            <div class="cpfa-pagination">
                <button class="cpfa-load-more" data-page="1" data-max="<?php echo $query->max_num_pages; ?>">
                    <?php _e('Charger plus', 'cpfa-core'); ?>
                </button>
            </div>
            <?php
        }
    }
}
```

## Enregistrement des Widgets

```php
// Dans chaque plugin
add_action('elementor/widgets/register', function($widgets_manager) {
    // Core Manager
    $widgets_manager->register(new \Cpfa\Core\Elementor\Widgets\CatalogueWidget());
    $widgets_manager->register(new \Cpfa\Core\Elementor\Widgets\SearchWidget());
    $widgets_manager->register(new \Cpfa\Core\Elementor\Widgets\StatsWidget());
    
    // Forms & Registrations
    $widgets_manager->register(new \Cpfa\Forms\Elementor\Widgets\RegistrationFormWidget());
    $widgets_manager->register(new \Cpfa\Forms\Elementor\Widgets\StatusWidget());
    $widgets_manager->register(new \Cpfa\Forms\Elementor\Widgets\PaymentWidget());
    
    // PDF Generator
    $widgets_manager->register(new \Cpfa\Pdf\Elementor\Widgets\PdfDownloadWidget());
    $widgets_manager->register(new \Cpfa\Pdf\Elementor\Widgets\QrVerifyWidget());
});

// Création de la catégorie CPFA
add_action('elementor/elements/categories_registered', function($elements_manager) {
    $elements_manager->add_category('cpfa-widgets', [
        'title' => __('CPFA Widgets', 'cpfa-core'),
        'icon' => 'fa fa-graduation-cap',
    ]);
});
```

## Styles CSS pour Elementor

```css
/* Styles communs pour tous les widgets CPFA */
.cpfa-catalogue-widget {
    --cpfa-primary: #2c5aa0;
    --cpfa-secondary: #f8f9fa;
    --cpfa-accent: #28a745;
}

.cpfa-catalogue-grid {
    display: grid;
    gap: 20px;
    grid-template-columns: repeat(3, 1fr);
}

.cpfa-catalogue-item {
    background: var(--cpfa-secondary);
    border-radius: 8px;
    overflow: hidden;
    transition: transform 0.3s ease;
}

.cpfa-catalogue-item:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
}

.cpfa-item-title {
    color: var(--cpfa-primary);
    font-weight: 600;
    margin-bottom: 10px;
}

.cpfa-item-link {
    background: var(--cpfa-primary);
    color: white;
    padding: 10px 20px;
    border-radius: 4px;
    text-decoration: none;
    display: inline-block;
    transition: background 0.3s ease;
}

.cpfa-item-link:hover {
    background: var(--cpfa-accent);
}

/* Responsive */
@media (max-width: 768px) {
    .cpfa-catalogue-grid {
        grid-template-columns: 1fr;
    }
}
```

---

# Livrables

* 3 plugins versionnés (Git), **README** + **manuel admin** (PDF).
* Fichiers **.pot**, schémas de meta boxes (JSON), scripts d'import pages/formulaires.
* **8 widgets Elementor** personnalisés avec contrôles avancés et styles responsifs.
* Jeux de **templates PDF** (carte, reçu, convocation, attestation).
* **Documentation Elementor** avec exemples d'utilisation et personnalisation.
* Jeux d'essai (fixtures) pour QA.

---
