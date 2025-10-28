# 📦 Export Production CPFA - Guide Complet

## ✅ Export Réussi

L'archive de production du projet CPFA a été créée avec succès.

### 📋 Informations de l'Archive

**Fichier:** `cpfa-production-20251012-220119.tar.gz`
**Taille:** 58 MB
**Format:** TAR.GZ (compatible Linux/macOS/Windows)

**Checksums:**
- **MD5:** `40064fd35a6dbe8abb8fcc75e9446592`
- **SHA256:** `763b4413387cf793f4bf59aa1ad2b457f14f25c51860f8cdcc3650fb11c74a9d`

### 📁 Contenu de l'Archive

```
cpfa-production-20251012-220119/
├── cpfa-core-manager/              # Plugin principal (gestion bibliothèque)
├── cpfa-forms-registrations/       # Formulaires et inscriptions
├── cpfa-pdf-generator/             # Génération de cartes PDF
├── INSTALLATION.md                 # Guide d'installation complet
├── README.md                       # Vue d'ensemble du projet
├── CLAUDE.md                       # Documentation développeur
├── FORMULAIRES_DISPONIBLES.md      # Documentation des formulaires
├── VERSION.txt                     # Informations de version
└── .htaccess-uploads               # Fichier de sécurité uploads
```

### 🔐 Vérification de l'Intégrité

Pour vérifier l'intégrité de l'archive après transfert:

```bash
# Vérification MD5
md5sum -c <(echo "40064fd35a6dbe8abb8fcc75e9446592  cpfa-production-20251012-220119.tar.gz")

# Vérification SHA256
sha256sum -c <(echo "763b4413387cf793f4bf59aa1ad2b457f14f25c51860f8cdcc3650fb11c74a9d  cpfa-production-20251012-220119.tar.gz")
```

**Résultat attendu:** `cpfa-production-20251012-220119.tar.gz: OK`

---

## 🚀 Installation sur le Serveur de Production

### Méthode 1: Via FTP/SFTP

1. **Transférer l'archive:**
   ```bash
   # Depuis votre machine locale
   scp cpfa-production-20251012-220119.tar.gz user@serveur:/chemin/vers/wordpress/
   ```

2. **Se connecter au serveur:**
   ```bash
   ssh user@serveur
   cd /chemin/vers/wordpress/
   ```

3. **Extraire les plugins:**
   ```bash
   tar -xzf cpfa-production-20251012-220119.tar.gz
   cd cpfa-production-20251012-220119

   # Copier les plugins
   cp -r cpfa-* ../wp-content/plugins/

   # Copier le fichier .htaccess pour la sécurité des uploads
   mkdir -p ../wp-content/uploads/cpfa
   cp .htaccess-uploads ../wp-content/uploads/cpfa/.htaccess
   ```

4. **Définir les permissions:**
   ```bash
   cd ../wp-content/plugins/
   chown -R www-data:www-data cpfa-*
   chmod -R 755 cpfa-*
   ```

### Méthode 2: Via wp-cli (Recommandé)

```bash
# Se placer dans le répertoire WordPress
cd /var/www/html  # ou votre chemin WordPress

# Extraire l'archive
tar -xzf cpfa-production-20251012-220119.tar.gz

# Copier les plugins
cp -r cpfa-production-20251012-220119/cpfa-* wp-content/plugins/

# Activer les plugins dans l'ordre
wp plugin activate cpfa-core-manager
wp plugin activate cpfa-forms-registrations
wp plugin activate cpfa-pdf-generator

# Vérifier l'activation
wp plugin list --status=active | grep cpfa
```

### Méthode 3: Via cPanel

1. Uploadez `cpfa-production-20251012-220119.tar.gz` via le gestionnaire de fichiers
2. Clic droit sur l'archive → Extraire
3. Déplacez les dossiers `cpfa-*` vers `wp-content/plugins/`
4. Dans WordPress Admin → Extensions → Activez les 3 plugins

---

## ⚙️ Configuration Post-Installation

### Étape 1: Vérification des Plugins

**Via WordPress Admin:**
- Extensions → Extensions installées
- Vérifiez que les 3 plugins CPFA sont actifs

**Via wp-cli:**
```bash
wp plugin list --status=active --format=table
```

### Étape 2: Configuration des Paiements

1. **CPFA → Paramètres → Paiement**
2. Configurez:
   - QR Code Wave (upload image)
   - Numéro Wave
   - Nom du compte Wave
   - QR Code Orange Money (upload image)
   - Numéro Orange Money
   - Nom du compte Orange Money
