# 🎓 CPFA WordPress Plugin System

Système complet de gestion pour un centre de formation et une bibliothèque, développé avec WordPress natif.

## 📦 Composition du projet

### ✅ Plugin 1: CPFA Core Manager (100% COMPLET)
Système de base avec CPT, taxonomies, services, REST API, widgets Elementor, **et système complet de gestion de bibliothèque**.

**Fonctionnalités:**
- 6 Custom Post Types (Formations, Séminaires, Concours, Ressources, Abonnements, Emprunts)
- REST API complète (7 endpoints)
- 5 Widgets Elementor (Catalogue, Recherche, Stats, Événements, **Bibliothèque**)
- Services (QR codes, Notifications, Paiements)
- **Système de bibliothèque complet:**
  - Interface admin (Dashboard, Emprunts, Retours, Pénalités)
  - Workflow d'emprunt/retour automatisé
  - Calcul automatique des pénalités (500 FCFA/jour après 3 jours)
  - Widget public avec recherche et filtres
  - AJAX pour toutes les opérations
- Cron jobs automatiques
- 30+ fichiers, ~9000 lignes de code

### 🔄 Plugin 2: CPFA Forms & Registrations (À développer)
Gestion des inscriptions et paiements.

### 📄 Plugin 3: CPFA PDF Generator (À développer)
Génération de documents PDF.

## 🚀 Installation rapide avec Docker

### Prérequis
- Docker
- Docker Compose

### Installation (2-3 minutes)

```bash
cd /home/youssoupha/project/cpfa

# Méthode 1: Makefile (recommandé)
make install

# Méthode 2: Script
./setup-wordpress.sh

# Méthode 3: Manuel
docker-compose up -d
```

### Accès immédiat
- **WordPress:** http://localhost:8080
- **Admin:** http://localhost:8080/wp-admin (admin / admin123)
- **phpMyAdmin:** http://localhost:8081
- **MailHog:** http://localhost:8025

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [README_DOCKER.md](README_DOCKER.md) | Guide installation Docker (ultra-rapide) |
| [DOCKER_GUIDE.md](DOCKER_GUIDE.md) | Documentation Docker complète |
| [INSTALLATION.md](INSTALLATION.md) | Guide installation détaillé |
| [CLAUDE.md](CLAUDE.md) | Guide développement |
| [LIBRARY_FEATURES.md](LIBRARY_FEATURES.md) | **Système de bibliothèque (NOUVEAU)** |
| [PROJECT_STATUS.md](PROJECT_STATUS.md) | État du projet |
| [RESUME_FINAL.md](RESUME_FINAL.md) | Résumé complet |

## 🎯 Commandes utiles

```bash
# Démarrer/Arrêter
make start
make stop

# Logs
make logs

# WP-CLI
make wp ARGS='plugin list'

# Backup
make backup

# Tests API
make test-api

# Aide complète
make help
```

## 🔧 Développement

### Structure du projet

```
cpfa/
├── cpfa-core-manager/          # Plugin 1 (✅ Complet)
│   ├── includes/
│   │   ├── cpt/                # Custom Post Types
│   │   ├── meta-boxes/         # Meta boxes natives
│   │   ├── services/           # QR, Notifications, Paiements
│   │   ├── rest-api/           # 7 endpoints
│   │   ├── settings/           # Pages de configuration
│   │   └── elementor/          # 4 widgets
│   └── assets/                 # CSS + JavaScript
├── cpfa-forms-registrations/  # Plugin 2 (À développer)
├── cpfa-pdf-generator/         # Plugin 3 (À développer)
├── docker-compose.yml          # Configuration Docker
└── Makefile                    # Commandes simplifiées
```

### Développement en temps réel

Les modifications sont reflétées immédiatement:
1. Éditez les fichiers du plugin
2. Rechargez WordPress
3. Changements appliqués instantanément

### Tester les widgets Elementor

