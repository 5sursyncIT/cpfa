<?php
/**
 * REST API Class.
 *
 * Registers REST API endpoints for the forms plugin.
 *
 * @package CPFA_Forms
 */

namespace Cpfa\Forms;

/**
 * REST_API class.
 */
class REST_API {

	/**
	 * Single instance.
	 *
	 * @var REST_API
	 */
	private static $instance = null;

	/**
	 * Get instance.
	 *
	 * @return REST_API
	 */
	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Constructor.
	 */
	private function __construct() {
		$this->init_hooks();
	}

	/**
	 * Initialize hooks.
	 */
	private function init_hooks() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register REST routes.
	 */
	public function register_routes() {
		// Get abonnement status by ID.
		register_rest_route(
			'cpfa/v1',
			'/abonnements/(?P<id>\d+)/status',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_abonnement_status' ),
				'permission_callback' => '__return_true',
				'args'                => array(
					'id' => array(
						'required'          => true,
						'validate_callback' => function ( $param ) {
							return is_numeric( $param );
						},
					),
				),
			)
		);

		// Verify card by numero_carte.
		register_rest_route(
			'cpfa/v1',
			'/verify-card/(?P<numero>[A-Z0-9\-]+)',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'verify_card' ),
				'permission_callback' => '__return_true',
			)
		);
	}

	/**
	 * Get abonnement status endpoint.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response
	 */
	public function get_abonnement_status( $request ) {
		$abonnement_id = $request->get_param( 'id' );

		// Get post.
		$post = get_post( $abonnement_id );
		if ( ! $post || 'cpfa_abonnement' !== $post->post_type ) {
			return new \WP_REST_Response(
				array(
					'error'   => 'not_found',
					'message' => __( 'Abonnement introuvable.', 'cpfa-forms' ),
				),
				404
			);
		}

		// Get meta data.
		$statut                = get_post_meta( $abonnement_id, '_cpfa_abonnement_statut', true );
		$numero_preinscription = get_post_meta( $abonnement_id, '_cpfa_abonnement_numero_preinscription', true );
		$date_soumission       = get_the_date( 'c', $abonnement_id );

		$response = array(
			'id'                    => $abonnement_id,
			'statut'                => $statut,
			'numero_preinscription' => $numero_preinscription,
			'date_soumission'       => $date_soumission,
		);

		// Add extra info if active.
		if ( 'active' === $statut ) {
			$numero_carte = get_post_meta( $abonnement_id, '_cpfa_abonnement_numero_carte', true );
			$date_debut   = get_post_meta( $abonnement_id, '_cpfa_abonnement_date_debut', true );
			$date_fin     = get_post_meta( $abonnement_id, '_cpfa_abonnement_date_fin', true );

			$response['numero_carte'] = $numero_carte;
			$response['date_debut']   = $date_debut;
			$response['date_fin']     = $date_fin;
		}

		return new \WP_REST_Response( $response, 200 );
	}

	/**
	 * Verify card by numero_carte (for QR code verification).
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response
	 */
	public function verify_card( $request ) {
		$numero_carte = $request->get_param( 'numero' );

		// Find abonnement by numero_carte.
		$abonnements = get_posts(
			array(
				'post_type'      => 'cpfa_abonnement',
				'posts_per_page' => 1,
				'meta_query'     => array(
					array(
						'key'     => '_cpfa_abonnement_numero_carte',
						'value'   => $numero_carte,
						'compare' => '=',
					),
				),
			)
		);

		if ( empty( $abonnements ) ) {
			return new \WP_REST_Response(
				array(
					'valid'   => false,
					'message' => __( 'Carte invalide ou introuvable.', 'cpfa-forms' ),
				),
				404
			);
		}

		$abonnement = $abonnements[0];

		// Get meta data.
		$nom      = get_post_meta( $abonnement->ID, '_cpfa_abonnement_nom', true );
		$prenom   = get_post_meta( $abonnement->ID, '_cpfa_abonnement_prenom', true );
		$type     = get_post_meta( $abonnement->ID, '_cpfa_abonnement_type', true );
		$statut   = get_post_meta( $abonnement->ID, '_cpfa_abonnement_statut', true );
		$date_fin = get_post_meta( $abonnement->ID, '_cpfa_abonnement_date_fin', true );

		// Check if active and not expired.
		$is_active = ( 'active' === $statut );
		$is_valid  = $is_active && strtotime( $date_fin ) >= time();

		$type_labels = array(
			'etudiant'         => __( 'Étudiant', 'cpfa-forms' ),
			'professionnel'    => __( 'Professionnel', 'cpfa-forms' ),
			'emprunt_domicile' => __( 'Emprunt à domicile', 'cpfa-forms' ),
		);

		$response = array(
			'valid'        => $is_valid,
			'numero_carte' => $numero_carte,
			'nom'          => $prenom . ' ' . $nom,
			'type'         => isset( $type_labels[ $type ] ) ? $type_labels[ $type ] : $type,
			'statut'       => $statut,
			'date_fin'     => $date_fin,
		);

		if ( ! $is_valid ) {
			if ( ! $is_active ) {
				$response['message'] = __( 'Abonnement non actif.', 'cpfa-forms' );
			} else {
				$response['message'] = __( 'Abonnement expiré.', 'cpfa-forms' );
			}
		}

		return new \WP_REST_Response( $response, 200 );
	}
}
