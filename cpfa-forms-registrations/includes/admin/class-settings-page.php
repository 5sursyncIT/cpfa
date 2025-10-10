<?php
/**
 * Settings Page Class.
 *
 * Handles the admin settings page for payment configuration.
 *
 * @package CPFA_Forms
 */

namespace Cpfa\Forms\Admin;

/**
 * Settings_Page class.
 */
class Settings_Page {

	/**
	 * Single instance.
	 *
	 * @var Settings_Page
	 */
	private static $instance = null;

	/**
	 * Get instance.
	 *
	 * @return Settings_Page
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
		$this->init_hooks();
	}

	/**
	 * Initialize hooks.
	 */
	private function init_hooks() {
		add_action( 'admin_menu', array( $this, 'add_settings_page' ) );
		add_action( 'admin_init', array( $this, 'register_settings' ) );
	}

	/**
	 * Add settings page to admin menu.
	 */
	public function add_settings_page() {
		add_submenu_page(
			'cpfa-core',
			__( 'Réglages Paiements', 'cpfa-forms' ),
			__( 'Paiements', 'cpfa-forms' ),
			'manage_options',
			'cpfa-payment-settings',
			array( $this, 'render_settings_page' )
		);
	}

	/**
	 * Register settings.
	 */
	public function register_settings() {
		// Register settings group.
		register_setting( 'cpfa_payment_settings', 'cpfa_wave_qr_url' );
		register_setting( 'cpfa_payment_settings', 'cpfa_wave_number' );
		register_setting( 'cpfa_payment_settings', 'cpfa_wave_account_name' );
		register_setting( 'cpfa_payment_settings', 'cpfa_om_qr_url' );
		register_setting( 'cpfa_payment_settings', 'cpfa_om_number' );
		register_setting( 'cpfa_payment_settings', 'cpfa_om_account_name' );
		register_setting( 'cpfa_payment_settings', 'cpfa_payment_instructions' );
		register_setting( 'cpfa_payment_settings', 'cpfa_preinscription_expire_days' );
		register_setting( 'cpfa_payment_settings', 'cpfa_enable_both_methods' );
		register_setting( 'cpfa_payment_settings', 'cpfa_allow_transaction_ref' );
		register_setting( 'cpfa_payment_settings', 'cpfa_admin_email' );
		register_setting( 'cpfa_payment_settings', 'cpfa_contact_email' );
		register_setting( 'cpfa_payment_settings', 'cpfa_contact_telephone' );
		register_setting( 'cpfa_payment_settings', 'cpfa_email_from_name' );
		register_setting( 'cpfa_payment_settings', 'cpfa_email_from_address' );

		// Section: Wave.
		add_settings_section(
			'cpfa_wave_section',
			__( 'Configuration Wave', 'cpfa-forms' ),
			array( $this, 'wave_section_callback' ),
			'cpfa-payment-settings'
		);

		add_settings_field(
			'cpfa_wave_qr_url',
			__( 'QR Code Wave', 'cpfa-forms' ),
			array( $this, 'wave_qr_callback' ),
			'cpfa-payment-settings',
			'cpfa_wave_section'
		);

		add_settings_field(
			'cpfa_wave_number',
			__( 'Numéro Wave', 'cpfa-forms' ),
			array( $this, 'wave_number_callback' ),
			'cpfa-payment-settings',
			'cpfa_wave_section'
		);

		add_settings_field(
			'cpfa_wave_account_name',
			__( 'Nom du compte Wave', 'cpfa-forms' ),
			array( $this, 'wave_account_name_callback' ),
			'cpfa-payment-settings',
			'cpfa_wave_section'
		);

		// Section: Orange Money.
		add_settings_section(
			'cpfa_om_section',
			__( 'Configuration Orange Money', 'cpfa-forms' ),
			array( $this, 'om_section_callback' ),
			'cpfa-payment-settings'
		);

		add_settings_field(
			'cpfa_om_qr_url',
			__( 'QR Code Orange Money', 'cpfa-forms' ),
			array( $this, 'om_qr_callback' ),
			'cpfa-payment-settings',
			'cpfa_om_section'
		);

		add_settings_field(
			'cpfa_om_number',
			__( 'Numéro Orange Money', 'cpfa-forms' ),
			array( $this, 'om_number_callback' ),
			'cpfa-payment-settings',
			'cpfa_om_section'
		);

		add_settings_field(
			'cpfa_om_account_name',
			__( 'Nom du compte Orange Money', 'cpfa-forms' ),
			array( $this, 'om_account_name_callback' ),
			'cpfa-payment-settings',
			'cpfa_om_section'
		);

		// Section: Instructions.
		add_settings_section(
			'cpfa_instructions_section',
			__( 'Instructions de paiement', 'cpfa-forms' ),
			array( $this, 'instructions_section_callback' ),
			'cpfa-payment-settings'
		);

		add_settings_field(
			'cpfa_payment_instructions',
			__( 'Texte des instructions', 'cpfa-forms' ),
			array( $this, 'payment_instructions_callback' ),
			'cpfa-payment-settings',
			'cpfa_instructions_section'
		);

		// Section: Options avancées.
		add_settings_section(
			'cpfa_advanced_section',
			__( 'Options avancées', 'cpfa-forms' ),
			array( $this, 'advanced_section_callback' ),
			'cpfa-payment-settings'
		);

		add_settings_field(
			'cpfa_enable_both_methods',
			__( 'Afficher les deux méthodes', 'cpfa-forms' ),
			array( $this, 'enable_both_methods_callback' ),
			'cpfa-payment-settings',
			'cpfa_advanced_section'
		);

		add_settings_field(
			'cpfa_allow_transaction_ref',
			__( 'Référence de transaction', 'cpfa-forms' ),
			array( $this, 'allow_transaction_ref_callback' ),
			'cpfa-payment-settings',
			'cpfa_advanced_section'
		);

		add_settings_field(
			'cpfa_preinscription_expire_days',
			__( 'Délai d\'expiration', 'cpfa-forms' ),
			array( $this, 'expire_days_callback' ),
			'cpfa-payment-settings',
			'cpfa_advanced_section'
		);

		// Section: Emails.
		add_settings_section(
			'cpfa_email_section',
			__( 'Configuration des emails', 'cpfa-forms' ),
			array( $this, 'email_section_callback' ),
			'cpfa-payment-settings'
		);

		add_settings_field(
			'cpfa_admin_email',
			__( 'Email administrateur', 'cpfa-forms' ),
			array( $this, 'admin_email_callback' ),
			'cpfa-payment-settings',
			'cpfa_email_section'
		);

		add_settings_field(
			'cpfa_email_from',
			__( 'Expéditeur des emails', 'cpfa-forms' ),
			array( $this, 'email_from_callback' ),
			'cpfa-payment-settings',
			'cpfa_email_section'
		);

		add_settings_field(
			'cpfa_contact_info',
			__( 'Informations de contact', 'cpfa-forms' ),
			array( $this, 'contact_info_callback' ),
			'cpfa-payment-settings',
			'cpfa_email_section'
		);
	}

