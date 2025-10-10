<?php
/**
 * Upcoming Events Widget for Elementor
 *
 * @package CpfaCore
 */

namespace Cpfa\Core\Elementor\Widgets;

use Elementor\Widget_Base;
use Elementor\Controls_Manager;

if ( ! defined( 'ABSPATH' ) ) exit;

class Upcoming_Events_Widget extends Widget_Base {
	public function get_name() { return 'cpfa-upcoming-events'; }
	public function get_title() { return __( 'CPFA Événements à venir', 'cpfa-core' ); }
	public function get_icon() { return 'eicon-calendar'; }
	public function get_categories() { return array( 'cpfa-widgets' ); }

	protected function register_controls() {
		$this->start_controls_section( 'content_section', array( 'label' => __( 'Contenu', 'cpfa-core' ) ) );
		
		$this->add_control( 'event_types', array(
			'label' => __( 'Types d\'événements', 'cpfa-core' ),
			'type' => Controls_Manager::SELECT2,
			'multiple' => true,
			'options' => array(
				'formations' => __( 'Formations', 'cpfa-core' ),
				'seminaires' => __( 'Séminaires', 'cpfa-core' ),
				'concours' => __( 'Concours', 'cpfa-core' ),
			),
			'default' => array( 'formations', 'seminaires' ),
		));

		$this->add_control( 'events_limit', array(
			'label' => __( 'Nombre d\'événements', 'cpfa-core' ),
			'type' => Controls_Manager::NUMBER,
			'default' => 5,
			'min' => 1,
			'max' => 20,
		));

		$this->add_control( 'show_countdown', array(
			'label' => __( 'Compte à rebours', 'cpfa-core' ),
			'type' => Controls_Manager::SWITCHER,
			'default' => 'yes',
		));

		$this->end_controls_section();
	}

	protected function render() {
		$settings = $this->get_settings_for_display();
		
		$post_types = array();
		foreach ( $settings['event_types'] as $type ) {
			$post_types[] = 'cpfa_' . $type;
		}

		$args = array(
			'post_type' => $post_types,
			'posts_per_page' => $settings['events_limit'],
			'post_status' => 'publish',
			'orderby' => 'date',
			'order' => 'ASC',
		);

		$query = new \WP_Query( $args );

		if ( ! $query->have_posts() ) {
			echo '<p>' . esc_html__( 'Aucun événement à venir.', 'cpfa-core' ) . '</p>';
			return;
		}
		?>
		<div class="cpfa-upcoming-events-widget">
			<?php while ( $query->have_posts() ) : $query->the_post(); ?>
				<div class="cpfa-event-item">
					<h4 class="cpfa-event-title"><?php the_title(); ?></h4>
					
					<?php if ( 'yes' === $settings['show_countdown'] ) : ?>
						<div class="cpfa-event-countdown" data-date="<?php echo esc_attr( get_the_date( 'Y-m-d' ) ); ?>"></div>
					<?php endif; ?>
					
					<a href="<?php the_permalink(); ?>" class="cpfa-event-link"><?php esc_html_e( 'En savoir plus', 'cpfa-core' ); ?></a>
				</div>
			<?php endwhile; wp_reset_postdata(); ?>
		</div>
		<?php
	}
}