3. Définissez les prix:
   - Étudiant: 5000 FCFA
   - Professionnel: 10000 FCFA
   - Emprunt domicile: 45000 FCFA (inclut 35000 caution)

### Étape 3: Configuration Bibliothèque

1. **CPFA → Paramètres → Bibliothèque**
2. Configurez:
   - Durée de prêt: 14 jours (par défaut)
   - Emprunts simultanés: 3 (par défaut)
   - Pénalité/jour: 500 FCFA
   - Notifications: Activées

### Étape 4: Créer les Pages

#### Page Formulaire d'Abonnement

```php
Titre: Abonnement Bibliothèque
Slug: abonnement
Contenu: [cpfa_abonnement_form]
```

#### Page Politique de Confidentialité

1. **Réglages → Confidentialité**
2. Créez ou sélectionnez votre page RGPD
3. Le lien sera auto-injecté dans le formulaire

### Étape 5: Permissions et Rôles

```bash
# Créer le rôle Bibliothécaire (via wp-cli)
wp role create bibliothecaire "Bibliothécaire" --clone=editor

# Ajouter les capacités CPFA
wp cap add bibliothecaire manage_cpfa_library
wp cap add bibliothecaire validate_cpfa_subscriptions
wp cap add bibliothecaire manage_cpfa_loans
```

**Ou via fonctions.php:**
```php
add_action('init', function() {
    if (!get_role('bibliothecaire')) {
        add_role('bibliothecaire', 'Bibliothécaire', array(
            'read' => true,
            'edit_posts' => true,
            'manage_cpfa_library' => true,
            'validate_cpfa_subscriptions' => true,
            'manage_cpfa_loans' => true,
        ));
    }
});
```

---

## 🧪 Tests Post-Déploiement

### Test 1: Formulaire d'Abonnement

1. Visitez `/abonnement`
2. Remplissez le formulaire avec des données de test
3. Vérifiez la réception des emails:
   - Email utilisateur (confirmation)
   - Email admin (nouvelle préinscription)

### Test 2: Validation Admin

1. Connectez-vous en admin
2. **CPFA → Préinscriptions**
3. Validez l'abonnement de test
4. Vérifiez:
   - Statut passe à "Actif"
   - Carte PDF générée
   - Email de validation envoyé

### Test 3: Dashboard Bibliothèque

1. **CPFA → Bibliothèque**
2. Vérifiez les statistiques:
   - Abonnés actifs
   - Emprunts en cours
   - Ressources disponibles
   - Retards

### Test 4: Gestion Emprunts

1. Créez une ressource (livre)
2. Créez un emprunt pour l'abonné test
3. Effectuez un retour
4. Vérifiez le calcul des pénalités (si retard)

---

## 🔧 Optimisations Production

### Cache

**Installer Redis Object Cache (recommandé):**
```bash
wp plugin install redis-cache --activate
wp redis enable
```

**Ou W3 Total Cache:**
```bash
wp plugin install w3-total-cache --activate
```

### Sécurité

**Installer Wordfence:**
```bash
wp plugin install wordfence --activate
```

**Limiter les tentatives de connexion:**
```bash
wp plugin install limit-login-attempts-reloaded --activate
```

**Configurer SSL (obligatoire pour paiements):**
```bash
wp search-replace 'http://votresite.com' 'https://votresite.com' --all-tables
wp option update home 'https://votresite.com'
wp option update siteurl 'https://votresite.com'
```

### Performance

**Optimiser la base de données:**
```bash
wp db optimize
```

**Activer la compression Gzip:**
```apache
# Dans .htaccess
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript
</IfModule>
```

### Monitoring

**Activer les logs WordPress:**
```php
// Dans wp-config.php
define('WP_DEBUG', false);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
```

**Configurer les notifications d'erreur:**
```php
// Email admin si erreur critique
ini_set('error_log', '/var/log/wordpress/error.log');
```

---

## 🔄 Tâches Cron

Configurez ces tâches cron pour le bon fonctionnement:

```bash
# Vérifier les emprunts en retard (toutes les heures)
0 * * * * wp-cli cron event run cpfa_check_overdue_loans

# Nettoyer les transients expirés (quotidien)
0 2 * * * wp-cli transient delete --expired

# Sauvegarder la base de données (quotidien)
0 3 * * * wp db export /backups/wordpress-$(date +\%Y\%m\%d).sql
```

