<?php
/**
 * Plugin Name: CPFA Core Manager
 * Plugin URI: https://cpfa.example.com
 * Description: Core management system for CPFA - Custom Post Types, taxonomies, roles, and shared services
 * Version: 1.0.0
 * Requires at least: 6.0
 * Requires PHP: 8.0
 * Author: CPFA Development Team
 * Text Domain: cpfa-core
 * Domain Path: /languages
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 *
 * @package CpfaCore
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Define plugin constants.
define( 'CPFA_CORE_VERSION', '1.0.0' );
define( 'CPFA_CORE_PLUGIN_FILE', __FILE__ );
define( 'CPFA_CORE_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'CPFA_CORE_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'CPFA_CORE_PLUGIN_BASENAME', plugin_basename( __FILE__ ) );

// Load Composer autoloader.
if ( file_exists( dirname( __DIR__ ) . '/vendor/autoload.php' ) ) {
	require_once dirname( __DIR__ ) . '/vendor/autoload.php';
}

/**
 * Main plugin class.
 */
final class CPFA_Core_Manager {

	/**
	 * Instance of this class.
	 *
	 * @var CPFA_Core_Manager
	 */
	private static $instance = null;

	/**
	 * Get instance of this class.
	 *
	 * @return CPFA_Core_Manager
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
		$this->load_dependencies();
		$this->init_hooks();
	}

	/**
	 * Load plugin dependencies.
	 */
	private function load_dependencies() {
		// Core Classes (load first - other classes depend on these).
		require_once CPFA_CORE_PLUGIN_DIR . 'includes/class-config.php';
		require_once CPFA_CORE_PLUGIN_DIR . 'includes/class-meta-keys.php';
		require_once CPFA_CORE_PLUGIN_DIR . 'includes/class-logger.php';
		require_once CPFA_CORE_PLUGIN_DIR . 'includes/class-meta-migration.php';

		// Initialize logger.
		\Cpfa\Core\Logger::init();

		// Custom Post Types.
		require_once CPFA_CORE_PLUGIN_DIR . 'includes/cpt/class-formation.php';
		require_once CPFA_CORE_PLUGIN_DIR . 'includes/cpt/class-seminaire.php';
		require_once CPFA_CORE_PLUGIN_DIR . 'includes/cpt/class-concours.php';
		require_once CPFA_CORE_PLUGIN_DIR . 'includes/cpt/class-ressource.php';
		require_once CPFA_CORE_PLUGIN_DIR . 'includes/cpt/class-abonnement.php';
		require_once CPFA_CORE_PLUGIN_DIR . 'includes/cpt/class-emprunt.php';

		// Meta Boxes.
		require_once CPFA_CORE_PLUGIN_DIR . 'includes/meta-boxes/class-meta-boxes.php';

		// Settings.
		require_once CPFA_CORE_PLUGIN_DIR . 'includes/settings/class-settings.php';

		// Services.
		require_once CPFA_CORE_PLUGIN_DIR . 'includes/services/class-cache-service.php';
		require_once CPFA_CORE_PLUGIN_DIR . 'includes/services/class-db-transaction.php';
		require_once CPFA_CORE_PLUGIN_DIR . 'includes/services/class-rate-limiter.php';
		require_once CPFA_CORE_PLUGIN_DIR . 'includes/services/class-qr-service.php';
		require_once CPFA_CORE_PLUGIN_DIR . 'includes/services/class-notification-service.php';
		require_once CPFA_CORE_PLUGIN_DIR . 'includes/services/class-payment-gateway-registry.php';

		// REST API.
		require_once CPFA_CORE_PLUGIN_DIR . 'includes/rest-api/class-rest-api.php';

		// Roles and capabilities.
		require_once CPFA_CORE_PLUGIN_DIR . 'includes/class-roles.php';

		// Cron jobs.
		require_once CPFA_CORE_PLUGIN_DIR . 'includes/class-cron.php';

		// Library Manager.
		require_once CPFA_CORE_PLUGIN_DIR . 'includes/class-library-manager.php';

		// Ajax Handler.
		require_once CPFA_CORE_PLUGIN_DIR . 'includes/class-ajax-handler.php';
	}

	/**
	 * Initialize hooks.
	 */
	private function init_hooks() {
		// Plugin activation/deactivation.
		register_activation_hook( CPFA_CORE_PLUGIN_FILE, array( $this, 'activate' ) );
		register_deactivation_hook( CPFA_CORE_PLUGIN_FILE, array( $this, 'deactivate' ) );

		// Internationalization.
		add_action( 'plugins_loaded', array( $this, 'load_textdomain' ) );

		// Enqueue assets.
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_scripts' ) );

		// Initialize components.
		add_action( 'init', array( $this, 'init_components' ) );

		// Elementor integration (after all plugins loaded).
		add_action( 'plugins_loaded', array( $this, 'init_elementor' ), 20 );

		// Cache invalidation on post save.
		add_action( 'save_post', array( 'Cpfa\Core\Services\Cache_Service', 'invalidate_on_save' ), 10, 1 );
	}

	/**
	 * Plugin activation.
	 */
	public function activate() {
		// Create custom roles and capabilities.
		Cpfa\Core\Roles::create_roles();

		// Run meta keys migration if needed.
		if ( \Cpfa\Core\Meta_Migration::is_migration_needed() ) {
			$result = \Cpfa\Core\Meta_Migration::run();

			if ( ! $result['success'] ) {
				\Cpfa\Core\Logger::error( 'Meta keys migration failed', $result );
			} else {
				\Cpfa\Core\Logger::info( 'Meta keys migration completed successfully', $result );
			}
		}

		// Flush rewrite rules.
		flush_rewrite_rules();

		// Schedule cron events.
		Cpfa\Core\Cron::schedule_events();

		// Log activation.
		\Cpfa\Core\Logger::info( 'CPFA Core Manager activated', array(
			'version' => CPFA_CORE_VERSION,
			'php_version' => PHP_VERSION,
			'wp_version' => get_bloginfo( 'version' ),
		) );
	}

