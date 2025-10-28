<?php
/**
 * Meta Keys Migration
 *
 * Migrates old inconsistent meta keys to standardized Meta_Keys constants.
 * Run once during plugin update to fix historical data.
 *
 * @package CpfaCore
 */

namespace Cpfa\Core;

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Meta_Migration class.
 */
class Meta_Migration {

	/**
	 * Migration mapping (old_key => new_key).
	 *
	 * @var array
	 */
	private static $migration_map = array(
		// Fix plural/singular inconsistencies.
		'_cpfa_emprunt_penalites'        => '_cpfa_emprunt_penalite',
		'_cpfa_emprunt_penalites_payees' => '_cpfa_emprunt_penalite_payee',
	);

	/**
	 * Run migration.
	 *
	 * @return array Migration results.
	 */
	public static function run() {
		global $wpdb;

		$results = array(
			'success' => true,
			'migrated' => 0,
			'errors' => array(),
		);

		Logger::info( 'Starting meta keys migration...' );

		foreach ( self::$migration_map as $old_key => $new_key ) {
			try {
				$migrated = self::migrate_key( $old_key, $new_key );
				$results['migrated'] += $migrated;

				Logger::info( "Migrated {$migrated} entries from {$old_key} to {$new_key}" );
			} catch ( \Exception $e ) {
				$results['success'] = false;
				$results['errors'][] = sprintf(
					'Failed to migrate %s: %s',
					$old_key,
					$e->getMessage()
				);

				Logger::error( 'Migration error', array(
					'old_key' => $old_key,
					'new_key' => $new_key,
					'error' => $e->getMessage(),
				) );
			}
		}

		Logger::info( 'Meta keys migration completed', array(
			'total_migrated' => $results['migrated'],
			'success' => $results['success'],
		) );

		// Store migration completion flag.
		update_option( 'cpfa_meta_keys_migrated', true );
		update_option( 'cpfa_meta_keys_migration_date', current_time( 'mysql' ) );

		return $results;
	}

	/**
	 * Migrate a single key.
	 *
	 * @param string $old_key Old meta key.
	 * @param string $new_key New meta key.
	 * @return int Number of rows migrated.
	 * @throws \Exception If migration fails.
	 */
	private static function migrate_key( $old_key, $new_key ) {
		global $wpdb;

		// Check if new key already exists (don't overwrite).
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$count = $wpdb->get_var(
			$wpdb->prepare(
				"SELECT COUNT(*)
				FROM {$wpdb->postmeta}
				WHERE meta_key = %s",
				$old_key
			)
		);

		if ( ! $count ) {
			return 0;
		}

		// Update old keys to new keys (only if new key doesn't exist).
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$updated = $wpdb->query(
			$wpdb->prepare(
				"UPDATE {$wpdb->postmeta} pm1
				SET pm1.meta_key = %s
				WHERE pm1.meta_key = %s
				AND NOT EXISTS (
					SELECT 1 FROM {$wpdb->postmeta} pm2
					WHERE pm2.post_id = pm1.post_id
					AND pm2.meta_key = %s
				)",
				$new_key,
				$old_key,
				$new_key
			)
		);

		if ( false === $updated ) {
			throw new \Exception( $wpdb->last_error );
		}

		return $updated;
	}

	/**
	 * Check if migration is needed.
	 *
	 * @return bool True if migration needed.
	 */
	public static function is_migration_needed() {
		return ! get_option( 'cpfa_meta_keys_migrated', false );
	}

	/**
	 * Get migration status.
	 *
	 * @return array Status information.
	 */
	public static function get_status() {
		return array(
			'migrated' => get_option( 'cpfa_meta_keys_migrated', false ),
			'date' => get_option( 'cpfa_meta_keys_migration_date', '' ),
			'needed' => self::is_migration_needed(),
		);
	}

	/**
	 * Reset migration (for testing).
	 *
	 * @return void
	 */
	public static function reset() {
		delete_option( 'cpfa_meta_keys_migrated' );
		delete_option( 'cpfa_meta_keys_migration_date' );
	}
}
