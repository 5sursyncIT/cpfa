#!/bin/bash
###############################################################################
# Install Select2 Locally
#
# Downloads Select2 v4.1.0-rc.0 and installs it locally in the plugin
# to remove CDN dependency.
#
# Usage: ./install-select2.sh
###############################################################################

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

VENDOR_DIR="cpfa-core-manager/assets/vendor/select2"
VERSION="4.1.0-rc.0"
CDN_BASE="https://cdn.jsdelivr.net/npm/select2@${VERSION}/dist"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         Select2 Local Installation Script                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if running from project root
if [ ! -d "cpfa-core-manager" ]; then
    echo -e "${RED}❌ Error: This script must be run from the project root${NC}"
    exit 1
fi

# Create vendor directory
echo -e "${BLUE}📁 Creating vendor directory...${NC}"
mkdir -p "$VENDOR_DIR"

# Download Select2 CSS
echo -e "${BLUE}⬇️  Downloading Select2 CSS v${VERSION}...${NC}"
if curl -f -o "${VENDOR_DIR}/select2.min.css" "${CDN_BASE}/css/select2.min.css"; then
    echo -e "${GREEN}✓ CSS downloaded successfully${NC}"
else
    echo -e "${RED}❌ Failed to download CSS${NC}"
    exit 1
fi

# Download Select2 JS
echo -e "${BLUE}⬇️  Downloading Select2 JS v${VERSION}...${NC}"
if curl -f -o "${VENDOR_DIR}/select2.min.js" "${CDN_BASE}/js/select2.min.js"; then
    echo -e "${GREEN}✓ JS downloaded successfully${NC}"
else
    echo -e "${RED}❌ Failed to download JS${NC}"
    exit 1
fi

# Verify files
echo -e "${BLUE}🔍 Verifying installation...${NC}"
if [ -f "${VENDOR_DIR}/select2.min.css" ] && [ -f "${VENDOR_DIR}/select2.min.js" ]; then
    CSS_SIZE=$(wc -c < "${VENDOR_DIR}/select2.min.css" | tr -d ' ')
    JS_SIZE=$(wc -c < "${VENDOR_DIR}/select2.min.js" | tr -d ' ')

    echo -e "${GREEN}✓ select2.min.css (${CSS_SIZE} bytes)${NC}"
    echo -e "${GREEN}✓ select2.min.js (${JS_SIZE} bytes)${NC}"
else
    echo -e "${RED}❌ Installation verification failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✓ Select2 installed successfully!                       ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📍 Location:${NC} ${VENDOR_DIR}"
echo -e "${BLUE}📦 Version:${NC} ${VERSION}"
echo ""
echo -e "${BLUE}ℹ️  Note:${NC} CDN dependency removed. Plugin now uses local files."
