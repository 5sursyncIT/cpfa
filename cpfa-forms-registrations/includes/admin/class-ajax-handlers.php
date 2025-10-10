<?php
/**
 * Admin AJAX Handlers Class.
 *
 * Handles AJAX requests for validation, rejection, and justification requests.
 *
 * @package CPFA_Forms
 */

namespace Cpfa\Forms\Admin;

use Cpfa\Forms\Services\Notification_Service;

/**
 * Ajax_Handlers class.
 */
class Ajax_Handlers {

	/**
	 * Single instance.
	 *
	 * @var Ajax_Handlers
	 */
	private static $instance = null;

	/**
	 * Get instance.
	 *
	 * @return Ajax_Handlers
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
		// AJAX handlers (admin only).
		add_action( 'wp_ajax_cpfa_get_abonnement_details', array( $this, 'get_abonnement_details' ) );
		add_action( 'wp_ajax_cpfa_validate_abonnement', array( $this, 'validate_abonnement' ) );
		add_action( 'wp_ajax_cpfa_reject_abonnement', array( $this, 'reject_abonnement' ) );
		add_action( 'wp_ajax_cpfa_request_justificatif', array( $this, 'request_justificatif' ) );
	}

	/**
	 * Get abonnement details.
	 */
	public function get_abonnement_details() {
		// Verify nonce.
		if ( ! isset( $_POST['nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['nonce'] ) ), 'cpfa_admin_nonce' ) ) {
			wp_send_json_error( array( 'message' => __( 'Erreur de sécurité.', 'cpfa-forms' ) ), 403 );
		}

		// Check permissions.
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array( 'message' => __( 'Permission refusée.', 'cpfa-forms' ) ), 403 );
		}

		// Get abonnement ID.
		if ( ! isset( $_POST['id'] ) ) {
			wp_send_json_error( array( 'message' => __( 'ID manquant.', 'cpfa-forms' ) ), 400 );
		}

		$abonnement_id = absint( $_POST['id'] );

		// Get post.
		$post = get_post( $abonnement_id );
		if ( ! $post || 'cpfa_abonnement' !== $post->post_type ) {
			wp_send_json_error( array( 'message' => __( 'Abonnement introuvable.', 'cpfa-forms' ) ), 404 );
		}

		// Get all meta data.
		$nom                   = get_post_meta( $abonnement_id, '_cpfa_abonnement_nom', true );
		$prenom                = get_post_meta( $abonnement_id, '_cpfa_abonnement_prenom', true );
		$email                 = get_post_meta( $abonnement_id, '_cpfa_abonnement_email', true );
		$telephone             = get_post_meta( $abonnement_id, '_cpfa_abonnement_telephone', true );
		$type                  = get_post_meta( $abonnement_id, '_cpfa_abonnement_type', true );
		$montant               = get_post_meta( $abonnement_id, '_cpfa_abonnement_montant', true );
		$statut                = get_post_meta( $abonnement_id, '_cpfa_abonnement_statut', true );
		$photo_id              = get_post_meta( $abonnement_id, '_cpfa_abonnement_photo', true );
		$cni_id                = get_post_meta( $abonnement_id, '_cpfa_abonnement_cni', true );
		$transaction_ref       = get_post_meta( $abonnement_id, '_cpfa_abonnement_transaction_ref', true );
		$numero_preinscription = get_post_meta( $abonnement_id, '_cpfa_abonnement_numero_preinscription', true );

		$type_labels = array(
			'etudiant'         => __( 'Étudiant', 'cpfa-forms' ),
			'professionnel'    => __( 'Professionnel', 'cpfa-forms' ),
			'emprunt_domicile' => __( 'Emprunt à domicile', 'cpfa-forms' ),
		);

		$data = array(
			'id'                    => $abonnement_id,
			'nom'                   => $nom,
			'prenom'                => $prenom,
			'email'                 => $email,
			'telephone'             => $telephone,
			'type'                  => isset( $type_labels[ $type ] ) ? $type_labels[ $type ] : $type,
			'montant'               => number_format( $montant, 0, ',', ' ' ) . ' FCFA',
			'statut'                => $statut,
			'date'                  => get_the_date( 'd/m/Y à H:i', $abonnement_id ),
			'transaction_ref'       => $transaction_ref,
			'numero_preinscription' => $numero_preinscription,
			'photo'                 => $photo_id ? wp_get_attachment_url( $photo_id ) : '',
			'cni'                   => $cni_id ? wp_get_attachment_url( $cni_id ) : '',
		);

		wp_send_json_success( $data );
	}

