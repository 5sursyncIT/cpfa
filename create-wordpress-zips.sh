#!/bin/bash
###############################################################################
# CPFA WordPress ZIP Creator
#
# Crée des archives ZIP compatibles avec le gestionnaire d'extensions WordPress
# pour une installation directe via l'interface admin.
#
# Usage: ./create-wordpress-zips.sh
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
OUTPUT_DIR="${PWD}/wordpress-plugins-zip"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      CPFA WordPress ZIP Creator v1.0                      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if running from project root
if [ ! -d "cpfa-core-manager" ]; then
    echo -e "${RED}❌ Erreur: Ce script doit être exécuté depuis la racine du projet CPFA${NC}"
    exit 1
fi

# Create output directory
echo -e "${YELLOW}📁 Création du répertoire de sortie...${NC}"
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

# Function to create a WordPress-compatible plugin ZIP
create_plugin_zip() {
    local PLUGIN_DIR=$1
    local PLUGIN_NAME=$(basename "$PLUGIN_DIR")
    local ZIP_NAME="${PLUGIN_NAME}.zip"
    local OUTPUT_PATH="${OUTPUT_DIR}/${ZIP_NAME}"

    echo -e "${BLUE}   📦 Création de ${GREEN}${ZIP_NAME}${NC}..."

    # Create temporary directory
    local TEMP_DIR="/tmp/${PLUGIN_NAME}-$$"
    mkdir -p "$TEMP_DIR"

    # Copy plugin files
    cp -r "$PLUGIN_DIR" "$TEMP_DIR/"

    # Clean development files
    find "$TEMP_DIR" -type f -name ".gitignore" -delete
    find "$TEMP_DIR" -type f -name ".DS_Store" -delete
    find "$TEMP_DIR" -type d -name ".git" -exec rm -rf {} + 2>/dev/null || true
    find "$TEMP_DIR" -type d -name "node_modules" -exec rm -rf {} + 2>/dev/null || true
    find "$TEMP_DIR" -type d -name ".idea" -exec rm -rf {} + 2>/dev/null || true
    find "$TEMP_DIR" -type f -name "test-*.php" -delete 2>/dev/null || true
    find "$TEMP_DIR" -type f -name "debug-*.php" -delete 2>/dev/null || true
    find "$TEMP_DIR" -type f -name "diagnostic-*.php" -delete 2>/dev/null || true

    # Create ZIP from the plugin directory
    cd "$TEMP_DIR"
    zip -rq "$OUTPUT_PATH" "$PLUGIN_NAME" -x "*.git*" "*.DS_Store" "*node_modules*"

    # Clean up
    rm -rf "$TEMP_DIR"

    # Get file size
    local FILE_SIZE=$(du -h "$OUTPUT_PATH" | cut -f1)
    echo -e "${GREEN}      ✓ ${ZIP_NAME} créé (${FILE_SIZE})${NC}"
}

# Create individual plugin ZIPs
echo -e "${YELLOW}📦 Création des archives ZIP individuelles...${NC}"
echo ""

create_plugin_zip "cpfa-core-manager"
create_plugin_zip "cpfa-forms-registrations"
create_plugin_zip "cpfa-pdf-generator"

# Create a combined ZIP with all plugins and documentation
echo ""
echo -e "${YELLOW}📦 Création de l'archive combinée...${NC}"

COMBINED_NAME="cpfa-complete-${TIMESTAMP}"
COMBINED_DIR="/tmp/${COMBINED_NAME}"
COMBINED_ZIP="${OUTPUT_DIR}/${COMBINED_NAME}.zip"

mkdir -p "$COMBINED_DIR"

# Copy plugins
cp -r cpfa-core-manager "$COMBINED_DIR/"
cp -r cpfa-forms-registrations "$COMBINED_DIR/"
cp -r cpfa-pdf-generator "$COMBINED_DIR/"

# Copy documentation
cp README.md "$COMBINED_DIR/" 2>/dev/null || true
cp CLAUDE.md "$COMBINED_DIR/" 2>/dev/null || true
cp FORMULAIRES_DISPONIBLES.md "$COMBINED_DIR/" 2>/dev/null || true
cp EXPORT_PRODUCTION_README.md "$COMBINED_DIR/" 2>/dev/null || true

# Create installation guide
cat > "$COMBINED_DIR/INSTALLATION_WORDPRESS_ADMIN.md" << 'EOF'
# 🚀 Installation via WordPress Admin

## Méthode 1: Installation Plugin par Plugin (Recommandé)