	/**
	 * Render settings page.
	 */
	public function render_settings_page() {
		?>
		<div class="wrap">
			<h1><?php echo esc_html( get_admin_page_title() ); ?></h1>
			<p><?php esc_html_e( 'Configurez les options de paiement hors ligne pour les abonnements bibliothèque.', 'cpfa-forms' ); ?></p>

			<form method="post" action="options.php">
				<?php
				settings_fields( 'cpfa_payment_settings' );
				do_settings_sections( 'cpfa-payment-settings' );
				submit_button();
				?>
			</form>
		</div>
		<?php
	}

	/**
	 * Wave section callback.
	 */
	public function wave_section_callback() {
		echo '<p>' . esc_html__( 'Configurez le QR code et les informations de votre compte Wave.', 'cpfa-forms' ) . '</p>';
	}

	/**
	 * Wave QR callback.
	 */
	public function wave_qr_callback() {
		$url = get_option( 'cpfa_wave_qr_url', '' );
		?>
		<div class="cpfa-qr-upload">
			<input type="hidden" id="cpfa_wave_qr_url" name="cpfa_wave_qr_url" value="<?php echo esc_attr( $url ); ?>">
			<button type="button" class="button cpfa-upload-qr-btn" data-target="cpfa_wave_qr_url">
				<?php esc_html_e( 'Téléverser QR Wave', 'cpfa-forms' ); ?>
			</button>
			<?php if ( $url ) : ?>
				<button type="button" class="button cpfa-remove-qr-btn" data-target="cpfa_wave_qr_url">
					<?php esc_html_e( 'Supprimer', 'cpfa-forms' ); ?>
				</button>
				<div class="cpfa-qr-preview">
					<img src="<?php echo esc_url( $url ); ?>" alt="QR Code Wave" style="max-width: 200px; margin-top: 10px; border: 1px solid #ddd; padding: 5px;">
				</div>
			<?php endif; ?>
			<p class="description"><?php esc_html_e( 'Format : PNG ou JPG, max 2MB', 'cpfa-forms' ); ?></p>
		</div>
		<?php
	}

