#!/bin/bash
#
# Script rapide pour ajouter un livre
# Usage: ./add-book.sh "Titre du livre" "Cote" "Auteur"
#

CONTAINER="cpfa_wordpress"

if [ "$#" -lt 3 ]; then
    echo "Usage: $0 \"Titre\" \"Cote\" \"Auteur\" [année] [isbn]"
    echo ""
    echo "Exemple:"
    echo "  $0 \"PHP 8 Avancé\" \"005.133 PHP\" \"Jean Dupont\" 2023 \"978-2-212-12345-6\""
    exit 1
fi

TITRE="$1"
COTE="$2"
AUTEUR="$3"
ANNEE="${4:-2024}"
ISBN="${5:-}"

echo "📚 Ajout d'un livre à la bibliothèque..."
echo "  Titre: $TITRE"
echo "  Cote: $COTE"
echo "  Auteur: $AUTEUR"
echo "  Année: $ANNEE"

# Create PHP script to add book
docker-compose exec -T wordpress php << EOF
<?php
require_once('/var/www/html/wp-load.php');

\$post_id = wp_insert_post([
    'post_type'   => 'cpfa_ressource',
    'post_title'  => '$TITRE',
    'post_status' => 'publish'
]);

if (is_wp_error(\$post_id)) {
    echo "✗ Erreur: " . \$post_id->get_error_message() . "\n";
    exit(1);
}

update_post_meta(\$post_id, '_cpfa_ressource_cote', '$COTE');
update_post_meta(\$post_id, '_cpfa_ressource_type', 'livre');
update_post_meta(\$post_id, '_cpfa_ressource_auteurs', '$AUTEUR');
update_post_meta(\$post_id, '_cpfa_ressource_annee', $ANNEE);
update_post_meta(\$post_id, '_cpfa_ressource_isbn', '$ISBN');
update_post_meta(\$post_id, '_cpfa_ressource_langue', 'français');
update_post_meta(\$post_id, '_cpfa_ressource_statut_emprunt', 'disponible');
update_post_meta(\$post_id, '_cpfa_ressource_exclu_pret', '0');

echo "✓ Livre ajouté avec succès! (ID: \$post_id)\n";
echo "  URL: " . get_permalink(\$post_id) . "\n";
?>
EOF

echo ""
echo "✓ Terminé!"
