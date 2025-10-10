<?php
/**
 * Plugin Name: CPFA PDF Generator
 * Plugin URI: https://cpfa.sn
 * Description: Génération de PDF (cartes membres, reçus, certificats) pour CPFA avec QR codes
 * Version: 1.0.0
 * Author: CPFA Development Team
 * Author URI: https://cpfa.sn
 * Text Domain: cpfa-pdf
 * Domain Path: /languages
 * Requires at least: 6.0
 * Requires PHP: 8.0
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 *
 * @package CPFA_PDF
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Define plugin constants.
define( 'CPFA_PDF_VERSION', '1.0.0' );
define( 'CPFA_PDF_PLUGIN_FILE', __FILE__ );
define( 'CPFA_PDF_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'CPFA_PDF_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'CPFA_PDF_INCLUDES_DIR', CPFA_PDF_PLUGIN_DIR . 'includes/' );
define( 'CPFA_PDF_TEMPLATES_DIR', CPFA_PDF_PLUGIN_DIR . 'templates/' );

/**
 * Main plugin class.
 */
class CPFA_PDF_Generator {

	/**
	 * Single instance of the class.
	 *
	 * @var CPFA_PDF_Generator
	 */
	private static $instance = null;

	/**
	 * Get single instance.
	 *
	 * @return CPFA_PDF_Generator
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
		$this->load_composer_autoloader();
		$this->check_dependencies();
		$this->load_textdomain();
		$this->includes();
		$this->init_hooks();
	}

	/**
	 * Load Composer autoloader.
	 */
	private function load_composer_autoloader() {
		if ( file_exists( CPFA_PDF_PLUGIN_DIR . 'vendor/autoload.php' ) ) {
			require_once CPFA_PDF_PLUGIN_DIR . 'vendor/autoload.php';
		}
	}

	/**
	 * Check if required plugins are active.
	 */
	private function check_dependencies() {
		// Check if CPFA Core Manager is active.
		if ( ! defined( 'CPFA_CORE_VERSION' ) ) {
			add_action( 'admin_notices', array( $this, 'core_dependency_notice' ) );
			return;
		}

		// Check if mPDF is available.
		if ( ! class_exists( '\Mpdf\Mpdf' ) ) {
			add_action( 'admin_notices', array( $this, 'mpdf_dependency_notice' ) );
			return;
		}
	}

	/**
	 * Show core dependency notice.
	 */
	public function core_dependency_notice() {
		?>
		<div class="notice notice-error">
			<p>
				<?php
				esc_html_e(
					'CPFA PDF Generator requires CPFA Core Manager to be installed and activated.',
					'cpfa-pdf'
				);
				?>
			</p>
		</div>
		<?php
	}

	/**
	 * Show mPDF dependency notice.
	 */
	public function mpdf_dependency_notice() {
		?>
		<div class="notice notice-error">
			<p>
				<?php
				esc_html_e(
					'CPFA PDF Generator requires mPDF library. Please run "composer install" in the plugin directory.',
					'cpfa-pdf'
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
		load_plugin_textdomain( 'cpfa-pdf', false, dirname( plugin_basename( __FILE__ ) ) . '/languages' );
	}

	/**
	 * Include required files.
	 */
	private function includes() {
		// Services.
		require_once CPFA_PDF_INCLUDES_DIR . 'services/class-pdf-generator.php';
		require_once CPFA_PDF_INCLUDES_DIR . 'services/class-pdf-storage.php';

		// PDF Generators.
		require_once CPFA_PDF_INCLUDES_DIR . 'pdf/class-member-card-pdf.php';
	}

	/**
	 * Initialize hooks.
	 */
	private function init_hooks() {
		add_action( 'plugins_loaded', array( $this, 'init_components' ), 30 );
	}

	/**
	 * Initialize plugin components.
	 */
	public function init_components() {
		// Services.
		\Cpfa\Pdf\Services\PDF_Generator::get_instance();
		\Cpfa\Pdf\Services\PDF_Storage::get_instance();

		// PDF Generators.
		\Cpfa\Pdf\Member_Card_PDF::get_instance();
	}
}

/**
 * Initialize plugin.
 */
function cpfa_pdf_init() {
	return CPFA_PDF_Generator::get_instance();
}

// Start the plugin.
add_action( 'plugins_loaded', 'cpfa_pdf_init', 10 );