	/**
	 * Wave number callback.
	 */
	public function wave_number_callback() {
		$value = get_option( 'cpfa_wave_number', '' );
		?>
		<input type="text" id="cpfa_wave_number" name="cpfa_wave_number" value="<?php echo esc_attr( $value ); ?>" placeholder="+221 77 123 45 67" class="regular-text">
		<p class="description"><?php esc_html_e( 'Numéro de téléphone Wave au format international.', 'cpfa-forms' ); ?></p>
		<?php
	}

	/**
	 * Wave account name callback.
	 */
	public function wave_account_name_callback() {
		$value = get_option( 'cpfa_wave_account_name', 'CPFA - Centre de Formation' );
		?>
		<input type="text" id="cpfa_wave_account_name" name="cpfa_wave_account_name" value="<?php echo esc_attr( $value ); ?>" class="regular-text">
		<p class="description"><?php esc_html_e( 'Nom affiché sous le QR code.', 'cpfa-forms' ); ?></p>
		<?php
	}

	/**
	 * Orange Money section callback.
	 */
	public function om_section_callback() {
		echo '<p>' . esc_html__( 'Configurez le QR code et les informations de votre compte Orange Money.', 'cpfa-forms' ) . '</p>';
	}

	/**
	 * Orange Money QR callback.
	 */
	public function om_qr_callback() {
		$url = get_option( 'cpfa_om_qr_url', '' );
		?>
		<div class="cpfa-qr-upload">
			<input type="hidden" id="cpfa_om_qr_url" name="cpfa_om_qr_url" value="<?php echo esc_attr( $url ); ?>">
			<button type="button" class="button cpfa-upload-qr-btn" data-target="cpfa_om_qr_url">
				<?php esc_html_e( 'Téléverser QR Orange Money', 'cpfa-forms' ); ?>
			</button>
			<?php if ( $url ) : ?>
				<button type="button" class="button cpfa-remove-qr-btn" data-target="cpfa_om_qr_url">
					<?php esc_html_e( 'Supprimer', 'cpfa-forms' ); ?>
				</button>
				<div class="cpfa-qr-preview">
					<img src="<?php echo esc_url( $url ); ?>" alt="QR Code Orange Money" style="max-width: 200px; margin-top: 10px; border: 1px solid #ddd; padding: 5px;">
				</div>
			<?php endif; ?>
			<p class="description"><?php esc_html_e( 'Format : PNG ou JPG, max 2MB', 'cpfa-forms' ); ?></p>
		</div>
		<?php
	}

	/**
	 * Orange Money number callback.
	 */
	public function om_number_callback() {
		$value = get_option( 'cpfa_om_number', '' );
		?>
		<input type="text" id="cpfa_om_number" name="cpfa_om_number" value="<?php echo esc_attr( $value ); ?>" placeholder="+221 70 987 65 43" class="regular-text">
		<p class="description"><?php esc_html_e( 'Numéro Orange Money au format international.', 'cpfa-forms' ); ?></p>
		<?php
	}

	/**
	 * Orange Money account name callback.
	 */
	public function om_account_name_callback() {
		$value = get_option( 'cpfa_om_account_name', 'CPFA - Centre de Formation' );
		?>
		<input type="text" id="cpfa_om_account_name" name="cpfa_om_account_name" value="<?php echo esc_attr( $value ); ?>" class="regular-text">
		<p class="description"><?php esc_html_e( 'Nom affiché sous le QR code.', 'cpfa-forms' ); ?></p>
		<?php
	}

	/**
	 * Instructions section callback.
	 */
	public function instructions_section_callback() {
		echo '<p>' . esc_html__( 'Personnalisez les instructions affichées sur le formulaire.', 'cpfa-forms' ); ?></p>
	}

	/**
	 * Payment instructions callback.
	 */
	public function payment_instructions_callback() {
		$default = "1. Scannez le QR code avec votre application mobile (Wave ou Orange Money)\n";
		$default .= "2. Saisissez le montant indiqué ci-dessus\n";
		$default .= "3. Confirmez le paiement dans l'application\n";
		$default .= "4. Notez la référence de transaction (vous pourrez la fournir si demandée)\n";
		$default .= '5. Votre préinscription sera validée sous 24-48h ouvrées';

		$value = get_option( 'cpfa_payment_instructions', $default );
		?>
		<textarea id="cpfa_payment_instructions" name="cpfa_payment_instructions" rows="8" class="large-text"><?php echo esc_textarea( $value ); ?></textarea>
		<p class="description"><?php esc_html_e( 'Instructions affichées sur le formulaire de paiement.', 'cpfa-forms' ); ?></p>
		<?php
	}

	/**
	 * Advanced section callback.
	 */
	public function advanced_section_callback() {
		echo '<p>' . esc_html__( 'Options de configuration avancées.', 'cpfa-forms' ); ?></p>
	}

