<?php
/**
 * Configuration Constants
 *
 * Centralized configuration management to avoid magic numbers
 * and provide a single source of truth for system settings.
 *
 * @package CpfaCore
 */

namespace Cpfa\Core;

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Config class.
 */
class Config {

	// === Library Configuration ===
	const LOAN_DURATION_DAYS = 30;
	const GRACE_PERIOD_DAYS = 3;
	const PENALTY_RATE_PER_DAY = 500; // FCFA
	const MAX_SIMULTANEOUS_LOANS = 5;
	const MAX_RENEWAL_COUNT = 2;

	// === Cache Configuration ===
	const CACHE_TTL_SHORT = 300;   // 5 minutes
	const CACHE_TTL_MEDIUM = 1800; // 30 minutes
	const CACHE_TTL_LONG = 3600;   // 1 hour
	const CACHE_TTL_DAY = 86400;   // 24 hours

	// === Rate Limiting Configuration ===
	const RATE_LIMIT_REST_API = 60;     // 60 requests per minute
	const RATE_LIMIT_AJAX = 30;         // 30 requests per minute
	const RATE_LIMIT_LOGIN = 5;         // 5 attempts per 15 minutes
	const RATE_LIMIT_SEARCH = 20;       // 20 searches per minute

	// === Notification Configuration ===
	const REMINDER_BEFORE_DUE_DAYS = 3;  // Reminder 3 days before due
	const REMINDER_AFTER_DUE_DAYS = 1;   // Reminder 1 day after due
	const REMINDER_FINAL_DAYS = 4;       // Final reminder 4 days after due

	// === Subscription Configuration ===
	const SUBSCRIPTION_REMINDER_30_DAYS = 30;
	const SUBSCRIPTION_REMINDER_7_DAYS = 7;
	const SUBSCRIPTION_REMINDER_1_DAY = 1;
	const PREINSCRIPTION_EXPIRY_DAYS = 7;

	// === Security Configuration ===
	const TOKEN_LENGTH = 64;
	const TOKEN_EXPIRY_HOURS = 24;
	const MAX_UPLOAD_SIZE_MB = 5;
	const ALLOWED_UPLOAD_TYPES = array( 'jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx' );

	// === Pagination Configuration ===
	const DEFAULT_ITEMS_PER_PAGE = 10;
	const MAX_ITEMS_PER_PAGE = 100;

	// === QR Code Configuration ===
	const QR_CODE_SIZE_DEFAULT = 300;
	const QR_CODE_SIZE_SMALL = 150;
	const QR_CODE_SIZE_LARGE = 500;
	const QR_CODE_MARGIN = 10;

	// === Status Values ===
	const STATUS_ACTIVE = 'actif';
	const STATUS_INACTIVE = 'inactif';
	const STATUS_EXPIRED = 'expire';
	const STATUS_SUSPENDED = 'suspendu';
	const STATUS_AWAITING_VALIDATION = 'awaiting_validation';

	const LOAN_STATUS_ACTIVE = 'en_cours';
	const LOAN_STATUS_RETURNED = 'termine';
	const LOAN_STATUS_OVERDUE = 'en_retard';

	const RESOURCE_STATUS_AVAILABLE = 'disponible';
	const RESOURCE_STATUS_BORROWED = 'emprunte';
	const RESOURCE_STATUS_RESERVED = 'reserve';

	/**
	 * Get loan duration in seconds.
	 *
	 * @return int Duration in seconds.
	 */
	public static function get_loan_duration_seconds() {
		return self::LOAN_DURATION_DAYS * DAY_IN_SECONDS;
	}

	/**
	 * Get grace period in seconds.
	 *
	 * @return int Grace period in seconds.
	 */
	public static function get_grace_period_seconds() {
		return self::GRACE_PERIOD_DAYS * DAY_IN_SECONDS;
	}

	/**
	 * Calculate penalty for given days overdue.
	 *
	 * @param int $days_overdue Number of days overdue.
	 * @return int Penalty amount.
	 */
	public static function calculate_penalty( $days_overdue ) {
		if ( $days_overdue <= self::GRACE_PERIOD_DAYS ) {
			return 0;
		}

		$penalty_days = $days_overdue - self::GRACE_PERIOD_DAYS;
		return $penalty_days * self::PENALTY_RATE_PER_DAY;
	}

	/**
	 * Get configuration value with filter support.
	 *
	 * @param string $key     Configuration key (class constant name).
	 * @param mixed  $default Default value if not found.
	 * @return mixed Configuration value.
	 */
	public static function get( $key, $default = null ) {
		if ( defined( 'self::' . $key ) ) {
			$value = constant( 'self::' . $key );
		} else {
			$value = $default;
		}

		return apply_filters( 'cpfa_config_get_' . strtolower( $key ), $value );
	}

	/**
	 * Check if upload file type is allowed.
	 *
	 * @param string $file_extension File extension.
	 * @return bool True if allowed.
	 */
	public static function is_upload_type_allowed( $file_extension ) {
		return in_array( strtolower( $file_extension ), self::ALLOWED_UPLOAD_TYPES, true );
	}

	/**
	 * Get max upload size in bytes.
	 *
	 * @return int Max size in bytes.
	 */
	public static function get_max_upload_size_bytes() {
		return self::MAX_UPLOAD_SIZE_MB * 1024 * 1024;
	}
}
