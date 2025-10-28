# 🚀 CPFA - Guide d'Installation Production

## 📦 Archives Disponibles

Deux formats d'export sont disponibles pour le déploiement en production:

### 1. Archives ZIP WordPress Admin (Recommandé) ⭐

**Dossier:** `wordpress-plugins-zip/`

Parfait pour l'installation via l'interface WordPress Admin (Extensions → Ajouter → Téléverser).

| Fichier | Taille | Compatible WordPress Admin |
|---------|--------|---------------------------|
| cpfa-core-manager.zip | 88 KB | ✅ Oui |
| cpfa-forms-registrations.zip | 43 KB | ✅ Oui |
| cpfa-pdf-generator.zip | 59 MB | ⚠️ Oui (si upload_max_filesize ≥ 64M) |

**Documentation:**
- [WORDPRESS_ADMIN_INSTALL_GUIDE.md](WORDPRESS_ADMIN_INSTALL_GUIDE.md) - Guide complet
- `wordpress-plugins-zip/INSTALLATION_WORDPRESS_ADMIN.md` - Guide dans l'archive
- `wordpress-plugins-zip/README.txt` - Instructions rapides

### 2. Archive TAR.GZ Production

**Fichier:** `cpfa-production-20251012-220119.tar.gz` (58 MB)

Parfait pour l'installation via FTP/SFTP ou ligne de commande.

**Contenu:**
- Les 3 plugins WordPress
- Documentation complète (CLAUDE.md, README.md, etc.)
- Guide d'installation (INSTALLATION.md)
- Fichier de version et sécurité

**Documentation:**
- [EXPORT_PRODUCTION_README.md](EXPORT_PRODUCTION_README.md) - Guide complet

---

## 🎯 Quelle Méthode Choisir ?

| Critère | WordPress Admin (ZIP) | FTP/SFTP (TAR.GZ) |
|---------|----------------------|-------------------|
| **Facilité** | ⭐⭐⭐⭐⭐ Très simple | ⭐⭐⭐ Moyen |
| **Accès requis** | Admin WordPress | FTP/SFTP ou SSH |
| **Limite taille** | 64M (configurable) | Aucune |
| **Temps installation** | ~5 minutes | ~10 minutes |
| **Recommandé pour** | Débutants, petits hébergements | Avancés, serveurs VPS/dédiés |

---

## 🚀 Installation Rapide (WordPress Admin)

### Prérequis

- WordPress 6.0+
- PHP 8.0+
- MySQL 5.7+ / MariaDB 10.3+
- Extensions PHP: gd, imagick, zip, mbstring

### Installation en 3 Étapes

#### 1. Installer CPFA Core Manager

```
WordPress Admin → Extensions → Ajouter → Téléverser une extension
→ Sélectionner: wordpress-plugins-zip/cpfa-core-manager.zip
→ Installer maintenant
→ Activer l'extension ✅
```

#### 2. Installer CPFA Forms & Registrations

```
Extensions → Ajouter → Téléverser une extension
→ Sélectionner: wordpress-plugins-zip/cpfa-forms-registrations.zip
→ Installer maintenant
→ Activer l'extension ✅
```

#### 3. Installer CPFA PDF Generator

```
Extensions → Ajouter → Téléverser une extension
→ Sélectionner: wordpress-plugins-zip/cpfa-pdf-generator.zip
→ Installer maintenant
→ Activer l'extension ✅
```

### ⚠️ IMPORTANT: Ordre d'Activation

Les plugins **DOIVENT** être activés dans cet ordre:
1. CPFA Core Manager (obligatoire en premier)
2. CPFA Forms & Registrations
3. CPFA PDF Generator

---

## ❌ Problème: Fichier Trop Gros

Si `cpfa-pdf-generator.zip` (59 MB) est rejeté:

### Solution 1: Augmenter les Limites PHP

**Via .htaccess:**
```apache
php_value upload_max_filesize 64M
php_value post_max_size 64M
php_value max_execution_time 300
```

**Via php.ini:**
```ini
upload_max_filesize = 64M
post_max_size = 64M
max_execution_time = 300
```

