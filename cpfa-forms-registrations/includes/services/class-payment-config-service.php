<?php
/**
 * Payment Configuration Service.
 *
 * Handles QR code static configuration for Wave and Orange Money.
 *
 * @package CPFA_Forms
 */

namespace Cpfa\Forms\Services;

/**
 * Payment_Config_Service class.
 */
class Payment_Config_Service {

	/**
	 * Single instance.
	 *
	 * @var Payment_Config_Service
	 */
	private static $instance = null;

	/**
	 * Get instance.
	 *
	 * @return Payment_Config_Service
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
		// No hooks needed here, just utility methods.
	}

	/**
	 * Get Wave QR code URL.
	 *
	 * @return string
	 */
	public function get_wave_qr_url() {
		return get_option( 'cpfa_wave_qr_url', '' );
	}

	/**
	 * Get Wave account number.
	 *
	 * @return string
	 */
	public function get_wave_number() {
		return get_option( 'cpfa_wave_number', '' );
	}

	/**
	 * Get Wave account name.
	 *
	 * @return string
	 */
	public function get_wave_account_name() {
		return get_option( 'cpfa_wave_account_name', 'CPFA - Centre de Formation' );
	}

	/**
	 * Get Orange Money QR code URL.
	 *
	 * @return string
	 */
	public function get_om_qr_url() {
		return get_option( 'cpfa_om_qr_url', '' );
	}

	/**
	 * Get Orange Money account number.
	 *
	 * @return string
	 */
	public function get_om_number() {
		return get_option( 'cpfa_om_number', '' );
	}

	/**
	 * Get Orange Money account name.
	 *
	 * @return string
	 */
	public function get_om_account_name() {
		return get_option( 'cpfa_om_account_name', 'CPFA - Centre de Formation' );
	}

	/**
	 * Get payment instructions.
	 *
	 * @return string
	 */
	public function get_payment_instructions() {
		$default = "1. Scannez le QR code avec votre application mobile (Wave ou Orange Money)\n";
		$default .= "2. Saisissez le montant indiqué ci-dessus\n";
		$default .= "3. Confirmez le paiement dans l'application\n";
		$default .= "4. Notez la référence de transaction (vous pourrez la fournir si demandée)\n";
		$default .= '5. Votre préinscription sera validée sous 24-48h ouvrées';

		return get_option( 'cpfa_payment_instructions', $default );
	}

	/**
	 * Get preincription expiration days.
	 *
	 * @return int
	 */
	public function get_preinscription_expire_days() {
		return absint( get_option( 'cpfa_preinscription_expire_days', 7 ) );
	}

	/**
	 * Check if both payment methods are enabled.
	 *
	 * @return bool
	 */
	public function is_both_methods_enabled() {
		return (bool) get_option( 'cpfa_enable_both_methods', true );
	}

	/**
	 * Check if user can enter transaction reference.
	 *
	 * @return bool
	 */
	public function allow_transaction_ref_input() {
		return (bool) get_option( 'cpfa_allow_transaction_ref', false );
	}

	/**
	 * Get all payment methods configuration.
	 *
	 * @return array
	 */
	public function get_all_config() {
		return array(
			'wave'        => array(
				'qr_url'       => $this->get_wave_qr_url(),
				'number'       => $this->get_wave_number(),
				'account_name' => $this->get_wave_account_name(),
			),
			'orange_money' => array(
				'qr_url'       => $this->get_om_qr_url(),
				'number'       => $this->get_om_number(),
				'account_name' => $this->get_om_account_name(),
			),
			'instructions' => $this->get_payment_instructions(),
			'expire_days'  => $this->get_preinscription_expire_days(),
			'both_enabled' => $this->is_both_methods_enabled(),
			'allow_ref'    => $this->allow_transaction_ref_input(),
		);
	}

	/**
	 * Get abonnement prices.
	 *
	 * @return array
	 */
	public function get_abonnement_prices() {
		return array(
			'etudiant'          => 10000,
			'professionnel'     => 15000,
			'emprunt_domicile'  => 50000,
		);
	}

	/**
	 * Get price for a specific abonnement type.
	 *
	 * @param string $type Abonnement type.
	 * @return int
	 */
	public function get_price_for_type( $type ) {
		$prices = $this->get_abonnement_prices();
		return isset( $prices[ $type ] ) ? $prices[ $type ] : 0;
	}

	/**
	 * Format price in FCFA.
	 *
	 * @param int $price Price in FCFA.
	 * @return string
	 */
	public function format_price( $price ) {
		return number_format( $price, 0, ',', ' ' ) . ' FCFA';
	}
}