---

## 📊 Checklist de Déploiement

### Pré-déploiement
- [x] Archive créée et vérifiée
- [x] Checksums générés
- [x] Documentation incluse
- [ ] Sauvegarde du site de production effectuée

### Installation
- [ ] Archive transférée sur le serveur
- [ ] Plugins extraits dans wp-content/plugins/
- [ ] Permissions correctes (755 dossiers, 644 fichiers)
- [ ] Plugins activés dans l'ordre

### Configuration
- [ ] QR codes paiement uploadés
- [ ] Prix configurés
- [ ] Paramètres bibliothèque définis
- [ ] Page formulaire créée
- [ ] Politique confidentialité configurée
- [ ] Rôles et permissions créés

### Tests
- [ ] Formulaire d'abonnement fonctionnel
- [ ] Emails reçus (utilisateur + admin)
- [ ] Validation admin opérationnelle
- [ ] Dashboard affiche les bonnes stats
- [ ] Création emprunt fonctionnelle
- [ ] Retour et pénalités calculés correctement

### Optimisations
- [ ] Cache activé (Redis ou W3TC)
- [ ] SSL configuré (HTTPS)
- [ ] Plugin de sécurité installé
- [ ] Tâches cron configurées
- [ ] Monitoring activé

### Post-déploiement
- [ ] Test complet workflow utilisateur
- [ ] Formation admin/bibliothécaire
- [ ] Documentation remise au client
- [ ] Support mis en place

---

## 🆘 Troubleshooting

### Problème: Plugins n'apparaissent pas

**Solution:**
```bash
# Vérifier les permissions
ls -la wp-content/plugins/cpfa-*

# Corriger si nécessaire
chown -R www-data:www-data wp-content/plugins/cpfa-*
chmod -R 755 wp-content/plugins/cpfa-*
```

### Problème: Erreur "CPFA Core Manager requis"

**Solution:** Activez d'abord `cpfa-core-manager`, puis les autres plugins.

### Problème: Images ne s'affichent pas

**Solution:**
```bash
# Créer les dossiers uploads
mkdir -p wp-content/uploads/cpfa/{abonnements,cartes,qr-codes}
chown -R www-data:www-data wp-content/uploads/cpfa
chmod -R 755 wp-content/uploads/cpfa
```

### Problème: Dashboard affiche 0 partout

**Solution:**
```bash
# Vider le cache
wp transient delete --all
wp cache flush

# Vérifier les données
wp post list --post_type=cpfa_abonnement --post_status=any --format=count
```

### Problème: Emails non reçus

**Solution:**
```bash
# Installer WP Mail SMTP
wp plugin install wp-mail-smtp --activate

# Ou tester avec MailHog en dev
docker-compose up -d mailhog
```

---

## 📞 Support

### Logs à consulter

- `/wp-content/debug.log` - Erreurs WordPress
- `/var/log/apache2/error.log` - Erreurs serveur
- `/var/log/php-fpm/error.log` - Erreurs PHP

### Commandes de Diagnostic

```bash
# État des plugins
wp plugin list --status=active

# État des post types
wp post-type list

# Options CPFA
wp option list | grep cpfa_

# Utilisateurs et rôles
wp user list --role=administrator
wp role list
```

### Contact

Pour assistance technique, contactez:
- **Email:** support@cpfa.sn
- **Documentation:** Consultez CLAUDE.md et FORMULAIRES_DISPONIBLES.md

---

## 📝 Notes de Version

**Version:** 1.0.0
**Date:** 12 octobre 2025
**Commit:** e46a746

**Fonctionnalités:**
- ✅ Formulaire d'abonnement avec paiement offline (Wave/OM)
- ✅ Validation manuelle admin avec génération carte PDF
- ✅ Gestion complète bibliothèque (emprunts, retours, pénalités)
- ✅ Dashboard statistiques temps réel
- ✅ Services critiques (cache, transactions, rate limiting)
- ✅ Notifications automatiques par email
- ✅ Support RGPD et consentements

**Corrections récentes:**
- 🐛 Fix incohérence statuts (active → actif)
- 🐛 Fix dashboard statistiques temps réel
- ⚡ Implémentation cache 2 niveaux
- ⚡ Protection API avec rate limiting
- ⚡ Transactions ACID pour opérations critiques

---

**Bonne installation ! 🚀**
