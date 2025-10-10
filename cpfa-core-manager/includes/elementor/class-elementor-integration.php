<?php
/**
 * Elementor Integration
 *
 * @package CpfaCore
 */

namespace Cpfa\Core\Elementor;

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Elementor Integration class.
 */
class Elementor_Integration {

	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'elementor/elements/categories_registered', array( $this, 'register_category' ) );
		add_action( 'elementor/widgets/register', array( $this, 'register_widgets' ) );
		add_action( 'elementor/frontend/after_enqueue_styles', array( $this, 'enqueue_styles' ) );
		add_action( 'elementor/frontend/after_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
	}

	/**
	 * Register CPFA widgets category.
	 *
	 * @param \Elementor\Elements_Manager $elements_manager Elements manager.
	 */
	public function register_category( $elements_manager ) {
		$elements_manager->add_category(
			'cpfa-widgets',
			array(
				'title' => __( 'CPFA Widgets', 'cpfa-core' ),
				'icon'  => 'fa fa-graduation-cap',
			)
		);
	}

	/**
	 * Register widgets.
	 *
	 * @param \Elementor\Widgets_Manager $widgets_manager Widgets manager.
	 */
	public function register_widgets( $widgets_manager ) {
		// Load widget files.
		require_once CPFA_CORE_PLUGIN_DIR . 'includes/elementor/widgets/class-catalogue-widget.php';
		require_once CPFA_CORE_PLUGIN_DIR . 'includes/elementor/widgets/class-search-widget.php';
		require_once CPFA_CORE_PLUGIN_DIR . 'includes/elementor/widgets/class-stats-widget.php';
		require_once CPFA_CORE_PLUGIN_DIR . 'includes/elementor/widgets/class-upcoming-events-widget.php';
		require_once CPFA_CORE_PLUGIN_DIR . 'includes/elementor/widgets/class-library-widget.php';

		// Register widgets.
		$widgets_manager->register( new Widgets\Catalogue_Widget() );
		$widgets_manager->register( new Widgets\Search_Widget() );
		$widgets_manager->register( new Widgets\Stats_Widget() );
		$widgets_manager->register( new Widgets\Upcoming_Events_Widget() );
		$widgets_manager->register( new Widgets\Library_Widget() );
	}

	/**
	 * Enqueue widget styles.
	 */
	public function enqueue_styles() {
		wp_enqueue_style(
			'cpfa-elementor-widgets',
			CPFA_CORE_PLUGIN_URL . 'assets/css/elementor-widgets.css',
			array(),
			CPFA_CORE_VERSION
		);
	}

	/**
	 * Enqueue widget scripts.
	 */
	public function enqueue_scripts() {
		wp_enqueue_script(
			'cpfa-elementor-widgets',
			CPFA_CORE_PLUGIN_URL . 'assets/js/elementor-widgets.js',
			array( 'jquery' ),
			CPFA_CORE_VERSION,
			true
		);

		wp_localize_script(
			'cpfa-elementor-widgets',
			'cpfaElementor',
			array(
				'ajaxUrl' => admin_url( 'admin-ajax.php' ),
				'restUrl' => rest_url( 'cpfa/v1' ),
				'nonce'   => wp_create_nonce( 'cpfa-elementor-nonce' ),
			)
		);
	}
}
