# 🚀 Installation via WordPress Admin

## ⚠️ ORDRE D'INSTALLATION CRITIQUE

**IMPORTANT:** Les plugins doivent être installés et activés dans cet ordre exact:

1. **CPFA Core Manager** (obligatoire en premier)
2. **CPFA Forms & Registrations**
3. **CPFA PDF Generator**

---

## 📦 Méthode 1: Installation Plugin par Plugin (Recommandé)

### Étape 1: CPFA Core Manager

1. Connectez-vous à WordPress Admin
2. Allez dans **Extensions → Ajouter**
3. Cliquez sur **Téléverser une extension**
4. Choisissez le fichier `cpfa-core-manager.zip` (88 KB)
5. Cliquez sur **Installer maintenant**
6. **Cliquez sur "Activer l'extension"**

✅ **Vérification:** Un menu "CPFA" devrait apparaître dans la barre latérale admin.

### Étape 2: CPFA Forms & Registrations

1. Allez dans **Extensions → Ajouter**
2. Cliquez sur **Téléverser une extension**
3. Choisissez le fichier `cpfa-forms-registrations.zip` (43 KB)
4. Cliquez sur **Installer maintenant**
5. **Cliquez sur "Activer l'extension"**

✅ **Vérification:** Un sous-menu "Préinscriptions" devrait apparaître sous "CPFA".

### Étape 3: CPFA PDF Generator

1. Allez dans **Extensions → Ajouter**
2. Cliquez sur **Téléverser une extension**
3. Choisissez le fichier `cpfa-pdf-generator.zip` (59 MB)
4. Cliquez sur **Installer maintenant**
5. **Cliquez sur "Activer l'extension"**

✅ **Vérification:** La génération de cartes PDF est maintenant disponible.

---

## 🔧 Configuration Post-Installation

### 1. Configurer les Paiements

**CPFA → Paramètres → Paiement**

Configurez:
- **QR Code Wave:** Uploadez l'image du QR code
- **Numéro Wave:** Ex. +221 77 123 45 67
- **Nom compte Wave:** Ex. Centre Papa Youssoupha DIOP
- **QR Code Orange Money:** Uploadez l'image du QR code
- **Numéro Orange Money:** Ex. +221 77 987 65 43
- **Nom compte OM:** Ex. Centre Papa Youssoupha DIOP
- **Instructions:** Texte affiché sur le formulaire

**Prix:**
- Étudiant: 5000 FCFA
- Professionnel: 10000 FCFA
- Emprunt domicile: 45000 FCFA (inclut 35000 FCFA de caution)

### 2. Configurer la Bibliothèque

**CPFA → Paramètres → Bibliothèque**

- Durée de prêt: 14 jours
- Emprunts simultanés max: 3
- Pénalité par jour de retard: 500 FCFA
- Notifications automatiques: Activées

### 3. Créer la Page Formulaire

1. **Pages → Ajouter**
2. Titre: "Abonnement Bibliothèque"
3. Contenu: Ajoutez le shortcode `[cpfa_abonnement_form]`
4. **Publier**

### 4. Configurer la Politique de Confidentialité

1. **Réglages → Confidentialité**
2. Créez ou sélectionnez votre page RGPD
3. Le lien sera automatiquement ajouté au formulaire

---

## ❌ Problèmes Courants et Solutions

### Problème: "La taille du fichier téléchargé dépasse la directive upload_max_filesize"

Cela arrive surtout avec `cpfa-pdf-generator.zip` (59 MB).

**Solution 1: Augmenter les limites PHP (Hébergeur)**

Contactez votre hébergeur pour augmenter:
- `upload_max_filesize` à 64M minimum
- `post_max_size` à 64M minimum
- `max_execution_time` à 300 secondes

**Solution 2: Via .htaccess (si hébergement partagé)**

Créez ou éditez `.htaccess` à la racine de WordPress:

```apache
php_value upload_max_filesize 64M
php_value post_max_size 64M
php_value max_execution_time 300
php_value max_input_time 300
```

**Solution 3: Via php.ini (si VPS/dédié)**

Éditez `php.ini`:

```ini
upload_max_filesize = 64M
post_max_size = 64M
max_execution_time = 300
max_input_time = 300
```

Puis redémarrez PHP-FPM:
```bash
sudo systemctl restart php8.0-fpm
```

**Solution 4: Installation via FTP (recommandée si limites)**

Voir "Méthode 2" ci-dessous.

### Problème: "Le plugin n'a pas pu être activé car il a généré X caractères de sortie inattendue"

**Causes possibles:**
1. PHP version < 8.0
2. Extensions PHP manquantes

**Solutions:**

```bash
# Vérifier version PHP
php -v

# Installer extensions manquantes
sudo apt-get install php8.0-gd php8.0-imagick php8.0-zip php8.0-mbstring
```

### Problème: Menu "CPFA" n'apparaît pas

**Solution:**

1. Vérifiez que `cpfa-core-manager` est bien activé en premier
2. Allez dans **Extensions** et désactivez puis réactivez dans l'ordre:
   - CPFA Core Manager
   - CPFA Forms & Registrations
   - CPFA PDF Generator
