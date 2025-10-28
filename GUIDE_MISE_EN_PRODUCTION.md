# 🚀 GUIDE DE MISE EN PRODUCTION - CPFA v1.1.0

## 📋 Pré-requis

### Environnement Serveur
- PHP >= 8.0
- MySQL >= 5.7 ou MariaDB >= 10.2
- WordPress >= 6.0
- Apache/Nginx avec mod_rewrite
- Composer installé (pour dépendances)
- SSL/TLS activé (HTTPS obligatoire)

### Extensions PHP Requises
```bash
php -m | grep -E 'pdo|mysqli|mbstring|gd|zip|curl|json|xml'
```

---

## 🔧 INSTALLATION

### 1. Préparation des Fichiers

```bash
# Cloner le repository
cd /var/www/wordpress/wp-content/plugins/
git clone [REPO_URL] cpfa

# Ou upload ZIP via FTP
# puis décompresser dans wp-content/plugins/

cd cpfa
```

### 2. Installation des Dépendances

```bash
# Installer Composer dependencies
composer install --no-dev --optimize-autoloader

# Installer Select2 localement
chmod +x install-select2.sh
./install-select2.sh

# Vérifier installation
ls cpfa-core-manager/assets/vendor/select2/
# Doit afficher: select2.min.css, select2.min.js
```

### 3. Configuration WordPress

#### a. Activer les Plugins

Dans WordPress Admin:
1. Extensions → Plugins installés
2. Activer dans l'ordre:
   - ✅ **CPFA Core Manager** (obligatoire)
   - ⏸️ **CPFA Forms & Registrations** (optionnel, en dev)
   - ⏸️ **CPFA PDF Generator** (optionnel, en dev)

#### b. Vérifier Activation

Logs de migration:
```bash
tail -f wp-content/uploads/cpfa-logs/cpfa-$(date +%Y-%m-%d).log
```

Rechercher:
```
[INFO] CPFA Core Manager activated
[INFO] Meta keys migration completed successfully
```

### 4. Configuration Environnement

#### a. Définir le Niveau de Log

Dans `wp-config.php`:
```php
// Production: WARNING seulement
define('CPFA_LOG_LEVEL', 'warning');

// Development: DEBUG tout
// define('CPFA_LOG_LEVEL', 'debug');
```

#### b. Configurer Cache (Optionnel)

Si Redis/Memcached disponible:
```php
// Dans wp-config.php
define('WP_CACHE', true);
define('CPFA_USE_EXTERNAL_CACHE', true);
```

---

## 🔐 SÉCURITÉ

### 1. Protéger les Logs

Vérifier `.htaccess` dans `/wp-content/uploads/cpfa-logs/`:
```apache
Order deny,allow
Deny from all
```

### 2. Configurer Rate Limiting

Par défaut:
- REST API: 60 req/min
- AJAX: 30 req/min
- Login: 5 essais/15min

Pour modifier, utiliser filtres:
```php
// Dans functions.php du thème
add_filter('cpfa_config_get_rate_limit_rest_api', function($limit) {
    return 100; // Augmenter à 100 req/min
});
```

### 3. Configurer Pénalités (Optionnel)

```php
add_filter('cpfa_config_get_penalty_rate_per_day', function($rate) {
    return 1000; // 1000 FCFA au lieu de 500
});

add_filter('cpfa_config_get_grace_period_days', function($days) {
    return 5; // 5 jours au lieu de 3
});
```

---

## ⚙️ CONFIGURATION

### 1. Créer les Rôles et Permissions

Les rôles sont créés automatiquement lors de l'activation:
- **CPFA Administrateur**: Accès complet
- **CPFA Bibliothécaire**: Gestion bibliothèque
- **CPFA Gestionnaire**: Gestion formations

Pour assigner:
1. Utilisateurs → Tous les utilisateurs
2. Modifier un utilisateur
3. Rôle → Choisir rôle CPFA

### 2. Configurer les Pages

Créer pages WordPress pour:
- `/bibliotheque/` - Catalogue bibliothèque
- `/formations/` - Liste formations
- `/inscription/` - Formulaire inscription

Utiliser Elementor avec widgets CPFA.

