# ⚡ CPFA - Quick Start Guide

## Installation en 3 étapes (2 minutes)

### 1️⃣ Installer

```bash
cd /home/youssoupha/project/cpfa
make install
```

### 2️⃣ Accéder

Ouvrir http://localhost:8080/wp-admin
- User: `admin`
- Password: `admin123`

### 3️⃣ Tester

Aller dans **CPFA > Formations** et créer une formation!

---

## 🎯 Commandes essentielles

```bash
make start       # Démarrer
make stop        # Arrêter
make logs        # Voir les logs
make test        # Lancer les tests
make help        # Aide complète
```

## 📍 URLs importantes

- **Site:** http://localhost:8080
- **Admin:** http://localhost:8080/wp-admin
- **API:** http://localhost:8080/wp-json/cpfa/v1/
- **phpMyAdmin:** http://localhost:8081
- **MailHog:** http://localhost:8025

## 🔧 Développement rapide

### Modifier le plugin
1. Éditez `cpfa-core-manager/includes/...`
2. Rechargez la page WordPress
3. C'est tout! (changements instantanés)

### Tester l'API
```bash
curl http://localhost:8080/wp-json/cpfa/v1/formations
```

### Créer une formation
```bash
make wp ARGS='post create --post_type=cpfa_formation --post_title="Ma Formation" --post_status=publish'
```

## 🎨 Tester les widgets Elementor

1. Créer une nouvelle page
2. Éditer avec Elementor
3. Chercher "CPFA Widgets"
4. Glisser-déposer:
   - CPFA Catalogue
   - CPFA Recherche
   - CPFA Statistiques
   - CPFA Événements

## ❓ Problème?

```bash
# Réinitialiser tout
make clean
make install

# Voir les erreurs
make debug-log
```

## 📚 Documentation

- **Installation:** [README_DOCKER.md](README_DOCKER.md)
- **Guide complet:** [DOCKER_GUIDE.md](DOCKER_GUIDE.md)
- **Développement:** [CLAUDE.md](CLAUDE.md)

---

**C'est tout! Vous êtes prêt!** 🚀