### Étape 1: CPFA Core Manager

1. Allez dans **Extensions → Ajouter**
2. Cliquez sur **Téléverser une extension**
3. Choisissez `cpfa-core-manager.zip`
4. Cliquez sur **Installer maintenant**
5. **Activez** le plugin

### Étape 2: CPFA Forms & Registrations

1. Allez dans **Extensions → Ajouter**
2. Cliquez sur **Téléverser une extension**
3. Choisissez `cpfa-forms-registrations.zip`
4. Cliquez sur **Installer maintenant**
5. **Activez** le plugin

### Étape 3: CPFA PDF Generator

1. Allez dans **Extensions → Ajouter**
2. Cliquez sur **Téléverser une extension**
3. Choisissez `cpfa-pdf-generator.zip`
4. Cliquez sur **Installer maintenant**
5. **Activez** le plugin

## Méthode 2: Installation via FTP

Si l'upload via WordPress échoue (taille de fichier):

1. Extrayez les 3 fichiers ZIP localement
2. Uploadez les 3 dossiers via FTP dans `/wp-content/plugins/`
3. Activez les plugins via WordPress Admin

## Ordre d'Activation Important

⚠️ **IMPORTANT:** Activez toujours dans cet ordre:
1. CPFA Core Manager (en premier)
2. CPFA Forms & Registrations
3. CPFA PDF Generator

## Vérification

Après activation, vous devriez voir:
- Menu **CPFA** dans l'admin WordPress
- Sous-menus: Bibliothèque, Préinscriptions, Paramètres

## Configuration

Consultez `EXPORT_PRODUCTION_README.md` pour la configuration complète.

## Problèmes Courants

### "La taille du fichier est trop importante"

**Solution 1: Augmenter les limites PHP**

Ajoutez dans `.htaccess`:
```apache
php_value upload_max_filesize 64M
php_value post_max_size 64M
php_value max_execution_time 300
php_value max_input_time 300
```

Ou dans `php.ini`:
```ini
upload_max_filesize = 64M
post_max_size = 64M
max_execution_time = 300
```

**Solution 2: Installation via FTP**

Voir Méthode 2 ci-dessus.

### "Le plugin n'apparaît pas"

1. Vérifiez que le dossier est bien dans `/wp-content/plugins/`
2. Vérifiez les permissions (755 pour dossiers, 644 pour fichiers)
3. Rechargez la page Extensions

### "Erreur lors de l'installation"

1. Vérifiez que WordPress est version 6.0+
2. Vérifiez que PHP est version 8.0+
3. Consultez les logs: `wp-content/debug.log`
EOF

# Create version info
cat > "$COMBINED_DIR/VERSION.txt" << EOF
CPFA WordPress Plugins - Complete Package
==========================================

Version: 1.0.0
Date: $(date '+%Y-%m-%d %H:%M:%S')
Git commit: $(git rev-parse --short HEAD 2>/dev/null || echo "N/A")

Plugins inclus:
- cpfa-core-manager.zip (installation individuelle)
- cpfa-forms-registrations.zip (installation individuelle)
- cpfa-pdf-generator.zip (installation individuelle)

Installation:
1. Voir INSTALLATION_WORDPRESS_ADMIN.md pour installation via interface
2. Voir EXPORT_PRODUCTION_README.md pour installation complète

WordPress: 6.0+
PHP: 8.0+
EOF

# Clean development files from combined directory
find "$COMBINED_DIR" -type f -name ".gitignore" -delete
find "$COMBINED_DIR" -type f -name ".DS_Store" -delete
find "$COMBINED_DIR" -type d -name ".git" -exec rm -rf {} + 2>/dev/null || true
find "$COMBINED_DIR" -type d -name "node_modules" -exec rm -rf {} + 2>/dev/null || true
find "$COMBINED_DIR" -type f -name "test-*.php" -delete 2>/dev/null || true
find "$COMBINED_DIR" -type f -name "debug-*.php" -delete 2>/dev/null || true

# Create combined ZIP
cd /tmp
zip -rq "$COMBINED_ZIP" "$COMBINED_NAME" -x "*.git*" "*.DS_Store"

# Clean up
rm -rf "$COMBINED_DIR"

COMBINED_SIZE=$(du -h "$COMBINED_ZIP" | cut -f1)
echo -e "${GREEN}   ✓ Archive combinée créée (${COMBINED_SIZE})${NC}"

# Generate checksums for all files
echo ""
echo -e "${YELLOW}🔒 Génération des checksums...${NC}"

