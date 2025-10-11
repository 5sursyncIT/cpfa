<?php
/**
 * Abonnement (Subscription) Custom Post Type
 *
 * @package CpfaCore
 */

namespace Cpfa\Core\CPT;

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Abonnement CPT class.
 */
class Abonnement {

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->register_post_type();
	}

	/**
	 * Register Abonnement post type.
	 */
	public function register_post_type() {
		$labels = array(
			'name'               => __( 'Abonnements', 'cpfa-core' ),
			'singular_name'      => __( 'Abonnement', 'cpfa-core' ),
			'menu_name'          => __( 'Abonnements', 'cpfa-core' ),
			'add_new'            => __( 'Ajouter', 'cpfa-core' ),
			'add_new_item'       => __( 'Ajouter un abonnement', 'cpfa-core' ),
			'edit_item'          => __( 'Modifier l\'abonnement', 'cpfa-core' ),
			'new_item'           => __( 'Nouvel abonnement', 'cpfa-core' ),
			'view_item'          => __( 'Voir l\'abonnement', 'cpfa-core' ),
			'search_items'       => __( 'Rechercher des abonnements', 'cpfa-core' ),
			'not_found'          => __( 'Aucun abonnement trouvé', 'cpfa-core' ),
			'not_found_in_trash' => __( 'Aucun abonnement dans la corbeille', 'cpfa-core' ),
		);

		$args = array(
			'labels'              => $labels,
			'public'              => false,
			'publicly_queryable'  => false,
			'show_ui'             => true,
			'show_in_menu'        => 'cpfa-library',
			'show_in_rest'        => true,
			'rest_base'           => 'abonnements',
			'query_var'           => true,
			'capability_type'     => array( 'cpfa_abonnement', 'cpfa_abonnements' ),
			'map_meta_cap'        => true,
			'has_archive'         => false,
			'hierarchical'        => false,
			'menu_icon'           => 'dashicons-id',
			'supports'            => array( 'title', 'custom-fields' ),
		);

		register_post_type( 'cpfa_abonnement', $args );
	}
}
