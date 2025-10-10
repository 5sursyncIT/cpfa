<?php
/**
 * Search Widget for Elementor
 *
 * @package CpfaCore
 */

namespace Cpfa\Core\Elementor\Widgets;

use Elementor\Widget_Base;
use Elementor\Controls_Manager;

if ( ! defined( 'ABSPATH' ) ) exit;

class Search_Widget extends Widget_Base {
	public function get_name() { return 'cpfa-search'; }
	public function get_title() { return __( 'CPFA Recherche', 'cpfa-core' ); }
	public function get_icon() { return 'eicon-search'; }
	public function get_categories() { return array( 'cpfa-widgets' ); }

	protected function register_controls() {
		$this->start_controls_section( 'content_section', array( 'label' => __( 'Contenu', 'cpfa-core' ) ) );
		
		$this->add_control( 'placeholder', array(
			'label' => __( 'Placeholder', 'cpfa-core' ),
			'type' => Controls_Manager::TEXT,
			'default' => __( 'Rechercher formations, séminaires...', 'cpfa-core' ),
		));

		$this->add_control( 'show_advanced', array(
			'label' => __( 'Filtres avancés', 'cpfa-core' ),
			'type' => Controls_Manager::SWITCHER,
			'default' => 'yes',
		));

		$this->end_controls_section();
	}

	protected function render() {
		$settings = $this->get_settings_for_display();
		?>
		<div class="cpfa-search-widget">
			<form class="cpfa-search-form" method="get">
				<input type="text" name="s" class="cpfa-search-input" placeholder="<?php echo esc_attr( $settings['placeholder'] ); ?>" />
				<button type="submit" class="cpfa-search-button"><?php esc_html_e( 'Rechercher', 'cpfa-core' ); ?></button>
			</form>
			
			<?php if ( 'yes' === $settings['show_advanced'] ) : ?>
			<div class="cpfa-advanced-filters">
				<select name="type" class="cpfa-filter-select">
					<option value=""><?php esc_html_e( 'Tous les types', 'cpfa-core' ); ?></option>
					<option value="formations"><?php esc_html_e( 'Formations', 'cpfa-core' ); ?></option>
					<option value="seminaires"><?php esc_html_e( 'Séminaires', 'cpfa-core' ); ?></option>
					<option value="concours"><?php esc_html_e( 'Concours', 'cpfa-core' ); ?></option>
				</select>
			</div>
			<?php endif; ?>
			
			<div class="cpfa-search-results"></div>
		</div>
		<?php
	}
}
