<?php
/**
 * Plugin Name: CPFA Forms & Registrations
 * Plugin URI: https://cpfa.sn
 * Description: Gestion des formulaires d'inscription, paiements hors ligne et validation manuelle pour CPFA
 * Version: 1.0.0
 * Author: CPFA Development Team
 * Author URI: https://cpfa.sn
 * Text Domain: cpfa-forms
 * Domain Path: /languages
 * Requires at least: 6.0
 * Requires PHP: 8.0
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 *
 * @package CPFA_Forms
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Define plugin constants.
define( 'CPFA_FORMS_VERSION', '1.0.0' );
define( 'CPFA_FORMS_PLUGIN_FILE', __FILE__ );
define( 'CPFA_FORMS_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'CPFA_FORMS_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'CPFA_FORMS_INCLUDES_DIR', CPFA_FORMS_PLUGIN_DIR . 'includes/' );
define( 'CPFA_FORMS_TEMPLATES_DIR', CPFA_FORMS_PLUGIN_DIR . 'templates/' );
define( 'CPFA_FORMS_ASSETS_URL', CPFA_FORMS_PLUGIN_URL . 'assets/' );

/**
 * Main plugin class.
 */
class CPFA_Forms_Registrations {

	/**
	 * Single instance of the class.
	 *
	 * @var CPFA_Forms_Registrations
	 */
	private static $instance = null;

	/**
	 * Get single instance.
	 *
	 * @return CPFA_Forms_Registrations
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
		$this->check_dependencies();
		$this->load_textdomain();
		$this->includes();
		$this->init_hooks();
	}

	/**
	 * Check if required plugins are active.
	 */
	private function check_dependencies() {
		// Check if CPFA Core Manager is active.
		if ( ! function_exists( 'cpfa_core_loaded' ) && ! defined( 'CPFA_CORE_VERSION' ) ) {
			add_action( 'admin_notices', array( $this, 'dependency_notice' ) );
			return;
		}
	}

	/**
	 * Show dependency notice.
	 */
	public function dependency_notice() {
		?>
		<div class="notice notice-error">
			<p>
				<?php
				esc_html_e(
					'CPFA Forms & Registrations requires CPFA Core Manager to be installed and activated.',
					'cpfa-forms'
				);
				?>
			</p>
		</div>
		<?php
	}

	/**
	 * Load plugin text domain.
	 */
	private function load_textdomain() {
		load_plugin_textdomain( 'cpfa-forms', false, dirname( plugin_basename( __FILE__ ) ) . '/languages' );
	}

	/**
	 * Include required files.
	 */
	private function includes() {
		// Services.
		require_once CPFA_FORMS_INCLUDES_DIR . 'services/class-notification-service.php';
		require_once CPFA_FORMS_INCLUDES_DIR . 'services/class-payment-config-service.php';

		// Forms.
		require_once CPFA_FORMS_INCLUDES_DIR . 'forms/class-abonnement-form.php';
		require_once CPFA_FORMS_INCLUDES_DIR . 'forms/class-form-handler.php';

		// Admin.
		require_once CPFA_FORMS_INCLUDES_DIR . 'admin/class-preinscriptions-page.php';
		require_once CPFA_FORMS_INCLUDES_DIR . 'admin/class-settings-page.php';
		require_once CPFA_FORMS_INCLUDES_DIR . 'admin/class-ajax-handlers.php';

		// REST API.
		require_once CPFA_FORMS_INCLUDES_DIR . 'class-rest-api.php';
	}

