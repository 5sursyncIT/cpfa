#!/bin/bash
###############################################################################
# CPFA Production Export Script
#
# Ce script crée une archive ZIP prête pour le déploiement en production
# contenant tous les plugins WordPress nécessaires.
#
# Usage: ./export-production.sh
# Output: cpfa-production-YYYYMMDD-HHMMSS.zip
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="cpfa"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
EXPORT_NAME="${PROJECT_NAME}-production-${TIMESTAMP}"
EXPORT_DIR="/tmp/${EXPORT_NAME}"
OUTPUT_FILE="${PWD}/${EXPORT_NAME}.zip"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         CPFA Production Export Script v1.0                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if running from project root
if [ ! -f "docker-compose.yml" ] || [ ! -d "cpfa-core-manager" ]; then
    echo -e "${RED}❌ Erreur: Ce script doit être exécuté depuis la racine du projet CPFA${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Préparation de l'export...${NC}"

# Clean up previous export directory if exists
if [ -d "$EXPORT_DIR" ]; then
    echo -e "${YELLOW}🧹 Nettoyage de l'ancien répertoire d'export...${NC}"
    rm -rf "$EXPORT_DIR"
fi

# Create export directory structure
echo -e "${YELLOW}📁 Création de la structure de dossiers...${NC}"
mkdir -p "$EXPORT_DIR"

# Export plugins
echo -e "${YELLOW}📦 Export des plugins WordPress...${NC}"
echo ""

# 1. CPFA Core Manager
echo -e "${BLUE}   [1/3]${NC} Copie de ${GREEN}cpfa-core-manager${NC}..."
cp -r cpfa-core-manager "$EXPORT_DIR/"

# 2. CPFA Forms & Registrations
echo -e "${BLUE}   [2/3]${NC} Copie de ${GREEN}cpfa-forms-registrations${NC}..."
cp -r cpfa-forms-registrations "$EXPORT_DIR/"

# 3. CPFA PDF Generator
echo -e "${BLUE}   [3/3]${NC} Copie de ${GREEN}cpfa-pdf-generator${NC}..."
cp -r cpfa-pdf-generator "$EXPORT_DIR/"

# Copy documentation files
echo ""
echo -e "${YELLOW}📄 Copie de la documentation...${NC}"
cp README.md "$EXPORT_DIR/" 2>/dev/null || echo "README.md non trouvé"
cp CLAUDE.md "$EXPORT_DIR/" 2>/dev/null || echo "CLAUDE.md non trouvé"
cp FORMULAIRES_DISPONIBLES.md "$EXPORT_DIR/" 2>/dev/null || echo "FORMULAIRES_DISPONIBLES.md non trouvé"

# Create deployment guide
echo -e "${YELLOW}📝 Génération du guide de déploiement...${NC}"
cat > "$EXPORT_DIR/INSTALLATION.md" << 'EOF'
# 🚀 Guide d'Installation CPFA - Production

## Prérequis

