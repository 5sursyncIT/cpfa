# 📚 Guide complet : Ajouter des livres dans la bibliothèque CPFA

## Prérequis

✅ WordPress doit être lancé : `docker-compose up -d`
✅ Le plugin CPFA Core Manager doit être activé

## Méthode 1 : Interface WordPress (Recommandé pour débuter)

### Étape 1 : Se connecter à WordPress

1. Ouvrez votre navigateur
2. Allez sur : http://localhost:8080/wp-admin
3. Connectez-vous avec :
   - **Identifiant** : `admin`
   - **Mot de passe** : `admin123`

### Étape 2 : Vérifier que le plugin est actif

1. Dans le menu de gauche, cliquez sur **"Extensions"**
2. Vérifiez que **"CPFA Core Manager"** est actif (fond bleu clair)
3. Si ce n'est pas le cas, cliquez sur **"Activer"**

### Étape 3 : Accéder au menu Ressources

Après activation du plugin, vous devriez voir dans le menu de gauche :

```
📋 Tableau de bord
📝 Articles
📄 Pages
💬 Commentaires
━━━━━━━━━━━━━━━━━━━━
📚 Formations        ← Nouveaux menus CPFA
📖 Séminaires
🏆 Concours
📗 Ressources        ← CLIQUEZ ICI !
👥 Abonnements
📘 Emprunts
━━━━━━━━━━━━━━━━━━━━
📖 Bibliothèque      ← Gestion des emprunts
```

**Si vous ne voyez PAS ces menus**, le plugin n'est pas actif. Suivez l'étape 2.

### Étape 4 : Ajouter un livre

1. Cliquez sur **"Ressources"** → **"Ajouter"**
2. Ou allez directement sur : http://localhost:8080/wp-admin/post-new.php?post_type=cpfa_ressource

### Étape 5 : Remplir les informations

#### Zone principale (en haut)

**Titre du livre** *(requis)*
```
Exemple : PHP 8 - Les fondamentaux
```

**Contenu / Description** *(optionnel)*
```
Exemple : Ce livre couvre tous les aspects de PHP 8, des bases
aux fonctionnalités avancées. Idéal pour débutants et développeurs
expérimentés.
```

#### Métadonnées (dans les boîtes à droite et en bas)

Vous verrez plusieurs boîtes avec des champs :

**📋 Informations générales**
- **Cote** *(requis)* : `005.133 PHP` (numéro de classification Dewey ou votre système)
- **Type** : Sélectionnez `Livre`, `Revue`, `Document`, etc.
- **Auteur(s)** : `Jean Dupont, Marie Martin`
- **Éditeur** : `Eyrolles`
- **Année de publication** : `2023`

**📖 Détails bibliographiques**
- **ISBN** : `978-2-212-12345-6`
- **Langue** : `Français`
- **Nombre de pages** : `450`

**🔍 Indexation**
- **Mots-clés** : `programmation, php, web, développement`

**📦 Gestion d'emprunt**
- **Statut d'emprunt** : Sélectionnez `Disponible` (pour un nouveau livre)
- **Exclu du prêt** : Cochez SEULEMENT si le livre est en consultation sur place uniquement

### Étape 6 : Publier

1. En haut à droite, cliquez sur **"Publier"**
2. Confirmez en cliquant à nouveau sur **"Publier"**

✅ **Le livre est maintenant dans le catalogue !**

---

## Méthode 2 : Import CSV en masse

Pour ajouter **plusieurs livres rapidement** (10, 50, 100+).

### Étape 1 : Préparer votre fichier CSV

Créez un fichier `mes-livres.csv` avec ce format :

```csv
titre,cote,type,auteurs,editeur,annee,isbn,langue,pages,mots_cles,description,statut,exclu_pret
"PHP 8 Avancé","005.133 PHP","livre","Jean Dupont","Eyrolles","2023","978-2-212-12345-6","français","450","programmation, php","Guide complet PHP 8","disponible","0"
"JavaScript Moderne","005.133 JS","livre","Marie Martin","Dunod","2023","978-2-100-12345-7","français","380","javascript, web","JavaScript ES6+","disponible","0"
"WordPress Pro","006.76 WP","livre","Pierre Durand","O'Reilly","2022","978-1-491-12345-8","français","320","wordpress, cms","Créer un site WordPress","disponible","0"
```

