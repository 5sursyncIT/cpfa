<?php
/**
 * Catalogue Widget for Elementor
 *
 * @package CpfaCore
 */

namespace Cpfa\Core\Elementor\Widgets;

use Elementor\Widget_Base;
use Elementor\Controls_Manager;
use Elementor\Group_Control_Typography;
use Elementor\Group_Control_Border;
use Elementor\Group_Control_Box_Shadow;

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Catalogue Widget class.
 */
class Catalogue_Widget extends Widget_Base {

	/**
	 * Get widget name.
	 *
	 * @return string Widget name.
	 */
	public function get_name() {
		return 'cpfa-catalogue';
	}

	/**
	 * Get widget title.
	 *
	 * @return string Widget title.
	 */
	public function get_title() {
		return __( 'CPFA Catalogue', 'cpfa-core' );
	}

	/**
	 * Get widget icon.
	 *
	 * @return string Widget icon.
	 */
	public function get_icon() {
		return 'eicon-posts-grid';
	}

	/**
	 * Get widget categories.
	 *
	 * @return array Widget categories.
	 */
	public function get_categories() {
		return array( 'cpfa-widgets' );
	}

	/**
	 * Register widget controls.
	 */
	protected function register_controls() {
		// Content section.
		$this->start_controls_section(
			'content_section',
			array(
				'label' => __( 'Contenu', 'cpfa-core' ),
				'tab'   => Controls_Manager::TAB_CONTENT,
			)
		);

		$this->add_control(
			'content_type',
			array(
				'label'   => __( 'Type de contenu', 'cpfa-core' ),
				'type'    => Controls_Manager::SELECT,
				'options' => array(
					'all'        => __( 'Tout', 'cpfa-core' ),
					'formation'  => __( 'Formations', 'cpfa-core' ),
					'seminaire'  => __( 'Séminaires', 'cpfa-core' ),
					'concours'   => __( 'Concours', 'cpfa-core' ),
					'ressource'  => __( 'Ressources (Livres)', 'cpfa-core' ),
				),
				'default' => 'all',
			)
		);

		$this->add_control(
			'posts_per_page',
			array(
				'label'   => __( 'Nombre d\'éléments', 'cpfa-core' ),
				'type'    => Controls_Manager::NUMBER,
				'default' => 6,
				'min'     => 1,
				'max'     => 20,
			)
		);

		$this->add_control(
			'layout',
			array(
				'label'   => __( 'Mise en page', 'cpfa-core' ),
				'type'    => Controls_Manager::SELECT,
				'options' => array(
					'grid' => __( 'Grille', 'cpfa-core' ),
					'list' => __( 'Liste', 'cpfa-core' ),
				),
				'default' => 'grid',
			)
		);

		$this->add_control(
			'show_filters',
			array(
				'label'        => __( 'Afficher les filtres', 'cpfa-core' ),
				'type'         => Controls_Manager::SWITCHER,
				'label_on'     => __( 'Oui', 'cpfa-core' ),
				'label_off'    => __( 'Non', 'cpfa-core' ),
				'return_value' => 'yes',
				'default'      => 'yes',
			)
		);

		$this->add_control(
			'enable_ajax',
			array(
				'label'        => __( 'Chargement Ajax', 'cpfa-core' ),
				'type'         => Controls_Manager::SWITCHER,
				'label_on'     => __( 'Oui', 'cpfa-core' ),
				'label_off'    => __( 'Non', 'cpfa-core' ),
				'return_value' => 'yes',
				'default'      => 'yes',
			)
		);

		$this->add_control(
			'show_excerpt',
			array(
				'label'        => __( 'Afficher l\'extrait', 'cpfa-core' ),
				'type'         => Controls_Manager::SWITCHER,
				'label_on'     => __( 'Oui', 'cpfa-core' ),
				'label_off'    => __( 'Non', 'cpfa-core' ),
				'return_value' => 'yes',
				'default'      => 'yes',
			)
		);

		$this->end_controls_section();

		// Style section.
		$this->start_controls_section(
			'style_section',
			array(
				'label' => __( 'Style', 'cpfa-core' ),
				'tab'   => Controls_Manager::TAB_STYLE,
			)
		);

		$this->add_responsive_control(
			'columns',
			array(
				'label'     => __( 'Colonnes', 'cpfa-core' ),
				'type'      => Controls_Manager::SELECT,
				'options'   => array(
					'1' => '1',
					'2' => '2',
					'3' => '3',
					'4' => '4',
				),
				'default'   => '3',
				'selectors' => array(
					'{{WRAPPER}} .cpfa-catalogue-grid' => 'grid-template-columns: repeat({{VALUE}}, 1fr);',
				),
				'condition' => array(
					'layout' => 'grid',
				),
			)
		);

		$this->add_responsive_control(
			'gap',
			array(
				'label'      => __( 'Espacement', 'cpfa-core' ),
				'type'       => Controls_Manager::SLIDER,
				'size_units' => array( 'px' ),
				'range'      => array(
					'px' => array(
						'min' => 0,
						'max' => 100,
					),
				),
				'default'    => array(
					'size' => 20,
				),
				'selectors'  => array(
					'{{WRAPPER}} .cpfa-catalogue-grid, {{WRAPPER}} .cpfa-catalogue-list' => 'gap: {{SIZE}}{{UNIT}};',
				),
			)
		);

		$this->add_control(
			'card_bg_color',
			array(
				'label'     => __( 'Couleur de fond', 'cpfa-core' ),
				'type'      => Controls_Manager::COLOR,
				'default'   => '#ffffff',
				'selectors' => array(
					'{{WRAPPER}} .cpfa-catalogue-item' => 'background-color: {{VALUE}};',
				),
			)
		);

		$this->add_group_control(
			Group_Control_Border::get_type(),
			array(
				'name'     => 'card_border',
				'selector' => '{{WRAPPER}} .cpfa-catalogue-item',
			)
		);

		$this->add_responsive_control(
			'card_border_radius',
			array(
				'label'      => __( 'Bordure arrondie', 'cpfa-core' ),
				'type'       => Controls_Manager::DIMENSIONS,
				'size_units' => array( 'px', '%' ),
				'selectors'  => array(
					'{{WRAPPER}} .cpfa-catalogue-item' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				),
			)
		);

		$this->add_group_control(
			Group_Control_Box_Shadow::get_type(),
			array(
				'name'     => 'card_box_shadow',
				'selector' => '{{WRAPPER}} .cpfa-catalogue-item',
			)
		);

		$this->end_controls_section();

		// Typography section.
		$this->start_controls_section(
			'typography_section',
			array(
				'label' => __( 'Typographie', 'cpfa-core' ),
				'tab'   => Controls_Manager::TAB_STYLE,
			)
		);

		$this->add_group_control(
			Group_Control_Typography::get_type(),
			array(
				'name'     => 'title_typography',
				'label'    => __( 'Titre', 'cpfa-core' ),
				'selector' => '{{WRAPPER}} .cpfa-item-title',
			)
		);

		$this->add_control(
			'title_color',
			array(
				'label'     => __( 'Couleur du titre', 'cpfa-core' ),
				'type'      => Controls_Manager::COLOR,
				'default'   => '#2c5aa0',
				'selectors' => array(
					'{{WRAPPER}} .cpfa-item-title' => 'color: {{VALUE}};',
				),
			)
		);

		$this->add_group_control(
			Group_Control_Typography::get_type(),
			array(
				'name'     => 'content_typography',
				'label'    => __( 'Contenu', 'cpfa-core' ),
				'selector' => '{{WRAPPER}} .cpfa-item-excerpt',
			)
		);

		$this->end_controls_section();
	}

