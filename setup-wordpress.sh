#!/bin/bash
# Script d'installation automatique WordPress + CPFA

echo "🚀 Installation WordPress + CPFA Plugin System"
echo "================================================"

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
print_step() {
    echo -e "${BLUE}➜${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Vérifier que Docker est installé
if ! command -v docker &> /dev/null; then
    print_error "Docker n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

print_success "Docker et Docker Compose détectés"

# Créer le fichier .env s'il n'existe pas
if [ ! -f .env ]; then
    print_step "Création du fichier .env..."
    cp .env.example .env
    print_success "Fichier .env créé"
fi

# Arrêter les containers existants
print_step "Nettoyage des containers existants..."
docker-compose down 2>/dev/null
print_success "Containers arrêtés"

# Construire et démarrer les containers
print_step "Démarrage des containers Docker..."
docker-compose up -d

# Attendre que les services soient prêts
print_step "Attente du démarrage des services..."
sleep 10

# Vérifier que WordPress est accessible
print_step "Vérification de WordPress..."
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if curl -s http://localhost:8080 > /dev/null 2>&1; then
        print_success "WordPress est accessible"
        break
    fi
    attempt=$((attempt + 1))
    echo -n "."
    sleep 2
done
echo ""

if [ $attempt -eq $max_attempts ]; then
    print_error "WordPress n'a pas démarré dans le délai imparti"
    exit 1
fi

# Installer WordPress via WP-CLI
print_step "Installation de WordPress..."
docker-compose run --rm wpcli core install \
    --url=http://localhost:8080 \
    --title="CPFA Training Center" \
    --admin_user=admin \
    --admin_password=admin123 \
    --admin_email=admin@cpfa.local \
    --skip-email

print_success "WordPress installé"

# Activer le plugin CPFA Core Manager
print_step "Activation du plugin CPFA Core Manager..."
docker-compose run --rm wpcli plugin activate cpfa-core-manager

print_success "Plugin activé"

# Installer et activer Elementor (requis pour les widgets)
print_step "Installation d'Elementor..."
docker-compose run --rm wpcli plugin install elementor --activate

print_success "Elementor installé et activé"

# Configurer les permaliens
print_step "Configuration des permaliens..."
docker-compose run --rm wpcli rewrite structure '/%postname%/' --hard

print_success "Permaliens configurés"

# Configurer le thème
print_step "Configuration du thème..."
docker-compose run --rm wpcli theme install hello-elementor --activate

print_success "Thème Hello Elementor activé"

# Créer des données de test
print_step "Création de données de test..."

# Formation 1
docker-compose run --rm wpcli post create \
    --post_type=cpfa_formation \
    --post_title="Gestion de Projet Agile" \
    --post_content="Formation complète en gestion de projet avec méthodologie Agile. Apprenez Scrum, Kanban et les meilleures pratiques." \
    --post_status=publish \
    --meta_input='{"_cpfa_formation_type":"diplomante","_cpfa_formation_duree":"120","_cpfa_formation_niveau":"Intermédiaire","_cpfa_formation_prix":"150000"}' 2>/dev/null

# Formation 2
docker-compose run --rm wpcli post create \
    --post_type=cpfa_formation \
    --post_title="Développement Web Full Stack" \
    --post_content="Maîtrisez le développement web moderne avec HTML, CSS, JavaScript, PHP et bases de données." \
    --post_status=publish \
    --meta_input='{"_cpfa_formation_type":"certifiante","_cpfa_formation_duree":"200","_cpfa_formation_niveau":"Débutant","_cpfa_formation_prix":"250000"}' 2>/dev/null

# Séminaire 1
docker-compose run --rm wpcli post create \
    --post_type=cpfa_seminaire \
    --post_title="Leadership et Management d'Équipe" \
    --post_content="Séminaire de 2 jours sur les techniques de leadership moderne et le management d'équipe efficace." \
    --post_status=publish \
    --meta_input='{"_cpfa_seminaire_dates":"15-16 décembre 2025","_cpfa_seminaire_lieu":"Dakar","_cpfa_seminaire_quota":"30","_cpfa_seminaire_prix":"75000"}' 2>/dev/null

# Ressource 1
docker-compose run --rm wpcli post create \
    --post_type=cpfa_ressource \
    --post_title="Clean Code - Robert C. Martin" \
    --post_content="Un guide essentiel pour écrire du code propre et maintenable." \
    --post_status=publish \
    --meta_input='{"_cpfa_ressource_cote":"005.1-MAR","_cpfa_ressource_auteurs":"Robert C. Martin","_cpfa_ressource_mots_cles":"programmation, qualité code, bonnes pratiques","_cpfa_ressource_statut_pret":"disponible"}' 2>/dev/null

print_success "Données de test créées"

# Afficher les informations de connexion
echo ""
echo "================================================"
echo -e "${GREEN}✓ Installation terminée avec succès!${NC}"
echo "================================================"
echo ""
echo "📍 URLs d'accès:"
echo "   WordPress:    http://localhost:8080"
echo "   Admin:        http://localhost:8080/wp-admin"
echo "   phpMyAdmin:   http://localhost:8081"
echo "   MailHog:      http://localhost:8025"
echo ""
echo "🔐 Identifiants WordPress:"
echo "   Utilisateur:  admin"
echo "   Mot de passe: admin123"
echo ""
echo "🔐 Identifiants Base de données:"
echo "   Host:         localhost:3306"
echo "   Database:     wordpress"
echo "   User:         wordpress"
echo "   Password:     wordpress"
echo ""
echo "📦 Plugins installés:"
echo "   ✓ CPFA Core Manager"
echo "   ✓ Elementor"
echo ""
echo "🎯 Prochaines étapes:"
echo "   1. Aller sur http://localhost:8080/wp-admin"
echo "   2. Explorer le menu CPFA"
echo "   3. Configurer les réglages (CPFA > Réglages généraux)"
echo "   4. Créer une page avec Elementor et tester les widgets CPFA"
echo ""
echo "📚 Commandes utiles:"
echo "   Arrêter:      docker-compose down"
echo "   Redémarrer:   docker-compose restart"
echo "   Logs:         docker-compose logs -f wordpress"
echo "   WP-CLI:       docker-compose run --rm wpcli [commande]"
echo ""
echo "================================================"
