<?php
/**
 * Notification Service.
 *
 * Handles all email notifications for the subscription workflow.
 *
 * @package CPFA_Forms
 */

namespace Cpfa\Forms\Services;

/**
 * Notification_Service class.
 */
class Notification_Service {

	/**
	 * Single instance.
	 *
	 * @var Notification_Service
	 */
	private static $instance = null;

	/**
	 * Get instance.
	 *
	 * @return Notification_Service
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
		// No hooks needed here, just utility methods.
	}

	/**
	 * Get email headers with HTML content type.
	 *
	 * @return array
	 */
	private function get_email_headers() {
		$from_name  = get_option( 'cpfa_email_from_name', 'CPFA Bibliothèque' );
		$from_email = get_option( 'cpfa_email_from_address', get_option( 'admin_email' ) );

		return array(
			'Content-Type: text/html; charset=UTF-8',
			'From: ' . $from_name . ' <' . $from_email . '>',
		);
	}

	/**
	 * Render email template.
	 *
	 * @param string $template Template name.
	 * @param array  $variables Variables to replace.
	 * @return string
	 */
	private function render_template( $template, $variables = array() ) {
		$template_path = CPFA_FORMS_TEMPLATES_DIR . 'emails/' . $template . '.php';

		if ( ! file_exists( $template_path ) ) {
			return '';
		}

		ob_start();
		include $template_path;
		$content = ob_get_clean();

		// Replace variables.
		foreach ( $variables as $key => $value ) {
			$content = str_replace( '{' . $key . '}', $value, $content );
		}

		return $content;
	}

	/**
	 * Send Email 1: Préinscription reçue (to user).
	 *
	 * @param int $abonnement_id Abonnement post ID.
	 * @return bool
	 */
	public function send_preinscription_received( $abonnement_id ) {
		$nom                     = get_post_meta( $abonnement_id, '_cpfa_abonnement_nom', true );
		$prenom                  = get_post_meta( $abonnement_id, '_cpfa_abonnement_prenom', true );
		$email                   = get_post_meta( $abonnement_id, '_cpfa_abonnement_email', true );
		$type                    = get_post_meta( $abonnement_id, '_cpfa_abonnement_type', true );
		$montant                 = get_post_meta( $abonnement_id, '_cpfa_abonnement_montant', true );
		$numero_preinscription   = get_post_meta( $abonnement_id, '_cpfa_abonnement_numero_preinscription', true );

		$type_labels = array(
			'etudiant'         => 'Étudiant',
			'professionnel'    => 'Professionnel',
			'emprunt_domicile' => 'Emprunt à domicile',
		);

		$variables = array(
			'nom'                   => sanitize_text_field( $nom ),
			'prenom'                => sanitize_text_field( $prenom ),
			'type_abonnement'       => isset( $type_labels[ $type ] ) ? $type_labels[ $type ] : $type,
			'montant'               => number_format( $montant, 0, ',', ' ' ) . ' FCFA',
			'numero_preinscription' => sanitize_text_field( $numero_preinscription ),
			'date_soumission'       => get_the_date( 'd/m/Y à H:i', $abonnement_id ),
		);

		$subject = '[CPFA] Votre préinscription a bien été reçue - Validation en cours';
		$message = $this->render_template( 'preinscription-received', $variables );

		return wp_mail( $email, $subject, $message, $this->get_email_headers() );
	}