	/**
	 * Validate abonnement.
	 */
	public function validate_abonnement() {
		// Verify nonce.
		if ( ! isset( $_POST['nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['nonce'] ) ), 'cpfa_admin_nonce' ) ) {
			wp_send_json_error( array( 'message' => __( 'Erreur de sécurité.', 'cpfa-forms' ) ), 403 );
		}

		// Check permissions.
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array( 'message' => __( 'Permission refusée.', 'cpfa-forms' ) ), 403 );
		}

		// Validate required fields.
		if ( empty( $_POST['abonnement_id'] ) || empty( $_POST['transaction_ref'] ) || empty( $_POST['gateway'] ) ) {
			wp_send_json_error( array( 'message' => __( 'Champs requis manquants.', 'cpfa-forms' ) ), 400 );
		}

		$abonnement_id   = absint( $_POST['abonnement_id'] );
		$transaction_ref = sanitize_text_field( wp_unslash( $_POST['transaction_ref'] ) );
		$gateway         = sanitize_key( wp_unslash( $_POST['gateway'] ) );
		$send_email      = isset( $_POST['send_email'] ) ? (bool) $_POST['send_email'] : true;

		// Get post.
		$post = get_post( $abonnement_id );
		if ( ! $post || 'cpfa_abonnement' !== $post->post_type ) {
			wp_send_json_error( array( 'message' => __( 'Abonnement introuvable.', 'cpfa-forms' ) ), 404 );
		}

		// Check current status.
		$current_status = get_post_meta( $abonnement_id, '_cpfa_abonnement_statut', true );
		if ( 'awaiting_validation' !== $current_status ) {
			wp_send_json_error( array( 'message' => __( 'Cet abonnement ne peut plus être validé.', 'cpfa-forms' ) ), 400 );
		}

		// Update status and metadata.
		update_post_meta( $abonnement_id, '_cpfa_abonnement_statut', 'active' );
		update_post_meta( $abonnement_id, '_cpfa_abonnement_transaction_ref', $transaction_ref );
		update_post_meta( $abonnement_id, '_cpfa_abonnement_gateway', $gateway );
		update_post_meta( $abonnement_id, '_cpfa_abonnement_valide_par', get_current_user_id() );
		update_post_meta( $abonnement_id, '_cpfa_abonnement_valide_le', current_time( 'mysql' ) );

		// Set dates (1 year subscription).
		$date_debut = current_time( 'Y-m-d' );
		$date_fin   = gmdate( 'Y-m-d', strtotime( '+1 year', strtotime( $date_debut ) ) );
		update_post_meta( $abonnement_id, '_cpfa_abonnement_date_debut', $date_debut );
		update_post_meta( $abonnement_id, '_cpfa_abonnement_date_fin', $date_fin );

		// Generate numero_carte.
		$numero_carte = 'CPFA-' . gmdate( 'Y' ) . '-' . str_pad( $abonnement_id, 6, '0', STR_PAD_LEFT );
		update_post_meta( $abonnement_id, '_cpfa_abonnement_numero_carte', $numero_carte );

		// Update history.
		$history   = get_post_meta( $abonnement_id, '_cpfa_abonnement_historique', true );
		$history   = $history ? $history : array();
		$history[] = array(
			'date'   => current_time( 'mysql' ),
			'action' => 'validated',
			'user'   => get_current_user_id(),
			'data'   => array(
				'transaction_ref' => $transaction_ref,
				'gateway'         => $gateway,
			),
		);
		update_post_meta( $abonnement_id, '_cpfa_abonnement_historique', $history );

		// Trigger hook for PDF generation (Plugin 3 will listen to this).
		do_action( 'cpfa_abonnement_validated', $abonnement_id );

		// Send email if requested.
		if ( $send_email ) {
			// Wait a bit for PDF to be generated.
			sleep( 2 );

			$carte_pdf_path = get_post_meta( $abonnement_id, '_cpfa_carte_pdf', true );
			$notification   = Notification_Service::get_instance();
			$notification->send_abonnement_valide( $abonnement_id, $carte_pdf_path );
		}

		wp_send_json_success(
			array(
				'message'      => __( 'Abonnement validé avec succès !', 'cpfa-forms' ),
				'numero_carte' => $numero_carte,
			)
		);
	}