### Solution 2: Installation via FTP

1. Extraire `cpfa-pdf-generator.zip` localement
2. Uploader le dossier `cpfa-pdf-generator/` via FTP vers `/wp-content/plugins/`
3. Activer le plugin dans WordPress Admin

**Voir:** [WORDPRESS_ADMIN_INSTALL_GUIDE.md](WORDPRESS_ADMIN_INSTALL_GUIDE.md) pour plus de détails.

---

## ⚙️ Configuration Post-Installation

### 1. Configurer les Paiements

**CPFA → Paramètres → Paiement**

- Uploader les QR codes Wave et Orange Money
- Configurer les numéros et noms de compte
- Définir les prix:
  - Étudiant: 5000 FCFA
  - Professionnel: 10000 FCFA
  - Emprunt domicile: 45000 FCFA (inclut caution)

### 2. Créer la Page Formulaire

**Pages → Ajouter**
- Titre: "Abonnement Bibliothèque"
- Contenu: `[cpfa_abonnement_form]`
- Publier

### 3. Configurer la Bibliothèque

**CPFA → Paramètres → Bibliothèque**
- Durée de prêt: 14 jours
- Emprunts simultanés max: 3
- Pénalité par jour: 500 FCFA

### 4. Politique de Confidentialité

**Réglages → Confidentialité**
- Créer ou sélectionner la page RGPD

---

## 🧪 Tests de Vérification

### Checklist

- [ ] Menu "CPFA" visible dans l'admin
- [ ] Sous-menus: Bibliothèque, Préinscriptions, Paramètres
- [ ] QR codes uploadés et visibles
- [ ] Page formulaire créée avec shortcode
- [ ] Test soumission formulaire
- [ ] Emails reçus (utilisateur + admin)
- [ ] Validation admin fonctionnelle
- [ ] Carte PDF générée
- [ ] Dashboard affiche les statistiques

---

## 📚 Documentation Complète

### Guides d'Installation

| Document | Description |
|----------|-------------|
| **WORDPRESS_ADMIN_INSTALL_GUIDE.md** | Guide complet pour installation via WordPress Admin |
| **EXPORT_PRODUCTION_README.md** | Guide complet pour installation FTP/SSH |
| `wordpress-plugins-zip/INSTALLATION_WORDPRESS_ADMIN.md` | Guide d'installation rapide |

### Documentation Développeur

| Document | Description |
|----------|-------------|
| **CLAUDE.md** | Documentation technique complète |
| **FORMULAIRES_DISPONIBLES.md** | Documentation des formulaires et exportabilité |
| **README.md** | Vue d'ensemble du projet |
| **cahier_des_charges.md** | Cahier des charges complet |

---

## 🔒 Vérification d'Intégrité

### Archives ZIP WordPress Admin

**Fichier:** `wordpress-plugins-zip/CHECKSUMS.txt`

```
cpfa-core-manager.zip
  MD5:    f7e886ca01b81095eb1705ad14258bd2
  SHA256: 5dc767805ab94df6711f881f0372aa0da9b7fc85663ccf578bb338c66a860c8c

cpfa-forms-registrations.zip
  MD5:    4d5cdabc51bf8b488a308e8bc2e695ba
  SHA256: 0685a5ac8859ba5c55b3fd4306630034d475e17ddc3d527a55ab989efc5b0031

cpfa-pdf-generator.zip
  MD5:    00b8a69296b6d02d876f1ba1346130fb
  SHA256: 18550257b34111acbc4bcc389f078fc4ae61927b6f26b4e4f109a55a81cf2800
```

### Archive TAR.GZ Production

**Fichier:** `cpfa-production-20251012-220119.tar.gz.checksums`

```
MD5:    40064fd35a6dbe8abb8fcc75e9446592
SHA256: 763b4413387cf793f4bf59aa1ad2b457f14f25c51860f8cdcc3650fb11c74a9d
```

**Vérification:**
```bash
md5sum -c cpfa-production-20251012-220119.tar.gz.checksums
```

---

## 📊 Résumé des Fichiers

### Structure du Projet