	/**
	 * Send Email 2: Nouvelle préinscription (to admin).
	 *
	 * @param int $abonnement_id Abonnement post ID.
	 * @return bool
	 */
	public function send_new_preinscription_admin( $abonnement_id ) {
		$admin_email = get_option( 'cpfa_admin_email', get_option( 'admin_email' ) );

		$nom       = get_post_meta( $abonnement_id, '_cpfa_abonnement_nom', true );
		$prenom    = get_post_meta( $abonnement_id, '_cpfa_abonnement_prenom', true );
		$email     = get_post_meta( $abonnement_id, '_cpfa_abonnement_email', true );
		$telephone = get_post_meta( $abonnement_id, '_cpfa_abonnement_telephone', true );
		$type      = get_post_meta( $abonnement_id, '_cpfa_abonnement_type', true );
		$montant   = get_post_meta( $abonnement_id, '_cpfa_abonnement_montant', true );

		$type_labels = array(
			'etudiant'         => 'Étudiant',
			'professionnel'    => 'Professionnel',
			'emprunt_domicile' => 'Emprunt à domicile',
		);

		$admin_url = admin_url( 'admin.php?page=cpfa-preinscriptions&action=view&id=' . $abonnement_id );

		$variables = array(
			'nom'              => sanitize_text_field( $nom ),
			'prenom'           => sanitize_text_field( $prenom ),
			'type_abonnement'  => isset( $type_labels[ $type ] ) ? $type_labels[ $type ] : $type,
			'montant'          => number_format( $montant, 0, ',', ' ' ),
			'email'            => sanitize_email( $email ),
			'telephone'        => sanitize_text_field( $telephone ),
			'lien_admin'       => esc_url( $admin_url ),
		);

		$subject = sprintf( '[CPFA Admin] Nouvelle préinscription à valider - %s %s', $prenom, $nom );
		$message = $this->render_template( 'new-preinscription-admin', $variables );

		return wp_mail( $admin_email, $subject, $message, $this->get_email_headers() );
	}

	/**
	 * Send Email 3: Abonnement validé (to user with PDF attachment).
	 *
	 * @param int    $abonnement_id Abonnement post ID.
	 * @param string $pdf_path      Path to PDF file.
	 * @return bool
	 */
	public function send_abonnement_valide( $abonnement_id, $pdf_path = '' ) {
		$nom           = get_post_meta( $abonnement_id, '_cpfa_abonnement_nom', true );
		$prenom        = get_post_meta( $abonnement_id, '_cpfa_abonnement_prenom', true );
		$email         = get_post_meta( $abonnement_id, '_cpfa_abonnement_email', true );
		$type          = get_post_meta( $abonnement_id, '_cpfa_abonnement_type', true );
		$date_debut    = get_post_meta( $abonnement_id, '_cpfa_abonnement_date_debut', true );
		$date_fin      = get_post_meta( $abonnement_id, '_cpfa_abonnement_date_fin', true );
		$numero_carte  = get_post_meta( $abonnement_id, '_cpfa_abonnement_numero_carte', true );
		$carte_pdf_url = get_post_meta( $abonnement_id, '_cpfa_carte_pdf_url', true );

		$type_labels = array(
			'etudiant'         => 'Étudiant',
			'professionnel'    => 'Professionnel',
			'emprunt_domicile' => 'Emprunt à domicile',
		);

		$variables = array(
			'nom'              => sanitize_text_field( $nom ),
			'prenom'           => sanitize_text_field( $prenom ),
			'type_abonnement'  => isset( $type_labels[ $type ] ) ? $type_labels[ $type ] : $type,
			'date_debut'       => date_i18n( 'd/m/Y', strtotime( $date_debut ) ),
			'date_fin'         => date_i18n( 'd/m/Y', strtotime( $date_fin ) ),
			'numero_carte'     => sanitize_text_field( $numero_carte ),
			'carte_pdf_url'    => esc_url( $carte_pdf_url ),
		);

		$subject = '[CPFA] Votre abonnement bibliothèque a été activé !';
		$message = $this->render_template( 'abonnement-valide', $variables );

		$attachments = array();
		if ( ! empty( $pdf_path ) && file_exists( $pdf_path ) ) {
			$attachments[] = $pdf_path;
		}

		return wp_mail( $email, $subject, $message, $this->get_email_headers(), $attachments );
	}

