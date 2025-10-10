# 🐳 Installation WordPress + CPFA avec Docker

## ⚡ Installation ultra-rapide

```bash
cd /home/youssoupha/project/cpfa

# Installation automatique (2-3 minutes)
make install

# Ou si make n'est pas disponible
./setup-wordpress.sh
```

C'est tout! WordPress + Plugin CPFA est prêt! 🎉

## 🌐 Accès

### URLs
- **WordPress:** http://localhost:8080
- **Admin:** http://localhost:8080/wp-admin
- **phpMyAdmin:** http://localhost:8081
- **MailHog:** http://localhost:8025

### Identifiants
- **User:** `admin`
- **Password:** `admin123`

## 🎯 Commandes rapides

```bash
# Aide complète
make help

# Démarrer
make start

# Arrêter
make stop

# Voir les logs
make logs

# Shell WordPress
make shell

# WP-CLI
make wp ARGS='plugin list'

# Ouvrir dans le navigateur
make open
```

## 📚 Documentation complète

Voir [DOCKER_GUIDE.md](DOCKER_GUIDE.md) pour:
- Guide complet des commandes
- Dépannage
- Configuration avancée
- Tests et développement

## 🧪 Tester le plugin

1. Aller sur http://localhost:8080/wp-admin
2. Menu **CPFA** → Explorer toutes les fonctionnalités
3. Créer une page avec **Elementor**
4. Ajouter les **widgets CPFA**:
   - CPFA Catalogue
   - CPFA Recherche
   - CPFA Statistiques
   - CPFA Événements à venir

## 🔧 Développement

Les modifications du plugin sont **reflétées immédiatement**:
- Éditez les fichiers dans `cpfa-core-manager/`
- Rechargez la page WordPress
- Pas de rebuild nécessaire!

## ❓ Problèmes?

```bash
# Réinitialiser complètement
make clean
make install

# Voir les logs d'erreur
make debug-log

# Info système
make info
```

## 📖 Plus d'infos

- **Guide complet:** [DOCKER_GUIDE.md](DOCKER_GUIDE.md)
- **Installation:** [INSTALLATION.md](INSTALLATION.md)
- **Documentation dev:** [CLAUDE.md](CLAUDE.md)

---

**Prêt en 3 minutes!** ⚡