**Format des colonnes :**
1. `titre` - Titre du livre (REQUIS)
2. `cote` - Numéro de classification (REQUIS)
3. `type` - Type de document (`livre`, `revue`, `document`)
4. `auteurs` - Noms des auteurs
5. `editeur` - Maison d'édition
6. `annee` - Année de publication
7. `isbn` - Numéro ISBN
8. `langue` - Langue du document
9. `pages` - Nombre de pages
10. `mots_cles` - Mots-clés séparés par des virgules
11. `description` - Résumé du livre
12. `statut` - Statut d'emprunt (`disponible`, `emprunte`)
13. `exclu_pret` - Exclusion du prêt (`0` = empruntable, `1` = consultation uniquement)

### Étape 2 : Copier le fichier dans Docker

```bash
docker cp mes-livres.csv cpfa_wordpress:/tmp/
```

### Étape 3 : Lancer l'import

```bash
docker-compose exec wordpress php << 'EOF'
<?php
require_once('/var/www/html/wp-load.php');

$file = '/tmp/mes-livres.csv';
$handle = fopen($file, 'r');
$header = fgetcsv($handle); // Skip header

$imported = 0;
while (($data = fgetcsv($handle)) !== false) {
    $post_id = wp_insert_post([
        'post_type'    => 'cpfa_ressource',
        'post_title'   => $data[0],
        'post_content' => $data[10],
        'post_status'  => 'publish'
    ]);

    if (!is_wp_error($post_id)) {
        update_post_meta($post_id, '_cpfa_ressource_cote', $data[1]);
        update_post_meta($post_id, '_cpfa_ressource_type', $data[2]);
        update_post_meta($post_id, '_cpfa_ressource_auteurs', $data[3]);
        update_post_meta($post_id, '_cpfa_ressource_editeur', $data[4]);
        update_post_meta($post_id, '_cpfa_ressource_annee', $data[5]);
        update_post_meta($post_id, '_cpfa_ressource_isbn', $data[6]);
        update_post_meta($post_id, '_cpfa_ressource_langue', $data[7]);
        update_post_meta($post_id, '_cpfa_ressource_pages', $data[8]);
        update_post_meta($post_id, '_cpfa_ressource_mots_cles', $data[9]);
        update_post_meta($post_id, '_cpfa_ressource_statut_emprunt', $data[11]);
        update_post_meta($post_id, '_cpfa_ressource_exclu_pret', $data[12]);
        $imported++;
        echo "✓ Importé: {$data[0]}\n";
    }
}
fclose($handle);
echo "\n✅ Total importé: $imported livres\n";
?>
EOF
```

---

## Méthode 3 : Script rapide en ligne de commande

Pour ajouter **un livre rapidement** sans ouvrir WordPress.

### Utilisation

```bash
./scripts/add-book.sh "Titre du livre" "Cote" "Auteur" [année] [isbn]
```

### Exemples

```bash
# Livre basique
./scripts/add-book.sh "Python pour débutants" "005.133 PY" "Luc Robert"

# Avec année et ISBN
./scripts/add-book.sh "PHP 8 Avancé" "005.133 PHP" "Jean Dupont" 2023 "978-2-212-12345-6"
```

---

## Méthode 4 : Via REST API

Pour ajouter des livres depuis une application externe.

### Endpoint

```
POST http://localhost:8080/wp-json/wp/v2/cpfa_ressource
```

### Authentification

Vous devez utiliser **Application Passwords** (WordPress 5.6+) :

1. Allez dans **Utilisateurs** → **Profil**
2. Scroll jusqu'à **Mots de passe d'application**
3. Créez un nouveau mot de passe
4. Utilisez-le avec HTTP Basic Auth

