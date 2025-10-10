<?php
/**
 * Form Handler Class.
 *
 * Handles AJAX submission of the abonnement form.
 *
 * @package CPFA_Forms
 */

namespace Cpfa\Forms;

use Cpfa\Forms\Services\Notification_Service;
use Cpfa\Forms\Services\Payment_Config_Service;

/**
 * Form_Handler class.
 */
class Form_Handler {

	/**
	 * Single instance.
	 *
	 * @var Form_Handler
	 */
	private static $instance = null;

	/**
	 * Get instance.
	 *
	 * @return Form_Handler
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
		// AJAX handler for logged-in and non-logged-in users.
		add_action( 'wp_ajax_cpfa_submit_abonnement', array( $this, 'handle_submission' ) );
		add_action( 'wp_ajax_nopriv_cpfa_submit_abonnement', array( $this, 'handle_submission' ) );
	}

	/**
	 * Handle form submission.
	 */
	public function handle_submission() {
		// Verify nonce.
		if ( ! isset( $_POST['cpfa_abonnement_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['cpfa_abonnement_nonce'] ) ), 'cpfa_submit_abonnement' ) ) {
			wp_send_json_error(
				array(
					'message' => __( 'Erreur de sécurité. Veuillez actualiser la page et réessayer.', 'cpfa-forms' ),
				),
				403
			);
		}

		// Validate required fields.
		$validation = $this->validate_fields();
		if ( is_wp_error( $validation ) ) {
			wp_send_json_error(
				array(
					'message' => $validation->get_error_message(),
				),
				400
			);
		}

		// Check for duplicate email.
		$duplicate_check = $this->check_duplicate_email( sanitize_email( wp_unslash( $_POST['cpfa_email'] ) ) );
		if ( is_wp_error( $duplicate_check ) ) {
			wp_send_json_error(
				array(
					'message' => $duplicate_check->get_error_message(),
				),
				409
			);
		}

		// Handle file uploads.
		$photo_id = $this->handle_file_upload( 'cpfa_photo', 2 * MB_IN_BYTES );
		if ( is_wp_error( $photo_id ) ) {
			wp_send_json_error(
				array(
					'message' => sprintf(
						/* translators: %s: error message */
						__( 'Erreur lors de l\'upload de la photo : %s', 'cpfa-forms' ),
						$photo_id->get_error_message()
					),
				),
				400
			);
		}

		$cni_id = $this->handle_file_upload( 'cpfa_cni', 5 * MB_IN_BYTES );
		if ( is_wp_error( $cni_id ) ) {
			// Delete the photo if CNI upload fails.
			wp_delete_attachment( $photo_id, true );

			wp_send_json_error(
				array(
					'message' => sprintf(
						/* translators: %s: error message */
						__( 'Erreur lors de l\'upload de la CNI : %s', 'cpfa-forms' ),
						$cni_id->get_error_message()
					),
				),
				400
			);
		}

		// Create abonnement post.
		$abonnement_id = $this->create_abonnement( $photo_id, $cni_id );

		if ( is_wp_error( $abonnement_id ) ) {
			// Delete uploaded files if post creation fails.
			wp_delete_attachment( $photo_id, true );
			wp_delete_attachment( $cni_id, true );

			wp_send_json_error(
				array(
					'message' => $abonnement_id->get_error_message(),
				),
				500
			);
		}

		// Send notification emails.
		$notification_service = Notification_Service::get_instance();
		$notification_service->send_preinscription_received( $abonnement_id );
		$notification_service->send_new_preinscription_admin( $abonnement_id );

		// Get the numero_preinscription for the success message.
		$numero_preinscription = get_post_meta( $abonnement_id, '_cpfa_abonnement_numero_preinscription', true );
		$email                 = get_post_meta( $abonnement_id, '_cpfa_abonnement_email', true );

		wp_send_json_success(
			array(
				'message'               => __( 'Votre demande a bien été enregistrée !', 'cpfa-forms' ),
				'numero_preinscription' => $numero_preinscription,
				'email'                 => $email,
			)
		);
	}

	/**
	 * Validate form fields.
	 *
	 * @return true|\WP_Error
	 */
	private function validate_fields() {
		$required_fields = array(
			'cpfa_nom'           => __( 'Le nom est requis.', 'cpfa-forms' ),
			'cpfa_prenom'        => __( 'Le prénom est requis.', 'cpfa-forms' ),
			'cpfa_email'         => __( 'L\'email est requis.', 'cpfa-forms' ),
			'cpfa_telephone'     => __( 'Le téléphone est requis.', 'cpfa-forms' ),
			'cpfa_type'          => __( 'Le type d\'abonnement est requis.', 'cpfa-forms' ),
			'cpfa_consent_rgpd'  => __( 'Vous devez accepter la politique de confidentialité.', 'cpfa-forms' ),
			'cpfa_consent_photo' => __( 'Vous devez autoriser l\'utilisation de votre photo.', 'cpfa-forms' ),
		);

		foreach ( $required_fields as $field => $message ) {
			if ( empty( $_POST[ $field ] ) ) {
				return new \WP_Error( 'missing_field', $message );
			}
		}

		// Validate email format.
		if ( ! is_email( sanitize_email( wp_unslash( $_POST['cpfa_email'] ) ) ) ) {
			return new \WP_Error( 'invalid_email', __( 'L\'adresse email est invalide.', 'cpfa-forms' ) );
		}

		// Validate type.
		$valid_types = array( 'etudiant', 'professionnel', 'emprunt_domicile' );
		if ( ! in_array( sanitize_key( wp_unslash( $_POST['cpfa_type'] ) ), $valid_types, true ) ) {
			return new \WP_Error( 'invalid_type', __( 'Type d\'abonnement invalide.', 'cpfa-forms' ) );
		}

		// Validate file uploads.
		if ( empty( $_FILES['cpfa_photo']['name'] ) ) {
			return new \WP_Error( 'missing_photo', __( 'La photo d\'identité est requise.', 'cpfa-forms' ) );
		}

		if ( empty( $_FILES['cpfa_cni']['name'] ) ) {
			return new \WP_Error( 'missing_cni', __( 'La copie de la CNI est requise.', 'cpfa-forms' ) );
		}

		return true;
	}

	/**
	 * Check for duplicate email.
	 *
	 * @param string $email Email to check.
	 * @return true|\WP_Error
	 */
	private function check_duplicate_email( $email ) {
		$existing = get_posts(
			array(
				'post_type'      => 'cpfa_abonnement',
				'posts_per_page' => 1,
				'meta_query'     => array(
					array(
						'key'     => '_cpfa_abonnement_email',
						'value'   => $email,
						'compare' => '=',
					),
					array(
						'key'     => '_cpfa_abonnement_statut',
						'value'   => array( 'awaiting_validation', 'active' ),
						'compare' => 'IN',
					),
				),
			)
		);

		if ( ! empty( $existing ) ) {
			$numero = get_post_meta( $existing[0]->ID, '_cpfa_abonnement_numero_preinscription', true );
			return new \WP_Error(
				'duplicate_email',
				sprintf(
					/* translators: %s: preincription number */
					__( 'Vous avez déjà une demande en cours avec cet email. Numéro : %s', 'cpfa-forms' ),
					$numero
				)
			);
		}

		return true;
	}

	/**
	 * Handle file upload with security checks.
	 *
	 * @param string $file_key File input name.
	 * @param int    $max_size Maximum file size in bytes.
	 * @return int|\WP_Error Attachment ID or error.
	 */
	private function handle_file_upload( $file_key, $max_size ) {
		if ( empty( $_FILES[ $file_key ]['name'] ) ) {
			return new \WP_Error( 'no_file', __( 'Aucun fichier fourni.', 'cpfa-forms' ) );
		}

		// phpcs:disable WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		$file = $_FILES[ $file_key ];
		// phpcs:enable

		// Check file size.
		if ( $file['size'] > $max_size ) {
			return new \WP_Error(
				'file_too_large',
				sprintf(
					/* translators: %s: maximum size in MB */
					__( 'Le fichier est trop volumineux. Taille max : %s MB', 'cpfa-forms' ),
					round( $max_size / MB_IN_BYTES, 2 )
				)
			);
		}

		// Check MIME type.
		$allowed_mimes = array(
			'cpfa_photo' => array( 'image/jpeg', 'image/png' ),
			'cpfa_cni'   => array( 'image/jpeg', 'image/png', 'application/pdf' ),
		);

		$file_type = wp_check_filetype( $file['name'] );
		if ( ! in_array( $file['type'], $allowed_mimes[ $file_key ], true ) ) {
			return new \WP_Error( 'invalid_file_type', __( 'Type de fichier non autorisé.', 'cpfa-forms' ) );
		}

		// Use WordPress upload handler.
		require_once ABSPATH . 'wp-admin/includes/image.php';
		require_once ABSPATH . 'wp-admin/includes/file.php';
		require_once ABSPATH . 'wp-admin/includes/media.php';

		$attachment_id = media_handle_upload(
			$file_key,
			0,
			array(),
			array(
				'test_form'   => false,
				'test_type'   => true,
				'test_upload' => true,
			)
		);

		if ( is_wp_error( $attachment_id ) ) {
			return $attachment_id;
		}

		return $attachment_id;
	}

	/**
	 * Create abonnement post with all meta data.
	 *
	 * @param int $photo_id Photo attachment ID.
	 * @param int $cni_id   CNI attachment ID.
	 * @return int|\WP_Error Post ID or error.
	 */
	private function create_abonnement( $photo_id, $cni_id ) {
		$nom       = isset( $_POST['cpfa_nom'] ) ? sanitize_text_field( wp_unslash( $_POST['cpfa_nom'] ) ) : '';
		$prenom    = isset( $_POST['cpfa_prenom'] ) ? sanitize_text_field( wp_unslash( $_POST['cpfa_prenom'] ) ) : '';
		$email     = isset( $_POST['cpfa_email'] ) ? sanitize_email( wp_unslash( $_POST['cpfa_email'] ) ) : '';
		$telephone = isset( $_POST['cpfa_telephone'] ) ? sanitize_text_field( wp_unslash( $_POST['cpfa_telephone'] ) ) : '';
		$type      = isset( $_POST['cpfa_type'] ) ? sanitize_key( wp_unslash( $_POST['cpfa_type'] ) ) : '';
		$trans_ref = isset( $_POST['cpfa_transaction_ref'] ) ? sanitize_text_field( wp_unslash( $_POST['cpfa_transaction_ref'] ) ) : '';

		// Create post.
		$post_id = wp_insert_post(
			array(
				'post_type'   => 'cpfa_abonnement',
				'post_title'  => sprintf( '%s %s', $prenom, $nom ),
				'post_status' => 'publish',
			),
			true
		);

		if ( is_wp_error( $post_id ) ) {
			return $post_id;
		}

		// Get montant from payment config.
		$payment_service = Payment_Config_Service::get_instance();
		$montant         = $payment_service->get_price_for_type( $type );

		// Generate numero_preinscription.
		$numero_preinscription = 'PRE-' . gmdate( 'Ymd' ) . '-' . str_pad( $post_id, 5, '0', STR_PAD_LEFT );

		// Save all meta data.
		update_post_meta( $post_id, '_cpfa_abonnement_nom', $nom );
		update_post_meta( $post_id, '_cpfa_abonnement_prenom', $prenom );
		update_post_meta( $post_id, '_cpfa_abonnement_email', $email );
		update_post_meta( $post_id, '_cpfa_abonnement_telephone', $telephone );
		update_post_meta( $post_id, '_cpfa_abonnement_type', $type );
		update_post_meta( $post_id, '_cpfa_abonnement_montant', $montant );
		update_post_meta( $post_id, '_cpfa_abonnement_statut', 'awaiting_validation' );
		update_post_meta( $post_id, '_cpfa_abonnement_photo', $photo_id );
		update_post_meta( $post_id, '_cpfa_abonnement_cni', $cni_id );
		update_post_meta( $post_id, '_cpfa_abonnement_numero_preinscription', $numero_preinscription );

		if ( ! empty( $trans_ref ) ) {
			update_post_meta( $post_id, '_cpfa_abonnement_transaction_ref', $trans_ref );
		}

		// Initialize historique.
		$history = array(
			array(
				'date'   => current_time( 'mysql' ),
				'action' => 'created',
				'user'   => 0,
				'data'   => array(
					'ip' => $this->get_client_ip(),
				),
			),
		);
		update_post_meta( $post_id, '_cpfa_abonnement_historique', $history );

		return $post_id;
	}

	/**
	 * Get client IP address.
	 *
	 * @return string
	 */
	private function get_client_ip() {
		$ip = '';

		if ( isset( $_SERVER['HTTP_CLIENT_IP'] ) ) {
			$ip = sanitize_text_field( wp_unslash( $_SERVER['HTTP_CLIENT_IP'] ) );
		} elseif ( isset( $_SERVER['HTTP_X_FORWARDED_FOR'] ) ) {
			$ip = sanitize_text_field( wp_unslash( $_SERVER['HTTP_X_FORWARDED_FOR'] ) );
		} elseif ( isset( $_SERVER['REMOTE_ADDR'] ) ) {
			$ip = sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) );
		}

		return $ip;
	}
}
