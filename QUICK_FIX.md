# 🔧 Guide de dépannage rapide

## Problème : "Je ne vois pas le menu Ressources"

### Solution rapide (2 minutes)

1. **Ouvrez votre navigateur**
   - URL : http://localhost:8080/wp-admin
   - Login : `admin` / `admin123`

2. **Allez dans Extensions**
   - Menu de gauche → **Extensions** → **Extensions installées**

3. **Activez CPFA Core Manager**
   - Cherchez "CPFA Core Manager" dans la liste
   - Si le bouton dit "Activer", cliquez dessus
   - Si le bouton dit "Désactiver", le plugin est déjà actif

4. **Rafraîchissez la page** (F5)

5. **Vérifiez que les menus apparaissent**
   - Vous devriez maintenant voir dans le menu de gauche :
     - Formations
     - Séminaires
     - Concours
     - **Ressources** ← C'EST ICI !
     - Abonnements
     - Emprunts
     - Bibliothèque

---

## Erreur critique WordPress

### Si vous voyez "Il y a eu une erreur critique sur ce site"

```bash
# Redémarrez les conteneurs Docker
docker-compose down
docker-compose up -d

# Attendez 10 secondes
sleep 10

# Testez l'accès
curl -s http://localhost:8080 | head -1
```

### Réinitialiser complètement

```bash
# ATTENTION : Ceci va SUPPRIMER toutes les données !
docker-compose down -v
docker-compose up -d
./setup-wordpress.sh
```

---

## Ajouter des livres rapidement

### Méthode 1 : Interface graphique (LA PLUS SIMPLE)

1. Allez sur http://localhost:8080/wp-admin
2. Menu de gauche → **Ressources** → **Ajouter**
3. Remplissez :
   - **Titre** : Nom du livre
   - **Cote** : Numéro de classification (ex: 005.133 PHP)
   - **Auteurs** : Nom de l'auteur
   - **Année** : Année de publication
   - **Statut d'emprunt** : Disponible
4. Cliquez sur **Publier**

### Méthode 2 : Script automatique (10 livres en 1 commande)

```bash
docker-compose exec wordpress php << 'EOF'
<?php
require('/var/www/html/wp-load.php');
do_action('plugins_loaded');

$livres = [
    ['PHP 8 Avancé', '005.133 PHP', 'Jean Dupont', '2023'],
    ['JavaScript ES6', '005.133 JS', 'Marie Martin', '2023'],
    ['WordPress Pro', '006.76 WP', 'Pierre Durand', '2022'],
    ['Python Débutant', '005.133 PY', 'Luc Robert', '2023'],
    ['Linux Ubuntu', '005.43 LIN', 'Anne Petit', '2023'],
];

foreach ($livres as $livre) {
    $id = wp_insert_post([
        'post_type' => 'cpfa_ressource',
        'post_title' => $livre[0],
        'post_status' => 'publish'
    ]);
    if ($id) {
        update_post_meta($id, '_cpfa_ressource_cote', $livre[1]);
        update_post_meta($id, '_cpfa_ressource_auteurs', $livre[2]);
        update_post_meta($id, '_cpfa_ressource_annee', $livre[3]);
        update_post_meta($id, '_cpfa_ressource_type', 'livre');
        update_post_meta($id, '_cpfa_ressource_langue', 'français');
        update_post_meta($id, '_cpfa_ressource_statut_emprunt', 'disponible');
        echo "✅ {$livre[0]}\n";
    }
}
echo "\nTerminé! Allez sur http://localhost:8080/wp-admin/edit.php?post_type=cpfa_ressource\n";
?>
EOF
```

---

## Vérifier que tout fonctionne

### Test 1 : WordPress charge

```bash
curl -s http://localhost:8080 | grep -q "WordPress" && echo "✅ OK" || echo "❌ Erreur"
```

### Test 2 : Admin accessible

```bash
curl -s http://localhost:8080/wp-admin | grep -q "connexion\|log in" && echo "✅ OK" || echo "❌ Erreur"
```

### Test 3 : Plugin activé

```bash
docker-compose exec wordpress ls /var/www/html/wp-content/plugins/cpfa-core-manager && echo "✅ OK" || echo "❌ Erreur"
```

---

## Liens rapides

| Page | URL |
|------|-----|
| **Ajouter un livre** | http://localhost:8080/wp-admin/post-new.php?post_type=cpfa_ressource |
| **Voir tous les livres** | http://localhost:8080/wp-admin/edit.php?post_type=cpfa_ressource |
| **Bibliothèque (gestion)** | http://localhost:8080/wp-admin/admin.php?page=cpfa-library |
| **Extensions** | http://localhost:8080/wp-admin/plugins.php |

---

## Besoin d'aide ?

```bash
# Voir les logs en temps réel
docker-compose logs -f wordpress

# Voir les dernières erreurs
docker-compose exec wordpress tail -50 /var/www/html/wp-content/debug.log
```

Documentation complète : [GUIDE_AJOUT_LIVRES.md](GUIDE_AJOUT_LIVRES.md)
