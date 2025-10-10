.PHONY: help install start stop restart logs clean test wp shell db backup restore

# Couleurs pour l'affichage
BLUE := \033[0;34m
GREEN := \033[0;32m
RED := \033[0;31m
NC := \033[0m # No Color

help: ## Affiche cette aide
	@echo "$(BLUE)CPFA WordPress Plugin System - Commandes Docker$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(BLUE)Exemples d'utilisation:$(NC)"
	@echo "  make install    # Première installation"
	@echo "  make start      # Démarrer les services"
	@echo "  make logs       # Voir les logs"
	@echo "  make wp ARGS='plugin list'  # Utiliser WP-CLI"

install: ## Installation complète (WordPress + Plugin)
	@echo "$(BLUE)🚀 Installation WordPress + CPFA...$(NC)"
	@./setup-wordpress.sh

start: ## Démarrer tous les services
	@echo "$(BLUE)▶️  Démarrage des services...$(NC)"
	@docker-compose up -d
	@echo "$(GREEN)✓ Services démarrés$(NC)"
	@echo ""
	@echo "WordPress:   http://localhost:8080"
	@echo "Admin:       http://localhost:8080/wp-admin"
	@echo "phpMyAdmin:  http://localhost:8081"
	@echo "MailHog:     http://localhost:8025"

stop: ## Arrêter tous les services
	@echo "$(BLUE)⏹️  Arrêt des services...$(NC)"
	@docker-compose down
	@echo "$(GREEN)✓ Services arrêtés$(NC)"

restart: ## Redémarrer tous les services
	@echo "$(BLUE)🔄 Redémarrage des services...$(NC)"
	@docker-compose restart
	@echo "$(GREEN)✓ Services redémarrés$(NC)"

logs: ## Voir les logs (Ctrl+C pour quitter)
	@docker-compose logs -f

logs-wp: ## Voir les logs WordPress uniquement
	@docker-compose logs -f wordpress

logs-db: ## Voir les logs MySQL uniquement
	@docker-compose logs -f db

ps: ## Liste des containers actifs
	@docker-compose ps

shell: ## Accès shell WordPress
	@docker-compose exec wordpress bash

shell-db: ## Accès shell MySQL
	@docker-compose exec db bash

wp: ## Exécuter une commande WP-CLI (usage: make wp ARGS='plugin list')
	@docker-compose run --rm wpcli $(ARGS)

db-connect: ## Se connecter à MySQL
	@docker-compose exec db mysql -u wordpress -pwordpress wordpress

backup: ## Backup de la base de données
	@echo "$(BLUE)💾 Backup de la base de données...$(NC)"
	@mkdir -p backups
	@docker-compose exec -T db mysqldump -u wordpress -pwordpress wordpress > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)✓ Backup créé dans backups/$(NC)"

restore: ## Restaurer le dernier backup (usage: make restore FILE=backup.sql)
	@echo "$(BLUE)📥 Restauration de la base de données...$(NC)"
	@if [ -z "$(FILE)" ]; then \
		echo "$(RED)✗ Erreur: Spécifier le fichier avec FILE=backup.sql$(NC)"; \
		exit 1; \
	fi
	@docker-compose exec -T db mysql -u wordpress -pwordpress wordpress < $(FILE)
	@echo "$(GREEN)✓ Base de données restaurée$(NC)"

clean: ## Nettoyer les containers et volumes
	@echo "$(RED)⚠️  Suppression de tous les containers et volumes...$(NC)"
	@read -p "Êtes-vous sûr? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose down -v; \
		echo "$(GREEN)✓ Nettoyage terminé$(NC)"; \
	fi

reset: clean install ## Reset complet et réinstallation

plugin-activate: ## Activer le plugin CPFA
	@docker-compose run --rm wpcli plugin activate cpfa-core-manager
	@echo "$(GREEN)✓ Plugin activé$(NC)"

plugin-deactivate: ## Désactiver le plugin CPFA
	@docker-compose run --rm wpcli plugin deactivate cpfa-core-manager
	@echo "$(GREEN)✓ Plugin désactivé$(NC)"

plugin-list: ## Liste des plugins installés
	@docker-compose run --rm wpcli plugin list

test-api: ## Tester les endpoints REST API
	@echo "$(BLUE)🧪 Test des endpoints REST API...$(NC)"
	@echo ""
	@echo "Formations:"
	@curl -s http://localhost:8080/wp-json/cpfa/v1/formations | jq -r '.[].title' 2>/dev/null || echo "  Aucune formation"
	@echo ""
	@echo "Séminaires:"
	@curl -s http://localhost:8080/wp-json/cpfa/v1/seminaires | jq -r '.[].title' 2>/dev/null || echo "  Aucun séminaire"
	@echo ""
	@echo "Stats:"
	@curl -s http://localhost:8080/wp-json/cpfa/v1/stats | jq 2>/dev/null || echo "  Erreur"

test-data: ## Créer des données de test
	@echo "$(BLUE)📝 Création de données de test...$(NC)"
	@docker-compose run --rm wpcli post create \
		--post_type=cpfa_formation \
		--post_title="Formation Test $$(date +%H%M%S)" \
		--post_status=publish
	@echo "$(GREEN)✓ Formation créée$(NC)"

elementor-install: ## Installer Elementor
	@docker-compose run --rm wpcli plugin install elementor --activate
	@echo "$(GREEN)✓ Elementor installé$(NC)"

flush-cache: ## Vider le cache WordPress
	@docker-compose run --rm wpcli cache flush
	@docker-compose run --rm wpcli rewrite flush
	@echo "$(GREEN)✓ Cache vidé$(NC)"

debug-enable: ## Activer le mode debug
	@docker-compose run --rm wpcli config set WP_DEBUG true --raw
	@docker-compose run --rm wpcli config set WP_DEBUG_LOG true --raw
	@echo "$(GREEN)✓ Debug activé$(NC)"

debug-disable: ## Désactiver le mode debug
	@docker-compose run --rm wpcli config set WP_DEBUG false --raw
	@docker-compose run --rm wpcli config set WP_DEBUG_LOG false --raw
	@echo "$(GREEN)✓ Debug désactivé$(NC)"

debug-log: ## Voir le fichier debug.log
	@docker-compose exec wordpress tail -f /var/www/html/wp-content/debug.log

composer-install: ## Installer les dépendances Composer
	@echo "$(BLUE)📦 Installation des dépendances Composer...$(NC)"
	@composer install
	@echo "$(GREEN)✓ Dépendances installées$(NC)"

phpcs: ## Vérifier les standards WordPress
	@echo "$(BLUE)🔍 Vérification des standards WordPress...$(NC)"
	@vendor/bin/phpcs --standard=WordPress cpfa-core-manager/

phpcbf: ## Corriger automatiquement les standards
	@echo "$(BLUE)🔧 Correction automatique...$(NC)"
	@vendor/bin/phpcbf --standard=WordPress cpfa-core-manager/

info: ## Afficher les informations système
	@echo "$(BLUE)ℹ️  Informations système$(NC)"
	@echo ""
	@echo "Docker:"
	@docker --version
	@echo ""
	@echo "Docker Compose:"
	@docker-compose --version
	@echo ""
	@echo "Containers actifs:"
	@docker-compose ps
	@echo ""
	@echo "Volumes:"
	@docker volume ls | grep cpfa || echo "  Aucun volume"
	@echo ""
	@echo "WordPress:"
	@docker-compose run --rm wpcli core version 2>/dev/null || echo "  Non installé"

open: ## Ouvrir WordPress dans le navigateur
	@echo "$(BLUE)🌐 Ouverture de WordPress...$(NC)"
	@if command -v xdg-open > /dev/null; then \
		xdg-open http://localhost:8080; \
	elif command -v open > /dev/null; then \
		open http://localhost:8080; \
	else \
		echo "Ouvrez manuellement: http://localhost:8080"; \
	fi

open-admin: ## Ouvrir l'admin WordPress
	@echo "$(BLUE)🌐 Ouverture de l'admin...$(NC)"
	@if command -v xdg-open > /dev/null; then \
		xdg-open http://localhost:8080/wp-admin; \
	elif command -v open > /dev/null; then \
		open http://localhost:8080/wp-admin; \
	else \
		echo "Ouvrez manuellement: http://localhost:8080/wp-admin"; \
	fi

urls: ## Afficher toutes les URLs
	@echo "$(BLUE)🌐 URLs disponibles:$(NC)"
	@echo ""
	@echo "  WordPress:     http://localhost:8080"
	@echo "  Admin:         http://localhost:8080/wp-admin"
	@echo "  phpMyAdmin:    http://localhost:8081"
	@echo "  MailHog:       http://localhost:8025"
	@echo "  REST API:      http://localhost:8080/wp-json/cpfa/v1/"
	@echo ""
	@echo "$(BLUE)Identifiants:$(NC)"
	@echo "  User:          admin"
	@echo "  Password:      admin123"