### Exemple avec cURL

```bash
curl -X POST http://localhost:8080/wp-json/wp/v2/cpfa_ressource \
  -u "admin:votre-app-password" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "PHP 8 - Les fondamentaux",
    "content": "Guide complet pour apprendre PHP 8",
    "status": "publish",
    "meta": {
      "_cpfa_ressource_cote": "005.133 PHP",
      "_cpfa_ressource_auteurs": "Jean Dupont",
      "_cpfa_ressource_annee": "2023",
      "_cpfa_ressource_statut_emprunt": "disponible"
    }
  }'
```

### Exemple avec JavaScript (fetch)

```javascript
const addBook = async (bookData) => {
  const auth = btoa('admin:votre-app-password');

  const response = await fetch('http://localhost:8080/wp-json/wp/v2/cpfa_ressource', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`
    },
    body: JSON.stringify({
      title: bookData.titre,
      content: bookData.description,
      status: 'publish',
      meta: {
        _cpfa_ressource_cote: bookData.cote,
        _cpfa_ressource_auteurs: bookData.auteurs,
        _cpfa_ressource_annee: bookData.annee,
        _cpfa_ressource_isbn: bookData.isbn,
        _cpfa_ressource_statut_emprunt: 'disponible'
      }
    })
  });

  return await response.json();
};

// Utilisation
addBook({
  titre: "PHP 8 Avancé",
  cote: "005.133 PHP",
  auteurs: "Jean Dupont",
  annee: "2023",
  isbn: "978-2-212-12345-6",
  description: "Guide complet PHP 8"
});
```

---

## Vérifier que les livres sont bien ajoutés

### Via l'interface WordPress

1. Allez sur http://localhost:8080/wp-admin/edit.php?post_type=cpfa_ressource
2. Vous verrez la liste de tous les livres

### Via le widget Bibliothèque (Frontend)

1. Créez une page dans WordPress
2. Éditez avec Elementor
3. Ajoutez le widget **"CPFA Bibliothèque"**
4. Publiez et visitez la page
5. Vous verrez le catalogue avec recherche et filtres

### Via la page de gestion de bibliothèque

1. Allez sur http://localhost:8080/wp-admin/admin.php?page=cpfa-library
2. Vous verrez les statistiques incluant le nombre total de ressources

---

## Fichiers d'exemple fournis

Dans le dossier `scripts/`, vous trouverez :

1. **`exemple-livres.csv`** - 10 livres d'exemple prêts à importer
2. **`import-books.php`** - Script d'import PHP complet
3. **`add-book.sh`** - Script bash pour ajout rapide

### Import rapide des exemples

```bash
# Copier le fichier CSV dans le conteneur
docker cp scripts/exemple-livres.csv cpfa_wordpress:/tmp/

# Importer les 10 livres d'exemple
docker-compose exec wordpress php << 'EOF'
<?php
require_once('/var/www/html/wp-load.php');
$handle = fopen('/tmp/exemple-livres.csv', 'r');
fgetcsv($handle); // Skip header
$imported = 0;
while (($data = fgetcsv($handle)) !== false) {
    $post_id = wp_insert_post([
        'post_type' => 'cpfa_ressource',
        'post_title' => $data[0],
        'post_content' => $data[10],
        'post_status' => 'publish'
    ]);
    if (!is_wp_error($post_id)) {
        update_post_meta($post_id, '_cpfa_ressource_cote', $data[1]);
        update_post_meta($post_id, '_cpfa_ressource_type', $data[2]);
        update_post_meta($post_id, '_cpfa_ressource_auteurs', $data[3]);
        update_post_meta($post_id, '_cpfa_ressource_editeur', $data[4]);
        update_post_meta($post_id, '_cpfa_ressource_annee', $data[5]);
        update_post_meta($post_id, '_cpfa_ressource_isbn', $data[6]);
        update_post_meta($post_id, '_cpfa_ressource_langue', $data[7]);
        update_post_meta($post_id, '_cpfa_ressource_pages', $data[8]);
        update_post_meta($post_id, '_cpfa_ressource_mots_cles', $data[9]);
        update_post_meta($post_id, '_cpfa_ressource_statut_emprunt', $data[11]);
        update_post_meta($post_id, '_cpfa_ressource_exclu_pret', $data[12]);
        $imported++;
        echo "✓ {$data[0]}\n";
    }
}
fclose($handle);
echo "\n✅ $imported livres importés\n";
?>
EOF
```

---

## Dépannage

### ❌ Je ne vois pas le menu "Ressources"

**Cause** : Le plugin CPFA Core Manager n'est pas activé.

**Solution** :
1. Allez sur http://localhost:8080/wp-admin/plugins.php
2. Cherchez "CPFA Core Manager"
3. Cliquez sur "Activer"
4. Rafraîchissez la page

### ❌ Erreur "Post type cpfa_ressource does not exist"

**Cause** : Le plugin n'est pas chargé ou les CPT ne sont pas enregistrés.

**Solution** :
```bash
# Vérifier les logs
docker-compose exec wordpress tail -50 /var/www/html/wp-content/debug.log

