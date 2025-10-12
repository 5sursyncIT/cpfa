<?php
/**
 * Rate Limiter Service
 *
 * Protects API endpoints from abuse
 *
 * @package CpfaCore
 */

namespace Cpfa\Core\Services;

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Rate Limiter class.
 */
class Rate_Limiter {

	/**
	 * Default rate limit (requests per minute).
	 *
	 * @var int
	 */
	const DEFAULT_LIMIT = 60;

	/**
	 * Rate limit window in seconds.
	 *
	 * @var int
	 */
	const WINDOW_SIZE = 60;

	/**
	 * Check if request should be rate limited.
	 *
	 * @param string $identifier Unique identifier (IP, user ID, etc).
	 * @param string $endpoint   Endpoint name.
	 * @param int    $limit      Rate limit (requests per minute).
	 * @return bool True if should be limited (over limit).
	 */
	public static function is_rate_limited( $identifier, $endpoint, $limit = self::DEFAULT_LIMIT ) {
		$key   = self::get_cache_key( $identifier, $endpoint );
		$count = (int) get_transient( $key );

		if ( $count >= $limit ) {
			// Log rate limit violation.
			self::log_rate_limit_violation( $identifier, $endpoint, $count );
			return true;
		}

		// Increment counter.
		if ( false === get_transient( $key ) ) {
			set_transient( $key, 1, self::WINDOW_SIZE );
		} else {
			set_transient( $key, $count + 1, self::WINDOW_SIZE );
		}

		return false;
	}

	/**
	 * Check and handle rate limiting.
	 *
	 * Sends 429 response if rate limited.
	 *
	 * @param string $identifier Unique identifier.
	 * @param string $endpoint   Endpoint name.
	 * @param int    $limit      Rate limit.
	 * @return bool True if allowed, exits if limited.
	 */
	public static function check( $identifier, $endpoint, $limit = self::DEFAULT_LIMIT ) {
		if ( self::is_rate_limited( $identifier, $endpoint, $limit ) ) {
			$retry_after = self::get_retry_after( $identifier, $endpoint );

			wp_send_json_error(
				array(
					'code'    => 'rate_limit_exceeded',
					'message' => sprintf(
						/* translators: %d: Retry time in seconds */
						__( 'Rate limit exceeded. Retry after %d seconds.', 'cpfa-core' ),
						$retry_after
					),
					'retry_after' => $retry_after,
				),
				429
			);
		}

		return true;
	}

	/**
	 * Get rate limit status for identifier.
	 *
	 * @param string $identifier Unique identifier.
	 * @param string $endpoint   Endpoint name.
	 * @param int    $limit      Rate limit.
	 * @return array Status information.
	 */
	public static function get_status( $identifier, $endpoint, $limit = self::DEFAULT_LIMIT ) {
		$key   = self::get_cache_key( $identifier, $endpoint );
		$count = (int) get_transient( $key );
		$ttl   = self::get_retry_after( $identifier, $endpoint );

		return array(
			'limit'     => $limit,
			'remaining' => max( 0, $limit - $count ),
			'used'      => $count,
			'reset'     => time() + $ttl,
		);
	}

	/**
	 * Reset rate limit for identifier.
	 *
	 * @param string $identifier Unique identifier.
	 * @param string $endpoint   Endpoint name.
	 * @return bool True on success.
	 */
	public static function reset( $identifier, $endpoint ) {
		$key = self::get_cache_key( $identifier, $endpoint );
		return delete_transient( $key );
	}

	/**
	 * Get retry-after time in seconds.
	 *
	 * @param string $identifier Unique identifier.
	 * @param string $endpoint   Endpoint name.
	 * @return int Seconds until reset.
	 */
	private static function get_retry_after( $identifier, $endpoint ) {
		$key = self::get_cache_key( $identifier, $endpoint );
		$ttl = get_option( '_transient_timeout_' . $key );

		if ( false === $ttl ) {
			return self::WINDOW_SIZE;
		}

		return max( 1, $ttl - time() );
	}

	/**
	 * Get cache key for rate limiting.
	 *
	 * @param string $identifier Unique identifier.
	 * @param string $endpoint   Endpoint name.
	 * @return string Cache key.
	 */
	private static function get_cache_key( $identifier, $endpoint ) {
		return 'cpfa_rate_limit_' . md5( $identifier . '_' . $endpoint );
	}

	/**
	 * Get identifier for current request.
	 *
	 * Uses user ID if logged in, otherwise IP address.
	 *
	 * @return string Identifier.
	 */
	public static function get_identifier() {
		if ( is_user_logged_in() ) {
			return 'user_' . get_current_user_id();
		}

		return 'ip_' . self::get_client_ip();
	}

	/**
	 * Get client IP address.
	 *
	 * @return string IP address.
	 */
	private static function get_client_ip() {
		$ip = '';

		if ( ! empty( $_SERVER['HTTP_CLIENT_IP'] ) ) {
			$ip = sanitize_text_field( wp_unslash( $_SERVER['HTTP_CLIENT_IP'] ) );
		} elseif ( ! empty( $_SERVER['HTTP_X_FORWARDED_FOR'] ) ) {
			$ip = sanitize_text_field( wp_unslash( $_SERVER['HTTP_X_FORWARDED_FOR'] ) );
		} elseif ( ! empty( $_SERVER['REMOTE_ADDR'] ) ) {
			$ip = sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) );
		}

		return $ip;
	}

	/**
	 * Log rate limit violation.
	 *
	 * @param string $identifier Identifier.
	 * @param string $endpoint   Endpoint.
	 * @param int    $count      Request count.
	 */
	private static function log_rate_limit_violation( $identifier, $endpoint, $count ) {
		error_log(
			sprintf(
				'CPFA Rate Limit: %s exceeded limit on %s (count: %d)',
				$identifier,
				$endpoint,
				$count
			)
		);

		do_action( 'cpfa_rate_limit_exceeded', $identifier, $endpoint, $count );
	}

	/**
	 * Add rate limit headers to response.
	 *
	 * @param string $identifier Identifier.
	 * @param string $endpoint   Endpoint.
	 * @param int    $limit      Rate limit.
	 */
	public static function add_headers( $identifier, $endpoint, $limit = self::DEFAULT_LIMIT ) {
		$status = self::get_status( $identifier, $endpoint, $limit );

		header( 'X-RateLimit-Limit: ' . $status['limit'] );
		header( 'X-RateLimit-Remaining: ' . $status['remaining'] );
		header( 'X-RateLimit-Reset: ' . $status['reset'] );
	}
}