### 3. Configurer Cron Jobs

Vérifier cron WordPress actif:
```bash
wp cron event list
```

Doit afficher:
- `cpfa_daily_loan_reminders`
- `cpfa_daily_penalty_calculation`
- `cpfa_daily_subscription_check`
- `cpfa_daily_log_rotation`

Si problème:
```bash
wp cron event run cpfa_daily_loan_reminders
```

---

## 📊 MONITORING

### 1. Activer Monitoring Logs

```bash
# Créer cron pour surveiller erreurs
cat > /etc/cron.daily/cpfa-check-errors <<'EOF'
#!/bin/bash
LOG_FILE="/var/www/wordpress/wp-content/uploads/cpfa-logs/cpfa-$(date +%Y-%m-%d).log"

if [ -f "$LOG_FILE" ]; then
    ERRORS=$(grep -c "\[ERROR\]" "$LOG_FILE")
    if [ "$ERRORS" -gt 10 ]; then
        echo "CPFA: $ERRORS erreurs détectées aujourd'hui!" | mail -s "CPFA Alert" admin@example.com
    fi
fi
EOF

chmod +x /etc/cron.daily/cpfa-check-errors
```

### 2. Dashboard Admin

Accéder à: CPFA → Tableau de bord

Vérifier:
- ✅ Statistiques temps réel
- ✅ Emprunts actifs
- ✅ Ressources disponibles
- ✅ Pénalités impayées

### 3. Vérifier API Health

```bash
# Test REST API
curl -i https://votresite.com/wp-json/cpfa/v1/stats

# Doit retourner HTTP/1.1 200 OK
# Avec headers X-RateLimit-*
```

---

## 🔄 MIGRATION DONNÉES EXISTANTES

Si vous migrez depuis version < 1.1.0:

### 1. Backup Complet

```bash
# Database
wp db export backup-$(date +%Y%m%d).sql

# Files
tar -czf backup-cpfa-$(date +%Y%m%d).tar.gz \
    wp-content/plugins/cpfa-* \
    wp-content/uploads/cpfa-*
```

### 2. Migration Meta Keys

La migration se fait automatiquement lors de l'activation.

Pour forcer la re-migration:
```php
// Temporairement dans wp-config.php
define('CPFA_FORCE_META_MIGRATION', true);
```

Puis désactiver/réactiver plugin.

### 3. Vérifier Intégrité

```bash
# Compter meta keys migrés
wp db query "SELECT COUNT(*) FROM wp_postmeta WHERE meta_key LIKE '_cpfa_emprunt_penalite%';"

# Avant: penalites (plural)
# Après: penalite (singular)
```

---

## 🧪 TESTS POST-INSTALLATION

### 1. Tests Fonctionnels

- [ ] Créer une ressource de test
- [ ] Créer un abonnement de test
- [ ] Créer un emprunt
- [ ] Vérifier calcul pénalité
- [ ] Effectuer un retour
- [ ] Vérifier email notifications (MailHog en dev)

### 2. Tests Performance

```bash
# Test charge API
ab -n 1000 -c 10 https://votresite.com/wp-json/cpfa/v1/formations

# Doit respecter rate limiting (60 req/min)
```

### 3. Tests Sécurité

```bash
# Scanner vulnérabilités
wpscan --url https://votresite.com --enumerate p

# Vérifier headers sécurité
curl -I https://votresite.com/wp-json/cpfa/v1/stats | grep -E "X-RateLimit|X-Content-Type-Options"
```

---

## 🐛 TROUBLESHOOTING

### Problème: Plugin ne s'active pas

**Diagnostic:**
```bash
tail -100 wp-content/debug.log
```

**Causes fréquentes:**
- PHP < 8.0
- Composer dependencies manquantes
- Conflits avec autres plugins

**Solution:**
```bash
composer install --no-dev
wp plugin deactivate --all
wp plugin activate cpfa-core-manager
```

### Problème: Select2 non chargé

**Symptôme:** Autocomplete ne fonctionne pas dans Gestion Bibliothèque

**Solution:**
```bash
./install-select2.sh
wp cache flush
```

### Problème: Migrations meta keys échouent