	/**
	 * Render widget output.
	 */
	protected function render() {
		$settings = $this->get_settings_for_display();

		// Determine post types.
		$post_types = array( 'cpfa_formation', 'cpfa_seminaire', 'cpfa_concours', 'cpfa_ressource' );
		if ( 'all' !== $settings['content_type'] ) {
			$post_types = array( 'cpfa_' . $settings['content_type'] );
		}

		// Build query.
		$args = array(
			'post_type'      => $post_types,
			'posts_per_page' => $settings['posts_per_page'],
			'post_status'    => 'publish',
		);

		$query = new \WP_Query( $args );

		if ( ! $query->have_posts() ) {
			echo '<p>' . esc_html__( 'Aucun élément trouvé.', 'cpfa-core' ) . '</p>';
			return;
		}

		?>
		<div class="cpfa-catalogue-widget cpfa-layout-<?php echo esc_attr( $settings['layout'] ); ?>" data-settings="<?php echo esc_attr( wp_json_encode( $settings ) ); ?>">

			<?php if ( 'yes' === $settings['show_filters'] ) : ?>
				<div class="cpfa-catalogue-filters">
					<select class="cpfa-filter-type">
						<option value=""><?php esc_html_e( 'Tous les types', 'cpfa-core' ); ?></option>
						<option value="formations"><?php esc_html_e( 'Formations', 'cpfa-core' ); ?></option>
						<option value="seminaires"><?php esc_html_e( 'Séminaires', 'cpfa-core' ); ?></option>
						<option value="concours"><?php esc_html_e( 'Concours', 'cpfa-core' ); ?></option>
					</select>
					<input type="text" class="cpfa-filter-search" placeholder="<?php esc_attr_e( 'Rechercher...', 'cpfa-core' ); ?>">
				</div>
			<?php endif; ?>

			<div class="cpfa-catalogue-<?php echo esc_attr( $settings['layout'] ); ?>">
				<?php
				while ( $query->have_posts() ) :
					$query->the_post();
					$this->render_item( $settings );
				endwhile;
				wp_reset_postdata();
				?>
			</div>

			<?php if ( 'yes' === $settings['enable_ajax'] && $query->max_num_pages > 1 ) : ?>
				<div class="cpfa-pagination">
					<button class="cpfa-load-more" data-page="1" data-max="<?php echo esc_attr( $query->max_num_pages ); ?>">
						<?php esc_html_e( 'Charger plus', 'cpfa-core' ); ?>
					</button>
				</div>
			<?php endif; ?>

		</div>
		<?php
	}

