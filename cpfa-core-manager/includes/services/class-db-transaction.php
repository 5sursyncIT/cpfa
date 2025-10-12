<?php
/**
 * Database Transaction Service
 *
 * Provides transactional database operations for critical workflows
 *
 * @package CpfaCore
 */

namespace Cpfa\Core\Services;

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * DB Transaction class.
 */
class DB_Transaction {

	/**
	 * Transaction active flag.
	 *
	 * @var bool
	 */
	private static $in_transaction = false;

	/**
	 * Start a database transaction.
	 *
	 * @return bool True on success.
	 */
	public static function begin() {
		global $wpdb;

		if ( self::$in_transaction ) {
			return false; // Already in transaction.
		}

		$wpdb->query( 'START TRANSACTION' );
		self::$in_transaction = true;

		return true;
	}

	/**
	 * Commit the current transaction.
	 *
	 * @return bool True on success.
	 */
	public static function commit() {
		global $wpdb;

		if ( ! self::$in_transaction ) {
			return false;
		}

		$wpdb->query( 'COMMIT' );
		self::$in_transaction = false;

		return true;
	}

	/**
	 * Rollback the current transaction.
	 *
	 * @return bool True on success.
	 */
	public static function rollback() {
		global $wpdb;

		if ( ! self::$in_transaction ) {
			return false;
		}

		$wpdb->query( 'ROLLBACK' );
		self::$in_transaction = false;

		return true;
	}

	/**
	 * Check if currently in transaction.
	 *
	 * @return bool True if in transaction.
	 */
	public static function in_transaction() {
		return self::$in_transaction;
	}

	/**
	 * Execute callback within transaction.
	 *
	 * Automatically commits on success, rolls back on exception.
	 *
	 * @param callable $callback Callback to execute.
	 * @return mixed Callback return value.
	 * @throws \Exception On failure.
	 */
	public static function execute( $callback ) {
		self::begin();

		try {
			$result = $callback();
			self::commit();
			return $result;
		} catch ( \Exception $e ) {
			self::rollback();
			throw $e;
		}
	}

	/**
	 * Execute callback with transaction safety.
	 *
	 * Returns WP_Error on failure instead of throwing exception.
	 *
	 * @param callable $callback Callback to execute.
	 * @return mixed|\WP_Error Callback return value or WP_Error.
	 */
	public static function safe_execute( $callback ) {
		try {
			return self::execute( $callback );
		} catch ( \Exception $e ) {
			return new \WP_Error(
				'transaction_failed',
				$e->getMessage(),
				array( 'exception' => $e )
			);
		}
	}
}
