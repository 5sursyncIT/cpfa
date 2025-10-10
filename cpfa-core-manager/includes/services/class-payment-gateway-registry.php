<?php
/**
 * Payment Gateway Registry
 *
 * @package CpfaCore
 */

namespace Cpfa\Core\Services;

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Payment Gateway Interface.
 */
interface Gateway_Interface {
	/**
	 * Create payment.
	 *
	 * @param array $data Payment data.
	 * @return array Payment result.
	 */
	public function create_payment( $data );

	/**
	 * Verify webhook signature.
	 *
	 * @param string $payload   Webhook payload.
	 * @param string $signature Signature to verify.
	 * @return bool True if valid.
	 */
	public function verify_webhook( $payload, $signature );

	/**
	 * Get payment status.
	 *
	 * @param string $transaction_id Transaction ID.
	 * @return string Status (pending, paid, failed, expired).
	 */
	public function get_status( $transaction_id );

	/**
	 * Process refund.
	 *
	 * @param string $transaction_id Transaction ID.
	 * @param float  $amount         Refund amount.
	 * @return array Refund result.
	 */
	public function refund( $transaction_id, $amount );

	/**
	 * Parse webhook event.
	 *
	 * @param string $payload Webhook payload.
	 * @return array Event data.
	 */
	public function parse_event( $payload );

	/**
	 * Get gateway name.
	 *
	 * @return string Gateway name.
	 */
	public function get_name();

	/**
	 * Get gateway slug.
	 *
	 * @return string Gateway slug.
	 */
	public function get_slug();
}

/**
 * Payment Gateway Registry class.
 */
class Payment_Gateway_Registry {

	/**
	 * Registered gateways.
	 *
	 * @var array
	 */
	private static $gateways = array();

	/**
	 * Register a gateway.
	 *
	 * @param Gateway_Interface $gateway Gateway instance.
	 */
	public static function register( Gateway_Interface $gateway ) {
		self::$gateways[ $gateway->get_slug() ] = $gateway;
	}

	/**
	 * Get a gateway by slug.
	 *
	 * @param string $slug Gateway slug.
	 * @return Gateway_Interface|null Gateway instance or null.
	 */
	public static function get( $slug ) {
		return isset( self::$gateways[ $slug ] ) ? self::$gateways[ $slug ] : null;
	}

	/**
	 * Get all registered gateways.
	 *
	 * @return array Array of gateways.
	 */
	public static function get_all() {
		return self::$gateways;
	}

	/**
	 * Get active gateways.
	 *
	 * @return array Array of active gateways.
	 */
	public static function get_active() {
		$active_slugs = get_option( 'cpfa_active_gateways', array() );
		$active       = array();

		foreach ( $active_slugs as $slug ) {
			if ( isset( self::$gateways[ $slug ] ) ) {
				$active[ $slug ] = self::$gateways[ $slug ];
			}
		}

		return $active;
	}

	/**
	 * Check if gateway is registered.
	 *
	 * @param string $slug Gateway slug.
	 * @return bool True if registered.
	 */
	public static function is_registered( $slug ) {
		return isset( self::$gateways[ $slug ] );
	}

	/**
	 * Unregister a gateway.
	 *
	 * @param string $slug Gateway slug.
	 */
	public static function unregister( $slug ) {
		if ( isset( self::$gateways[ $slug ] ) ) {
			unset( self::$gateways[ $slug ] );
		}
	}

	/**
	 * Get gateway choices for settings.
	 *
	 * @return array Gateway choices.
	 */
	public static function get_gateway_choices() {
		$choices = array();

		foreach ( self::$gateways as $slug => $gateway ) {
			$choices[ $slug ] = $gateway->get_name();
		}

		return $choices;
	}
}

/**
 * Abstract Gateway base class.
 */
abstract class Abstract_Gateway implements Gateway_Interface {

	/**
	 * Gateway configuration.
	 *
	 * @var array
	 */
	protected $config = array();

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->load_config();
	}

	/**
	 * Load gateway configuration.
	 */
	protected function load_config() {
		$slug         = $this->get_slug();
		$this->config = array(
			'enabled'    => get_option( "cpfa_gateway_{$slug}_enabled", false ),
			'test_mode'  => get_option( "cpfa_gateway_{$slug}_test_mode", true ),
			'public_key' => get_option( "cpfa_gateway_{$slug}_public_key", '' ),
			'secret_key' => get_option( "cpfa_gateway_{$slug}_secret_key", '' ),
		);
	}

	/**
	 * Check if gateway is enabled.
	 *
	 * @return bool True if enabled.
	 */
	public function is_enabled() {
		return ! empty( $this->config['enabled'] );
	}

	/**
	 * Check if in test mode.
	 *
	 * @return bool True if test mode.
	 */
	public function is_test_mode() {
		return ! empty( $this->config['test_mode'] );
	}

	/**
	 * Get API key based on mode.
	 *
	 * @param string $type Key type (public or secret).
	 * @return string API key.
	 */
	protected function get_api_key( $type = 'secret' ) {
		$key_name = $type . '_key';
		if ( $this->is_test_mode() ) {
			return get_option( "cpfa_gateway_{$this->get_slug()}_test_{$key_name}", '' );
		}
		return isset( $this->config[ $key_name ] ) ? $this->config[ $key_name ] : '';
	}

	/**
	 * Make API request.
	 *
	 * @param string $endpoint API endpoint.
	 * @param array  $data     Request data.
	 * @param string $method   HTTP method.
	 * @return array|WP_Error Response or error.
	 */
	protected function api_request( $endpoint, $data = array(), $method = 'POST' ) {
		$url = $this->get_api_url() . $endpoint;

		$args = array(
			'method'  => $method,
			'headers' => $this->get_api_headers(),
			'timeout' => 30,
		);

		if ( 'POST' === $method || 'PUT' === $method ) {
			$args['body'] = wp_json_encode( $data );
		}

		$response = wp_remote_request( $url, $args );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$body = wp_remote_retrieve_body( $response );
		return json_decode( $body, true );
	}

	/**
	 * Get API URL.
	 *
	 * @return string API URL.
	 */
	abstract protected function get_api_url();

	/**
	 * Get API headers.
	 *
	 * @return array Headers.
	 */
	abstract protected function get_api_headers();

	/**
	 * Log gateway activity.
	 *
	 * @param string $message Log message.
	 * @param string $level   Log level (info, error).
	 */
	protected function log( $message, $level = 'info' ) {
		if ( get_option( 'cpfa_log_payments', false ) ) {
			$log_entry = sprintf(
				'[%s] [%s] %s: %s',
				current_time( 'Y-m-d H:i:s' ),
				strtoupper( $level ),
				$this->get_name(),
				$message
			);
			error_log( $log_entry );
		}
	}
}