	/**
	 * Enable both methods callback.
	 */
	public function enable_both_methods_callback() {
		$value = get_option( 'cpfa_enable_both_methods', true );
		?>
		<label>
			<input type="checkbox" id="cpfa_enable_both_methods" name="cpfa_enable_both_methods" value="1" <?php checked( $value, true ); ?>>
			<?php esc_html_e( 'Afficher Wave et Orange Money simultanément', 'cpfa-forms' ); ?>
		</label>
		<p class="description"><?php esc_html_e( 'Décochez pour n\'afficher qu\'une seule méthode.', 'cpfa-forms' ); ?></p>
		<?php
	}

	/**
	 * Allow transaction ref callback.
	 */
	public function allow_transaction_ref_callback() {
		$value = get_option( 'cpfa_allow_transaction_ref', false );
		?>
		<label>
			<input type="checkbox" id="cpfa_allow_transaction_ref" name="cpfa_allow_transaction_ref" value="1" <?php checked( $value, true ); ?>>
			<?php esc_html_e( 'Permettre à l\'utilisateur de saisir la référence de transaction', 'cpfa-forms' ); ?>
		</label>
		<p class="description"><?php esc_html_e( 'Affiche un champ optionnel pour la référence.', 'cpfa-forms' ); ?></p>
		<?php
	}

	/**
	 * Expire days callback.
	 */
	public function expire_days_callback() {
		$value = get_option( 'cpfa_preinscription_expire_days', 7 );
		?>
		<input type="number" id="cpfa_preinscription_expire_days" name="cpfa_preinscription_expire_days" value="<?php echo esc_attr( $value ); ?>" min="1" max="30" class="small-text">
		<?php esc_html_e( 'jours', 'cpfa-forms' ); ?>
		<p class="description"><?php esc_html_e( 'Délai avant expiration automatique des préinscriptions non validées.', 'cpfa-forms' ); ?></p>
		<?php
	}

	/**
	 * Email section callback.
	 */
	public function email_section_callback() {
		echo '<p>' . esc_html__( 'Configurez les emails de notification.', 'cpfa-forms' ); ?></p>
	}

	/**
	 * Admin email callback.
	 */
	public function admin_email_callback() {
		$value = get_option( 'cpfa_admin_email', get_option( 'admin_email' ) );
		?>
		<input type="email" id="cpfa_admin_email" name="cpfa_admin_email" value="<?php echo esc_attr( $value ); ?>" class="regular-text">
		<p class="description"><?php esc_html_e( 'Email qui recevra les notifications de nouvelles préinscriptions.', 'cpfa-forms' ); ?></p>
		<?php
	}

	/**
	 * Email from callback.
	 */
	public function email_from_callback() {
		$from_name    = get_option( 'cpfa_email_from_name', 'CPFA Bibliothèque' );
		$from_address = get_option( 'cpfa_email_from_address', get_option( 'admin_email' ) );
		?>
		<p>
			<label>
				<?php esc_html_e( 'Nom :', 'cpfa-forms' ); ?>
				<input type="text" id="cpfa_email_from_name" name="cpfa_email_from_name" value="<?php echo esc_attr( $from_name ); ?>" class="regular-text">
			</label>
		</p>
		<p>
			<label>
				<?php esc_html_e( 'Email :', 'cpfa-forms' ); ?>
				<input type="email" id="cpfa_email_from_address" name="cpfa_email_from_address" value="<?php echo esc_attr( $from_address ); ?>" class="regular-text">
			</label>
		</p>
		<p class="description"><?php esc_html_e( 'Expéditeur affiché dans les emails envoyés aux utilisateurs.', 'cpfa-forms' ); ?></p>
		<?php
	}

	/**
	 * Contact info callback.
	 */
	public function contact_info_callback() {
		$contact_email = get_option( 'cpfa_contact_email', get_option( 'admin_email' ) );
		$contact_tel   = get_option( 'cpfa_contact_telephone', '+221 33 XXX XX XX' );
		?>
		<p>
			<label>
				<?php esc_html_e( 'Email de contact :', 'cpfa-forms' ); ?>
				<input type="email" id="cpfa_contact_email" name="cpfa_contact_email" value="<?php echo esc_attr( $contact_email ); ?>" class="regular-text">
			</label>
		</p>
		<p>
			<label>
				<?php esc_html_e( 'Téléphone :', 'cpfa-forms' ); ?>
				<input type="text" id="cpfa_contact_telephone" name="cpfa_contact_telephone" value="<?php echo esc_attr( $contact_tel ); ?>" class="regular-text">
			</label>
		</p>
		<p class="description"><?php esc_html_e( 'Coordonnées affichées dans les emails en cas de problème.', 'cpfa-forms' ); ?></p>
		<?php
	}
}
