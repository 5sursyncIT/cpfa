<?php
/**
 * Member Card PDF Generator.
 *
 * Generates member card PDFs when abonnement is validated.
 *
 * @package CPFA_PDF
 */

namespace Cpfa\Pdf;

use Cpfa\Pdf\Services\PDF_Generator;
use Cpfa\Pdf\Services\PDF_Storage;

/**
 * Member_Card_PDF class.
 */
class Member_Card_PDF {

	/**
	 * Single instance.
	 *
	 * @var Member_Card_PDF
	 */
	private static $instance = null;

	/**
	 * PDF Generator service.
	 *
	 * @var PDF_Generator
	 */
	private $pdf_generator;

	/**
	 * PDF Storage service.
	 *
	 * @var PDF_Storage
	 */
	private $pdf_storage;

	/**
	 * Get instance.
	 *
	 * @return Member_Card_PDF
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
		$this->pdf_generator = PDF_Generator::get_instance();
		$this->pdf_storage   = PDF_Storage::get_instance();

		$this->init_hooks();
	}

	/**
	 * Initialize hooks.
	 */
	private function init_hooks() {
		// Listen to abonnement validation from Plugin 2.
		add_action( 'cpfa_abonnement_validated', array( $this, 'generate_member_card' ), 10, 1 );
	}

	/**
	 * Generate member card PDF.
	 *
	 * @param int $abonnement_id Abonnement post ID.
	 */
	public function generate_member_card( $abonnement_id ) {
		// Get abonnement data.
		$nom            = get_post_meta( $abonnement_id, '_cpfa_abonnement_nom', true );
		$prenom         = get_post_meta( $abonnement_id, '_cpfa_abonnement_prenom', true );
		$type           = get_post_meta( $abonnement_id, '_cpfa_abonnement_type', true );
		$numero_carte   = get_post_meta( $abonnement_id, '_cpfa_abonnement_numero_carte', true );
		$date_debut     = get_post_meta( $abonnement_id, '_cpfa_abonnement_date_debut', true );
		$date_fin       = get_post_meta( $abonnement_id, '_cpfa_abonnement_date_fin', true );
		$photo_id       = get_post_meta( $abonnement_id, '_cpfa_abonnement_photo', true );

		// Get photo URL.
		$photo_url = $photo_id ? wp_get_attachment_url( $photo_id ) : '';

		// Generate QR code for verification.
		$qr_code_data = $this->generate_qr_code( $numero_carte );

		$type_labels = array(
			'etudiant'         => __( 'Étudiant', 'cpfa-pdf' ),
			'professionnel'    => __( 'Professionnel', 'cpfa-pdf' ),
			'emprunt_domicile' => __( 'Emprunt à domicile', 'cpfa-pdf' ),
		);

		// Prepare variables for template.
		$variables = array(
			'nom'           => strtoupper( $nom ),
			'prenom'        => ucfirst( $prenom ),
			'type'          => isset( $type_labels[ $type ] ) ? $type_labels[ $type ] : $type,
			'numero_carte'  => $numero_carte,
			'date_debut'    => $this->pdf_generator->format_date( $date_debut ),
			'date_fin'      => $this->pdf_generator->format_date( $date_fin ),
			'photo_url'     => $photo_url,
			'qr_code'       => $qr_code_data,
			'logo_url'      => $this->pdf_generator->get_logo_url(),
			'colors'        => $this->pdf_generator->get_brand_colors(),
		);

		// Render HTML template.
		$html = $this->pdf_generator->render_template( 'member-card', $variables );

		if ( empty( $html ) ) {
			error_log( 'CPFA PDF: Failed to render member card template for abonnement #' . $abonnement_id );
			return;
		}

		// Generate PDF (credit card size: 85.6mm x 54mm).
		$pdf_content = $this->pdf_generator->generate_from_html(
			$html,
			array(
				'format'        => array( 85.6, 54 ),
				'margin_left'   => 0,
				'margin_right'  => 0,
				'margin_top'    => 0,
				'margin_bottom' => 0,
				'orientation'   => 'L', // Landscape.
			)
		);

		if ( false === $pdf_content ) {
			error_log( 'CPFA PDF: Failed to generate PDF for abonnement #' . $abonnement_id );
			return;
		}

		// Save PDF.
		$filename = 'carte-' . $abonnement_id . '.pdf';
		$filepath = $this->pdf_storage->save( $filename, $pdf_content );

		if ( false === $filepath ) {
			error_log( 'CPFA PDF: Failed to save PDF for abonnement #' . $abonnement_id );
			return;
		}

		// Save file path and URL in post meta.
		update_post_meta( $abonnement_id, '_cpfa_carte_pdf', $filepath );
		update_post_meta( $abonnement_id, '_cpfa_carte_pdf_url', $this->pdf_storage->get_url( $filepath ) );

		// Trigger hook for Plugin 2 to send email.
		do_action( 'cpfa_carte_generated', $abonnement_id, $filepath );

		// Log success.
		error_log( 'CPFA PDF: Successfully generated member card for abonnement #' . $abonnement_id );
	}

	/**
	 * Generate QR code for card verification.
	 *
	 * @param string $numero_carte Card number.
	 * @return string Base64 encoded QR code image.
	 */
	private function generate_qr_code( $numero_carte ) {
		// Verification URL.
		$verify_url = rest_url( 'cpfa/v1/verify-card/' . $numero_carte );

		// Check if QR code library is available.
		if ( ! class_exists( '\Endroid\QrCode\QrCode' ) ) {
			// Return placeholder if library not available.
			return '';
		}

		try {
			$qr_code = new \Endroid\QrCode\QrCode( $verify_url );
			$qr_code->setSize( 150 );
			$qr_code->setMargin( 5 );

			$writer = new \Endroid\QrCode\Writer\PngWriter();
			$result = $writer->write( $qr_code );

			// Return as base64 data URI.
			return $result->getDataUri();

		} catch ( \Exception $e ) {
			error_log( 'CPFA PDF: QR Code generation error: ' . $e->getMessage() );
			return '';
		}
	}
}
