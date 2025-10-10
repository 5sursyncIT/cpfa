<?php
/**
 * Abonnement Form Class.
 *
 * Handles the display of the subscription form with shortcode [cpfa_abonnement_form].
 *
 * @package CPFA_Forms
 */

namespace Cpfa\Forms;

use Cpfa\Forms\Services\Payment_Config_Service;

/**
 * Abonnement_Form class.
 */
class Abonnement_Form {

	/**
	 * Single instance.
	 *
	 * @var Abonnement_Form
	 */
	private static $instance = null;

	/**
	 * Payment config service.
	 *
	 * @var Payment_Config_Service
	 */
	private $payment_config;

	/**
	 * Get instance.
	 *
	 * @return Abonnement_Form
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
		$this->payment_config = Payment_Config_Service::get_instance();
		$this->init_hooks();
	}

	/**
	 * Initialize hooks.
	 */
	private function init_hooks() {
		add_shortcode( 'cpfa_abonnement_form', array( $this, 'render_form' ) );
	}

	/**
	 * Render the subscription form.
	 *
	 * @param array $atts Shortcode attributes.
	 * @return string
	 */
	public function render_form( $atts ) {
		// Parse shortcode attributes.
		$atts = shortcode_atts(
			array(
				'title' => __( 'Formulaire d\'abonnement bibliothèque', 'cpfa-forms' ),
				'show_title' => 'yes',
			),
			$atts,
			'cpfa_abonnement_form'
		);

		// Get payment configuration.
		$prices = $this->payment_config->get_abonnement_prices();
		$wave_qr = $this->payment_config->get_wave_qr_url();
		$wave_number = $this->payment_config->get_wave_number();
		$wave_name = $this->payment_config->get_wave_account_name();
		$om_qr = $this->payment_config->get_om_qr_url();
		$om_number = $this->payment_config->get_om_number();
		$om_name = $this->payment_config->get_om_account_name();
		$instructions = $this->payment_config->get_payment_instructions();
		$both_methods = $this->payment_config->is_both_methods_enabled();
		$allow_ref = $this->payment_config->allow_transaction_ref_input();

		// Start output buffering.
		ob_start();
		?>

		<div class="cpfa-abonnement-form-container">
			<?php if ( 'yes' === $atts['show_title'] ) : ?>
				<h2 class="cpfa-form-title"><?php echo esc_html( $atts['title'] ); ?></h2>
			<?php endif; ?>

			<div id="cpfa-form-messages"></div>

			<form id="cpfa-abonnement-form" class="cpfa-form" enctype="multipart/form-data" method="post">
				<?php wp_nonce_field( 'cpfa_submit_abonnement', 'cpfa_abonnement_nonce' ); ?>

				<!-- Section: Informations personnelles -->
				<div class="cpfa-form-section">
					<h3 class="cpfa-section-title"><?php esc_html_e( 'Informations personnelles', 'cpfa-forms' ); ?></h3>

					<div class="cpfa-form-row">
						<div class="cpfa-form-field cpfa-field-half">
							<label for="cpfa_nom">
								<?php esc_html_e( 'Nom', 'cpfa-forms' ); ?>
								<span class="cpfa-required">*</span>
							</label>
							<input type="text" id="cpfa_nom" name="cpfa_nom" required>
						</div>

						<div class="cpfa-form-field cpfa-field-half">
							<label for="cpfa_prenom">
								<?php esc_html_e( 'Prénom', 'cpfa-forms' ); ?>
								<span class="cpfa-required">*</span>
							</label>
							<input type="text" id="cpfa_prenom" name="cpfa_prenom" required>
						</div>
					</div>

					<div class="cpfa-form-row">
						<div class="cpfa-form-field cpfa-field-half">
							<label for="cpfa_email">
								<?php esc_html_e( 'Email', 'cpfa-forms' ); ?>
								<span class="cpfa-required">*</span>
							</label>
							<input type="email" id="cpfa_email" name="cpfa_email" required>
						</div>

						<div class="cpfa-form-field cpfa-field-half">
							<label for="cpfa_telephone">
								<?php esc_html_e( 'Téléphone', 'cpfa-forms' ); ?>
								<span class="cpfa-required">*</span>
							</label>
							<input type="tel" id="cpfa_telephone" name="cpfa_telephone" placeholder="+221 77 123 45 67" required>
						</div>
					</div>
				</div>

				<!-- Section: Type d'abonnement -->
				<div class="cpfa-form-section">
					<h3 class="cpfa-section-title"><?php esc_html_e( 'Type d\'abonnement', 'cpfa-forms' ); ?></h3>

					<div class="cpfa-form-field">
						<div class="cpfa-radio-group">
							<label class="cpfa-radio-option">
								<input type="radio" name="cpfa_type" value="etudiant" data-price="<?php echo esc_attr( $prices['etudiant'] ); ?>" required>
								<span class="cpfa-radio-label">
									<strong><?php esc_html_e( 'Étudiant', 'cpfa-forms' ); ?></strong>
									- <?php echo esc_html( $this->payment_config->format_price( $prices['etudiant'] ) ); ?>
								</span>
							</label>

							<label class="cpfa-radio-option">
								<input type="radio" name="cpfa_type" value="professionnel" data-price="<?php echo esc_attr( $prices['professionnel'] ); ?>" required>
								<span class="cpfa-radio-label">
									<strong><?php esc_html_e( 'Professionnel', 'cpfa-forms' ); ?></strong>
									- <?php echo esc_html( $this->payment_config->format_price( $prices['professionnel'] ) ); ?>
								</span>
							</label>

							<label class="cpfa-radio-option">
								<input type="radio" name="cpfa_type" value="emprunt_domicile" data-price="<?php echo esc_attr( $prices['emprunt_domicile'] ); ?>" required>
								<span class="cpfa-radio-label">
									<strong><?php esc_html_e( 'Emprunt à domicile', 'cpfa-forms' ); ?></strong>
									- <?php echo esc_html( $this->payment_config->format_price( $prices['emprunt_domicile'] ) ); ?>
									<small><?php esc_html_e( '(inclut 35 000 FCFA de caution)', 'cpfa-forms' ); ?></small>
								</span>
							</label>
						</div>

						<div class="cpfa-price-display">
							<span class="cpfa-price-label"><?php esc_html_e( 'Montant à payer :', 'cpfa-forms' ); ?></span>
							<span id="cpfa-amount-display" class="cpfa-price-amount">-</span>
						</div>
					</div>
				</div>

				<!-- Section: Documents requis -->
				<div class="cpfa-form-section">
					<h3 class="cpfa-section-title"><?php esc_html_e( 'Documents requis', 'cpfa-forms' ); ?></h3>

					<div class="cpfa-form-field">
						<label for="cpfa_photo">
							<?php esc_html_e( 'Photo d\'identité', 'cpfa-forms' ); ?>
							<span class="cpfa-required">*</span>
						</label>
						<input type="file" id="cpfa_photo" name="cpfa_photo" accept=".jpg,.jpeg,.png" required>
						<small class="cpfa-field-help">
							<?php esc_html_e( 'Format : JPG ou PNG. Taille max : 2 MB.', 'cpfa-forms' ); ?>
						</small>
					</div>

					<div class="cpfa-form-field">
						<label for="cpfa_cni">
							<?php esc_html_e( 'Copie de la CNI', 'cpfa-forms' ); ?>
							<span class="cpfa-required">*</span>
						</label>
						<input type="file" id="cpfa_cni" name="cpfa_cni" accept=".pdf,.jpg,.jpeg,.png" required>
						<small class="cpfa-field-help">
							<?php esc_html_e( 'Format : PDF, JPG ou PNG. Taille max : 5 MB.', 'cpfa-forms' ); ?>
						</small>
					</div>
				</div>

				<!-- Section: Paiement -->
				<div class="cpfa-form-section">
					<h3 class="cpfa-section-title"><?php esc_html_e( 'Paiement', 'cpfa-forms' ); ?></h3>

					<div class="cpfa-payment-instructions">
						<?php echo wp_kses_post( nl2br( $instructions ) ); ?>
					</div>

					<div class="cpfa-payment-methods">
						<?php if ( $both_methods && ! empty( $wave_qr ) && ! empty( $om_qr ) ) : ?>
							<!-- Both payment methods -->
							<div class="cpfa-payment-method cpfa-payment-wave">
								<h4><?php esc_html_e( 'Wave', 'cpfa-forms' ); ?></h4>
								<?php if ( ! empty( $wave_qr ) ) : ?>
									<img src="<?php echo esc_url( $wave_qr ); ?>" alt="<?php esc_attr_e( 'QR Code Wave', 'cpfa-forms' ); ?>" class="cpfa-qr-code">
								<?php endif; ?>
								<?php if ( ! empty( $wave_number ) ) : ?>
									<p class="cpfa-payment-info">
										<strong><?php esc_html_e( 'Numéro :', 'cpfa-forms' ); ?></strong>
										<?php echo esc_html( $wave_number ); ?>
									</p>
								<?php endif; ?>
								<?php if ( ! empty( $wave_name ) ) : ?>
									<p class="cpfa-payment-info">
										<strong><?php esc_html_e( 'Nom :', 'cpfa-forms' ); ?></strong>
										<?php echo esc_html( $wave_name ); ?>
									</p>
								<?php endif; ?>
							</div>

							<div class="cpfa-payment-method cpfa-payment-om">
								<h4><?php esc_html_e( 'Orange Money', 'cpfa-forms' ); ?></h4>
								<?php if ( ! empty( $om_qr ) ) : ?>
									<img src="<?php echo esc_url( $om_qr ); ?>" alt="<?php esc_attr_e( 'QR Code Orange Money', 'cpfa-forms' ); ?>" class="cpfa-qr-code">
								<?php endif; ?>
								<?php if ( ! empty( $om_number ) ) : ?>
									<p class="cpfa-payment-info">
										<strong><?php esc_html_e( 'Numéro :', 'cpfa-forms' ); ?></strong>
										<?php echo esc_html( $om_number ); ?>
									</p>
								<?php endif; ?>
								<?php if ( ! empty( $om_name ) ) : ?>
									<p class="cpfa-payment-info">
										<strong><?php esc_html_e( 'Nom :', 'cpfa-forms' ); ?></strong>
										<?php echo esc_html( $om_name ); ?>
									</p>
								<?php endif; ?>
							</div>
						<?php elseif ( ! empty( $wave_qr ) ) : ?>
							<!-- Wave only -->
							<div class="cpfa-payment-method cpfa-payment-wave cpfa-payment-single">
								<h4><?php esc_html_e( 'Wave', 'cpfa-forms' ); ?></h4>
								<img src="<?php echo esc_url( $wave_qr ); ?>" alt="<?php esc_attr_e( 'QR Code Wave', 'cpfa-forms' ); ?>" class="cpfa-qr-code">
								<?php if ( ! empty( $wave_number ) ) : ?>
									<p class="cpfa-payment-info">
										<strong><?php esc_html_e( 'Numéro :', 'cpfa-forms' ); ?></strong>
										<?php echo esc_html( $wave_number ); ?>
									</p>
								<?php endif; ?>
								<?php if ( ! empty( $wave_name ) ) : ?>
									<p class="cpfa-payment-info">
										<strong><?php esc_html_e( 'Nom :', 'cpfa-forms' ); ?></strong>
										<?php echo esc_html( $wave_name ); ?>
									</p>
								<?php endif; ?>
							</div>
						<?php elseif ( ! empty( $om_qr ) ) : ?>
							<!-- Orange Money only -->
							<div class="cpfa-payment-method cpfa-payment-om cpfa-payment-single">
								<h4><?php esc_html_e( 'Orange Money', 'cpfa-forms' ); ?></h4>
								<img src="<?php echo esc_url( $om_qr ); ?>" alt="<?php esc_attr_e( 'QR Code Orange Money', 'cpfa-forms' ); ?>" class="cpfa-qr-code">
								<?php if ( ! empty( $om_number ) ) : ?>
									<p class="cpfa-payment-info">
										<strong><?php esc_html_e( 'Numéro :', 'cpfa-forms' ); ?></strong>
										<?php echo esc_html( $om_number ); ?>
									</p>
								<?php endif; ?>
								<?php if ( ! empty( $om_name ) ) : ?>
									<p class="cpfa-payment-info">
										<strong><?php esc_html_e( 'Nom :', 'cpfa-forms' ); ?></strong>
										<?php echo esc_html( $om_name ); ?>
									</p>
								<?php endif; ?>
							</div>
						<?php endif; ?>
					</div>

					<?php if ( $allow_ref ) : ?>
						<div class="cpfa-form-field">
							<label for="cpfa_transaction_ref">
								<?php esc_html_e( 'Référence de transaction (optionnel)', 'cpfa-forms' ); ?>
							</label>
							<input type="text" id="cpfa_transaction_ref" name="cpfa_transaction_ref" placeholder="<?php esc_attr_e( 'Ex: WAV123456789', 'cpfa-forms' ); ?>">
							<small class="cpfa-field-help">
								<?php esc_html_e( 'Si vous avez déjà effectué le paiement, vous pouvez indiquer la référence ici.', 'cpfa-forms' ); ?>
							</small>
						</div>
					<?php endif; ?>
				</div>

				<!-- Section: RGPD -->
				<div class="cpfa-form-section">
					<div class="cpfa-form-field">
						<label class="cpfa-checkbox-label">
							<input type="checkbox" name="cpfa_consent_rgpd" required>
							<span>
								<?php
								printf(
									/* translators: %1$s: opening link tag, %2$s: closing link tag */
									esc_html__( 'J\'accepte que mes données personnelles soient collectées et traitées conformément à la %1$spolitique de confidentialité%2$s.', 'cpfa-forms' ),
									'<a href="' . esc_url( get_privacy_policy_url() ) . '" target="_blank">',
									'</a>'
								);
								?>
								<span class="cpfa-required">*</span>
							</span>
						</label>
					</div>

					<div class="cpfa-form-field">
						<label class="cpfa-checkbox-label">
							<input type="checkbox" name="cpfa_consent_photo" required>
							<span>
								<?php esc_html_e( 'J\'autorise l\'utilisation de ma photo pour la carte d\'abonné.', 'cpfa-forms' ); ?>
								<span class="cpfa-required">*</span>
							</span>
						</label>
					</div>
				</div>

				<!-- Submit button -->
				<div class="cpfa-form-actions">
					<button type="submit" id="cpfa-submit-btn" class="cpfa-submit-button">
						<?php esc_html_e( 'Soumettre ma demande', 'cpfa-forms' ); ?>
					</button>
				</div>
			</form>
		</div>

		<?php
		return ob_get_clean();
	}
}
