<?php
/**
 * Stats Widget for Elementor
 *
 * @package CpfaCore
 */

namespace Cpfa\Core\Elementor\Widgets;

use Elementor\Widget_Base;
use Elementor\Controls_Manager;

if ( ! defined( 'ABSPATH' ) ) exit;

class Stats_Widget extends Widget_Base {
	public function get_name() { return 'cpfa-stats'; }
	public function get_title() { return __( 'CPFA Statistiques', 'cpfa-core' ); }
	public function get_icon() { return 'eicon-counter'; }
	public function get_categories() { return array( 'cpfa-widgets' ); }

	protected function register_controls() {
		$this->start_controls_section( 'content_section', array( 'label' => __( 'Contenu', 'cpfa-core' ) ) );
		
		$this->add_control( 'stats_to_show', array(
			'label' => __( 'Statistiques', 'cpfa-core' ),
			'type' => Controls_Manager::SELECT2,
			'multiple' => true,
			'options' => array(
				'formations' => __( 'Formations', 'cpfa-core' ),
				'seminaires' => __( 'Séminaires', 'cpfa-core' ),
				'concours' => __( 'Concours', 'cpfa-core' ),
				'ressources' => __( 'Ressources', 'cpfa-core' ),
				'abonnements' => __( 'Abonnements', 'cpfa-core' ),
			),
			'default' => array( 'formations', 'seminaires', 'abonnements' ),
		));

		$this->add_control( 'animation_duration', array(
			'label' => __( 'Durée animation (ms)', 'cpfa-core' ),
			'type' => Controls_Manager::NUMBER,
			'default' => 2000,
		));

		$this->end_controls_section();
	}

	protected function render() {
		$settings = $this->get_settings_for_display();
		$stats = array(
			'formations' => wp_count_posts( 'cpfa_formation' )->publish,
			'seminaires' => wp_count_posts( 'cpfa_seminaire' )->publish,
			'concours' => wp_count_posts( 'cpfa_concours' )->publish,
			'ressources' => wp_count_posts( 'cpfa_ressource' )->publish,
			'abonnements' => wp_count_posts( 'cpfa_abonnement' )->publish,
		);

		$labels = array(
			'formations' => __( 'Formations', 'cpfa-core' ),
			'seminaires' => __( 'Séminaires', 'cpfa-core' ),
			'concours' => __( 'Concours', 'cpfa-core' ),
			'ressources' => __( 'Ressources', 'cpfa-core' ),
			'abonnements' => __( 'Abonnements', 'cpfa-core' ),
		);
		?>
		<div class="cpfa-stats-widget">
			<?php foreach ( $settings['stats_to_show'] as $stat ) : ?>
				<div class="cpfa-stat-item">
					<span class="cpfa-counter" data-target="<?php echo esc_attr( $stats[ $stat ] ); ?>" data-duration="<?php echo esc_attr( $settings['animation_duration'] ); ?>">0</span>
					<span class="cpfa-stat-label"><?php echo esc_html( $labels[ $stat ] ); ?></span>
				</div>
			<?php endforeach; ?>
		</div>
		<?php
	}
}
