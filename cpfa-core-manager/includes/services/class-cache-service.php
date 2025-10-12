<?php
/**
 * Cache Service
 *
 * Centralized cache management for CPFA system
 *
 * @package CpfaCore
 */

namespace Cpfa\Core\Services;

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Cache Service class.
 */
class Cache_Service {

	/**
	 * Cache group prefix.
	 *
	 * @var string
	 */
	const CACHE_GROUP = 'cpfa_cache';

	/**
	 * Default cache duration (5 minutes).
	 *
	 * @var int
	 */
	const DEFAULT_DURATION = 300;

	/**
	 * Get cached value or execute callback.
	 *
	 * @param string   $key      Cache key.
	 * @param callable $callback Callback to execute if cache miss.
	 * @param int      $duration Cache duration in seconds.
	 * @return mixed Cached value or callback result.
	 */
	public static function remember( $key, $callback, $duration = self::DEFAULT_DURATION ) {
		$cache_key = self::get_cache_key( $key );
		$cached    = wp_cache_get( $cache_key, self::CACHE_GROUP );

		if ( false !== $cached ) {
			return $cached;
		}

		// Try transient for persistent cache.
		$cached = get_transient( $cache_key );
		if ( false !== $cached ) {
			wp_cache_set( $cache_key, $cached, self::CACHE_GROUP, $duration );
			return $cached;
		}

		// Execute callback.
		$value = $callback();

		// Store in both object cache and transient.
		wp_cache_set( $cache_key, $value, self::CACHE_GROUP, $duration );
		set_transient( $cache_key, $value, $duration );

		return $value;
	}

	/**
	 * Get value from cache.
	 *
	 * @param string $key Cache key.
	 * @return mixed|false Cached value or false.
	 */
	public static function get( $key ) {
		$cache_key = self::get_cache_key( $key );
		$cached    = wp_cache_get( $cache_key, self::CACHE_GROUP );

		if ( false === $cached ) {
			$cached = get_transient( $cache_key );
			if ( false !== $cached ) {
				wp_cache_set( $cache_key, $cached, self::CACHE_GROUP );
			}
		}

		return $cached;
	}

	/**
	 * Set value in cache.
	 *
	 * @param string $key      Cache key.
	 * @param mixed  $value    Value to cache.
	 * @param int    $duration Cache duration in seconds.
	 * @return bool True on success.
	 */
	public static function set( $key, $value, $duration = self::DEFAULT_DURATION ) {
		$cache_key = self::get_cache_key( $key );

		wp_cache_set( $cache_key, $value, self::CACHE_GROUP, $duration );
		set_transient( $cache_key, $value, $duration );

		return true;
	}

	/**
	 * Delete value from cache.
	 *
	 * @param string $key Cache key.
	 * @return bool True on success.
	 */
	public static function delete( $key ) {
		$cache_key = self::get_cache_key( $key );

		wp_cache_delete( $cache_key, self::CACHE_GROUP );
		delete_transient( $cache_key );

		return true;
	}

	/**
	 * Flush all cache for a specific pattern.
	 *
	 * @param string $pattern Cache key pattern (e.g., 'library_stats_*').
	 * @return bool True on success.
	 */
	public static function flush_pattern( $pattern ) {
		global $wpdb;

		// Flush transients matching pattern.
		$pattern_like = $wpdb->esc_like( '_transient_' . self::CACHE_GROUP . '_' . $pattern );
		$pattern_like = str_replace( '*', '%', $pattern_like );

		$wpdb->query(
			$wpdb->prepare(
				"DELETE FROM {$wpdb->options}
				WHERE option_name LIKE %s
				OR option_name LIKE %s",
				$pattern_like,
				$wpdb->esc_like( '_transient_timeout_' . self::CACHE_GROUP . '_' . $pattern )
			)
		);

		// Note: wp_cache_flush() would flush ALL cache, not just pattern.
		// For object cache, we rely on transient deletion.

		do_action( 'cpfa_cache_flushed', $pattern );

		return true;
	}

	/**
	 * Flush all CPFA cache.
	 *
	 * @return bool True on success.
	 */
	public static function flush_all() {
		return self::flush_pattern( '*' );
	}

	/**
	 * Get cache key with prefix.
	 *
	 * @param string $key Original key.
	 * @return string Prefixed key.
	 */
	private static function get_cache_key( $key ) {
		return self::CACHE_GROUP . '_' . $key;
	}

	/**
	 * Get cache stats (for debugging).
	 *
	 * @return array Cache statistics.
	 */
	public static function get_stats() {
		global $wpdb;

		$transient_count = $wpdb->get_var(
			$wpdb->prepare(
				"SELECT COUNT(*) FROM {$wpdb->options}
				WHERE option_name LIKE %s",
				$wpdb->esc_like( '_transient_' . self::CACHE_GROUP ) . '%'
			)
		);

		return array(
			'transient_count' => (int) $transient_count,
			'cache_group'     => self::CACHE_GROUP,
		);
	}

	/**
	 * Invalidate cache on post save.
	 *
	 * @param int $post_id Post ID.
	 */
	public static function invalidate_on_save( $post_id ) {
		$post_type = get_post_type( $post_id );

		// Invalidate relevant caches based on post type.
		switch ( $post_type ) {
			case 'cpfa_emprunt':
				self::delete( 'library_stats' );
				self::flush_pattern( 'active_loans*' );
				self::flush_pattern( 'loans_with_penalties*' );
				break;

			case 'cpfa_abonnement':
				self::delete( 'library_stats' );
				self::flush_pattern( 'subscribers*' );
				break;

			case 'cpfa_ressource':
				self::delete( 'library_stats' );
				self::flush_pattern( 'resources*' );
				break;

			case 'cpfa_formation':
			case 'cpfa_seminaire':
			case 'cpfa_concours':
				self::flush_pattern( 'catalogue*' );
				self::delete( 'stats' );
				break;
		}

		do_action( 'cpfa_cache_invalidated', $post_id, $post_type );
	}
}
