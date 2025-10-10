# 🐳 Guide Docker - CPFA WordPress Plugin System

## 📋 Vue d'ensemble

Environnement Docker complet pour tester les plugins CPFA sur WordPress avec:
- WordPress (dernière version)
- MySQL 8.0
- phpMyAdmin
- MailHog (capture emails)
- WP-CLI

## 🚀 Installation rapide

### Méthode 1: Script automatique (Recommandé)

```bash
cd /home/youssoupha/project/cpfa
./setup-wordpress.sh
```

Le script va automatiquement:
- ✅ Démarrer les containers Docker
- ✅ Installer WordPress
- ✅ Activer le plugin CPFA Core Manager
- ✅ Installer Elementor
- ✅ Créer des données de test
- ✅ Tout configurer

**Durée:** ~2-3 minutes

### Méthode 2: Installation manuelle

```bash
# 1. Démarrer les containers
docker-compose up -d

# 2. Attendre que WordPress soit prêt (30-60 secondes)
sleep 30

# 3. Installer WordPress
docker-compose run --rm wpcli core install \
    --url=http://localhost:8080 \
    --title="CPFA Training Center" \
    --admin_user=admin \
    --admin_password=admin123 \
    --admin_email=admin@cpfa.local

# 4. Activer le plugin
docker-compose run --rm wpcli plugin activate cpfa-core-manager

# 5. Installer Elementor
docker-compose run --rm wpcli plugin install elementor --activate
```

## 🌐 URLs d'accès

| Service | URL | Description |
|---------|-----|-------------|
| **WordPress** | http://localhost:8080 | Site principal |
| **Admin** | http://localhost:8080/wp-admin | Tableau de bord WordPress |
| **phpMyAdmin** | http://localhost:8081 | Gestion base de données |
| **MailHog** | http://localhost:8025 | Capture des emails |

## 🔐 Identifiants

### WordPress Admin
- **URL:** http://localhost:8080/wp-admin
- **Utilisateur:** `admin`
- **Mot de passe:** `admin123`

### Base de données
- **Host:** `localhost:3306` (ou `db:3306` depuis un container)
- **Database:** `wordpress`
- **User:** `wordpress`
- **Password:** `wordpress`
- **Root Password:** `rootpassword`

### phpMyAdmin
- **URL:** http://localhost:8081
- **Serveur:** `db`
- **Utilisateur:** `wordpress` ou `root`
- **Mot de passe:** `wordpress` ou `rootpassword`

## 📦 Services Docker

### 1. WordPress (`cpfa_wordpress`)
- **Image:** wordpress:latest
- **Port:** 8080
- **Volume plugin:** Le plugin est monté directement depuis votre projet
- **Debug:** Activé (logs dans `/var/www/html/wp-content/debug.log`)

### 2. MySQL (`cpfa_mysql`)
- **Image:** mysql:8.0
- **Port:** 3306
- **Volume:** Données persistées dans `db_data`

### 3. phpMyAdmin (`cpfa_phpmyadmin`)
- **Image:** phpmyadmin/phpmyadmin
- **Port:** 8081
- **Usage:** Gérer la base de données visuellement

### 4. WP-CLI (`cpfa_wpcli`)
- **Image:** wordpress:cli
- **Usage:** Exécuter des commandes WordPress

### 5. MailHog (`cpfa_mailhog`)
- **Image:** mailhog/mailhog
- **Port web:** 8025
- **Port SMTP:** 1025
- **Usage:** Capturer tous les emails envoyés par WordPress

## 🛠️ Commandes utiles

### Gestion des containers

```bash
# Démarrer tous les services
docker-compose up -d

# Arrêter tous les services
docker-compose down

# Redémarrer un service
docker-compose restart wordpress

# Voir les logs
docker-compose logs -f wordpress

# Voir l'état des containers
docker-compose ps

# Supprimer tout (containers + volumes)
docker-compose down -v
```

### WP-CLI - Commandes WordPress