1. Créer une page WordPress
2. Éditer avec Elementor
3. Chercher "CPFA Widgets" dans le panneau
4. Ajouter les widgets disponibles

## 🌟 Fonctionnalités principales

### Custom Post Types
- **Formations** - Gestion des formations diplômantes/certifiantes
- **Séminaires** - Organisation de séminaires
- **Concours** - Gestion des concours
- **Ressources** - Catalogue bibliothèque
- **Abonnements** - Membres bibliothèque
- **Emprunts** - Gestion des prêts avec pénalités auto

### REST API Publique
- `/wp-json/cpfa/v1/catalogue` - Liste complète
- `/wp-json/cpfa/v1/formations` - Formations
- `/wp-json/cpfa/v1/seminaires` - Séminaires
- `/wp-json/cpfa/v1/concours` - Concours
- `/wp-json/cpfa/v1/verif/{token}` - Vérification QR
- `/wp-json/cpfa/v1/stats` - Statistiques

### Widgets Elementor
- **Catalogue** - Grille/liste avec filtres Ajax
- **Recherche** - Recherche avancée temps réel
- **Statistiques** - Compteurs animés
- **Événements** - À venir avec countdown

### Services
- **QR Codes** - Génération PNG/SVG, tokens, vérification
- **Notifications** - Emails HTML, rappels automatiques
- **Paiements** - Interface gateway, webhooks

### Automatisations
- Rappels emprunts (J-3, J+1, J+4)
- Expiration abonnements (J-30, J-7, J-1)
- Calcul pénalités (500 FCFA/jour dès J+4)
- Nettoyage cache

## 🔐 Sécurité

- ✅ Nonces sur toutes les actions
- ✅ Vérification capabilities
- ✅ Sanitization inputs
- ✅ Escaping outputs
- ✅ Requêtes SQL préparées
- ✅ Validation webhooks

## 📊 Qualité du code

- WordPress Coding Standards
- PSR-4 Autoloading
- Documentation inline
- Architecture modulaire
- Pas de dépendance ACF Pro

## 🧪 Tests

```bash
# Vérifier standards WordPress
make phpcs

# Correction automatique
make phpcbf

# Test endpoints API
make test-api

# Créer données de test
make test-data
```

## 🎓 Exemples de code

### Créer une formation

```php
$formation_id = wp_insert_post([
    'post_type' => 'cpfa_formation',
    'post_title' => 'Gestion de projet',
    'post_status' => 'publish'
]);

update_post_meta($formation_id, '_cpfa_formation_prix', 150000);
```

### Générer un QR code

```php
use Cpfa\Core\Services\QR_Service;

$token = QR_Service::generate_token($post_id, 'abonnement');
$qr = QR_Service::generate_png(
    QR_Service::get_verification_url($token)
);
```

### Appeler REST API

```javascript
fetch('/wp-json/cpfa/v1/formations')
    .then(res => res.json())
    .then(data => console.log(data));
```

## 🤝 Contribution

Le plugin est en développement actif. Pour contribuer:
1. Fork le projet
2. Créer une branche feature
3. Commiter les changements
4. Pousser vers la branche
5. Ouvrir une Pull Request

## 📝 Licence

GPL v2 or later

## 📞 Support

- **Documentation:** Voir les fichiers .md
- **Issues:** GitHub Issues
- **Email:** support@cpfa.local

## 🏆 Crédits

Développé avec:
- WordPress 6.0+
- PHP 8.0+
- Elementor
- Composer
- Docker

---

**Version:** 1.0.0
**Date:** 2025-10-09
**Statut:** Plugin 1 Production Ready ✅

## 🎯 Roadmap

- [x] Plugin 1: CPFA Core Manager
- [ ] Plugin 2: CPFA Forms & Registrations
- [ ] Plugin 3: CPFA PDF Generator
- [ ] Tests unitaires complets
- [ ] Documentation utilisateur
- [ ] Vidéos tutoriels

**Prochaine étape:** Développement Plugin 2 🚀
