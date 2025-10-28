<?php
/**
 * Centralized Logging System
 *
 * PSR-3 compatible logging with multiple levels and handlers.
 *
 * @package CpfaCore
 */

namespace Cpfa\Core;

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Logger class.
 */
class Logger {

	// Log levels (PSR-3 compatible).
	const EMERGENCY = 'emergency'; // System is unusable.
	const ALERT     = 'alert';     // Action must be taken immediately.
	const CRITICAL  = 'critical';  // Critical conditions.
	const ERROR     = 'error';     // Error conditions.
	const WARNING   = 'warning';   // Warning conditions.
	const NOTICE    = 'notice';    // Normal but significant condition.
	const INFO      = 'info';      // Informational messages.
	const DEBUG     = 'debug';     // Debug-level messages.

	/**
	 * Log file path.
	 *
	 * @var string
	 */
	private static $log_file = null;

	/**
	 * Minimum log level.
	 *
	 * @var string
	 */
	private static $min_level = self::WARNING;

	/**
	 * Level priorities.
	 *
	 * @var array
	 */
	private static $level_priorities = array(
		self::DEBUG     => 0,
		self::INFO      => 1,
		self::NOTICE    => 2,
		self::WARNING   => 3,
		self::ERROR     => 4,
		self::CRITICAL  => 5,
		self::ALERT     => 6,
		self::EMERGENCY => 7,
	);

	/**
	 * Initialize logger.
	 */
	public static function init() {
		$upload_dir     = wp_upload_dir();
		$log_dir        = $upload_dir['basedir'] . '/cpfa-logs/';

		if ( ! file_exists( $log_dir ) ) {
			wp_mkdir_p( $log_dir );

			// Add .htaccess to protect logs.
			$htaccess_content = "Order deny,allow\nDeny from all";
			file_put_contents( $log_dir . '.htaccess', $htaccess_content );
		}

		self::$log_file = $log_dir . 'cpfa-' . gmdate( 'Y-m-d' ) . '.log';

		// Set minimum level from options or constant.
		if ( defined( 'CPFA_LOG_LEVEL' ) ) {
			self::$min_level = CPFA_LOG_LEVEL;
		} else {
			self::$min_level = get_option( 'cpfa_log_level', self::WARNING );
		}

		// Rotate logs daily.
		add_action( 'cpfa_daily_log_rotation', array( __CLASS__, 'rotate_logs' ) );
		if ( ! wp_next_scheduled( 'cpfa_daily_log_rotation' ) ) {
			wp_schedule_event( time(), 'daily', 'cpfa_daily_log_rotation' );
		}
	}

	/**
	 * Log a message.
	 *
	 * @param string $level   Log level.
	 * @param string $message Message to log.
	 * @param array  $context Context data.
	 * @return bool True on success.
	 */
	public static function log( $level, $message, $context = array() ) {
		// Check if level should be logged.
		if ( ! self::should_log( $level ) ) {
			return false;
		}

		// Format message.
		$formatted_message = self::format_message( $level, $message, $context );

		// Write to file.
		$result = self::write_to_file( $formatted_message );

		// If error or higher, also log to WordPress debug.log.
		if ( self::$level_priorities[ $level ] >= self::$level_priorities[ self::ERROR ] ) {
			error_log( '[CPFA ' . strtoupper( $level ) . '] ' . $message );
		}

		// Fire action for external handlers (e.g., Sentry, Slack).
		do_action( 'cpfa_log', $level, $message, $context );

		return $result;
	}

	/**
	 * Convenience methods for each level.
	 */

	/**
	 * Log emergency message.
	 *
	 * @param string $message Message.
	 * @param array  $context Context.
	 * @return bool Success.
	 */
	public static function emergency( $message, $context = array() ) {
		return self::log( self::EMERGENCY, $message, $context );
	}

	/**
	 * Log alert message.
	 *
	 * @param string $message Message.
	 * @param array  $context Context.
	 * @return bool Success.
	 */
	public static function alert( $message, $context = array() ) {
		return self::log( self::ALERT, $message, $context );
	}

	/**
	 * Log critical message.
	 *
	 * @param string $message Message.
	 * @param array  $context Context.
	 * @return bool Success.
	 */
	public static function critical( $message, $context = array() ) {
		return self::log( self::CRITICAL, $message, $context );
	}

	/**
	 * Log error message.
	 *
	 * @param string $message Message.
	 * @param array  $context Context.
	 * @return bool Success.
	 */
	public static function error( $message, $context = array() ) {
		return self::log( self::ERROR, $message, $context );
	}