```bash
# Info WordPress
docker-compose run --rm wpcli core version

# Liste des plugins
docker-compose run --rm wpcli plugin list

# Activer/Désactiver plugin
docker-compose run --rm wpcli plugin activate cpfa-core-manager
docker-compose run --rm wpcli plugin deactivate cpfa-core-manager

# Créer un utilisateur
docker-compose run --rm wpcli user create john john@example.com \
    --role=administrator \
    --user_pass=password123

# Liste des posts
docker-compose run --rm wpcli post list --post_type=cpfa_formation

# Créer une formation
docker-compose run --rm wpcli post create \
    --post_type=cpfa_formation \
    --post_title="Ma Formation" \
    --post_status=publish

# Flush cache
docker-compose run --rm wpcli cache flush

# Régénérer permaliens
docker-compose run --rm wpcli rewrite flush

# Exporter la base de données
docker-compose run --rm wpcli db export - > backup.sql

# Importer la base de données
docker-compose run --rm wpcli db import < backup.sql

# Rechercher/remplacer dans la BDD
docker-compose run --rm wpcli search-replace 'old-url.com' 'new-url.com'
```

### MySQL - Commandes base de données

```bash
# Se connecter à MySQL
docker-compose exec db mysql -u wordpress -pwordpress wordpress

# Backup base de données
docker-compose exec db mysqldump -u wordpress -pwordpress wordpress > backup.sql

# Restore base de données
docker-compose exec -T db mysql -u wordpress -pwordpress wordpress < backup.sql

# Accès shell MySQL
docker-compose exec db bash
```

### Accès shell containers

```bash
# Shell WordPress
docker-compose exec wordpress bash

# Shell MySQL
docker-compose exec db bash

# Exécuter une commande PHP
docker-compose exec wordpress php -v
```

## 🧪 Tests et développement

### Activer le mode debug

Le mode debug est déjà activé par défaut. Les logs sont disponibles:

```bash
# Voir les logs WordPress
docker-compose exec wordpress tail -f /var/www/html/wp-content/debug.log

# Voir les logs PHP
docker-compose logs -f wordpress
```

### Modifier le plugin

Les modifications sont reflétées immédiatement:
1. Éditez les fichiers dans `/home/youssoupha/project/cpfa/cpfa-core-manager/`
2. Rechargez la page WordPress
3. Les changements sont appliqués instantanément

### Tester les emails

1. Aller sur http://localhost:8025
2. Déclencher un email dans WordPress
3. Voir l'email capturé dans MailHog

### Tester les widgets Elementor

1. Créer une nouvelle page dans WordPress
2. Éditer avec Elementor
3. Chercher "CPFA Widgets" dans le panneau gauche
4. Glisser-déposer les widgets:
   - CPFA Catalogue
   - CPFA Recherche
   - CPFA Statistiques
   - CPFA Événements à venir

## 📊 Données de test

Le script `setup-wordpress.sh` crée automatiquement:

### Formations
- Gestion de Projet Agile (Diplômante, 120h, 150,000 FCFA)
- Développement Web Full Stack (Certifiante, 200h, 250,000 FCFA)

### Séminaires
- Leadership et Management d'Équipe (2 jours, 75,000 FCFA)

### Ressources
- Clean Code - Robert C. Martin (Livre disponible)

### Créer plus de données

```bash
# Formation
docker-compose run --rm wpcli post create \
    --post_type=cpfa_formation \
    --post_title="Cybersécurité" \
    --post_content="Formation en sécurité informatique" \
    --post_status=publish

# Puis ajouter les meta données via Admin ou WP-CLI
```

## 🔧 Configuration personnalisée

### Changer les ports

Éditez `docker-compose.yml`:

```yaml
ports:
  - "9000:80"  # WordPress sur port 9000
```

### Activer HTTPS (optionnel)

Ajoutez un proxy reverse (Traefik, Nginx) ou utilisez:

```bash
docker-compose run --rm wpcli config set WP_HOME 'https://localhost:8080'
docker-compose run --rm wpcli config set WP_SITEURL 'https://localhost:8080'
```

### Changer la version PHP

Éditez `docker-compose.yml`:

