<?php
/**
 * Emprunt (Loan) Custom Post Type
 *
 * @package CpfaCore
 */

namespace Cpfa\Core\CPT;

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Emprunt CPT class.
 */
class Emprunt {

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->register_post_type();
	}

	/**
	 * Register Emprunt post type.
	 */
	public function register_post_type() {
		$labels = array(
			'name'               => __( 'Emprunts', 'cpfa-core' ),
			'singular_name'      => __( 'Emprunt', 'cpfa-core' ),
			'menu_name'          => __( 'Emprunts', 'cpfa-core' ),
			'add_new'            => __( 'Ajouter', 'cpfa-core' ),
			'add_new_item'       => __( 'Ajouter un emprunt', 'cpfa-core' ),
			'edit_item'          => __( 'Modifier l\'emprunt', 'cpfa-core' ),
			'new_item'           => __( 'Nouvel emprunt', 'cpfa-core' ),
			'view_item'          => __( 'Voir l\'emprunt', 'cpfa-core' ),
			'search_items'       => __( 'Rechercher des emprunts', 'cpfa-core' ),
			'not_found'          => __( 'Aucun emprunt trouvé', 'cpfa-core' ),
			'not_found_in_trash' => __( 'Aucun emprunt dans la corbeille', 'cpfa-core' ),
		);

		$args = array(
			'labels'              => $labels,
			'public'              => false,
			'publicly_queryable'  => false,
			'show_ui'             => true,
			'show_in_menu'        => 'cpfa-dashboard',
			'show_in_rest'        => true,
			'rest_base'           => 'emprunts',
			'query_var'           => true,
			'capability_type'     => array( 'cpfa_emprunt', 'cpfa_emprunts' ),
			'map_meta_cap'        => true,
			'has_archive'         => false,
			'hierarchical'        => false,
			'menu_icon'           => 'dashicons-book-alt',
			'supports'            => array( 'title', 'custom-fields' ),
		);

		register_post_type( 'cpfa_emprunt', $args );
	}
}