- WordPress 6.0+
- PHP 8.0+
- MySQL 5.7+ / MariaDB 10.3+
- Extensions PHP requises:
  - gd (pour la génération d'images)
  - imagick (recommandé)
  - zip
  - mbstring

## Installation

### Étape 1: Upload des Plugins

1. Connectez-vous à votre serveur via FTP/SFTP ou cPanel
2. Naviguez vers `/wp-content/plugins/`
3. Uploadez les 3 dossiers:
   - `cpfa-core-manager`
   - `cpfa-forms-registrations`
   - `cpfa-pdf-generator`

**Via wp-cli (recommandé):**
```bash
cd /path/to/wordpress/wp-content/plugins/
# Extraire l'archive
unzip cpfa-production-*.zip
# Copier les plugins
cp -r cpfa-production-*/cpfa-* .
```

### Étape 2: Activation des Plugins

**Via WordPress Admin:**
1. Allez dans Extensions → Extensions installées
2. Activez dans cet ordre:
   - **CPFA Core Manager** (obligatoire en premier)
   - **CPFA Forms & Registrations**
   - **CPFA PDF Generator**

**Via wp-cli:**
```bash
wp plugin activate cpfa-core-manager
wp plugin activate cpfa-forms-registrations
wp plugin activate cpfa-pdf-generator
```

### Étape 3: Configuration

#### A. Configuration des Paiements

1. Allez dans **CPFA → Paramètres**
2. Onglet **Paiement**:
   - Uploadez les QR codes Wave et/ou Orange Money
   - Renseignez les numéros de téléphone
   - Configurez les prix par type d'abonnement:
     - Étudiant: ex. 5000 FCFA
     - Professionnel: ex. 10000 FCFA
     - Emprunt à domicile: ex. 45000 FCFA (inclut caution)

#### B. Configuration de la Bibliothèque

1. Allez dans **CPFA → Paramètres → Bibliothèque**
2. Configurez:
   - Durée de prêt par défaut (jours)
   - Nombre max d'emprunts simultanés
   - Pénalités de retard (montant par jour)
   - Notifications automatiques

#### C. Politique de Confidentialité

1. Allez dans **Réglages → Confidentialité**
2. Créez ou sélectionnez votre page de politique de confidentialité
3. Le lien sera automatiquement intégré dans les formulaires

### Étape 4: Création des Pages

#### Page Formulaire d'Abonnement

1. Créez une nouvelle page
2. Titre: "Abonnement Bibliothèque"
3. Contenu: `[cpfa_abonnement_form]`
4. Publiez

#### Page Dashboard Bibliothèque (Admin seulement)

Le dashboard est accessible via le menu admin **CPFA → Bibliothèque**

### Étape 5: Permissions

Assurez-vous que les rôles WordPress ont les bonnes capacités:

**Administrateur:**
- Accès complet à tous les modules CPFA

**Bibliothécaire (créer ce rôle):**
```php
// Ajouter dans functions.php du thème
add_role('bibliothecaire', 'Bibliothécaire', array(
    'read' => true,
    'edit_posts' => true,
    'manage_cpfa_library' => true,
    'validate_cpfa_subscriptions' => true,
));
```

### Étape 6: Test de l'Installation

1. **Test formulaire d'abonnement:**
   - Visitez la page du formulaire
   - Remplissez avec des données de test
   - Vérifiez la réception de l'email

2. **Test validation admin:**
   - Connectez-vous en admin
   - Allez dans **CPFA → Préinscriptions**
   - Validez/Rejetez l'abonnement test

3. **Test gestion bibliothèque:**
   - Créez une ressource (livre)
   - Créez un emprunt
   - Effectuez un retour

## Configuration Avancée

### Cache

Le système utilise un cache 2 niveaux automatique.

**Pour vider le cache:**
```bash
wp transient delete --all
```

### Tâches Cron

Configurez un cron pour les notifications automatiques:

```bash
# Toutes les heures
0 * * * * wp-cli cron event run cpfa_check_overdue_loans
```

### Performance

**Pour de meilleures performances:**
- Activez un plugin de cache (WP Rocket, W3 Total Cache)
- Activez Redis Object Cache (recommandé)
- Optimisez les images uploadées

### Sécurité

**Recommandations:**
- Limitez l'upload de fichiers (déjà configuré: 2MB photo, 5MB CNI)
- Utilisez HTTPS (obligatoire pour les paiements)
- Installez un plugin de sécurité (Wordfence, iThemes Security)
- Limitez les tentatives de connexion

## Vérification Post-Installation

### Checklist

- [ ] Les 3 plugins sont activés
- [ ] Menu "CPFA" apparaît dans l'admin
- [ ] Post types créés (Abonnements, Ressources, Emprunts)
- [ ] QR codes de paiement uploadés
- [ ] Prix configurés
- [ ] Page formulaire créée avec shortcode
- [ ] Test d'abonnement réussi
- [ ] Emails reçus (utilisateur + admin)
- [ ] Validation admin fonctionnelle
- [ ] Dashboard affiche les statistiques

### Commandes de Diagnostic

```bash
# Vérifier les plugins actifs
wp plugin list --status=active

# Vérifier les post types
wp post-type list

# Vérifier les options CPFA
wp option list | grep cpfa

# Vérifier les capacités
wp cap list administrator | grep cpfa
```

## Support

### Documentation

- **CLAUDE.md** - Guide complet pour développeurs
- **FORMULAIRES_DISPONIBLES.md** - Documentation des formulaires
- **README.md** - Vue d'ensemble du projet

### Logs

Les logs se trouvent dans:
- WordPress debug.log: `/wp-content/debug.log`
- Logs PHP: Selon configuration serveur

Activer le mode debug:
```php
// Dans wp-config.php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
```

### Contact

Pour toute assistance, contactez l'équipe de développement CPFA.

---

**Version:** 1.0.0
**Date:** $(date +%Y-%m-%d)
**WordPress:** 6.0+
**PHP:** 8.0+
EOF

# Create .htaccess for security
echo -e "${YELLOW}🔒 Création du fichier de sécurité...${NC}"
cat > "$EXPORT_DIR/.htaccess-uploads" << 'EOF'
# CPFA Uploads Security
# Placer ce fichier dans wp-content/uploads/cpfa/

# Deny direct access to PHP files
<FilesMatch "\.php$">
    Order Allow,Deny
    Deny from all
</FilesMatch>

# Allow only specific file types
<FilesMatch "\.(jpg|jpeg|png|gif|pdf)$">
    Order Allow,Deny
    Allow from all
</FilesMatch>
EOF

# Create version file
echo -e "${YELLOW}📋 Création du fichier de version...${NC}"
cat > "$EXPORT_DIR/VERSION.txt" << EOF
CPFA Production Package
=======================

Version: 1.0.0
Date d'export: $(date '+%Y-%m-%d %H:%M:%S')
Git commit: $(git rev-parse --short HEAD 2>/dev/null || echo "N/A")

Plugins inclus:
- CPFA Core Manager v1.0.0
- CPFA Forms & Registrations v1.0.0
- CPFA PDF Generator v1.0.0

Configuration système requise:
- WordPress: 6.0+
- PHP: 8.0+
- MySQL: 5.7+ / MariaDB: 10.3+

Extensions PHP requises:
- gd
- imagick (recommandé)
- zip
- mbstring

Pour installer, consultez INSTALLATION.md
EOF

# Clean development files from plugins
echo ""
echo -e "${YELLOW}🧹 Nettoyage des fichiers de développement...${NC}"

find "$EXPORT_DIR" -type f -name ".gitignore" -delete
find "$EXPORT_DIR" -type f -name ".DS_Store" -delete
find "$EXPORT_DIR" -type f -name "Thumbs.db" -delete
find "$EXPORT_DIR" -type d -name ".git" -exec rm -rf {} + 2>/dev/null || true
find "$EXPORT_DIR" -type d -name "node_modules" -exec rm -rf {} + 2>/dev/null || true
find "$EXPORT_DIR" -type d -name ".idea" -exec rm -rf {} + 2>/dev/null || true

# Remove test/debug files
rm -f "$EXPORT_DIR"/*/test-*.php 2>/dev/null || true
rm -f "$EXPORT_DIR"/*/debug-*.php 2>/dev/null || true
rm -f "$EXPORT_DIR"/*/diagnostic-*.php 2>/dev/null || true

# Create the archive (tar.gz as fallback if zip not available)
echo ""
if command -v zip &> /dev/null; then
    echo -e "${YELLOW}🗜️  Création de l'archive ZIP...${NC}"
    cd /tmp
    zip -rq "${OUTPUT_FILE}" "${EXPORT_NAME}" -x "*.git*" "*.DS_Store"
else
    echo -e "${YELLOW}🗜️  Création de l'archive TAR.GZ (zip non disponible)...${NC}"
    OUTPUT_FILE="${OUTPUT_FILE%.zip}.tar.gz"
    cd /tmp
    tar -czf "${OUTPUT_FILE}" --exclude="*.git*" --exclude=".DS_Store" "${EXPORT_NAME}"
fi

# Calculate file size and checksums
FILE_SIZE=$(du -h "${OUTPUT_FILE}" | cut -f1)
MD5_SUM=$(md5sum "${OUTPUT_FILE}" | cut -d' ' -f1)
SHA256_SUM=$(sha256sum "${OUTPUT_FILE}" | cut -d' ' -f1)

# Create checksum file
cat > "${OUTPUT_FILE}.checksums" << EOF
CPFA Production Package - Checksums
====================================

Fichier: $(basename "${OUTPUT_FILE}")
Taille: ${FILE_SIZE}
Date: $(date '+%Y-%m-%d %H:%M:%S')

MD5:    ${MD5_SUM}
SHA256: ${SHA256_SUM}

Vérification:
  md5sum -c <(echo "${MD5_SUM}  $(basename "${OUTPUT_FILE}")")
  sha256sum -c <(echo "${SHA256_SUM}  $(basename "${OUTPUT_FILE}")")
EOF

# Clean up temporary directory
rm -rf "$EXPORT_DIR"

# Success summary
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                  ✅ Export Réussi !                        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📦 Archive créée:${NC}     ${GREEN}${OUTPUT_FILE}${NC}"
echo -e "${BLUE}📏 Taille:${NC}           ${GREEN}${FILE_SIZE}${NC}"
echo -e "${BLUE}🔒 MD5:${NC}              ${YELLOW}${MD5_SUM}${NC}"
echo -e "${BLUE}🔒 SHA256:${NC}           ${YELLOW}${SHA256_SUM}${NC}"
echo ""
echo -e "${BLUE}📋 Fichiers inclus:${NC}"
echo -e "   ${GREEN}✓${NC} cpfa-core-manager/"
echo -e "   ${GREEN}✓${NC} cpfa-forms-registrations/"
echo -e "   ${GREEN}✓${NC} cpfa-pdf-generator/"
echo -e "   ${GREEN}✓${NC} INSTALLATION.md"
echo -e "   ${GREEN}✓${NC} README.md"
echo -e "   ${GREEN}✓${NC} CLAUDE.md"
echo -e "   ${GREEN}✓${NC} VERSION.txt"
echo -e "   ${GREEN}✓${NC} .htaccess-uploads"
echo ""
echo -e "${BLUE}📝 Fichier de checksums:${NC} ${OUTPUT_FILE}.checksums"
echo ""
echo -e "${YELLOW}🚀 Prochaines étapes:${NC}"
echo -e "   1. Transférez ${GREEN}$(basename "${OUTPUT_FILE}")${NC} vers votre serveur"
echo -e "   2. Extrayez l'archive dans /wp-content/plugins/"
echo -e "   3. Consultez ${GREEN}INSTALLATION.md${NC} pour les instructions complètes"
echo -e "   4. Activez les plugins dans cet ordre:"
echo -e "      - CPFA Core Manager"
echo -e "      - CPFA Forms & Registrations"
echo -e "      - CPFA PDF Generator"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

exit 0