```yaml
wordpress:
  image: wordpress:php8.1  # ou php8.2, php8.0
```

### Ajouter des plugins additionnels

```bash
# Installer un plugin depuis le repo
docker-compose run --rm wpcli plugin install contact-form-7 --activate

# Installer depuis un zip
docker-compose run --rm wpcli plugin install /path/to/plugin.zip --activate
```

## 🐛 Dépannage

### WordPress ne démarre pas

```bash
# Vérifier les logs
docker-compose logs wordpress

# Redémarrer proprement
docker-compose down
docker-compose up -d
```

### Erreur de connexion à la base de données

```bash
# Vérifier que MySQL est prêt
docker-compose logs db

# Attendre 30 secondes puis réessayer
sleep 30
docker-compose restart wordpress
```

### Plugin non visible

```bash
# Vérifier les permissions
docker-compose exec wordpress ls -la /var/www/html/wp-content/plugins/

# Réactiver le plugin
docker-compose run --rm wpcli plugin deactivate cpfa-core-manager
docker-compose run --rm wpcli plugin activate cpfa-core-manager

# Flush permaliens
docker-compose run --rm wpcli rewrite flush
```

### Erreur 500

```bash
# Vérifier les logs d'erreur
docker-compose exec wordpress tail -f /var/www/html/wp-content/debug.log

# Vérifier les logs PHP
docker-compose logs -f wordpress

# Vérifier la syntaxe PHP
docker-compose exec wordpress php -l /var/www/html/wp-content/plugins/cpfa-core-manager/cpfa-core-manager.php
```

### Réinitialiser complètement

```bash
# Supprimer tout et recommencer
docker-compose down -v
rm -rf ~/.docker/volumes/cpfa_*
./setup-wordpress.sh
```

## 📈 Performance

### Optimiser la vitesse

```bash
# Installer un plugin de cache
docker-compose run --rm wpcli plugin install wp-super-cache --activate

# Activer le cache d'objets
docker-compose run --rm wpcli config set WP_CACHE true
```

### Limiter la mémoire PHP

Éditez `docker-compose.yml`:

```yaml
environment:
  WORDPRESS_CONFIG_EXTRA: |
    define('WP_MEMORY_LIMIT', '256M');
    define('WP_MAX_MEMORY_LIMIT', '512M');
```

## 🔐 Sécurité

### Pour la production

**⚠️ NE PAS utiliser cet environnement en production!**

Pour la production:
1. Changer TOUS les mots de passe
2. Utiliser des certificats SSL
3. Configurer un firewall
4. Désactiver le mode debug
5. Utiliser des secrets Docker
6. Mettre à jour régulièrement

### Changer les mots de passe

```bash
# Mot de passe admin WordPress
docker-compose run --rm wpcli user update admin --user_pass=nouveau_mot_de_passe_fort

# Mot de passe BDD (dans docker-compose.yml)
```

## 📚 Ressources

### Liens utiles
- [Docker Documentation](https://docs.docker.com/)
- [WordPress Docker](https://hub.docker.com/_/wordpress)
- [WP-CLI Commands](https://developer.wordpress.org/cli/commands/)
- [Elementor Documentation](https://elementor.com/help/)

### Support CPFA
- Documentation: `INSTALLATION.md`
- Guide dev: `CLAUDE.md`
- Spécifications: `cahier_des_charges.md`

## 🎯 Checklist de test

- [ ] WordPress accessible sur http://localhost:8080
- [ ] Connexion admin fonctionnelle
- [ ] Plugin CPFA Core Manager activé
- [ ] Menu CPFA visible dans l'admin
- [ ] CPTs créés (Formations, Séminaires, etc.)
- [ ] Création d'une formation avec meta boxes
- [ ] REST API accessible (`/wp-json/cpfa/v1/formations`)
- [ ] Widgets Elementor disponibles
- [ ] Page test avec widgets CPFA créée
- [ ] Emails capturés dans MailHog
- [ ] phpMyAdmin accessible

---

**Date de création:** 2025-10-09
**Version Docker Compose:** 3.8
**Prêt pour:** Développement et Tests