3. Videz le cache de WordPress et du navigateur

### Problème: "Erreur: Le paquet ne contenait aucun fichier d'extension"

**Cause:** Le fichier ZIP n'est pas correctement formaté ou corrompu.

**Solutions:**

1. Re-téléchargez le fichier ZIP
2. Vérifiez l'intégrité avec les checksums (voir CHECKSUMS.txt)
3. Utilisez la méthode 2 (installation FTP)

---

## 📂 Méthode 2: Installation via FTP/SFTP

Si l'upload via WordPress échoue (taille de fichier trop importante):

### Étape 1: Extraire les ZIPs localement

Sur votre ordinateur:
```bash
unzip cpfa-core-manager.zip
unzip cpfa-forms-registrations.zip
unzip cpfa-pdf-generator.zip
```

### Étape 2: Upload via FTP

1. Connectez-vous à votre serveur via FTP (FileZilla, Cyberduck, etc.)
2. Naviguez vers `/wp-content/plugins/`
3. Uploadez les 3 dossiers:
   - `cpfa-core-manager/`
   - `cpfa-forms-registrations/`
   - `cpfa-pdf-generator/`

### Étape 3: Définir les Permissions

Via FTP, définissez les permissions:
- **Dossiers:** 755
- **Fichiers:** 644

Ou via SSH:
```bash
cd /var/www/html/wp-content/plugins/
chown -R www-data:www-data cpfa-*
chmod -R 755 cpfa-*/
find cpfa-*/ -type f -exec chmod 644 {} \;
```

### Étape 4: Activer dans WordPress Admin

1. **Extensions → Extensions installées**
2. Activez dans l'ordre:
   - CPFA Core Manager
   - CPFA Forms & Registrations
   - CPFA PDF Generator

---

## 🧪 Tests Post-Installation

### Test 1: Vérifier les Menus

**Menu visible:**
- CPFA (menu principal)
  - Bibliothèque
  - Préinscriptions
  - Paramètres

### Test 2: Tester le Formulaire

1. Créez une page avec `[cpfa_abonnement_form]`
2. Visitez la page
3. Remplissez avec des données de test
4. Vérifiez la soumission

### Test 3: Validation Admin

1. **CPFA → Préinscriptions**
2. Trouvez l'abonnement test
3. Cliquez sur "Valider"
4. Vérifiez la génération de la carte PDF

### Test 4: Dashboard

1. **CPFA → Bibliothèque**
2. Vérifiez que les statistiques s'affichent:
   - Abonnés actifs
   - Emprunts en cours
   - Ressources disponibles
   - Emprunts en retard

---

## 📋 Checklist d'Installation

- [ ] CPFA Core Manager installé et activé
- [ ] CPFA Forms & Registrations installé et activé
- [ ] CPFA PDF Generator installé et activé
- [ ] Menu "CPFA" visible dans l'admin
- [ ] QR codes de paiement uploadés
- [ ] Prix configurés
- [ ] Paramètres bibliothèque définis
- [ ] Page formulaire créée avec shortcode
- [ ] Politique confidentialité configurée
- [ ] Test formulaire réussi
- [ ] Test validation admin réussi
- [ ] Dashboard affiche les statistiques

---

## 🔍 Diagnostic

### Vérifier les Plugins Actifs

**Via wp-cli:**
```bash
wp plugin list --status=active | grep cpfa
```

**Résultat attendu:**
```
cpfa-core-manager          active   1.0.0
cpfa-forms-registrations   active   1.0.0
cpfa-pdf-generator         active   1.0.0
```

### Vérifier les Post Types

```bash
wp post-type list | grep cpfa
```

**Résultat attendu:**
```
cpfa_abonnement
cpfa_ressource
cpfa_emprunt
```

### Vérifier les Logs

En cas d'erreur, consultez:
```
/wp-content/debug.log
```

Pour activer les logs, ajoutez dans `wp-config.php`:
```php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
```

---

## 📞 Support

### Documentation Complète

- **README.md** - Vue d'ensemble du projet
- **CLAUDE.md** - Documentation développeur complète
- **FORMULAIRES_DISPONIBLES.md** - Documentation des formulaires
- **EXPORT_PRODUCTION_README.md** - Guide de déploiement avancé

### Ressources

- **Prérequis:**
  - WordPress 6.0+
  - PHP 8.0+
  - MySQL 5.7+ / MariaDB 10.3+
  - Extensions PHP: gd, imagick, zip, mbstring

### Contact

Pour toute assistance technique:
- **Email:** support@cpfa.sn
- **Logs:** Consultez `/wp-content/debug.log`

---

## 🎉 Installation Terminée !

Une fois tous les plugins activés et configurés, votre système CPFA est prêt à l'emploi:

✅ Formulaire d'abonnement en ligne
✅ Paiement offline (Wave/Orange Money)
✅ Validation manuelle par admin
✅ Génération automatique de cartes PDF
✅ Gestion complète de bibliothèque
✅ Dashboard statistiques temps réel
✅ Notifications automatiques par email

**Bon usage ! 🚀**