	/**
	 * Render single item.
	 *
	 * @param array $settings Widget settings.
	 */
	private function render_item( $settings ) {
		$post_type = get_post_type();
		$type_slug = str_replace( 'cpfa_', '', $post_type );

		// Get meta data based on post type.
		if ( 'cpfa_ressource' === $post_type ) {
			$auteurs = get_post_meta( get_the_ID(), '_cpfa_ressource_auteurs', true );
			$cote    = get_post_meta( get_the_ID(), '_cpfa_ressource_cote', true );
			$annee   = get_post_meta( get_the_ID(), '_cpfa_ressource_annee', true );
		} else {
			$prix  = get_post_meta( get_the_ID(), '_cpfa_' . $type_slug . '_prix', true );
			$duree = get_post_meta( get_the_ID(), '_cpfa_' . $type_slug . '_duree', true );
		}
		?>
		<div class="cpfa-catalogue-item" data-post-id="<?php the_ID(); ?>">
			<?php if ( has_post_thumbnail() ) : ?>
				<div class="cpfa-item-image">
					<a href="<?php the_permalink(); ?>">
						<?php the_post_thumbnail( 'medium' ); ?>
					</a>
				</div>
			<?php endif; ?>

			<div class="cpfa-item-content">
				<h3 class="cpfa-item-title">
					<a href="<?php the_permalink(); ?>"><?php the_title(); ?></a>
				</h3>

				<?php if ( 'yes' === $settings['show_excerpt'] && has_excerpt() ) : ?>
					<div class="cpfa-item-excerpt">
						<?php the_excerpt(); ?>
					</div>
				<?php endif; ?>

				<div class="cpfa-item-meta">
					<?php if ( 'cpfa_ressource' === $post_type ) : ?>
						<?php if ( ! empty( $auteurs ) ) : ?>
							<span class="cpfa-author">📚 <?php echo esc_html( $auteurs ); ?></span>
						<?php endif; ?>
						<?php if ( ! empty( $cote ) ) : ?>
							<span class="cpfa-cote">📋 <?php echo esc_html( $cote ); ?></span>
						<?php endif; ?>
						<?php if ( ! empty( $annee ) ) : ?>
							<span class="cpfa-year">📅 <?php echo esc_html( $annee ); ?></span>
						<?php endif; ?>
					<?php else : ?>
						<?php if ( ! empty( $prix ) ) : ?>
							<span class="cpfa-price"><?php echo number_format( (int) $prix ); ?> FCFA</span>
						<?php endif; ?>
						<?php if ( ! empty( $duree ) ) : ?>
							<span class="cpfa-duration"><?php echo esc_html( $duree ); ?>h</span>
						<?php endif; ?>
					<?php endif; ?>

					<span class="cpfa-type"><?php echo esc_html( get_post_type_object( $post_type )->labels->singular_name ); ?></span>
				</div>

				<a href="<?php the_permalink(); ?>" class="cpfa-item-link">
					<?php esc_html_e( 'En savoir plus', 'cpfa-core' ); ?>
				</a>
			</div>
		</div>
		<?php
	}
}
