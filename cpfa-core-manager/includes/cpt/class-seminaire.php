<?php
/**
 * Seminaire Custom Post Type
 *
 * @package CpfaCore
 */

namespace Cpfa\Core\CPT;

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Seminaire CPT class.
 */
class Seminaire {

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->register_post_type();
		$this->register_taxonomies();
	}

	/**
	 * Register Seminaire post type.
	 */
	public function register_post_type() {
		$labels = array(
			'name'               => __( 'Séminaires', 'cpfa-core' ),
			'singular_name'      => __( 'Séminaire', 'cpfa-core' ),
			'menu_name'          => __( 'Séminaires', 'cpfa-core' ),
			'add_new'            => __( 'Ajouter', 'cpfa-core' ),
			'add_new_item'       => __( 'Ajouter un séminaire', 'cpfa-core' ),
			'edit_item'          => __( 'Modifier le séminaire', 'cpfa-core' ),
			'new_item'           => __( 'Nouveau séminaire', 'cpfa-core' ),
			'view_item'          => __( 'Voir le séminaire', 'cpfa-core' ),
			'search_items'       => __( 'Rechercher des séminaires', 'cpfa-core' ),
			'not_found'          => __( 'Aucun séminaire trouvé', 'cpfa-core' ),
			'not_found_in_trash' => __( 'Aucun séminaire dans la corbeille', 'cpfa-core' ),
		);

		$args = array(
			'labels'              => $labels,
			'public'              => true,
			'publicly_queryable'  => true,
			'show_ui'             => true,
			'show_in_menu'        => 'cpfa-library',
			'show_in_rest'        => true,
			'rest_base'           => 'seminaires',
			'query_var'           => true,
			'rewrite'             => array( 'slug' => 'seminaires' ),
			'capability_type'     => array( 'cpfa_seminaire', 'cpfa_seminaires' ),
			'map_meta_cap'        => true,
			'has_archive'         => true,
			'hierarchical'        => false,
			'menu_icon'           => 'dashicons-groups',
			'supports'            => array( 'title', 'editor', 'thumbnail', 'excerpt', 'custom-fields', 'revisions' ),
		);

		register_post_type( 'cpfa_seminaire', $args );
	}

	/**
	 * Register Seminaire taxonomies.
	 */
	public function register_taxonomies() {
		register_taxonomy(
			'thematique',
			'cpfa_seminaire',
			array(
				'label'             => __( 'Thématiques', 'cpfa-core' ),
				'hierarchical'      => true,
				'show_ui'           => true,
				'show_in_rest'      => true,
				'show_admin_column' => true,
				'query_var'         => true,
				'rewrite'           => array( 'slug' => 'thematique' ),
			)
		);
	}
}
