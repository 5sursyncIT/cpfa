<?php
/**
 * PDF Storage Service.
 *
 * Handles storage and retrieval of generated PDF files.
 *
 * @package CPFA_PDF
 */

namespace Cpfa\Pdf\Services;

/**
 * PDF_Storage class.
 */
class PDF_Storage {

	/**
	 * Single instance.
	 *
	 * @var PDF_Storage
	 */
	private static $instance = null;

	/**
	 * Get instance.
	 *
	 * @return PDF_Storage
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
	 * Get upload directory for PDFs.
	 *
	 * @return array
	 */
	public function get_upload_dir() {
		$upload_dir = wp_upload_dir();
		$base_dir   = $upload_dir['basedir'] . '/cpfa-pdf';
		$base_url   = $upload_dir['baseurl'] . '/cpfa-pdf';

		// Create year/month subdirectories.
		$year  = gmdate( 'Y' );
		$month = gmdate( 'm' );

		$pdf_dir = $base_dir . '/' . $year . '/' . $month;
		$pdf_url = $base_url . '/' . $year . '/' . $month;

		// Create directory if it doesn't exist.
		if ( ! file_exists( $pdf_dir ) ) {
			wp_mkdir_p( $pdf_dir );

			// Add .htaccess for security.
			$this->create_htaccess( $base_dir );
		}

		return array(
			'path' => $pdf_dir,
			'url'  => $pdf_url,
		);
	}

	/**
	 * Save PDF content to file.
	 *
	 * @param string $filename Filename (without path).
	 * @param string $content  PDF content.
	 * @return string|false File path on success, false on failure.
	 */
	public function save( $filename, $content ) {
		$dir  = $this->get_upload_dir();
		$path = $dir['path'] . '/' . sanitize_file_name( $filename );

		// Save file.
		$result = file_put_contents( $path, $content );

		if ( false === $result ) {
			return false;
		}

		return $path;
	}

	/**
	 * Get URL for a saved PDF.
	 *
	 * @param string $filepath Full file path.
	 * @return string URL.
	 */
	public function get_url( $filepath ) {
		$upload_dir = wp_upload_dir();
		$base_dir   = $upload_dir['basedir'] . '/cpfa-pdf';
		$base_url   = $upload_dir['baseurl'] . '/cpfa-pdf';

		return str_replace( $base_dir, $base_url, $filepath );
	}

	/**
	 * Delete a PDF file.
	 *
	 * @param string $filepath Full file path.
	 * @return bool
	 */
	public function delete( $filepath ) {
		if ( file_exists( $filepath ) ) {
			return wp_delete_file( $filepath );
		}
		return false;
	}

	/**
	 * Create .htaccess file for security.
	 *
	 * @param string $dir Directory path.
	 */
	private function create_htaccess( $dir ) {
		$htaccess_file = $dir . '/.htaccess';

		if ( ! file_exists( $htaccess_file ) ) {
			$htaccess_content  = "# Protect PDF files\n";
			$htaccess_content .= "<FilesMatch \"\.pdf$\">\n";
			$htaccess_content .= "  Order Deny,Allow\n";
			$htaccess_content .= "  Deny from all\n";
			$htaccess_content .= "</FilesMatch>\n";

			file_put_contents( $htaccess_file, $htaccess_content );
		}
	}

	/**
	 * Generate secure download link with nonce.
	 *
	 * @param int    $post_id  Post ID.
	 * @param string $filepath File path.
	 * @return string Download URL.
	 */
	public function get_secure_download_url( $post_id, $filepath ) {
		return add_query_arg(
			array(
				'cpfa_download' => 'pdf',
				'id'            => $post_id,
				'nonce'         => wp_create_nonce( 'cpfa_download_pdf_' . $post_id ),
			),
			home_url()
		);
	}
}