	/**
	 * Send Email 4: Préinscription rejetée (to user).
	 *
	 * @param int $abonnement_id Abonnement post ID.
	 * @return bool
	 */
	public function send_abonnement_rejete( $abonnement_id ) {
		$nom            = get_post_meta( $abonnement_id, '_cpfa_abonnement_nom', true );
		$prenom         = get_post_meta( $abonnement_id, '_cpfa_abonnement_prenom', true );
		$email          = get_post_meta( $abonnement_id, '_cpfa_abonnement_email', true );
		$motif_rejet    = get_post_meta( $abonnement_id, '_cpfa_abonnement_motif_rejet', true );
		$details_rejet  = get_post_meta( $abonnement_id, '_cpfa_abonnement_details_rejet', true );
		$contact_email  = get_option( 'cpfa_contact_email', get_option( 'admin_email' ) );
		$contact_tel    = get_option( 'cpfa_contact_telephone', '+221 33 XXX XX XX' );

		$motif_labels = array(
			'paiement_non_recu'        => 'Paiement non reçu',
			'montant_incorrect'        => 'Montant incorrect',
			'photo_illisible'          => 'Photo illisible',
			'informations_incompletes' => 'Informations incomplètes',
			'autre'                    => 'Autre motif',
		);

		$variables = array(
			'nom'              => sanitize_text_field( $nom ),
			'prenom'           => sanitize_text_field( $prenom ),
			'motif_rejet'      => isset( $motif_labels[ $motif_rejet ] ) ? $motif_labels[ $motif_rejet ] : $motif_rejet,
			'details_rejet'    => ! empty( $details_rejet ) ? sanitize_textarea_field( $details_rejet ) : '',
			'contact_email'    => sanitize_email( $contact_email ),
			'contact_telephone' => sanitize_text_field( $contact_tel ),
		);

		$subject = '[CPFA] Votre préinscription nécessite une action de votre part';
		$message = $this->render_template( 'preinscription-rejetee', $variables );

		return wp_mail( $email, $subject, $message, $this->get_email_headers() );
	}

	/**
	 * Send Email 5: Justificatif de paiement demandé (to user).
	 *
	 * @param int    $abonnement_id    Abonnement post ID.
	 * @param string $custom_message   Custom message from admin.
	 * @return bool
	 */
	public function send_justificatif_demande( $abonnement_id, $custom_message = '' ) {
		$nom                   = get_post_meta( $abonnement_id, '_cpfa_abonnement_nom', true );
		$prenom                = get_post_meta( $abonnement_id, '_cpfa_abonnement_prenom', true );
		$email                 = get_post_meta( $abonnement_id, '_cpfa_abonnement_email', true );
		$numero_preinscription = get_post_meta( $abonnement_id, '_cpfa_abonnement_numero_preinscription', true );
		$contact_email         = get_option( 'cpfa_contact_email', get_option( 'admin_email' ) );

		$variables = array(
			'nom'                   => sanitize_text_field( $nom ),
			'prenom'                => sanitize_text_field( $prenom ),
			'numero_preinscription' => sanitize_text_field( $numero_preinscription ),
			'contact_email'         => sanitize_email( $contact_email ),
			'custom_message'        => ! empty( $custom_message ) ? sanitize_textarea_field( $custom_message ) : '',
		);

		$subject = '[CPFA] Justificatif de paiement requis pour votre abonnement';
		$message = $this->render_template( 'justificatif-demande', $variables );

		return wp_mail( $email, $subject, $message, $this->get_email_headers() );
	}

	/**
	 * Send Email 6: Préinscription expirée (to user).
	 *
	 * @param int $abonnement_id Abonnement post ID.
	 * @return bool
	 */
	public function send_preinscription_expired( $abonnement_id ) {
		$nom    = get_post_meta( $abonnement_id, '_cpfa_abonnement_nom', true );
		$prenom = get_post_meta( $abonnement_id, '_cpfa_abonnement_prenom', true );
		$email  = get_post_meta( $abonnement_id, '_cpfa_abonnement_email', true );

		$variables = array(
			'nom'    => sanitize_text_field( $nom ),
			'prenom' => sanitize_text_field( $prenom ),
		);

		$subject = '[CPFA] Votre préinscription a expiré';
		$message = $this->render_template( 'preinscription-expired', $variables );

		return wp_mail( $email, $subject, $message, $this->get_email_headers() );
	}
}
