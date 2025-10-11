<?php
/**
 * CPFA Ajax Handler
 *
 * Gère toutes les requêtes Ajax du frontend.
 *
 * @package CpfaCore
 */

namespace Cpfa\Core;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Ajax_Handler
 */
class Ajax_Handler {

	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'wp_ajax_cpfa_reserve_resource', array( $this, 'reserve_resource' ) );
		add_action( 'wp_ajax_nopriv_cpfa_reserve_resource', array( $this, 'reserve_resource_guest' ) );
	}

	/**
	 * Reserve a library resource (logged-in users).
	 */
	public function reserve_resource() {
		// Vérifier le nonce.
		check_ajax_referer( 'cpfa-elementor-widgets', 'nonce' );

		// Vérifier que l'utilisateur est connecté.
		if ( ! is_user_logged_in() ) {
			wp_send_json_error(
				array(
					'message' => __( 'Vous devez être connecté pour réserver une ressource.', 'cpfa-core' ),
				)
			);
		}

		$resource_id = isset( $_POST['resource_id'] ) ? absint( $_POST['resource_id'] ) : 0;

		if ( ! $resource_id ) {
			wp_send_json_error(
				array(
					'message' => __( 'ID de ressource invalide.', 'cpfa-core' ),
				)
			);
		}

		// Vérifier que la ressource existe et est bien une ressource.
		$resource = get_post( $resource_id );
		if ( ! $resource || 'cpfa_ressource' !== $resource->post_type ) {
			wp_send_json_error(
				array(
					'message' => __( 'Ressource introuvable.', 'cpfa-core' ),
				)
			);
		}

		// Vérifier que la ressource n'est pas exclue du prêt.
		$is_excluded = get_post_meta( $resource_id, '_cpfa_ressource_exclu_pret', true );
		if ( 'oui' === $is_excluded ) {
			wp_send_json_error(
				array(
					'message' => __( 'Cette ressource est disponible uniquement en consultation sur place.', 'cpfa-core' ),
				)
			);
		}

		// Vérifier que la ressource n'est pas déjà empruntée.
		$existing_loan = $this->get_active_loan_for_resource( $resource_id );
		if ( $existing_loan ) {
			wp_send_json_error(
				array(
					'message' => __( 'Cette ressource est actuellement empruntée.', 'cpfa-core' ),
				)
			);
		}

		$user_id = get_current_user_id();

		// Vérifier si l'utilisateur a un abonnement actif.
		$subscription = $this->get_active_subscription_for_user( $user_id );
		if ( ! $subscription ) {
			wp_send_json_error(
				array(
					'message' => __( 'Vous devez avoir un abonnement actif pour emprunter des ressources. Veuillez contacter l\'administration.', 'cpfa-core' ),
				)
			);
		}

		// Vérifier si l'utilisateur a des pénalités en attente.
		$has_penalties = $this->user_has_pending_penalties( $user_id );
		if ( $has_penalties ) {
			wp_send_json_error(
				array(
					'message' => __( 'Vous avez des pénalités en attente. Veuillez les régler avant de pouvoir emprunter.', 'cpfa-core' ),
				)
			);
		}

		// Créer l'emprunt.
		$loan_data = array(
			'post_title'   => sprintf(
				/* translators: 1: Resource title, 2: User display name */
				__( 'Emprunt: %1$s par %2$s', 'cpfa-core' ),
				$resource->post_title,
				wp_get_current_user()->display_name
			),
			'post_type'    => 'cpfa_emprunt',
			'post_status'  => 'publish',
			'post_author'  => $user_id,
		);

		$loan_id = wp_insert_post( $loan_data );

		if ( is_wp_error( $loan_id ) ) {
			wp_send_json_error(
				array(
					'message' => __( 'Erreur lors de la création de l\'emprunt.', 'cpfa-core' ),
				)
			);
		}

		// Calculer les dates.
		$date_emprunt   = current_time( 'Y-m-d' );
		$date_retour_prevue = date( 'Y-m-d', strtotime( '+30 days', strtotime( $date_emprunt ) ) );

		// Enregistrer les méta données de l'emprunt.
		update_post_meta( $loan_id, '_cpfa_emprunt_abonne_id', $subscription );
		update_post_meta( $loan_id, '_cpfa_emprunt_ressource_id', $resource_id );
		update_post_meta( $loan_id, '_cpfa_emprunt_date_emprunt', $date_emprunt );
		update_post_meta( $loan_id, '_cpfa_emprunt_date_retour_prevue', $date_retour_prevue );
		update_post_meta( $loan_id, '_cpfa_emprunt_statut', 'en_cours' );

		// Envoyer une action pour permettre d'autres traitements (email, notifications, etc.).
		do_action( 'cpfa_resource_reserved', $loan_id, $resource_id, $user_id, $subscription );

		wp_send_json_success(
			array(
				'message'  => sprintf(
					/* translators: %s: Return date */
					__( 'Réservation effectuée avec succès ! Vous pouvez récupérer la ressource. Date de retour prévue : %s', 'cpfa-core' ),
					date_i18n( get_option( 'date_format' ), strtotime( $date_retour_prevue ) )
				),
				'loan_id'  => $loan_id,
				'due_date' => $date_retour_prevue,
			)
		);
	}

	/**
	 * Reserve resource for guest users (redirect to login).
	 */
	public function reserve_resource_guest() {
		wp_send_json_error(
			array(
				'message'  => __( 'Vous devez être connecté pour réserver une ressource.', 'cpfa-core' ),
				'redirect' => wp_login_url( get_permalink() ),
			)
		);
	}

	/**
	 * Get active loan for a resource.
	 *
	 * @param int $resource_id Resource ID.
	 * @return int|false Loan ID or false if not found.
	 */
	private function get_active_loan_for_resource( $resource_id ) {
		$args = array(
			'post_type'      => 'cpfa_emprunt',
			'posts_per_page' => 1,
			'post_status'    => 'publish',
			'meta_query'     => array(
				'relation' => 'AND',
				array(
					'key'     => '_cpfa_emprunt_ressource_id',
					'value'   => $resource_id,
					'compare' => '=',
				),
				array(
					'key'     => '_cpfa_emprunt_statut',
					'value'   => 'en_cours',
					'compare' => '=',
				),
			),
		);

		$query = new \WP_Query( $args );

		if ( $query->have_posts() ) {
			wp_reset_postdata();
			return $query->posts[0]->ID;
		}

		wp_reset_postdata();
		return false;
	}

	/**
	 * Get active subscription for a user.
	 *
	 * @param int $user_id User ID.
	 * @return int|false Subscription ID or false if not found.
	 */
	private function get_active_subscription_for_user( $user_id ) {
		$args = array(
			'post_type'      => 'cpfa_abonnement',
			'posts_per_page' => 1,
			'post_status'    => 'publish',
			'author'         => $user_id,
			'meta_query'     => array(
				'relation' => 'AND',
				array(
					'key'     => '_cpfa_abonnement_statut',
					'value'   => 'actif',
					'compare' => '=',
				),
				array(
					'key'     => '_cpfa_abonnement_date_fin',
					'value'   => current_time( 'Y-m-d' ),
					'compare' => '>=',
					'type'    => 'DATE',
				),
			),
		);

		$query = new \WP_Query( $args );

		if ( $query->have_posts() ) {
			wp_reset_postdata();
			return $query->posts[0]->ID;
		}

		wp_reset_postdata();
		return false;
	}

	/**
	 * Check if user has pending penalties.
	 *
	 * @param int $user_id User ID.
	 * @return bool True if user has pending penalties.
	 */
	private function user_has_pending_penalties( $user_id ) {
		// Récupérer tous les emprunts de l'utilisateur.
		$args = array(
			'post_type'      => 'cpfa_emprunt',
			'posts_per_page' => -1,
			'post_status'    => 'publish',
			'author'         => $user_id,
		);

		$query = new \WP_Query( $args );

		if ( ! $query->have_posts() ) {
			wp_reset_postdata();
			return false;
		}

		foreach ( $query->posts as $loan ) {
			$penalites = get_post_meta( $loan->ID, '_cpfa_emprunt_penalites', true );
			$penalites_payees = get_post_meta( $loan->ID, '_cpfa_emprunt_penalites_payees', true );

			if ( ! empty( $penalites ) && $penalites > 0 ) {
				if ( empty( $penalites_payees ) || 'oui' !== $penalites_payees ) {
					wp_reset_postdata();
					return true;
				}
			}
		}

		wp_reset_postdata();
		return false;
	}
}