# Redémarrer WordPress
docker-compose restart wordpress
```

### ❌ Les métadonnées ne s'affichent pas

**Cause** : Les meta boxes ne sont pas enregistrées.

**Solution** :
1. Vérifiez que vous êtes sur la bonne page d'édition
2. Cliquez sur "Options de l'écran" en haut à droite
3. Cochez toutes les boîtes

### ❌ Import CSV échoue

**Cause** : Format CSV incorrect ou encodage.

**Solution** :
- Assurez-vous que le fichier est en UTF-8
- Vérifiez qu'il y a bien une ligne d'en-tête
- Les champs avec des virgules doivent être entre guillemets : `"Dupont, Jean"`

---

## Exemples de systèmes de cotes

### Dewey Decimal Classification (DDC)

```
000 - Informatique, information et ouvrages généraux
  004 - Traitement des données
  005 - Programmation
    005.1 - Programmation générale
    005.133 - Langages de programmation spécifiques
      005.133 PHP - PHP
      005.133 PY - Python
      005.133 JS - JavaScript
  006 - Méthodes spéciales de calcul
    006.76 - Systèmes de gestion de contenu (WordPress)

100 - Philosophie et psychologie
200 - Religion
300 - Sciences sociales
400 - Langues
500 - Sciences pures
600 - Technologie (sciences appliquées)
700 - Arts et loisirs
800 - Littérature
900 - Histoire et géographie
```

### Système simple personnalisé

```
INF - Informatique
  INF.PRG - Programmation
  INF.WEB - Développement web
  INF.BDD - Bases de données

LIT - Littérature
  LIT.ROM - Romans
  LIT.POE - Poésie

SCI - Sciences
  SCI.MAT - Mathématiques
  SCI.PHY - Physique
```

---

## Conseils pour une bonne gestion

### ✅ Bonnes pratiques

1. **Cote unique** : Chaque livre doit avoir une cote unique
2. **Format cohérent** : Gardez le même format pour tous les livres
3. **Mots-clés pertinents** : Ajoutez 5-10 mots-clés par livre
4. **Description claire** : Résumé de 2-3 phrases minimum
5. **Vérifier la disponibilité** : Nouveau livre = "Disponible"

### 📋 Checklist avant publication

- [ ] Titre complet et correct
- [ ] Cote unique attribuée
- [ ] Auteur(s) renseigné(s)
- [ ] Année de publication
- [ ] Statut d'emprunt = "Disponible"
- [ ] Mots-clés ajoutés
- [ ] Description rédigée

---

## Ressources

- **Documentation complète** : [LIBRARY_FEATURES.md](LIBRARY_FEATURES.md)
- **Guide développeur** : [CLAUDE.md](CLAUDE.md)
- **Cahier des charges** : [cahier_des_charges.md](cahier_des_charges.md)

---

**Besoin d'aide ?** Consultez les logs :
```bash
docker-compose logs -f wordpress
```