	/**
	 * Initialize hooks.
	 */
	private function init_hooks() {
		add_action( 'plugins_loaded', array( $this, 'init_components' ), 20 );
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_frontend_assets' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_assets' ) );

		// Setup cron on activation.
		register_activation_hook( __FILE__, array( $this, 'setup_cron' ) );
		register_deactivation_hook( __FILE__, array( $this, 'clear_cron' ) );

		// Cron actions.
		add_action( 'cpfa_daily_expire_preinscriptions', array( $this, 'expire_old_preinscriptions' ) );
	}

	/**
	 * Initialize plugin components.
	 */
	public function init_components() {
		// Services.
		\Cpfa\Forms\Services\Notification_Service::get_instance();
		\Cpfa\Forms\Services\Payment_Config_Service::get_instance();

		// Forms.
		\Cpfa\Forms\Abonnement_Form::get_instance();
		\Cpfa\Forms\Form_Handler::get_instance();

		// Admin.
		if ( is_admin() ) {
			\Cpfa\Forms\Admin\Preinscriptions_Page::get_instance();
			\Cpfa\Forms\Admin\Settings_Page::get_instance();
			\Cpfa\Forms\Admin\Ajax_Handlers::get_instance();
		}

		// REST API.
		\Cpfa\Forms\REST_API::get_instance();
	}

	/**
	 * Enqueue frontend assets.
	 */
	public function enqueue_frontend_assets() {
		wp_enqueue_style(
			'cpfa-forms-frontend',
			CPFA_FORMS_ASSETS_URL . 'css/frontend.css',
			array(),
			CPFA_FORMS_VERSION
		);

		wp_enqueue_script(
			'cpfa-forms-frontend',
			CPFA_FORMS_ASSETS_URL . 'js/frontend.js',
			array( 'jquery' ),
			CPFA_FORMS_VERSION,
			true
		);

		wp_localize_script(
			'cpfa-forms-frontend',
			'cpfaForms',
			array(
				'ajaxUrl' => admin_url( 'admin-ajax.php' ),
				'nonce'   => wp_create_nonce( 'cpfa_forms_nonce' ),
				'strings' => array(
					'error'   => __( 'Une erreur est survenue. Veuillez réessayer.', 'cpfa-forms' ),
					'success' => __( 'Votre demande a été enregistrée avec succès !', 'cpfa-forms' ),
				),
			)
		);
	}

	/**
	 * Enqueue admin assets.
	 */
	public function enqueue_admin_assets( $hook ) {
		// Only load on our admin pages.
		if ( strpos( $hook, 'cpfa-preinscriptions' ) === false && strpos( $hook, 'cpfa-settings' ) === false ) {
			return;
		}

		wp_enqueue_style(
			'cpfa-forms-admin',
			CPFA_FORMS_ASSETS_URL . 'css/admin.css',
			array(),
			CPFA_FORMS_VERSION
		);

		wp_enqueue_script(
			'cpfa-forms-admin',
			CPFA_FORMS_ASSETS_URL . 'js/admin.js',
			array( 'jquery', 'jquery-ui-dialog' ),
			CPFA_FORMS_VERSION,
			true
		);

		wp_localize_script(
			'cpfa-forms-admin',
			'cpfaFormsAdmin',
			array(
				'ajaxUrl' => admin_url( 'admin-ajax.php' ),
				'nonce'   => wp_create_nonce( 'cpfa_admin_nonce' ),
				'strings' => array(
					'confirmValidate' => __( 'Êtes-vous sûr de vouloir valider cet abonnement ?', 'cpfa-forms' ),
					'confirmReject'   => __( 'Êtes-vous sûr de vouloir rejeter cette préinscription ?', 'cpfa-forms' ),
					'error'           => __( 'Une erreur est survenue.', 'cpfa-forms' ),
					'success'         => __( 'Opération réussie !', 'cpfa-forms' ),
				),
			)
		);

		// Enqueue WordPress media uploader for QR code uploads.
		wp_enqueue_media();
	}

	/**
	 * Setup cron job on plugin activation.
	 */
	public function setup_cron() {
		if ( ! wp_next_scheduled( 'cpfa_daily_expire_preinscriptions' ) ) {
			wp_schedule_event( time(), 'daily', 'cpfa_daily_expire_preinscriptions' );
		}
	}

	/**
	 * Clear cron job on plugin deactivation.
	 */
	public function clear_cron() {
		$timestamp = wp_next_scheduled( 'cpfa_daily_expire_preinscriptions' );
		if ( $timestamp ) {
			wp_unschedule_event( $timestamp, 'cpfa_daily_expire_preinscriptions' );
		}
	}

	/**
	 * Expire old preinscriptions (cron job).
	 *
	 * Runs daily to check for preinscriptions that have been awaiting validation
	 * for longer than the configured expiration period.
	 */
	public function expire_old_preinscriptions() {
		$expire_days  = absint( get_option( 'cpfa_preinscription_expire_days', 7 ) );
		$date_limite = gmdate( 'Y-m-d H:i:s', strtotime( '-' . $expire_days . ' days' ) );

		// Get old awaiting preinscriptions.
		$old_preinscriptions = get_posts(
			array(
				'post_type'      => 'cpfa_abonnement',
				'posts_per_page' => -1,
				'date_query'     => array(
					array(
						'before' => $date_limite,
					),
				),
				'meta_query'     => array(
					array(
						'key'     => '_cpfa_abonnement_statut',
						'value'   => 'awaiting_validation',
						'compare' => '=',
					),
				),
			)
		);

		if ( empty( $old_preinscriptions ) ) {
			return;
		}

		$notification_service = \Cpfa\Forms\Services\Notification_Service::get_instance();

		foreach ( $old_preinscriptions as $preinscription ) {
			// Update status.
			update_post_meta( $preinscription->ID, '_cpfa_abonnement_statut', 'expired' );
			update_post_meta( $preinscription->ID, '_cpfa_abonnement_expired_le', current_time( 'mysql' ) );

			// Update history.
			$history   = get_post_meta( $preinscription->ID, '_cpfa_abonnement_historique', true );
			$history   = $history ? $history : array();
			$history[] = array(
				'date'   => current_time( 'mysql' ),
				'action' => 'expired_auto',
				'user'   => 0,
				'data'   => array(
					'expire_days' => $expire_days,
				),
			);
			update_post_meta( $preinscription->ID, '_cpfa_abonnement_historique', $history );

			// Send email notification.
			$notification_service->send_preinscription_expired( $preinscription->ID );
		}

		// Log for debugging.
		error_log( sprintf( 'CPFA: Expired %d old preinscriptions.', count( $old_preinscriptions ) ) );
	}
}

/**
 * Initialize plugin.
 */
function cpfa_forms_init() {
	return CPFA_Forms_Registrations::get_instance();
}

// Start the plugin.
add_action( 'plugins_loaded', 'cpfa_forms_init', 10 );
