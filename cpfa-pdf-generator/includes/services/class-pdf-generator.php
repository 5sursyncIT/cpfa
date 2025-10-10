<?php
/**
 * PDF Generator Service.
 *
 * Base service for generating PDFs with mPDF.
 *
 * @package CPFA_PDF
 */

namespace Cpfa\Pdf\Services;

/**
 * PDF_Generator class.
 */
class PDF_Generator {

	/**
	 * Single instance.
	 *
	 * @var PDF_Generator
	 */
	private static $instance = null;

	/**
	 * Get instance.
	 *
	 * @return PDF_Generator
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
		// No hooks needed, just utility methods.
	}

	/**
	 * Generate PDF from HTML.
	 *
	 * @param string $html    HTML content.
	 * @param array  $options mPDF options.
	 * @return string|false PDF content on success, false on failure.
	 */
	public function generate_from_html( $html, $options = array() ) {
		// Check if mPDF is available.
		if ( ! class_exists( '\Mpdf\Mpdf' ) ) {
			error_log( 'CPFA PDF: mPDF library not found.' );
			return false;
		}

		$default_options = array(
			'mode'              => 'utf-8',
			'format'            => 'A4',
			'default_font_size' => 12,
			'default_font'      => 'dejavusans',
			'margin_left'       => 15,
			'margin_right'      => 15,
			'margin_top'        => 16,
			'margin_bottom'     => 16,
			'margin_header'     => 9,
			'margin_footer'     => 9,
			'orientation'       => 'P',
		);

		$options = wp_parse_args( $options, $default_options );

		try {
			$mpdf = new \Mpdf\Mpdf( $options );

			// Write HTML to PDF.
			$mpdf->WriteHTML( $html );

			// Return PDF content as string.
			return $mpdf->Output( '', 'S' );

		} catch ( \Mpdf\MpdfException $e ) {
			error_log( 'CPFA PDF Error: ' . $e->getMessage() );
			return false;
		}
	}

	/**
	 * Render template with variables.
	 *
	 * @param string $template_name Template file name (without extension).
	 * @param array  $variables     Variables to pass to template.
	 * @return string HTML content.
	 */
	public function render_template( $template_name, $variables = array() ) {
		$template_path = CPFA_PDF_TEMPLATES_DIR . 'pdf/' . $template_name . '.php';

		if ( ! file_exists( $template_path ) ) {
			error_log( 'CPFA PDF: Template not found: ' . $template_path );
			return '';
		}

		// Extract variables to make them available in template.
		extract( $variables, EXTR_SKIP );

		// Start output buffering.
		ob_start();

		// Include template.
		include $template_path;

		// Get content and clean buffer.
		return ob_get_clean();
	}

	/**
	 * Get logo URL.
	 *
	 * @return string
	 */
	public function get_logo_url() {
		$logo = get_option( 'cpfa_logo', '' );

		if ( empty( $logo ) ) {
			// Use default logo if available.
			$logo = CPFA_PDF_PLUGIN_URL . 'assets/images/logo.png';
		}

		return $logo;
	}

	/**
	 * Get brand colors.
	 *
	 * @return array
	 */
	public function get_brand_colors() {
		return array(
			'primary'   => get_option( 'cpfa_color_primary', '#0073aa' ),
			'secondary' => get_option( 'cpfa_color_secondary', '#005177' ),
			'accent'    => get_option( 'cpfa_color_accent', '#f0b849' ),
		);
	}

	/**
	 * Format date in French.
	 *
	 * @param string $date Date string.
	 * @return string
	 */
	public function format_date( $date ) {
		$timestamp = strtotime( $date );
		return date_i18n( 'd/m/Y', $timestamp );
	}
}
