<?php
/**
 * Settings Handler
 *
 * @package CpfaCore
 */

namespace Cpfa\Core\Settings;

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Settings class.
 */
class Settings {

	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'admin_menu', array( $this, 'add_admin_menu' ), 200 );
		add_action( 'admin_init', array( $this, 'register_settings' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_media' ) );
	}

	/**
	 * Add admin menu.
	 */
	public function add_admin_menu() {
		// Note: The main menu is created by Library_Manager with priority 6.
		// We just add the settings submenus here.

		// General settings.
		add_submenu_page(
			'cpfa-library',
			__( 'Réglages généraux', 'cpfa-core' ),
			__( '⚙️ Réglages généraux', 'cpfa-core' ),
			'manage_options',
			'cpfa-general-settings',
			array( $this, 'render_general_settings_page' )
		);

		// Library settings.
		add_submenu_page(
			'cpfa-library',
			__( 'Réglages Bibliothèque', 'cpfa-core' ),
			__( '📚 Réglages Bibliothèque', 'cpfa-core' ),
			'manage_options',
			'cpfa-library-settings',
			array( $this, 'render_library_settings_page' )
		);

		// Payment settings.
		add_submenu_page(
			'cpfa-library',
			__( 'Réglages Paiements', 'cpfa-core' ),
			__( '💳 Réglages Paiements', 'cpfa-core' ),
			'manage_options',
			'cpfa-payment-settings',
			array( $this, 'render_payment_settings_page' )
		);

		// PDF & QR settings.
		add_submenu_page(
			'cpfa-library',
			__( 'PDF & QR', 'cpfa-core' ),
			__( '📄 PDF & QR', 'cpfa-core' ),
			'manage_options',
			'cpfa-pdf-settings',
			array( $this, 'render_pdf_settings_page' )
		);
	}

	/**
	 * Register settings.
	 */
	public function register_settings() {
		// General settings section.
		register_setting( 'cpfa_general_settings', 'cpfa_logo' );
		register_setting( 'cpfa_general_settings', 'cpfa_coordonnees' );
		register_setting( 'cpfa_general_settings', 'cpfa_email_from_name' );
		register_setting( 'cpfa_general_settings', 'cpfa_email_from_address' );
		register_setting( 'cpfa_general_settings', 'cpfa_rgpd_retention' );
		register_setting( 'cpfa_general_settings', 'cpfa_log_emails' );

		add_settings_section(
			'cpfa_general_section',
			__( 'Identité', 'cpfa-core' ),
			null,
			'cpfa-general-settings'
		);

		add_settings_field(
			'cpfa_logo',
			__( 'Logo', 'cpfa-core' ),
			array( $this, 'render_logo_field' ),
			'cpfa-general-settings',
			'cpfa_general_section'
		);

		add_settings_field(
			'cpfa_coordonnees',
			__( 'Coordonnées', 'cpfa-core' ),
			array( $this, 'render_textarea_field' ),
			'cpfa-general-settings',
			'cpfa_general_section',
			array( 'option_name' => 'cpfa_coordonnees', 'rows' => 4 )
		);

		add_settings_field(
			'cpfa_email_from_name',
			__( 'Nom d\'expéditeur email', 'cpfa-core' ),
			array( $this, 'render_text_field' ),
			'cpfa-general-settings',
			'cpfa_general_section',
			array( 'option_name' => 'cpfa_email_from_name' )
		);

		add_settings_field(
			'cpfa_email_from_address',
			__( 'Adresse email expéditeur', 'cpfa-core' ),
			array( $this, 'render_text_field' ),
			'cpfa-general-settings',
			'cpfa_general_section',
			array( 'option_name' => 'cpfa_email_from_address', 'type' => 'email' )
		);

		add_settings_field(
			'cpfa_log_emails',
			__( 'Logs emails', 'cpfa-core' ),
			array( $this, 'render_checkbox_field' ),
			'cpfa-general-settings',
			'cpfa_general_section',
			array( 'option_name' => 'cpfa_log_emails', 'label' => __( 'Activer les logs d\'emails', 'cpfa-core' ) )
		);

		// Library settings.
		register_setting( 'cpfa_library_settings', 'cpfa_library_tarif_etudiant' );
		register_setting( 'cpfa_library_settings', 'cpfa_library_tarif_pro' );
		register_setting( 'cpfa_library_settings', 'cpfa_library_tarif_emprunt' );
		register_setting( 'cpfa_library_settings', 'cpfa_library_caution' );
		register_setting( 'cpfa_library_settings', 'cpfa_library_penalite_jour' );
		register_setting( 'cpfa_library_settings', 'cpfa_library_penalite_delai' );
		register_setting( 'cpfa_library_settings', 'cpfa_library_duree_emprunt' );
		register_setting( 'cpfa_library_settings', 'cpfa_library_horaires' );

		add_settings_section(
			'cpfa_library_section',
			__( 'Tarifs et règles', 'cpfa-core' ),
			array( $this, 'render_library_section_description' ),
			'cpfa-library-settings'
		);

		add_settings_field(
			'cpfa_library_tarif_etudiant',
			__( 'Tarif étudiant (FCFA)', 'cpfa-core' ),
			array( $this, 'render_number_field' ),
			'cpfa-library-settings',
			'cpfa_library_section',
			array( 'option_name' => 'cpfa_library_tarif_etudiant', 'default' => 10000 )
		);

		add_settings_field(
			'cpfa_library_tarif_pro',
			__( 'Tarif professionnel (FCFA)', 'cpfa-core' ),
			array( $this, 'render_number_field' ),
			'cpfa-library-settings',
			'cpfa_library_section',
			array( 'option_name' => 'cpfa_library_tarif_pro', 'default' => 15000 )
		);

		add_settings_field(
			'cpfa_library_tarif_emprunt',
			__( 'Tarif emprunt domicile (FCFA)', 'cpfa-core' ),
			array( $this, 'render_number_field' ),
			'cpfa-library-settings',
			'cpfa_library_section',
			array( 'option_name' => 'cpfa_library_tarif_emprunt', 'default' => 50000 )
		);

		add_settings_field(
			'cpfa_library_caution',
			__( 'Caution (FCFA)', 'cpfa-core' ),
			array( $this, 'render_number_field' ),
			'cpfa-library-settings',
			'cpfa_library_section',
			array( 'option_name' => 'cpfa_library_caution', 'default' => 35000 )
		);

		add_settings_field(
			'cpfa_library_penalite_jour',
			__( 'Pénalité par jour (FCFA)', 'cpfa-core' ),
			array( $this, 'render_number_field' ),
			'cpfa-library-settings',
			'cpfa_library_section',
			array( 'option_name' => 'cpfa_library_penalite_jour', 'default' => 500 )
		);

		add_settings_field(
			'cpfa_library_penalite_delai',
			__( 'Délai avant pénalité (jours)', 'cpfa-core' ),
			array( $this, 'render_number_field' ),
			'cpfa-library-settings',
			'cpfa_library_section',
			array( 'option_name' => 'cpfa_library_penalite_delai', 'default' => 3 )
		);

		add_settings_field(
			'cpfa_library_duree_emprunt',
			__( 'Durée d\'emprunt (jours)', 'cpfa-core' ),
			array( $this, 'render_number_field' ),
			'cpfa-library-settings',
			'cpfa_library_section',
			array( 'option_name' => 'cpfa_library_duree_emprunt', 'default' => 30 )
		);

		add_settings_field(
			'cpfa_library_horaires',
			__( 'Horaires d\'ouverture', 'cpfa-core' ),
			array( $this, 'render_textarea_field' ),
			'cpfa-library-settings',
			'cpfa_library_section',
			array( 'option_name' => 'cpfa_library_horaires', 'rows' => 4, 'default' => 'Lun-Ven : 08:00-17:00' )
		);

		// Payment settings.
		register_setting( 'cpfa_payment_settings', 'cpfa_active_gateways' );
		register_setting( 'cpfa_payment_settings', 'cpfa_log_payments' );

		add_settings_section(
			'cpfa_payment_section',
			__( 'Configuration des paiements', 'cpfa-core' ),
			array( $this, 'render_payment_section_description' ),
			'cpfa-payment-settings'
		);

		add_settings_field(
			'cpfa_log_payments',
			__( 'Logs paiements', 'cpfa-core' ),
			array( $this, 'render_checkbox_field' ),
			'cpfa-payment-settings',
			'cpfa_payment_section',
			array( 'option_name' => 'cpfa_log_payments', 'label' => __( 'Activer les logs de paiements', 'cpfa-core' ) )
		);

		// PDF settings.
		register_setting( 'cpfa_pdf_settings', 'cpfa_pdf_primary_color' );
		register_setting( 'cpfa_pdf_settings', 'cpfa_pdf_secondary_color' );
		register_setting( 'cpfa_pdf_settings', 'cpfa_pdf_font_family' );

		add_settings_section(
			'cpfa_pdf_section',
			__( 'Configuration PDF', 'cpfa-core' ),
			null,
			'cpfa-pdf-settings'
		);

		add_settings_field(
			'cpfa_pdf_primary_color',
			__( 'Couleur principale', 'cpfa-core' ),
			array( $this, 'render_color_field' ),
			'cpfa-pdf-settings',
			'cpfa_pdf_section',
			array( 'option_name' => 'cpfa_pdf_primary_color', 'default' => '#2c5aa0' )
		);

		add_settings_field(
			'cpfa_pdf_secondary_color',
			__( 'Couleur secondaire', 'cpfa-core' ),
			array( $this, 'render_color_field' ),
			'cpfa-pdf-settings',
			'cpfa_pdf_section',
			array( 'option_name' => 'cpfa_pdf_secondary_color', 'default' => '#f8f9fa' )
		);

		add_settings_field(
			'cpfa_pdf_font_family',
			__( 'Police', 'cpfa-core' ),
			array( $this, 'render_select_field' ),
			'cpfa-pdf-settings',
			'cpfa_pdf_section',
			array(
				'option_name' => 'cpfa_pdf_font_family',
				'options'     => array(
					'dejavusans'     => 'DejaVu Sans',
					'dejavuserif'    => 'DejaVu Serif',
					'notosans'       => 'Noto Sans',
					'freesans'       => 'Free Sans',
				),
				'default'     => 'dejavusans',
			)
		);
	}

	/**
	 * Enqueue media scripts.
	 */
	public function enqueue_media() {
		wp_enqueue_media();
		wp_enqueue_style( 'wp-color-picker' );
	}

	/**
	 * Render dashboard page.
	 */
	public function render_dashboard_page() {
		?>
		<div class="wrap">
			<h1><?php esc_html_e( 'Tableau de bord CPFA', 'cpfa-core' ); ?></h1>

			<div class="cpfa-dashboard-widgets">
				<div class="cpfa-widget">
					<h2><?php esc_html_e( 'Statistiques rapides', 'cpfa-core' ); ?></h2>
					<div class="cpfa-stats">
						<div class="stat-item">
							<?php $formation_count = wp_count_posts( 'cpfa_formation' ); ?>
							<span class="stat-number"><?php echo esc_html( isset( $formation_count->publish ) ? $formation_count->publish : 0 ); ?></span>
							<span class="stat-label"><?php esc_html_e( 'Formations', 'cpfa-core' ); ?></span>
						</div>
						<div class="stat-item">
							<?php $seminaire_count = wp_count_posts( 'cpfa_seminaire' ); ?>
							<span class="stat-number"><?php echo esc_html( isset( $seminaire_count->publish ) ? $seminaire_count->publish : 0 ); ?></span>
							<span class="stat-label"><?php esc_html_e( 'Séminaires', 'cpfa-core' ); ?></span>
						</div>
						<div class="stat-item">
							<?php $ressource_count = wp_count_posts( 'cpfa_ressource' ); ?>
							<span class="stat-number"><?php echo esc_html( isset( $ressource_count->publish ) ? $ressource_count->publish : 0 ); ?></span>
							<span class="stat-label"><?php esc_html_e( 'Ressources', 'cpfa-core' ); ?></span>
						</div>
						<div class="stat-item">
							<?php $abonnement_count = wp_count_posts( 'cpfa_abonnement' ); ?>
							<span class="stat-number"><?php echo esc_html( isset( $abonnement_count->publish ) ? $abonnement_count->publish : 0 ); ?></span>
							<span class="stat-label"><?php esc_html_e( 'Abonnements', 'cpfa-core' ); ?></span>
						</div>
					</div>
				</div>

				<div class="cpfa-widget">
					<h2><?php esc_html_e( 'Liens rapides', 'cpfa-core' ); ?></h2>
					<ul>
						<li><a href="<?php echo esc_url( admin_url( 'post-new.php?post_type=cpfa_formation' ) ); ?>"><?php esc_html_e( 'Ajouter une formation', 'cpfa-core' ); ?></a></li>
						<li><a href="<?php echo esc_url( admin_url( 'post-new.php?post_type=cpfa_seminaire' ) ); ?>"><?php esc_html_e( 'Ajouter un séminaire', 'cpfa-core' ); ?></a></li>
						<li><a href="<?php echo esc_url( admin_url( 'post-new.php?post_type=cpfa_ressource' ) ); ?>"><?php esc_html_e( 'Ajouter une ressource', 'cpfa-core' ); ?></a></li>
						<li><a href="<?php echo esc_url( admin_url( 'admin.php?page=cpfa-general-settings' ) ); ?>"><?php esc_html_e( 'Réglages', 'cpfa-core' ); ?></a></li>
					</ul>
				</div>
			</div>
		</div>
		<?php
	}

	/**
	 * Render general settings page.
	 */
	public function render_general_settings_page() {
		?>
		<div class="wrap">
			<h1><?php echo esc_html( get_admin_page_title() ); ?></h1>
			<form action="options.php" method="post">
				<?php
				settings_fields( 'cpfa_general_settings' );
				do_settings_sections( 'cpfa-general-settings' );
				submit_button();
				?>
			</form>
		</div>
		<?php
	}

	/**
	 * Render library settings page.
	 */
	public function render_library_settings_page() {
		?>
		<div class="wrap">
			<h1><?php echo esc_html( get_admin_page_title() ); ?></h1>
			<form action="options.php" method="post">
				<?php
				settings_fields( 'cpfa_library_settings' );
				do_settings_sections( 'cpfa-library-settings' );
				submit_button();
				?>
			</form>
		</div>
		<?php
	}

	/**
	 * Render payment settings page.
	 */
	public function render_payment_settings_page() {
		?>
		<div class="wrap">
			<h1><?php echo esc_html( get_admin_page_title() ); ?></h1>
			<form action="options.php" method="post">
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
	 * Render PDF settings page.
	 */
	public function render_pdf_settings_page() {
		?>
		<div class="wrap">
			<h1><?php echo esc_html( get_admin_page_title() ); ?></h1>
			<form action="options.php" method="post">
				<?php
				settings_fields( 'cpfa_pdf_settings' );
				do_settings_sections( 'cpfa-pdf-settings' );
				submit_button();
				?>
			</form>
		</div>
		<?php
	}

	/**
	 * Render library section description.
	 */
	public function render_library_section_description() {
		echo '<p>' . esc_html__( 'Configurez les tarifs, pénalités et règles d\'emprunt de la bibliothèque.', 'cpfa-core' ) . '</p>';
	}

	/**
	 * Render payment section description.
	 */
	public function render_payment_section_description() {
		echo '<p>' . esc_html__( 'Les passerelles de paiement seront configurées dans le plugin CPFA Forms & Registrations.', 'cpfa-core' ) . '</p>';
	}

	/**
	 * Render logo field.
	 */
	public function render_logo_field() {
		$value = get_option( 'cpfa_logo', '' );
		?>
		<input type="text" name="cpfa_logo" id="cpfa_logo" value="<?php echo esc_url( $value ); ?>" class="regular-text" />
		<button type="button" class="button cpfa-upload-logo-button"><?php esc_html_e( 'Choisir le logo', 'cpfa-core' ); ?></button>
		<?php if ( $value ) : ?>
			<br><img src="<?php echo esc_url( $value ); ?>" style="max-width: 200px; margin-top: 10px;">
		<?php endif; ?>
		<script>
		jQuery(document).ready(function($) {
			$('.cpfa-upload-logo-button').on('click', function(e) {
				e.preventDefault();
				var button = $(this);
				var field = $('#cpfa_logo');
				var uploader = wp.media({
					title: '<?php esc_html_e( 'Choisir le logo', 'cpfa-core' ); ?>',
					button: { text: '<?php esc_html_e( 'Utiliser cette image', 'cpfa-core' ); ?>' },
					multiple: false
				}).on('select', function() {
					var attachment = uploader.state().get('selection').first().toJSON();
					field.val(attachment.url);
				}).open();
			});
		});
		</script>
		<?php
	}

	/**
	 * Render text field.
	 *
	 * @param array $args Field arguments.
	 */
	public function render_text_field( $args ) {
		$option_name = $args['option_name'];
		$value       = get_option( $option_name, $args['default'] ?? '' );
		$type        = $args['type'] ?? 'text';
		?>
		<input type="<?php echo esc_attr( $type ); ?>" name="<?php echo esc_attr( $option_name ); ?>" value="<?php echo esc_attr( $value ); ?>" class="regular-text" />
		<?php
	}

	/**
	 * Render number field.
	 *
	 * @param array $args Field arguments.
	 */
	public function render_number_field( $args ) {
		$option_name = $args['option_name'];
		$value       = get_option( $option_name, $args['default'] ?? 0 );
		?>
		<input type="number" name="<?php echo esc_attr( $option_name ); ?>" value="<?php echo esc_attr( $value ); ?>" class="regular-text" />
		<?php
	}

	/**
	 * Render textarea field.
	 *
	 * @param array $args Field arguments.
	 */
	public function render_textarea_field( $args ) {
		$option_name = $args['option_name'];
		$value       = get_option( $option_name, $args['default'] ?? '' );
		$rows        = $args['rows'] ?? 5;
		?>
		<textarea name="<?php echo esc_attr( $option_name ); ?>" rows="<?php echo esc_attr( $rows ); ?>" class="large-text"><?php echo esc_textarea( $value ); ?></textarea>
		<?php
	}

	/**
	 * Render checkbox field.
	 *
	 * @param array $args Field arguments.
	 */
	public function render_checkbox_field( $args ) {
		$option_name = $args['option_name'];
		$value       = get_option( $option_name, false );
		$label       = $args['label'] ?? '';
		?>
		<label>
			<input type="checkbox" name="<?php echo esc_attr( $option_name ); ?>" value="1" <?php checked( $value, 1 ); ?> />
			<?php echo esc_html( $label ); ?>
		</label>
		<?php
	}

	/**
	 * Render color field.
	 *
	 * @param array $args Field arguments.
	 */
	public function render_color_field( $args ) {
		$option_name = $args['option_name'];
		$value       = get_option( $option_name, $args['default'] ?? '#000000' );
		?>
		<input type="text" name="<?php echo esc_attr( $option_name ); ?>" value="<?php echo esc_attr( $value ); ?>" class="cpfa-color-picker" />
		<script>
		jQuery(document).ready(function($) {
			$('.cpfa-color-picker').wpColorPicker();
		});
		</script>
		<?php
	}

	/**
	 * Render select field.
	 *
	 * @param array $args Field arguments.
	 */
	public function render_select_field( $args ) {
		$option_name = $args['option_name'];
		$value       = get_option( $option_name, $args['default'] ?? '' );
		$options     = $args['options'] ?? array();
		?>
		<select name="<?php echo esc_attr( $option_name ); ?>" class="regular-text">
			<?php foreach ( $options as $key => $label ) : ?>
				<option value="<?php echo esc_attr( $key ); ?>" <?php selected( $value, $key ); ?>><?php echo esc_html( $label ); ?></option>
			<?php endforeach; ?>
		</select>
		<?php
	}
}