cat > "${OUTPUT_DIR}/CHECKSUMS.txt" << EOF
CPFA WordPress Plugins - Checksums
===================================
Date: $(date '+%Y-%m-%d %H:%M:%S')

EOF

cd "$OUTPUT_DIR"
for file in *.zip; do
    if [ -f "$file" ]; then
        SIZE=$(du -h "$file" | cut -f1)
        MD5=$(md5sum "$file" | cut -d' ' -f1)
        SHA256=$(sha256sum "$file" | cut -d' ' -f1)

        echo "$file (${SIZE})" >> CHECKSUMS.txt
        echo "  MD5:    $MD5" >> CHECKSUMS.txt
        echo "  SHA256: $SHA256" >> CHECKSUMS.txt
        echo "" >> CHECKSUMS.txt
    fi
done

# Create README for the output directory
cat > "${OUTPUT_DIR}/README.txt" << 'EOF'
╔════════════════════════════════════════════════════════════╗
║         CPFA WordPress Plugins - Archives ZIP              ║
╚════════════════════════════════════════════════════════════╝

Ce dossier contient les archives ZIP prêtes pour l'installation
via l'interface d'administration WordPress.

📦 FICHIERS INDIVIDUELS (Installation recommandée):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• cpfa-core-manager.zip
  → Plugin principal de gestion de bibliothèque
  → À installer EN PREMIER

• cpfa-forms-registrations.zip
  → Formulaires d'inscription et validation
  → À installer EN DEUXIÈME

• cpfa-pdf-generator.zip
  → Génération de cartes d'abonné PDF
  → À installer EN TROISIÈME

📦 ARCHIVE COMPLÈTE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• cpfa-complete-YYYYMMDD-HHMMSS.zip
  → Tous les plugins + documentation
  → Pour installation manuelle via FTP/SFTP

🚀 INSTALLATION VIA WORDPRESS ADMIN:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Extensions → Ajouter → Téléverser une extension
2. Choisir cpfa-core-manager.zip → Installer → Activer
3. Choisir cpfa-forms-registrations.zip → Installer → Activer
4. Choisir cpfa-pdf-generator.zip → Installer → Activer

📖 DOCUMENTATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• INSTALLATION_WORDPRESS_ADMIN.md (dans archive complète)
• EXPORT_PRODUCTION_README.md (dans archive complète)
• CHECKSUMS.txt (vérification intégrité)

⚠️ IMPORTANT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

L'ordre d'activation est CRITIQUE:
1. CPFA Core Manager (obligatoire en premier)
2. CPFA Forms & Registrations
3. CPFA PDF Generator

Si vous installez dans le mauvais ordre, désactivez tout
et réactivez dans le bon ordre.

🔒 SÉCURITÉ:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Vérifiez les checksums après transfert:
• Consultez CHECKSUMS.txt
• Comparez avec md5sum ou sha256sum

📞 SUPPORT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Pour toute assistance:
• Email: support@cpfa.sn
• Documentation complète dans l'archive combinée
EOF

# Summary
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              ✅ Archives ZIP Créées avec Succès !          ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📁 Dossier de sortie:${NC} ${GREEN}${OUTPUT_DIR}${NC}"
echo ""
echo -e "${BLUE}📦 Archives individuelles (pour WordPress Admin):${NC}"
ls -lh "${OUTPUT_DIR}"/*.zip | grep -v "complete" | awk '{printf "   \033[0;32m✓\033[0m %s (%s)\n", $9, $5}'
echo ""
echo -e "${BLUE}📦 Archive complète (pour installation manuelle):${NC}"
ls -lh "${OUTPUT_DIR}"/cpfa-complete-*.zip | awk '{printf "   \033[0;32m✓\033[0m %s (%s)\n", $9, $5}'
echo ""
echo -e "${BLUE}📝 Fichiers additionnels:${NC}"
echo -e "   ${GREEN}✓${NC} README.txt"
echo -e "   ${GREEN}✓${NC} CHECKSUMS.txt"
echo ""
echo -e "${YELLOW}🚀 Installation via WordPress Admin:${NC}"
echo -e "   1. Extensions → Ajouter → Téléverser une extension"
echo -e "   2. Choisir ${GREEN}cpfa-core-manager.zip${NC} → Installer → Activer"
echo -e "   3. Choisir ${GREEN}cpfa-forms-registrations.zip${NC} → Installer → Activer"
echo -e "   4. Choisir ${GREEN}cpfa-pdf-generator.zip${NC} → Installer → Activer"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

exit 0