	/**
	 * Log warning message.
	 *
	 * @param string $message Message.
	 * @param array  $context Context.
	 * @return bool Success.
	 */
	public static function warning( $message, $context = array() ) {
		return self::log( self::WARNING, $message, $context );
	}

	/**
	 * Log notice message.
	 *
	 * @param string $message Message.
	 * @param array  $context Context.
	 * @return bool Success.
	 */
	public static function notice( $message, $context = array() ) {
		return self::log( self::NOTICE, $message, $context );
	}

	/**
	 * Log info message.
	 *
	 * @param string $message Message.
	 * @param array  $context Context.
	 * @return bool Success.
	 */
	public static function info( $message, $context = array() ) {
		return self::log( self::INFO, $message, $context );
	}

	/**
	 * Log debug message.
	 *
	 * @param string $message Message.
	 * @param array  $context Context.
	 * @return bool Success.
	 */
	public static function debug( $message, $context = array() ) {
		return self::log( self::DEBUG, $message, $context );
	}

	/**
	 * Check if level should be logged.
	 *
	 * @param string $level Level to check.
	 * @return bool True if should log.
	 */
	private static function should_log( $level ) {
		if ( ! isset( self::$level_priorities[ $level ] ) ) {
			return false;
		}

		return self::$level_priorities[ $level ] >= self::$level_priorities[ self::$min_level ];
	}

	/**
	 * Format log message.
	 *
	 * @param string $level   Level.
	 * @param string $message Message.
	 * @param array  $context Context.
	 * @return string Formatted message.
	 */
	private static function format_message( $level, $message, $context ) {
		$timestamp = gmdate( 'Y-m-d H:i:s' );
		$level_str = strtoupper( $level );

		// Replace placeholders in message.
		$message = self::interpolate( $message, $context );

		// Build context string.
		$context_str = '';
		if ( ! empty( $context ) ) {
			$context_str = ' | Context: ' . wp_json_encode( $context, JSON_UNESCAPED_UNICODE );
		}

		// Get user info.
		$user_id = get_current_user_id();
		$user_str = $user_id ? " | User: {$user_id}" : '';

		// Get request info.
		$ip = self::get_client_ip();
		$request_str = " | IP: {$ip}";

		return "[{$timestamp}] [{$level_str}]{$user_str}{$request_str} - {$message}{$context_str}\n";
	}

	/**
	 * Interpolate context values into message placeholders.
	 *
	 * @param string $message Message with {placeholders}.
	 * @param array  $context Context values.
	 * @return string Interpolated message.
	 */
	private static function interpolate( $message, $context ) {
		$replace = array();
		foreach ( $context as $key => $val ) {
			if ( is_scalar( $val ) || ( is_object( $val ) && method_exists( $val, '__toString' ) ) ) {
				$replace[ '{' . $key . '}' ] = $val;
			}
		}
		return strtr( $message, $replace );
	}

	/**
	 * Write message to log file.
	 *
	 * @param string $message Formatted message.
	 * @return bool True on success.
	 */
	private static function write_to_file( $message ) {
		if ( ! self::$log_file ) {
			self::init();
		}

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		$result = file_put_contents( self::$log_file, $message, FILE_APPEND | LOCK_EX );

		return false !== $result;
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
	 * Rotate old log files.
	 *
	 * Keeps logs for 30 days, then deletes them.
	 */
	public static function rotate_logs() {
		$upload_dir = wp_upload_dir();
		$log_dir    = $upload_dir['basedir'] . '/cpfa-logs/';

		if ( ! is_dir( $log_dir ) ) {
			return;
		}

		$files = glob( $log_dir . 'cpfa-*.log' );
		$max_age = 30 * DAY_IN_SECONDS;

		foreach ( $files as $file ) {
			if ( is_file( $file ) && ( time() - filemtime( $file ) ) > $max_age ) {
				wp_delete_file( $file );
			}
		}
	}

	/**
	 * Get recent logs for admin display.
	 *
	 * @param int $lines Number of lines to retrieve.
	 * @return array Log lines.
	 */
	public static function get_recent_logs( $lines = 100 ) {
		if ( ! self::$log_file || ! file_exists( self::$log_file ) ) {
			return array();
		}

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file
		$file_content = file( self::$log_file );

		if ( false === $file_content ) {
			return array();
		}

		return array_slice( $file_content, -$lines );
	}
}
