<?php
/**
 * Library Widget for Elementor
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
 * Library Widget class.
 */
class Library_Widget extends Widget_Base {

	/**
	 * Get widget name.
	 *
	 * @return string Widget name.
	 */
	public function get_name() {
		return 'cpfa-library';
	}

	/**
	 * Get widget title.
	 *
	 * @return string Widget title.
	 */
	public function get_title() {
		return __( 'CPFA Bibliothèque', 'cpfa-core' );
	}

	/**
	 * Get widget icon.
	 *
	 * @return string Widget icon.
	 */
	public function get_icon() {
		return 'eicon-library-open';
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
		// Content Section.
		$this->start_controls_section(
			'content_section',
			array(
				'label' => __( 'Contenu', 'cpfa-core' ),
				'tab'   => Controls_Manager::TAB_CONTENT,
			)
		);

		$this->add_control(
			'title',
			array(
				'label'       => __( 'Titre', 'cpfa-core' ),
				'type'        => Controls_Manager::TEXT,
				'default'     => __( 'Catalogue de la Bibliothèque', 'cpfa-core' ),
				'placeholder' => __( 'Entrez le titre', 'cpfa-core' ),
			)
		);

		$this->add_control(
			'show_search',
			array(
				'label'        => __( 'Afficher la recherche', 'cpfa-core' ),
				'type'         => Controls_Manager::SWITCHER,
				'label_on'     => __( 'Oui', 'cpfa-core' ),
				'label_off'    => __( 'Non', 'cpfa-core' ),
				'return_value' => 'yes',
				'default'      => 'yes',
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
			'show_availability',
			array(
				'label'        => __( 'Afficher la disponibilité', 'cpfa-core' ),
				'type'         => Controls_Manager::SWITCHER,
				'label_on'     => __( 'Oui', 'cpfa-core' ),
				'label_off'    => __( 'Non', 'cpfa-core' ),
				'return_value' => 'yes',
				'default'      => 'yes',
			)
		);

		$this->add_control(
			'items_per_page',
			array(
				'label'   => __( 'Éléments par page', 'cpfa-core' ),
				'type'    => Controls_Manager::NUMBER,
				'min'     => 1,
				'max'     => 50,
				'step'    => 1,
				'default' => 12,
			)
		);

		$this->add_control(
			'layout',
			array(
				'label'   => __( 'Disposition', 'cpfa-core' ),
				'type'    => Controls_Manager::SELECT,
				'options' => array(
					'grid' => __( 'Grille', 'cpfa-core' ),
					'list' => __( 'Liste', 'cpfa-core' ),
				),
				'default' => 'grid',
			)
		);

		$this->add_control(
			'columns',
			array(
				'label'     => __( 'Colonnes', 'cpfa-core' ),
				'type'      => Controls_Manager::SELECT,
				'options'   => array(
					'2' => __( '2 colonnes', 'cpfa-core' ),
					'3' => __( '3 colonnes', 'cpfa-core' ),
					'4' => __( '4 colonnes', 'cpfa-core' ),
				),
				'default'   => '3',
				'condition' => array(
					'layout' => 'grid',
				),
			)
		);

		$this->end_controls_section();

		// Style Section.
		$this->start_controls_section(
			'style_section',
			array(
				'label' => __( 'Style', 'cpfa-core' ),
				'tab'   => Controls_Manager::TAB_STYLE,
			)
		);

		$this->add_group_control(
			Group_Control_Typography::get_type(),
			array(
				'name'     => 'title_typography',
				'label'    => __( 'Typographie du titre', 'cpfa-core' ),
				'selector' => '{{WRAPPER}} .cpfa-library-title',
			)
		);

		$this->add_control(
			'card_background',
			array(
				'label'     => __( 'Fond de carte', 'cpfa-core' ),
				'type'      => Controls_Manager::COLOR,
				'default'   => '#ffffff',
				'selectors' => array(
					'{{WRAPPER}} .library-item' => 'background-color: {{VALUE}}',
				),
			)
		);

		$this->add_group_control(
			Group_Control_Border::get_type(),
			array(
				'name'     => 'card_border',
				'selector' => '{{WRAPPER}} .library-item',
			)
		);

		$this->add_group_control(
			Group_Control_Box_Shadow::get_type(),
			array(
				'name'     => 'card_box_shadow',
				'selector' => '{{WRAPPER}} .library-item',
			)
		);

		$this->end_controls_section();
	}

	/**
	 * Render widget output on the frontend.
	 */
	protected function render() {
		$settings = $this->get_settings_for_display();

		$args = array(
			'post_type'      => 'cpfa_ressource',
			'post_status'    => 'publish',
			'posts_per_page' => $settings['items_per_page'],
			'paged'          => get_query_var( 'paged' ) ? get_query_var( 'paged' ) : 1,
		);

		// Handle search.
		if ( isset( $_GET['library_search'] ) && ! empty( $_GET['library_search'] ) ) {
			$args['s'] = sanitize_text_field( wp_unslash( $_GET['library_search'] ) );
		}

		// Handle type filter.
		if ( isset( $_GET['resource_type'] ) && ! empty( $_GET['resource_type'] ) ) {
			$args['tax_query'] = array(
				array(
					'taxonomy' => 'cpfa_type_ressource',
					'field'    => 'slug',
					'terms'    => sanitize_text_field( wp_unslash( $_GET['resource_type'] ) ),
				),
			);
		}

		$query = new \WP_Query( $args );

		?>
		<div class="cpfa-library-widget layout-<?php echo esc_attr( $settings['layout'] ); ?>" data-columns="<?php echo esc_attr( $settings['columns'] ); ?>">
			<?php if ( ! empty( $settings['title'] ) ) : ?>
				<h2 class="cpfa-library-title"><?php echo esc_html( $settings['title'] ); ?></h2>
			<?php endif; ?>

			<?php if ( 'yes' === $settings['show_search'] || 'yes' === $settings['show_filters'] ) : ?>
				<div class="library-controls">
					<?php if ( 'yes' === $settings['show_search'] ) : ?>
						<div class="library-search">
							<form method="get" class="library-search-form">
								<input type="text" name="library_search" class="library-search-input" placeholder="<?php esc_attr_e( 'Rechercher un livre...', 'cpfa-core' ); ?>" value="<?php echo isset( $_GET['library_search'] ) ? esc_attr( sanitize_text_field( wp_unslash( $_GET['library_search'] ) ) ) : ''; ?>">
								<button type="submit" class="library-search-button">
									<span class="dashicons dashicons-search"></span>
								</button>
							</form>
						</div>
					<?php endif; ?>

					<?php if ( 'yes' === $settings['show_filters'] ) : ?>
						<div class="library-filters">
							<?php
							$types = get_terms(
								array(
									'taxonomy'   => 'cpfa_type_ressource',
									'hide_empty' => true,
								)
							);

							if ( ! empty( $types ) && ! is_wp_error( $types ) ) :
								?>
								<select name="resource_type" class="library-filter-select" onchange="window.location.href=this.value">
									<option value="<?php echo esc_url( remove_query_arg( 'resource_type' ) ); ?>">
										<?php esc_html_e( 'Tous les types', 'cpfa-core' ); ?>
									</option>
									<?php foreach ( $types as $type ) : ?>
										<option value="<?php echo esc_url( add_query_arg( 'resource_type', $type->slug ) ); ?>" <?php selected( isset( $_GET['resource_type'] ) && $_GET['resource_type'] === $type->slug ); ?>>
											<?php echo esc_html( $type->name ); ?>
										</option>
									<?php endforeach; ?>
								</select>
							<?php endif; ?>
						</div>
					<?php endif; ?>
				</div>
			<?php endif; ?>

			<?php if ( $query->have_posts() ) : ?>
				<div class="library-grid columns-<?php echo esc_attr( $settings['columns'] ); ?>">
					<?php while ( $query->have_posts() ) : ?>
						<?php
						$query->the_post();
						$resource_id        = get_the_ID();
						$cote               = get_post_meta( $resource_id, '_cpfa_ressource_cote', true );
						$auteurs            = get_post_meta( $resource_id, '_cpfa_ressource_auteurs', true );
						$annee              = get_post_meta( $resource_id, '_cpfa_ressource_annee', true );
						$statut_emprunt     = get_post_meta( $resource_id, '_cpfa_ressource_statut_emprunt', true );
						$exclu_pret         = get_post_meta( $resource_id, '_cpfa_ressource_exclu_pret', true );

						$is_available = 'disponible' === $statut_emprunt && '1' !== $exclu_pret;
						?>
						<div class="library-item <?php echo $is_available ? 'available' : 'unavailable'; ?>">
							<div class="item-content">
								<div class="item-header">
									<h3 class="item-title"><?php the_title(); ?></h3>
									<?php if ( ! empty( $cote ) ) : ?>
										<span class="item-cote"><?php echo esc_html( $cote ); ?></span>
									<?php endif; ?>
								</div>

								<?php if ( ! empty( $auteurs ) ) : ?>
									<div class="item-authors">
										<span class="dashicons dashicons-admin-users"></span>
										<?php echo esc_html( $auteurs ); ?>
									</div>
								<?php endif; ?>

								<?php if ( ! empty( $annee ) ) : ?>
									<div class="item-year">
										<span class="dashicons dashicons-calendar-alt"></span>
										<?php echo esc_html( $annee ); ?>
									</div>
								<?php endif; ?>

								<?php if ( 'yes' === $settings['show_availability'] ) : ?>
									<div class="item-availability">
										<?php if ( '1' === $exclu_pret ) : ?>
											<span class="availability-badge excluded">
												<span class="dashicons dashicons-minus"></span>
												<?php esc_html_e( 'Consultation sur place', 'cpfa-core' ); ?>
											</span>
										<?php elseif ( 'disponible' === $statut_emprunt ) : ?>
											<span class="availability-badge available">
												<span class="dashicons dashicons-yes"></span>
												<?php esc_html_e( 'Disponible', 'cpfa-core' ); ?>
											</span>
										<?php else : ?>
											<span class="availability-badge unavailable">
												<span class="dashicons dashicons-no"></span>
												<?php esc_html_e( 'Emprunté', 'cpfa-core' ); ?>
											</span>
										<?php endif; ?>
									</div>
								<?php endif; ?>

								<?php if ( has_excerpt() ) : ?>
									<div class="item-excerpt">
										<?php the_excerpt(); ?>
									</div>
								<?php endif; ?>
							</div>
						</div>
					<?php endwhile; ?>
				</div>

				<?php
				// Pagination.
				if ( $query->max_num_pages > 1 ) :
					?>
					<div class="library-pagination">
						<?php
						echo wp_kses_post(
							paginate_links(
								array(
									'total'   => $query->max_num_pages,
									'current' => max( 1, get_query_var( 'paged' ) ),
									'format'  => '?paged=%#%',
									'prev_text' => '<span class="dashicons dashicons-arrow-left-alt2"></span> ' . __( 'Précédent', 'cpfa-core' ),
									'next_text' => __( 'Suivant', 'cpfa-core' ) . ' <span class="dashicons dashicons-arrow-right-alt2"></span>',
								)
							)
						);
						?>
					</div>
				<?php endif; ?>

			<?php else : ?>
				<div class="library-no-results">
					<p><?php esc_html_e( 'Aucune ressource trouvée.', 'cpfa-core' ); ?></p>
				</div>
			<?php endif; ?>

			<?php wp_reset_postdata(); ?>
		</div>
		<?php
	}
}
