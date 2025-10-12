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

		// Add custom columns to the abonnement list table.
		add_filter( 'manage_cpfa_abonnement_posts_columns', array( $this, 'add_custom_columns' ) );
		add_action( 'manage_cpfa_abonnement_posts_custom_column', array( $this, 'display_custom_columns' ), 10, 2 );
	}

	/**
	 * Add custom columns to the post type list table.
	 *
	 * @param array $columns The existing columns.
	 * @return array The modified columns.
	 */
	public function add_custom_columns( $columns ) {
		$new_columns = array();
		foreach ( $columns as $key => $title ) {
			$new_columns[ $key ] = $title;
			if ( 'title' === $key ) {
				$new_columns['numero_carte'] = __( 'Numéro de Carte', 'cpfa-core' );
				$new_columns['statut'] = __( 'Statut', 'cpfa-core' );
			}
		}
		return $new_columns;
	}

	/**
	 * Display the content for custom columns.
	 *
	 * @param string $column The name of the custom column.
	 * @param int    $post_id The ID of the current post.
	 */
	public function display_custom_columns( $column, $post_id ) {
		if ( 'numero_carte' === $column ) {
			$numero_carte = get_post_meta( $post_id, '_cpfa_abonnement_numero_carte', true );
			echo esc_html( $numero_carte ? $numero_carte : '-' );
		}

		if ( 'statut' === $column ) {
			$statut = get_post_meta( $post_id, '_cpfa_abonnement_statut', true );
			if ( $statut ) {
				echo '<span class="status-badge status-' . esc_attr( $statut ) . '">' . esc_html( $statut ) . '</span>';
			} else {
				echo '-';
			}
		}
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
