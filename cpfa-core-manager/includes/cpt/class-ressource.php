<?php
/**
 * Ressource (Library) Custom Post Type
 *
 * @package CpfaCore
 */

namespace Cpfa\Core\CPT;

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Ressource CPT class.
 */
class Ressource {

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->register_post_type();
		$this->register_taxonomies();
	}

	/**
	 * Register Ressource post type.
	 */
	public function register_post_type() {
		$labels = array(
			'name'               => __( 'Ressources Biblio', 'cpfa-core' ),
			'singular_name'      => __( 'Ressource', 'cpfa-core' ),
			'menu_name'          => __( 'Bibliothèque', 'cpfa-core' ),
			'add_new'            => __( 'Ajouter', 'cpfa-core' ),
			'add_new_item'       => __( 'Ajouter une ressource', 'cpfa-core' ),
			'edit_item'          => __( 'Modifier la ressource', 'cpfa-core' ),
			'new_item'           => __( 'Nouvelle ressource', 'cpfa-core' ),
			'view_item'          => __( 'Voir la ressource', 'cpfa-core' ),
			'search_items'       => __( 'Rechercher des ressources', 'cpfa-core' ),
			'not_found'          => __( 'Aucune ressource trouvée', 'cpfa-core' ),
			'not_found_in_trash' => __( 'Aucune ressource dans la corbeille', 'cpfa-core' ),
		);

		$args = array(
			'labels'              => $labels,
			'public'              => true,
			'publicly_queryable'  => true,
			'show_ui'             => true,
			'show_in_menu'        => 'cpfa-dashboard',
			'show_in_rest'        => true,
			'rest_base'           => 'ressources',
			'query_var'           => true,
			'rewrite'             => array( 'slug' => 'catalogue' ),
			'capability_type'     => array( 'cpfa_ressource', 'cpfa_ressources' ),
			'map_meta_cap'        => true,
			'has_archive'         => true,
			'hierarchical'        => false,
			'menu_icon'           => 'dashicons-book',
			'supports'            => array( 'title', 'editor', 'thumbnail', 'excerpt', 'custom-fields', 'revisions' ),
		);

		register_post_type( 'cpfa_ressource', $args );
	}

	/**
	 * Register Ressource taxonomies.
	 */
	public function register_taxonomies() {
		register_taxonomy(
			'ressource_classe',
			'cpfa_ressource',
			array(
				'label'             => __( 'Classes de ressources', 'cpfa-core' ),
				'hierarchical'      => true,
				'show_ui'           => true,
				'show_in_rest'      => true,
				'show_admin_column' => true,
				'query_var'         => true,
				'rewrite'           => array( 'slug' => 'classe' ),
			)
		);
	}
}
