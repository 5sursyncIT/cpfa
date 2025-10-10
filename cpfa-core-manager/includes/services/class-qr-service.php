<?php
/**
 * QR Code Service
 *
 * @package CpfaCore
 */

namespace Cpfa\Core\Services;

use Endroid\QrCode\QrCode;
use Endroid\QrCode\Writer\PngWriter;
use Endroid\QrCode\Writer\SvgWriter;
use Endroid\QrCode\Encoding\Encoding;
use Endroid\QrCode\ErrorCorrectionLevel;
use Endroid\QrCode\RoundBlockSizeMode;

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * QR Service class.
 */
class QR_Service {

	/**
	 * Generate QR code as PNG.
	 *
	 * @param string $data Data to encode.
	 * @param int    $size Size in pixels.
	 * @return string Base64 encoded PNG.
	 */
	public static function generate_png( $data, $size = 300 ) {
		$qr_code = self::create_qr_code( $data, $size );
		$writer  = new PngWriter();
		$result  = $writer->write( $qr_code );

		return 'data:image/png;base64,' . base64_encode( $result->getString() );
	}

	/**
	 * Generate QR code as SVG.
	 *
	 * @param string $data Data to encode.
	 * @param int    $size Size in pixels.
	 * @return string SVG string.
	 */
	public static function generate_svg( $data, $size = 300 ) {
		$qr_code = self::create_qr_code( $data, $size );
		$writer  = new SvgWriter();
		$result  = $writer->write( $qr_code );

		return $result->getString();
	}

	/**
	 * Save QR code to file.
	 *
	 * @param string $data     Data to encode.
	 * @param string $filename Filename to save.
	 * @param string $format   Format (png or svg).
	 * @param int    $size     Size in pixels.
	 * @return string|false File path on success, false on failure.
	 */
	public static function save_to_file( $data, $filename, $format = 'png', $size = 300 ) {
		$upload_dir = wp_upload_dir();
		$qr_dir     = $upload_dir['basedir'] . '/cpfa-qr/';

		// Create directory if not exists.
		if ( ! file_exists( $qr_dir ) ) {
			wp_mkdir_p( $qr_dir );
		}

		$file_path = $qr_dir . $filename . '.' . $format;
		$qr_code   = self::create_qr_code( $data, $size );

		try {
			if ( 'png' === $format ) {
				$writer = new PngWriter();
			} else {
				$writer = new SvgWriter();
			}

			$result = $writer->write( $qr_code );
			file_put_contents( $file_path, $result->getString() );

			return $file_path;
		} catch ( \Exception $e ) {
			error_log( 'CPFA QR Code Error: ' . $e->getMessage() );
			return false;
		}
	}

	/**
	 * Create QR code object.
	 *
	 * @param string $data Data to encode.
	 * @param int    $size Size in pixels.
	 * @return QrCode QR code object.
	 */
	private static function create_qr_code( $data, $size = 300 ) {
		$qr_code = new QrCode( $data );
		$qr_code->setSize( $size );
		$qr_code->setMargin( 10 );
		$qr_code->setEncoding( new Encoding( 'UTF-8' ) );
		$qr_code->setErrorCorrectionLevel( ErrorCorrectionLevel::High );
		$qr_code->setRoundBlockSizeMode( RoundBlockSizeMode::Margin );

		return $qr_code;
	}

	/**
	 * Generate verification token.
	 *
	 * @param int    $post_id Post ID.
	 * @param string $type    Type (abonnement, formation, etc).
	 * @return string Token.
	 */
	public static function generate_token( $post_id, $type ) {
		$token = wp_hash( $post_id . $type . time() . wp_rand() );
		update_post_meta( $post_id, '_cpfa_verification_token', $token );
		update_post_meta( $post_id, '_cpfa_verification_type', $type );

		return $token;
	}

	/**
	 * Verify token.
	 *
	 * @param string $token Token to verify.
	 * @return array|false Post data on success, false on failure.
	 */
	public static function verify_token( $token ) {
		global $wpdb;

		$post_id = $wpdb->get_var(
			$wpdb->prepare(
				"SELECT post_id FROM {$wpdb->postmeta}
				WHERE meta_key = '_cpfa_verification_token'
				AND meta_value = %s",
				$token
			)
		);

		if ( ! $post_id ) {
			return false;
		}

		$post = get_post( $post_id );
		if ( ! $post ) {
			return false;
		}

		$type = get_post_meta( $post_id, '_cpfa_verification_type', true );

		return array(
			'post_id' => $post_id,
			'type'    => $type,
			'post'    => $post,
			'valid'   => true,
		);
	}

	/**
	 * Generate verification URL.
	 *
	 * @param string $token Token.
	 * @return string Verification URL.
	 */
	public static function get_verification_url( $token ) {
		return rest_url( 'cpfa/v1/verif/' . $token );
	}

	/**
	 * Generate QR code with verification URL.
	 *
	 * @param int    $post_id Post ID.
	 * @param string $type    Type.
	 * @param string $format  Format (png or svg).
	 * @return string QR code data.
	 */
	public static function generate_verification_qr( $post_id, $type, $format = 'png' ) {
		$token = self::generate_token( $post_id, $type );
		$url   = self::get_verification_url( $token );

		if ( 'png' === $format ) {
			return self::generate_png( $url );
		}

		return self::generate_svg( $url );
	}
}
