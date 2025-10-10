<?php
/**
 * Concours Custom Post Type
 *
 * @package CpfaCore
 */

namespace Cpfa\Core\CPT;

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Concours CPT class.
 */
class Concours {

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->register_post_type();
		$this->register_taxonomies();
	}

	/**
	 * Register Concours post type.
	 */
	public function register_post_type() {
		$labels = array(
			'name'               => __( 'Concours', 'cpfa-core' ),
			'singular_name'      => __( 'Concours', 'cpfa-core' ),
			'menu_name'          => __( 'Concours', 'cpfa-core' ),
			'add_new'            => __( 'Ajouter', 'cpfa-core' ),
			'add_new_item'       => __( 'Ajouter un concours', 'cpfa-core' ),
			'edit_item'          => __( 'Modifier le concours', 'cpfa-core' ),
			'new_item'           => __( 'Nouveau concours', 'cpfa-core' ),
			'view_item'          => __( 'Voir le concours', 'cpfa-core' ),
			'search_items'       => __( 'Rechercher des concours', 'cpfa-core' ),
			'not_found'          => __( 'Aucun concours trouvé', 'cpfa-core' ),
			'not_found_in_trash' => __( 'Aucun concours dans la corbeille', 'cpfa-core' ),
		);

		$args = array(
			'labels'              => $labels,
			'public'              => true,
			'publicly_queryable'  => true,
			'show_ui'             => true,
			'show_in_menu'        => 'cpfa-dashboard',
			'show_in_rest'        => true,
			'rest_base'           => 'concours',
			'query_var'           => true,
			'rewrite'             => array( 'slug' => 'concours' ),
			'capability_type'     => array( 'cpfa_concours', 'cpfa_concours' ),
			'map_meta_cap'        => true,
			'has_archive'         => true,
			'hierarchical'        => false,
			'menu_icon'           => 'dashicons-awards',
			'supports'            => array( 'title', 'editor', 'thumbnail', 'excerpt', 'custom-fields', 'revisions' ),
		);

		register_post_type( 'cpfa_concours', $args );
	}

	/**
	 * Register Concours taxonomies.
	 */
	public function register_taxonomies() {
		register_taxonomy(
			'session',
			'cpfa_concours',
			array(
				'label'             => __( 'Sessions', 'cpfa-core' ),
				'hierarchical'      => true,
				'show_ui'           => true,
				'show_in_rest'      => true,
				'show_admin_column' => true,
				'query_var'         => true,
				'rewrite'           => array( 'slug' => 'session' ),
			)
		);
	}
}
