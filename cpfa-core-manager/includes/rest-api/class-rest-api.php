<?php
/**
 * REST API Handler
 *
 * @package CpfaCore
 */

namespace Cpfa\Core\RestAPI;

use Cpfa\Core\Services\QR_Service;
use Cpfa\Core\Services\Rate_Limiter;

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * REST API class.
 */
class Rest_API {

	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
		add_filter( 'rest_pre_dispatch', array( $this, 'apply_rate_limiting' ), 10, 3 );
	}

	/**
	 * Apply rate limiting to CPFA endpoints.
	 *
	 * @param mixed           $result  Response to replace the requested version with.
	 * @param WP_REST_Server  $server  Server instance.
	 * @param WP_REST_Request $request Request used to generate the response.
	 * @return mixed Original result or error response.
	 */
	public function apply_rate_limiting( $result, $server, $request ) {
		$route = $request->get_route();

		// Only apply to CPFA endpoints.
		if ( strpos( $route, '/cpfa/v1/' ) !== 0 ) {
			return $result;
		}

		// Get identifier and endpoint.
		$identifier = Rate_Limiter::get_identifier();
		$endpoint   = str_replace( '/cpfa/v1/', '', $route );

		// Check rate limit (60 requests per minute).
		if ( Rate_Limiter::is_rate_limited( $identifier, $endpoint, 60 ) ) {
			$retry_after = Rate_Limiter::get_status( $identifier, $endpoint )['reset'] - time();

			return new \WP_Error(
				'rest_rate_limit_exceeded',
				__( 'Rate limit exceeded. Please try again later.', 'cpfa-core' ),
				array(
					'status'       => 429,
					'retry_after'  => max( 1, $retry_after ),
				)
			);
		}

		// Add rate limit headers.
		add_filter(
			'rest_post_dispatch',
			function ( $response ) use ( $identifier, $endpoint ) {
				$status = Rate_Limiter::get_status( $identifier, $endpoint, 60 );
				$response->header( 'X-RateLimit-Limit', $status['limit'] );
				$response->header( 'X-RateLimit-Remaining', $status['remaining'] );
				$response->header( 'X-RateLimit-Reset', $status['reset'] );
				return $response;
			}
		);

		return $result;
	}

	/**
	 * Register REST API routes.
	 */
	public function register_routes() {
		// Catalogue endpoint.
		register_rest_route(
			'cpfa/v1',
			'/catalogue',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_catalogue' ),
				'permission_callback' => '__return_true',
				'args'                => array(
					'type'     => array(
						'required' => false,
						'type'     => 'string',
					),
					'search'   => array(
						'required' => false,
						'type'     => 'string',
					),
					'per_page' => array(
						'required' => false,
						'type'     => 'integer',
						'default'  => 10,
					),
					'page'     => array(
						'required' => false,
						'type'     => 'integer',
						'default'  => 1,
					),
				),
			)
		);

		// Formations endpoint.
		register_rest_route(
			'cpfa/v1',
			'/formations',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_formations' ),
				'permission_callback' => '__return_true',
				'args'                => $this->get_collection_params(),
			)
		);

		// Seminaires endpoint.
		register_rest_route(
			'cpfa/v1',
			'/seminaires',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_seminaires' ),
				'permission_callback' => '__return_true',
				'args'                => $this->get_collection_params(),
			)
		);

		// Concours endpoint.
		register_rest_route(
			'cpfa/v1',
			'/concours',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_concours' ),
				'permission_callback' => '__return_true',
				'args'                => $this->get_collection_params(),
			)
		);

		// Single formation endpoint.
		register_rest_route(
			'cpfa/v1',
			'/formations/(?P<id>\d+)',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_single_formation' ),
				'permission_callback' => '__return_true',
			)
		);

		// Verification endpoint.
		register_rest_route(
			'cpfa/v1',
			'/verif/(?P<token>[a-zA-Z0-9]+)',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'verify_token' ),
				'permission_callback' => '__return_true',
			)
		);

		// Stats endpoint.
		register_rest_route(
			'cpfa/v1',
			'/stats',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_stats' ),
				'permission_callback' => '__return_true',
			)
		);
	}

	/**
	 * Get collection params.
	 *
	 * @return array Parameters.
	 */
	private function get_collection_params() {
		return array(
			'per_page' => array(
				'required' => false,
				'type'     => 'integer',
				'default'  => 10,
			),
			'page'     => array(
				'required' => false,
				'type'     => 'integer',
				'default'  => 1,
			),
			'search'   => array(
				'required' => false,
				'type'     => 'string',
			),
			'orderby'  => array(
				'required' => false,
				'type'     => 'string',
				'default'  => 'date',
			),
			'order'    => array(
				'required' => false,
				'type'     => 'string',
				'default'  => 'DESC',
			),
		);
	}

	/**
	 * Get catalogue.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response Response object.
	 */
	public function get_catalogue( $request ) {
		$type     = $request->get_param( 'type' );
		$search   = $request->get_param( 'search' );
		$per_page = $request->get_param( 'per_page' );
		$page     = $request->get_param( 'page' );

		// Determine post types.
		$post_types = array( 'cpfa_formation', 'cpfa_seminaire', 'cpfa_concours', 'cpfa_ressource' );
		if ( $type && in_array( 'cpfa_' . $type, $post_types, true ) ) {
			$post_types = array( 'cpfa_' . $type );
		}

		// Build query args.
		$args = array(
			'post_type'      => $post_types,
			'post_status'    => 'publish',
			'posts_per_page' => $per_page,
			'paged'          => $page,
		);

		if ( $search ) {
			$args['s'] = sanitize_text_field( $search );
		}

		// Get posts.
		$query = new \WP_Query( $args );

		$items = array();
		foreach ( $query->posts as $post ) {
			$items[] = $this->prepare_item( $post );
		}

		$response = rest_ensure_response( $items );

		// Add pagination headers.
		$response->header( 'X-WP-Total', $query->found_posts );
		$response->header( 'X-WP-TotalPages', $query->max_num_pages );

		return $response;
	}

	/**
	 * Get formations.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response Response object.
	 */
	public function get_formations( $request ) {
		return $this->get_collection( 'cpfa_formation', $request );
	}

	/**
	 * Get seminaires.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response Response object.
	 */
	public function get_seminaires( $request ) {
		return $this->get_collection( 'cpfa_seminaire', $request );
	}

	/**
	 * Get concours.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response Response object.
	 */
	public function get_concours( $request ) {
		return $this->get_collection( 'cpfa_concours', $request );
	}

	/**
	 * Get collection.
	 *
	 * @param string           $post_type Post type.
	 * @param \WP_REST_Request $request   Request object.
	 * @return \WP_REST_Response Response object.
	 */
	private function get_collection( $post_type, $request ) {
		$per_page = $request->get_param( 'per_page' );
		$page     = $request->get_param( 'page' );
		$search   = $request->get_param( 'search' );
		$orderby  = $request->get_param( 'orderby' );
		$order    = $request->get_param( 'order' );

		$args = array(
			'post_type'      => $post_type,
			'post_status'    => 'publish',
			'posts_per_page' => $per_page,
			'paged'          => $page,
			'orderby'        => $orderby,
			'order'          => $order,
		);

		if ( $search ) {
			$args['s'] = sanitize_text_field( $search );
		}

		$query = new \WP_Query( $args );

		$items = array();
		foreach ( $query->posts as $post ) {
			$items[] = $this->prepare_item( $post );
		}

		$response = rest_ensure_response( $items );
		$response->header( 'X-WP-Total', $query->found_posts );
		$response->header( 'X-WP-TotalPages', $query->max_num_pages );

		return $response;
	}

	/**
	 * Get single formation.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error Response object or error.
	 */
	public function get_single_formation( $request ) {
		$post_id = $request->get_param( 'id' );
		$post    = get_post( $post_id );

		if ( ! $post || 'cpfa_formation' !== $post->post_type ) {
			return new \WP_Error( 'not_found', __( 'Formation non trouvée', 'cpfa-core' ), array( 'status' => 404 ) );
		}

		return rest_ensure_response( $this->prepare_item( $post, true ) );
	}

	/**
	 * Verify token.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error Response object or error.
	 */
	public function verify_token( $request ) {
		$token  = $request->get_param( 'token' );
		$result = QR_Service::verify_token( $token );

		if ( ! $result ) {
			return new \WP_Error( 'invalid_token', __( 'Token invalide', 'cpfa-core' ), array( 'status' => 404 ) );
		}

		$data = array(
			'valid'   => true,
			'type'    => $result['type'],
			'post_id' => $result['post_id'],
			'title'   => $result['post']->post_title,
		);

		// Add type-specific data.
		switch ( $result['type'] ) {
			case 'abonnement':
				$data['membre']     = get_post_meta( $result['post_id'], '_cpfa_abonnement_membre', true );
				$data['statut']     = get_post_meta( $result['post_id'], '_cpfa_abonnement_statut', true );
				$data['date_fin']   = get_post_meta( $result['post_id'], '_cpfa_abonnement_date_fin', true );
				$data['type_abo']   = get_post_meta( $result['post_id'], '_cpfa_abonnement_type', true );
				break;

			case 'formation':
			case 'seminaire':
			case 'concours':
				$data['details'] = $this->prepare_item( $result['post'] );
				break;
		}

		return rest_ensure_response( $data );
	}

	/**
	 * Get stats.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response Response object.
	 */
	public function get_stats( $request ) {
		// Use transient to cache stats for 1 hour.
		$stats = get_transient( 'cpfa_stats' );

		if ( false === $stats ) {
			$stats = array(
				'formations'  => wp_count_posts( 'cpfa_formation' )->publish,
				'seminaires'  => wp_count_posts( 'cpfa_seminaire' )->publish,
				'concours'    => wp_count_posts( 'cpfa_concours' )->publish,
				'ressources'  => wp_count_posts( 'cpfa_ressource' )->publish,
				'abonnements' => $this->count_active_subscriptions(),
				'emprunts'    => $this->count_active_loans(),
			);

			set_transient( 'cpfa_stats', $stats, HOUR_IN_SECONDS );
		}

		return rest_ensure_response( $stats );
	}

	/**
	 * Count active subscriptions.
	 *
	 * @return int Count.
	 */
	private function count_active_subscriptions() {
		$args = array(
			'post_type'      => 'cpfa_abonnement',
			'post_status'    => 'publish',
			'posts_per_page' => -1,
			'meta_query'     => array(
				array(
					'key'   => '_cpfa_abonnement_statut',
					'value' => 'actif',
				),
			),
			'fields'         => 'ids',
		);

		$query = new \WP_Query( $args );
		return $query->found_posts;
	}

	/**
	 * Count active loans.
	 *
	 * @return int Count.
	 */
	private function count_active_loans() {
		$args = array(
			'post_type'      => 'cpfa_emprunt',
			'post_status'    => 'publish',
			'posts_per_page' => -1,
			'meta_query'     => array(
				array(
					'key'     => '_cpfa_emprunt_date_retour_effective',
					'compare' => 'NOT EXISTS',
				),
			),
			'fields'         => 'ids',
		);

		$query = new \WP_Query( $args );
		return $query->found_posts;
	}

	/**
	 * Prepare item for response.
	 *
	 * @param \WP_Post $post     Post object.
	 * @param bool     $detailed Include detailed info.
	 * @return array Item data.
	 */
	private function prepare_item( $post, $detailed = false ) {
		$data = array(
			'id'           => $post->ID,
			'title'        => $post->post_title,
			'excerpt'      => $post->post_excerpt,
			'type'         => $post->post_type,
			'date'         => $post->post_date,
			'link'         => get_permalink( $post->ID ),
			'thumbnail'    => get_the_post_thumbnail_url( $post->ID, 'medium' ),
		);

		// Add type-specific fields.
		$type_suffix = str_replace( 'cpfa_', '', $post->post_type );

		if ( 'cpfa_formation' === $post->post_type ) {
			$data['prix']   = get_post_meta( $post->ID, '_cpfa_formation_prix', true );
			$data['duree']  = get_post_meta( $post->ID, '_cpfa_formation_duree', true );
			$data['niveau'] = get_post_meta( $post->ID, '_cpfa_formation_niveau', true );
		} elseif ( 'cpfa_seminaire' === $post->post_type ) {
			$data['prix']  = get_post_meta( $post->ID, '_cpfa_seminaire_prix', true );
			$data['dates'] = get_post_meta( $post->ID, '_cpfa_seminaire_dates', true );
			$data['lieu']  = get_post_meta( $post->ID, '_cpfa_seminaire_lieu', true );
			$data['quota'] = get_post_meta( $post->ID, '_cpfa_seminaire_quota', true );
		} elseif ( 'cpfa_ressource' === $post->post_type ) {
			$data['cote']        = get_post_meta( $post->ID, '_cpfa_ressource_cote', true );
			$data['auteurs']     = get_post_meta( $post->ID, '_cpfa_ressource_auteurs', true );
			$data['statut_pret'] = get_post_meta( $post->ID, '_cpfa_ressource_statut_pret', true );
		}

		if ( $detailed ) {
			$data['content'] = apply_filters( 'the_content', $post->post_content );
		}

		return apply_filters( 'cpfa_rest_prepare_item', $data, $post );
	}
}
