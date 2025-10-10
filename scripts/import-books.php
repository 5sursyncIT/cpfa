<?php
/**
 * Script d'import de livres depuis CSV
 *
 * Usage: php import-books.php livres.csv
 *
 * Format CSV attendu:
 * titre,cote,type,auteurs,editeur,annee,isbn,langue,pages,mots_cles,description,statut,exclu_pret
 *
 * @package CpfaCore
 */

// Load WordPress.
require_once dirname( __DIR__ ) . '/wp-load.php';

if ( ! defined( 'ABSPATH' ) ) {
	die( 'WordPress non chargé' );
}

/**
 * Import books from CSV file.
 *
 * @param string $file_path Path to CSV file.
 * @return array Results.
 */
function cpfa_import_books_from_csv( $file_path ) {
	if ( ! file_exists( $file_path ) ) {
		return array(
			'success' => false,
			'message' => 'Fichier non trouvé: ' . $file_path,
		);
	}

	$handle = fopen( $file_path, 'r' );
	if ( ! $handle ) {
		return array(
			'success' => false,
			'message' => 'Impossible d\'ouvrir le fichier',
		);
	}

	$imported = 0;
	$errors   = array();
	$line_num = 0;

	// Skip header row.
	$header = fgetcsv( $handle, 0, ',' );

	while ( ( $data = fgetcsv( $handle, 0, ',' ) ) !== false ) {
		$line_num++;

		// Skip empty lines.
		if ( empty( array_filter( $data ) ) ) {
			continue;
		}

		// Map CSV columns.
		$book = array(
			'titre'       => $data[0] ?? '',
			'cote'        => $data[1] ?? '',
			'type'        => $data[2] ?? 'livre',
			'auteurs'     => $data[3] ?? '',
			'editeur'     => $data[4] ?? '',
			'annee'       => $data[5] ?? '',
			'isbn'        => $data[6] ?? '',
			'langue'      => $data[7] ?? 'français',
			'pages'       => $data[8] ?? '',
			'mots_cles'   => $data[9] ?? '',
			'description' => $data[10] ?? '',
			'statut'      => $data[11] ?? 'disponible',
			'exclu_pret'  => $data[12] ?? '0',
		);

		// Validate required fields.
		if ( empty( $book['titre'] ) || empty( $book['cote'] ) ) {
			$errors[] = "Ligne $line_num: Titre et cote requis";
			continue;
		}

		// Create post.
		$post_id = wp_insert_post(
			array(
				'post_type'    => 'cpfa_ressource',
				'post_title'   => sanitize_text_field( $book['titre'] ),
				'post_content' => sanitize_textarea_field( $book['description'] ),
				'post_status'  => 'publish',
			)
		);

		if ( is_wp_error( $post_id ) ) {
			$errors[] = "Ligne $line_num: " . $post_id->get_error_message();
			continue;
		}

		// Add meta data.
		update_post_meta( $post_id, '_cpfa_ressource_cote', sanitize_text_field( $book['cote'] ) );
		update_post_meta( $post_id, '_cpfa_ressource_type', sanitize_text_field( $book['type'] ) );
		update_post_meta( $post_id, '_cpfa_ressource_auteurs', sanitize_text_field( $book['auteurs'] ) );
		update_post_meta( $post_id, '_cpfa_ressource_editeur', sanitize_text_field( $book['editeur'] ) );
		update_post_meta( $post_id, '_cpfa_ressource_annee', absint( $book['annee'] ) );
		update_post_meta( $post_id, '_cpfa_ressource_isbn', sanitize_text_field( $book['isbn'] ) );
		update_post_meta( $post_id, '_cpfa_ressource_langue', sanitize_text_field( $book['langue'] ) );
		update_post_meta( $post_id, '_cpfa_ressource_pages', absint( $book['pages'] ) );
		update_post_meta( $post_id, '_cpfa_ressource_mots_cles', sanitize_text_field( $book['mots_cles'] ) );
		update_post_meta( $post_id, '_cpfa_ressource_statut_emprunt', sanitize_text_field( $book['statut'] ) );
		update_post_meta( $post_id, '_cpfa_ressource_exclu_pret', $book['exclu_pret'] === '1' ? '1' : '0' );

		$imported++;
	}

	fclose( $handle );

	return array(
		'success'  => true,
		'imported' => $imported,
		'errors'   => $errors,
	);
}

// Run import.
if ( isset( $argv[1] ) ) {
	$file = $argv[1];

	echo "Import de livres depuis: $file\n";
	echo "----------------------------------------\n";

	$result = cpfa_import_books_from_csv( $file );

	if ( $result['success'] ) {
		echo "✓ Import terminé!\n";
		echo "  Livres importés: {$result['imported']}\n";

		if ( ! empty( $result['errors'] ) ) {
			echo "\n⚠ Erreurs:\n";
			foreach ( $result['errors'] as $error ) {
				echo "  - $error\n";
			}
		}
	} else {
		echo "✗ Erreur: {$result['message']}\n";
	}
} else {
	echo "Usage: php import-books.php fichier.csv\n";
	echo "\nFormat CSV attendu (avec ligne d'en-tête):\n";
	echo "titre,cote,type,auteurs,editeur,annee,isbn,langue,pages,mots_cles,description,statut,exclu_pret\n";
	exit( 1 );
}