	/**
	 * Reject abonnement.
	 */
	public function reject_abonnement() {
		// Verify nonce.
		if ( ! isset( $_POST['nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['nonce'] ) ), 'cpfa_admin_nonce' ) ) {
			wp_send_json_error( array( 'message' => __( 'Erreur de sécurité.', 'cpfa-forms' ) ), 403 );
		}

		// Check permissions.
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array( 'message' => __( 'Permission refusée.', 'cpfa-forms' ) ), 403 );
		}

		// Validate required fields.
		if ( empty( $_POST['abonnement_id'] ) || empty( $_POST['motif'] ) ) {
			wp_send_json_error( array( 'message' => __( 'Champs requis manquants.', 'cpfa-forms' ) ), 400 );
		}

		$abonnement_id = absint( $_POST['abonnement_id'] );
		$motif         = sanitize_key( wp_unslash( $_POST['motif'] ) );
		$details       = isset( $_POST['details'] ) ? sanitize_textarea_field( wp_unslash( $_POST['details'] ) ) : '';
		$send_email    = isset( $_POST['send_email'] ) ? (bool) $_POST['send_email'] : true;

		// Get post.
		$post = get_post( $abonnement_id );
		if ( ! $post || 'cpfa_abonnement' !== $post->post_type ) {
			wp_send_json_error( array( 'message' => __( 'Abonnement introuvable.', 'cpfa-forms' ) ), 404 );
		}

		// Check current status.
		$current_status = get_post_meta( $abonnement_id, '_cpfa_abonnement_statut', true );
		if ( 'awaiting_validation' !== $current_status ) {
			wp_send_json_error( array( 'message' => __( 'Cet abonnement ne peut plus être rejeté.', 'cpfa-forms' ) ), 400 );
		}

		// Update status and metadata.
		update_post_meta( $abonnement_id, '_cpfa_abonnement_statut', 'rejected' );
		update_post_meta( $abonnement_id, '_cpfa_abonnement_motif_rejet', $motif );
		update_post_meta( $abonnement_id, '_cpfa_abonnement_details_rejet', $details );
		update_post_meta( $abonnement_id, '_cpfa_abonnement_rejete_par', get_current_user_id() );
		update_post_meta( $abonnement_id, '_cpfa_abonnement_rejete_le', current_time( 'mysql' ) );

		// Update history.
		$history   = get_post_meta( $abonnement_id, '_cpfa_abonnement_historique', true );
		$history   = $history ? $history : array();
		$history[] = array(
			'date'   => current_time( 'mysql' ),
			'action' => 'rejected',
			'user'   => get_current_user_id(),
			'data'   => array(
				'motif'   => $motif,
				'details' => $details,
			),
		);
		update_post_meta( $abonnement_id, '_cpfa_abonnement_historique', $history );

		// Send email if requested.
		if ( $send_email ) {
			$notification = Notification_Service::get_instance();
			$notification->send_abonnement_rejete( $abonnement_id );
		}

		wp_send_json_success(
			array(
				'message' => __( 'Préinscription rejetée.', 'cpfa-forms' ),
			)
		);
	}

	/**
	 * Request justificatif.
	 */
	public function request_justificatif() {
		// Verify nonce.
		if ( ! isset( $_POST['nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['nonce'] ) ), 'cpfa_admin_nonce' ) ) {
			wp_send_json_error( array( 'message' => __( 'Erreur de sécurité.', 'cpfa-forms' ) ), 403 );
		}

		// Check permissions.
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array( 'message' => __( 'Permission refusée.', 'cpfa-forms' ) ), 403 );
		}

		// Get abonnement ID.
		if ( ! isset( $_POST['id'] ) ) {
			wp_send_json_error( array( 'message' => __( 'ID manquant.', 'cpfa-forms' ) ), 400 );
		}

		$abonnement_id  = absint( $_POST['id'] );
		$custom_message = isset( $_POST['message'] ) ? sanitize_textarea_field( wp_unslash( $_POST['message'] ) ) : '';

		// Get post.
		$post = get_post( $abonnement_id );
		if ( ! $post || 'cpfa_abonnement' !== $post->post_type ) {
			wp_send_json_error( array( 'message' => __( 'Abonnement introuvable.', 'cpfa-forms' ) ), 404 );
		}

		// Update history.
		$history   = get_post_meta( $abonnement_id, '_cpfa_abonnement_historique', true );
		$history   = $history ? $history : array();
		$history[] = array(
			'date'   => current_time( 'mysql' ),
			'action' => 'justificatif_requested',
			'user'   => get_current_user_id(),
			'data'   => array(
				'message' => $custom_message,
			),
		);
		update_post_meta( $abonnement_id, '_cpfa_abonnement_historique', $history );

		// Send email.
		$notification = Notification_Service::get_instance();
		$notification->send_justificatif_demande( $abonnement_id, $custom_message );

		wp_send_json_success(
			array(
				'message' => __( 'Email envoyé avec succès.', 'cpfa-forms' ),
			)
		);
	}
}