```
cpfa/
├── wordpress-plugins-zip/              # Archives WordPress Admin
│   ├── cpfa-core-manager.zip          (88 KB)
│   ├── cpfa-forms-registrations.zip   (43 KB)
│   ├── cpfa-pdf-generator.zip         (59 MB)
│   ├── INSTALLATION_WORDPRESS_ADMIN.md
│   ├── README.txt
│   └── CHECKSUMS.txt
│
├── cpfa-production-20251012-220119.tar.gz     (58 MB)
├── cpfa-production-20251012-220119.tar.gz.checksums
│
├── WORDPRESS_ADMIN_INSTALL_GUIDE.md    # Guide WordPress Admin
├── EXPORT_PRODUCTION_README.md         # Guide FTP/SSH
├── README_INSTALLATION.md              # Ce fichier
├── CLAUDE.md                           # Doc technique
├── FORMULAIRES_DISPONIBLES.md         # Doc formulaires
└── README.md                           # Vue d'ensemble
```

---

## 🎯 Recommandations

### Pour Hébergement Partagé (OVH, Hostinger, etc.)

**Méthode recommandée:** WordPress Admin (ZIP)

**Avantages:**
- Installation en quelques clics
- Pas besoin d'accès FTP
- Interface familière

**Note:** Vérifiez que `upload_max_filesize ≥ 64M`

### Pour VPS/Serveur Dédié

**Méthode recommandée:** FTP/SFTP ou wp-cli

**Avantages:**
- Aucune limite de taille
- Plus rapide
- Automatisable via scripts

**Installation wp-cli:**
```bash
cd /var/www/html/wp-content/plugins/
tar -xzf cpfa-production-20251012-220119.tar.gz
cp -r cpfa-production-*/cpfa-* .
wp plugin activate cpfa-core-manager cpfa-forms-registrations cpfa-pdf-generator
```

---

## 📞 Support

### En Cas de Problème

1. **Consulter la documentation:**
   - WORDPRESS_ADMIN_INSTALL_GUIDE.md (problèmes courants + solutions)
   - EXPORT_PRODUCTION_README.md (troubleshooting avancé)

2. **Vérifier les logs:**
   ```
   /wp-content/debug.log
   ```

3. **Activer le mode debug:**
   ```php
   // Dans wp-config.php
   define('WP_DEBUG', true);
   define('WP_DEBUG_LOG', true);
   define('WP_DEBUG_DISPLAY', false);
   ```

4. **Contact:**
   - Email: support@cpfa.sn

---

## ✅ Checklist Finale

```
Avant Installation:
[ ] WordPress ≥ 6.0
[ ] PHP ≥ 8.0
[ ] MySQL ≥ 5.7 ou MariaDB ≥ 10.3
[ ] Extensions PHP: gd, imagick, zip, mbstring
[ ] Sauvegarde du site effectuée

Installation:
[ ] CPFA Core Manager installé et activé
[ ] CPFA Forms & Registrations installé et activé
[ ] CPFA PDF Generator installé et activé

Configuration:
[ ] QR codes uploadés
[ ] Prix configurés
[ ] Page formulaire créée
[ ] Politique RGPD configurée

Tests:
[ ] Menu CPFA visible
[ ] Formulaire accessible et fonctionnel
[ ] Emails reçus
[ ] Validation admin OK
[ ] Carte PDF générée
[ ] Dashboard affiche les stats

Production:
[ ] SSL activé (HTTPS)
[ ] Plugin de cache installé
[ ] Plugin de sécurité installé
[ ] Cron configuré
[ ] Formation admin effectuée
```

---

## 🎉 Félicitations !

Une fois l'installation terminée, votre système CPFA est opérationnel:

✅ **Formulaire d'abonnement en ligne**
✅ **Paiement offline (Wave/Orange Money)**
✅ **Validation manuelle admin**
✅ **Génération automatique de cartes PDF**
✅ **Gestion complète de bibliothèque**
✅ **Dashboard statistiques temps réel**
✅ **Notifications automatiques**
✅ **Conformité RGPD**

**Bon usage ! 🚀**

---

**Version:** 1.0.0
**Date:** 12 octobre 2025
**Commit:** e46a746
