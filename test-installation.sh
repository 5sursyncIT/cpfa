#!/bin/bash
# Script de test pour vérifier l'installation CPFA

echo "🧪 Test d'installation CPFA WordPress Plugin System"
echo "===================================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

PASSED=0
FAILED=0

# Fonction de test
test_case() {
    local name="$1"
    local command="$2"

    echo -n "Testing: $name... "
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        ((FAILED++))
        return 1
    fi
}

# Test Docker
echo -e "${BLUE}=== Tests Docker ===${NC}"
test_case "Docker installé" "command -v docker"
test_case "Docker Compose installé" "command -v docker-compose"
test_case "Containers en cours" "docker-compose ps | grep -q 'Up'"
echo ""

# Test WordPress
echo -e "${BLUE}=== Tests WordPress ===${NC}"
test_case "WordPress accessible" "curl -s http://localhost:8080 | grep -q 'WordPress'"
test_case "Admin accessible" "curl -s http://localhost:8080/wp-admin | grep -q 'wp-login'"
test_case "WordPress installé" "docker-compose run --rm wpcli core is-installed"
echo ""

# Test Plugin
echo -e "${BLUE}=== Tests Plugin CPFA ===${NC}"
test_case "Plugin présent" "docker-compose exec -T wordpress ls /var/www/html/wp-content/plugins/cpfa-core-manager/cpfa-core-manager.php"
test_case "Plugin activé" "docker-compose run --rm wpcli plugin is-active cpfa-core-manager"
echo ""

# Test CPT
echo -e "${BLUE}=== Tests Custom Post Types ===${NC}"
test_case "CPT Formations" "docker-compose run --rm wpcli post-type list --field=name | grep -q 'cpfa_formation'"
test_case "CPT Séminaires" "docker-compose run --rm wpcli post-type list --field=name | grep -q 'cpfa_seminaire'"
test_case "CPT Concours" "docker-compose run --rm wpcli post-type list --field=name | grep -q 'cpfa_concours'"
test_case "CPT Ressources" "docker-compose run --rm wpcli post-type list --field=name | grep -q 'cpfa_ressource'"
test_case "CPT Abonnements" "docker-compose run --rm wpcli post-type list --field=name | grep -q 'cpfa_abonnement'"
test_case "CPT Emprunts" "docker-compose run --rm wpcli post-type list --field=name | grep -q 'cpfa_emprunt'"
echo ""

# Test REST API
echo -e "${BLUE}=== Tests REST API ===${NC}"
test_case "API Catalogue" "curl -s http://localhost:8080/wp-json/cpfa/v1/catalogue | grep -q '\['"
test_case "API Formations" "curl -s http://localhost:8080/wp-json/cpfa/v1/formations | grep -q '\['"
test_case "API Séminaires" "curl -s http://localhost:8080/wp-json/cpfa/v1/seminaires | grep -q '\['"
test_case "API Concours" "curl -s http://localhost:8080/wp-json/cpfa/v1/concours | grep -q '\['"
test_case "API Stats" "curl -s http://localhost:8080/wp-json/cpfa/v1/stats | grep -q 'formations'"
echo ""

# Test Elementor
echo -e "${BLUE}=== Tests Elementor ===${NC}"
test_case "Elementor installé" "docker-compose run --rm wpcli plugin is-installed elementor"
test_case "Elementor activé" "docker-compose run --rm wpcli plugin is-active elementor"
echo ""

# Test Services
echo -e "${BLUE}=== Tests Services ===${NC}"
test_case "phpMyAdmin accessible" "curl -s http://localhost:8081 | grep -q 'phpMyAdmin'"
test_case "MailHog accessible" "curl -s http://localhost:8025 | grep -q 'MailHog'"
echo ""

# Test Base de données
echo -e "${BLUE}=== Tests Base de données ===${NC}"
test_case "MySQL en cours" "docker-compose exec -T db mysqladmin ping -h localhost -u root -prootpassword | grep -q 'alive'"
test_case "BDD WordPress existe" "docker-compose exec -T db mysql -u wordpress -pwordpress -e 'SHOW DATABASES' | grep -q 'wordpress'"
echo ""

# Test Fichiers
echo -e "${BLUE}=== Tests Fichiers ===${NC}"
test_case "Structure CPT" "[ -d cpfa-core-manager/includes/cpt ]"
test_case "Structure Services" "[ -d cpfa-core-manager/includes/services ]"
test_case "Structure Elementor" "[ -d cpfa-core-manager/includes/elementor ]"
test_case "Assets CSS" "[ -f cpfa-core-manager/assets/css/cpfa-core.css ]"
test_case "Assets JS" "[ -f cpfa-core-manager/assets/js/cpfa-core.js ]"
echo ""

# Test Posts de test
echo -e "${BLUE}=== Tests Données ===${NC}"
COUNT_FORMATIONS=$(docker-compose run --rm wpcli post list --post_type=cpfa_formation --format=count 2>/dev/null || echo "0")
COUNT_SEMINAIRES=$(docker-compose run --rm wpcli post list --post_type=cpfa_seminaire --format=count 2>/dev/null || echo "0")
COUNT_RESSOURCES=$(docker-compose run --rm wpcli post list --post_type=cpfa_ressource --format=count 2>/dev/null || echo "0")

test_case "Formations créées ($COUNT_FORMATIONS)" "[ $COUNT_FORMATIONS -gt 0 ]"
test_case "Séminaires créés ($COUNT_SEMINAIRES)" "[ $COUNT_SEMINAIRES -gt 0 ]"
test_case "Ressources créées ($COUNT_RESSOURCES)" "[ $COUNT_RESSOURCES -gt 0 ]"
echo ""

# Résumé
echo "===================================================="
echo -e "${BLUE}Résumé des tests:${NC}"
echo -e "  ${GREEN}Réussis: $PASSED${NC}"
echo -e "  ${RED}Échoués:  $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ Tous les tests sont passés! Installation réussie!${NC}"
    echo ""
    echo "🎉 WordPress + CPFA est prêt à l'emploi!"
    echo ""
    echo "Accès:"
    echo "  WordPress:   http://localhost:8080"
    echo "  Admin:       http://localhost:8080/wp-admin"
    echo "  User:        admin"
    echo "  Password:    admin123"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Certains tests ont échoué. Vérifiez l'installation.${NC}"
    echo ""
    echo "Pour réinitialiser:"
    echo "  make clean"
    echo "  make install"
    echo ""
    exit 1
fi
