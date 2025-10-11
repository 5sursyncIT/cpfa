<?php
/**
 * Formation Custom Post Type
 *
 * @package CpfaCore
 */

namespace Cpfa\Core\CPT;

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Formation CPT class.
 */
class Formation {

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->register_post_type();
		$this->register_taxonomies();
	}

	/**
	 * Register Formation post type.
	 */
	public function register_post_type() {
		$labels = array(
			'name'               => __( 'Formations', 'cpfa-core' ),
			'singular_name'      => __( 'Formation', 'cpfa-core' ),
			'menu_name'          => __( 'Formations', 'cpfa-core' ),
			'add_new'            => __( 'Ajouter', 'cpfa-core' ),
			'add_new_item'       => __( 'Ajouter une formation', 'cpfa-core' ),
			'edit_item'          => __( 'Modifier la formation', 'cpfa-core' ),
			'new_item'           => __( 'Nouvelle formation', 'cpfa-core' ),
			'view_item'          => __( 'Voir la formation', 'cpfa-core' ),
			'search_items'       => __( 'Rechercher des formations', 'cpfa-core' ),
			'not_found'          => __( 'Aucune formation trouvée', 'cpfa-core' ),
			'not_found_in_trash' => __( 'Aucune formation dans la corbeille', 'cpfa-core' ),
		);

		$args = array(
			'labels'              => $labels,
			'public'              => true,
			'publicly_queryable'  => true,
			'show_ui'             => true,
			'show_in_menu'        => 'cpfa-library',
			'show_in_rest'        => true,
			'rest_base'           => 'formations',
			'query_var'           => true,
			'rewrite'             => array( 'slug' => 'formations' ),
			'capability_type'     => array( 'cpfa_formation', 'cpfa_formations' ),
			'map_meta_cap'        => true,
			'has_archive'         => true,
			'hierarchical'        => false,
			'menu_position'       => 20,
			'menu_icon'           => 'dashicons-welcome-learn-more',
			'supports'            => array( 'title', 'editor', 'thumbnail', 'excerpt', 'custom-fields', 'revisions' ),
		);

		register_post_type( 'cpfa_formation', $args );
	}

	/**
	 * Register Formation taxonomies.
	 */
	public function register_taxonomies() {
		// Formation Type taxonomy.
		register_taxonomy(
			'formation_type',
			'cpfa_formation',
			array(
				'label'             => __( 'Types de formation', 'cpfa-core' ),
				'hierarchical'      => true,
				'show_ui'           => true,
				'show_in_rest'      => true,
				'show_admin_column' => true,
				'query_var'         => true,
				'rewrite'           => array( 'slug' => 'formation-type' ),
			)
		);

		// Niveau taxonomy.
		register_taxonomy(
			'niveau',
			'cpfa_formation',
			array(
				'label'             => __( 'Niveaux', 'cpfa-core' ),
				'hierarchical'      => true,
				'show_ui'           => true,
				'show_in_rest'      => true,
				'show_admin_column' => true,
				'query_var'         => true,
				'rewrite'           => array( 'slug' => 'niveau' ),
			)
		);
	}
}