	/**
	 * Plugin deactivation.
	 */
	public function deactivate() {
		// Clear scheduled cron events.
		Cpfa\Core\Cron::clear_scheduled_events();

		// Flush rewrite rules.
		flush_rewrite_rules();
	}

	/**
	 * Load text domain for translations.
	 */
	public function load_textdomain() {
		load_plugin_textdomain(
			'cpfa-core',
			false,
			dirname( CPFA_CORE_PLUGIN_BASENAME ) . '/languages'
		);
	}

	/**
	 * Enqueue frontend scripts and styles.
	 */
	public function enqueue_scripts() {
		// Main styles.
		wp_enqueue_style(
			'cpfa-core-styles',
			CPFA_CORE_PLUGIN_URL . 'assets/css/cpfa-core.css',
			array(),
			CPFA_CORE_VERSION
		);

		// Library widget styles (modern UI) - registered for Elementor.
		wp_register_style(
			'cpfa-library-widget',
			CPFA_CORE_PLUGIN_URL . 'assets/css/library-widget.css',
			array(),
			CPFA_CORE_VERSION
		);

		// Library notifications styles - enqueued globally.
		wp_enqueue_style(
			'cpfa-library-notifications',
			CPFA_CORE_PLUGIN_URL . 'assets/css/library-notifications.css',
			array(),
			CPFA_CORE_VERSION
		);

		// Main scripts.
		wp_enqueue_script(
			'cpfa-core-scripts',
			CPFA_CORE_PLUGIN_URL . 'assets/js/cpfa-core.js',
			array( 'jquery' ),
			CPFA_CORE_VERSION,
			true
		);

		// Library widget script - registered for Elementor.
		wp_register_script(
			'cpfa-library-widget-js',
			CPFA_CORE_PLUGIN_URL . 'assets/js/library-widget.js',
			array( 'jquery' ),
			CPFA_CORE_VERSION,
			true
		);

		// Localize scripts with enhanced data.
		$localize_data = array(
			'ajaxUrl'    => admin_url( 'admin-ajax.php' ),
			'restUrl'    => rest_url( 'cpfa/v1' ),
			'nonce'      => wp_create_nonce( 'cpfa-core-nonce' ),
			'isLoggedIn' => is_user_logged_in(),
			'i18n'       => array(
				'loading'       => __( 'Chargement...', 'cpfa-core' ),
				'error'         => __( 'Une erreur est survenue', 'cpfa-core' ),
				'success'       => __( 'Succès !', 'cpfa-core' ),
				'confirm'       => __( 'Êtes-vous sûr ?', 'cpfa-core' ),
				'loginRequired' => __( 'Vous devez être connecté', 'cpfa-core' ),
			),
		);

		wp_localize_script( 'cpfa-core-scripts', 'cpfaCore', $localize_data );
		wp_localize_script( 'cpfa-library-widget-js', 'cpfaCore', $localize_data );
	}

	/**
	 * Enqueue admin scripts and styles.
	 */
	public function enqueue_admin_scripts() {
		wp_enqueue_style(
			'cpfa-core-admin-styles',
			CPFA_CORE_PLUGIN_URL . 'assets/css/cpfa-admin.css',
			array(),
			CPFA_CORE_VERSION
		);

		wp_enqueue_script(
			'cpfa-core-admin-scripts',
			CPFA_CORE_PLUGIN_URL . 'assets/js/cpfa-admin.js',
			array( 'jquery', 'wp-color-picker' ),
			CPFA_CORE_VERSION,
			true
		);

		wp_enqueue_style( 'wp-color-picker' );
	}

	/**
	 * Initialize plugin components.
	 */
	public function init_components() {
		// Initialize CPTs.
		new Cpfa\Core\CPT\Formation();
		new Cpfa\Core\CPT\Seminaire();
		new Cpfa\Core\CPT\Concours();
		new Cpfa\Core\CPT\Ressource();
		new Cpfa\Core\CPT\Abonnement();
		new Cpfa\Core\CPT\Emprunt();

		// Initialize meta boxes.
		new Cpfa\Core\MetaBoxes\Meta_Boxes();

		// Initialize settings.
		new Cpfa\Core\Settings\Settings();

		// Initialize REST API.
		new Cpfa\Core\RestAPI\Rest_API();

		// Initialize Library Manager.
		new Cpfa\Core\Library_Manager();

		// Initialize Ajax Handler.
		new Cpfa\Core\Ajax_Handler();
	}

	/**
	 * Initialize Elementor integration.
	 */
	public function init_elementor() {
		// Check if Elementor is installed and activated.
		if ( ! did_action( 'elementor/loaded' ) ) {
			return;
		}

		// Load Elementor integration file.
		require_once CPFA_CORE_PLUGIN_DIR . 'includes/elementor/class-elementor-integration.php';

		// Initialize Elementor integration.
		new Cpfa\Core\Elementor\Elementor_Integration();
	}
}

/**
 * Initialize the plugin.
 */
function cpfa_core_manager() {
	return CPFA_Core_Manager::get_instance();
}

// Start the plugin.
cpfa_core_manager();