**Diagnostic:**
```bash
grep "Migration error" wp-content/uploads/cpfa-logs/cpfa-*.log
```

**Solution:**
```bash
# Backup DB
wp db export backup-pre-migration.sql

# Reset migration flag
wp option delete cpfa_meta_keys_migrated

# Réactiver plugin
wp plugin deactivate cpfa-core-manager
wp plugin activate cpfa-core-manager
```

### Problème: Logs trop volumineux

**Solution:**
```bash
# Changer niveau log à WARNING
wp config set CPFA_LOG_LEVEL warning --type=constant

# Nettoyer vieux logs (manuel)
find wp-content/uploads/cpfa-logs/ -name "*.log" -mtime +30 -delete

# Ou via cron (automatique)
wp cron event run cpfa_daily_log_rotation
```

---

## 📈 OPTIMISATION PERFORMANCE

### 1. Activer Cache Objet

```bash
# Installer Redis plugin
wp plugin install redis-cache --activate
wp redis enable
```

### 2. Optimiser Base de Données

```sql
-- Ajouter indexes pour queries fréquentes
ALTER TABLE wp_postmeta ADD INDEX idx_cpfa_emprunt_statut (meta_key, meta_value(20));
ALTER TABLE wp_postmeta ADD INDEX idx_cpfa_abonnement_statut (meta_key, meta_value(20));
```

### 3. Configurer CDN (Optionnel)

Pour assets statiques uniquement (CSS/JS/images):
```php
// wp-config.php
define('CPFA_CDN_URL', 'https://cdn.votresite.com');
```

---

## 🔄 MISES À JOUR

### Procédure Standard

```bash
# 1. Backup
wp db export backup-$(date +%Y%m%d).sql

# 2. Mettre en mode maintenance
wp maintenance-mode activate

# 3. Pull nouvelle version
cd wp-content/plugins/cpfa
git pull origin main

# 4. Update dependencies
composer install --no-dev --optimize-autoloader

# 5. Désactiver/Réactiver (lance migrations)
wp plugin deactivate cpfa-core-manager
wp plugin activate cpfa-core-manager

# 6. Clear cache
wp cache flush

# 7. Sortir maintenance
wp maintenance-mode deactivate

# 8. Vérifier logs
tail -50 wp-content/uploads/cpfa-logs/cpfa-$(date +%Y-%m-%d).log
```

---

## 📞 SUPPORT

### Logs à Fournir en Cas de Problème

```bash
# 1. Logs CPFA
cat wp-content/uploads/cpfa-logs/cpfa-$(date +%Y-%m-%d).log

# 2. WordPress debug.log
tail -200 wp-content/debug.log

# 3. Info système
wp cli info
wp plugin list
wp option get active_plugins
```

### Contacts
- Documentation: [CLAUDE.md](CLAUDE.md)
- Corrections: [CORRECTIONS_APPLIQUEES.md](CORRECTIONS_APPLIQUEES.md)
- GitHub Issues: [Créer un ticket]

---

## ✅ CHECKLIST FINALE

Avant mise en production, vérifier:

### Technique
- [ ] PHP >= 8.0
- [ ] Composer dependencies installées
- [ ] Select2 installé localement
- [ ] Logs protégés (.htaccess)
- [ ] SSL/HTTPS actif
- [ ] Backup DB effectué

### Configuration
- [ ] Niveau log configuré (WARNING)
- [ ] Cron jobs actifs
- [ ] Rate limiting configuré
- [ ] Rôles créés et assignés

### Tests
- [ ] Cycle emprunt/retour fonctionne
- [ ] Pénalités calculées correctement
- [ ] Emails envoyés (tester avec MailHog)
- [ ] API répond correctement
- [ ] Tabs JavaScript fonctionnent

### Monitoring
- [ ] Logs surveillés (cron ou manuel)
- [ ] Dashboard accessible
- [ ] Alertes configurées

### Documentation
- [ ] Équipe formée
- [ ] Procédures documentées
- [ ] Plan de rollback préparé

---

**Date Publication**: 2025-10-28
**Version**: 1.1.0
**Statut**: ✅ Production Ready (avec corrections critiques appliquées)

**Prochaine Version**: 1.2.0 (REST API authentication, validations métier)
