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
				'max'     => 50,
			)
		);

		$this->add_control(
			'orderby',
			array(
				'label'   => __( 'Trier par', 'cpfa-core' ),
				'type'    => Controls_Manager::SELECT,
				'options' => array(
					'date'       => __( 'Date', 'cpfa-core' ),
					'title'      => __( 'Titre', 'cpfa-core' ),
					'rand'       => __( 'Aléatoire', 'cpfa-core' ),
					'menu_order' => __( 'Ordre personnalisé', 'cpfa-core' ),
				),
				'default' => 'date',
			)
		);

		$this->add_control(
			'order',
			array(
				'label'     => __( 'Ordre', 'cpfa-core' ),
				'type'      => Controls_Manager::SELECT,
				'options'   => array(
					'ASC'  => __( 'Croissant', 'cpfa-core' ),
					'DESC' => __( 'Décroissant', 'cpfa-core' ),
				),
				'default'   => 'DESC',
				'condition' => array(
					'orderby!' => 'rand',
				),
			)
		);

		$this->add_control(
			'layout',
			array(
				'label'   => __( 'Mise en page', 'cpfa-core' ),
				'type'    => Controls_Manager::SELECT,
				'options' => array(
					'grid'    => __( 'Grille', 'cpfa-core' ),
					'list'    => __( 'Liste', 'cpfa-core' ),
					'masonry' => __( 'Maçonnerie', 'cpfa-core' ),
				),
				'default' => 'grid',
			)
		);

		$this->end_controls_section();

		// Display Options Section
		$this->start_controls_section(
			'display_options_section',
			array(
				'label' => __( 'Options d\'affichage', 'cpfa-core' ),
				'tab'   => Controls_Manager::TAB_CONTENT,
			)
		);

		$this->add_control(
			'show_image',
			array(
				'label'        => __( 'Afficher l\'image', 'cpfa-core' ),
				'type'         => Controls_Manager::SWITCHER,
				'label_on'     => __( 'Oui', 'cpfa-core' ),
				'label_off'    => __( 'Non', 'cpfa-core' ),
				'return_value' => 'yes',
				'default'      => 'yes',
			)
		);

		$this->add_control(
			'image_size',
			array(
				'label'     => __( 'Taille de l\'image', 'cpfa-core' ),
				'type'      => Controls_Manager::SELECT,
				'options'   => array(
					'thumbnail' => __( 'Miniature', 'cpfa-core' ),
					'medium'    => __( 'Moyenne', 'cpfa-core' ),
					'large'     => __( 'Grande', 'cpfa-core' ),
					'full'      => __( 'Originale', 'cpfa-core' ),
				),
				'default'   => 'medium',
				'condition' => array(
					'show_image' => 'yes',
				),
			)
		);

		$this->add_control(
			'image_ratio',
			array(
				'label'     => __( 'Ratio de l\'image', 'cpfa-core' ),
				'type'      => Controls_Manager::SELECT,
				'options'   => array(
					''     => __( 'Original', 'cpfa-core' ),
					'1-1'  => __( '1:1 (Carré)', 'cpfa-core' ),
					'4-3'  => __( '4:3', 'cpfa-core' ),
					'16-9' => __( '16:9', 'cpfa-core' ),
					'21-9' => __( '21:9', 'cpfa-core' ),
				),
				'default'   => '',
				'condition' => array(
					'show_image' => 'yes',
				),
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

		$this->add_control(
			'excerpt_length',
			array(
				'label'     => __( 'Longueur de l\'extrait (mots)', 'cpfa-core' ),
				'type'      => Controls_Manager::NUMBER,
				'default'   => 20,
				'min'       => 5,
				'max'       => 100,
				'condition' => array(
					'show_excerpt' => 'yes',
				),
			)
		);

		$this->add_control(
			'show_meta',
			array(
				'label'        => __( 'Afficher les métadonnées', 'cpfa-core' ),
				'type'         => Controls_Manager::SWITCHER,
				'label_on'     => __( 'Oui', 'cpfa-core' ),
				'label_off'    => __( 'Non', 'cpfa-core' ),
				'return_value' => 'yes',
				'default'      => 'yes',
			)
		);

		$this->add_control(
			'show_type_badge',
			array(
				'label'        => __( 'Afficher le badge de type', 'cpfa-core' ),
				'type'         => Controls_Manager::SWITCHER,
				'label_on'     => __( 'Oui', 'cpfa-core' ),
				'label_off'    => __( 'Non', 'cpfa-core' ),
				'return_value' => 'yes',
				'default'      => 'yes',
			)
		);

		$this->add_control(
			'show_read_more',
			array(
				'label'        => __( 'Afficher le bouton "En savoir plus"', 'cpfa-core' ),
				'type'         => Controls_Manager::SWITCHER,
				'label_on'     => __( 'Oui', 'cpfa-core' ),
				'label_off'    => __( 'Non', 'cpfa-core' ),
				'return_value' => 'yes',
				'default'      => 'yes',
			)
		);

		$this->add_control(
			'read_more_text',
			array(
				'label'     => __( 'Texte du bouton', 'cpfa-core' ),
				'type'      => Controls_Manager::TEXT,
				'default'   => __( 'En savoir plus', 'cpfa-core' ),
				'condition' => array(
					'show_read_more' => 'yes',
				),
			)
		);

		$this->end_controls_section();

		// Filter Options Section
		$this->start_controls_section(
			'filter_options_section',
			array(
				'label' => __( 'Options de filtres', 'cpfa-core' ),
				'tab'   => Controls_Manager::TAB_CONTENT,
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
			'filter_style',
			array(
				'label'     => __( 'Style des filtres', 'cpfa-core' ),
				'type'      => Controls_Manager::SELECT,
				'options'   => array(
					'dropdown' => __( 'Menu déroulant', 'cpfa-core' ),
					'buttons'  => __( 'Boutons', 'cpfa-core' ),
					'tabs'     => __( 'Onglets', 'cpfa-core' ),
				),
				'default'   => 'dropdown',
				'condition' => array(
					'show_filters' => 'yes',
				),
			)
		);

		$this->add_control(
			'show_search_filter',
			array(
				'label'        => __( 'Afficher le champ de recherche', 'cpfa-core' ),
				'type'         => Controls_Manager::SWITCHER,
				'label_on'     => __( 'Oui', 'cpfa-core' ),
				'label_off'    => __( 'Non', 'cpfa-core' ),
				'return_value' => 'yes',
				'default'      => 'yes',
				'condition'    => array(
					'show_filters' => 'yes',
				),
			)
		);

		$this->add_control(
			'search_placeholder',
			array(
				'label'     => __( 'Texte du placeholder', 'cpfa-core' ),
				'type'      => Controls_Manager::TEXT,
				'default'   => __( 'Rechercher...', 'cpfa-core' ),
				'condition' => array(
					'show_filters'       => 'yes',
					'show_search_filter' => 'yes',
				),
			)
		);

		$this->end_controls_section();

		// Pagination Section
		$this->start_controls_section(
			'pagination_section',
			array(
				'label' => __( 'Pagination', 'cpfa-core' ),
				'tab'   => Controls_Manager::TAB_CONTENT,
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
			'pagination_type',
			array(
				'label'     => __( 'Type de pagination', 'cpfa-core' ),
				'type'      => Controls_Manager::SELECT,
				'options'   => array(
					'load_more'       => __( 'Bouton "Charger plus"', 'cpfa-core' ),
					'infinite_scroll' => __( 'Défilement infini', 'cpfa-core' ),
					'numbers'         => __( 'Numéros de page', 'cpfa-core' ),
				),
				'default'   => 'load_more',
				'condition' => array(
					'enable_ajax' => 'yes',
				),
			)
		);

		$this->add_control(
			'load_more_text',
			array(
				'label'     => __( 'Texte du bouton "Charger plus"', 'cpfa-core' ),
				'type'      => Controls_Manager::TEXT,
				'default'   => __( 'Charger plus', 'cpfa-core' ),
				'condition' => array(
					'enable_ajax'     => 'yes',
					'pagination_type' => 'load_more',
				),
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
			'orderby'        => $settings['orderby'],
		);

		// Add order parameter if not random
		if ( 'rand' !== $settings['orderby'] ) {
			$args['order'] = $settings['order'];
		}

		$query = new \WP_Query( $args );

		if ( ! $query->have_posts() ) {
			echo '<p>' . esc_html__( 'Aucun élément trouvé.', 'cpfa-core' ) . '</p>';
			return;
		}

		// Add image ratio class if set
		$image_ratio_class = ! empty( $settings['image_ratio'] ) ? ' cpfa-ratio-' . $settings['image_ratio'] : '';
		$filter_style_class = 'yes' === $settings['show_filters'] ? ' cpfa-filter-' . $settings['filter_style'] : '';
		$pagination_class = 'yes' === $settings['enable_ajax'] ? ' cpfa-pagination-' . $settings['pagination_type'] : '';

		?>
		<div class="cpfa-catalogue-widget cpfa-layout-<?php echo esc_attr( $settings['layout'] ); ?><?php echo esc_attr( $image_ratio_class ); ?><?php echo esc_attr( $filter_style_class ); ?><?php echo esc_attr( $pagination_class ); ?>" data-settings="<?php echo esc_attr( wp_json_encode( $settings ) ); ?>">

			<?php if ( 'yes' === $settings['show_filters'] ) : ?>
				<div class="cpfa-catalogue-filters cpfa-filter-style-<?php echo esc_attr( $settings['filter_style'] ); ?>">
					<?php if ( 'dropdown' === $settings['filter_style'] ) : ?>
						<select class="cpfa-filter-type">
							<option value=""><?php esc_html_e( 'Tous les types', 'cpfa-core' ); ?></option>
							<option value="formations"><?php esc_html_e( 'Formations', 'cpfa-core' ); ?></option>
							<option value="seminaires"><?php esc_html_e( 'Séminaires', 'cpfa-core' ); ?></option>
							<option value="concours"><?php esc_html_e( 'Concours', 'cpfa-core' ); ?></option>
							<option value="ressources"><?php esc_html_e( 'Ressources', 'cpfa-core' ); ?></option>
						</select>
					<?php elseif ( 'buttons' === $settings['filter_style'] ) : ?>
						<div class="cpfa-filter-buttons">
							<button class="cpfa-filter-btn active" data-filter=""><?php esc_html_e( 'Tout', 'cpfa-core' ); ?></button>
							<button class="cpfa-filter-btn" data-filter="formations"><?php esc_html_e( 'Formations', 'cpfa-core' ); ?></button>
							<button class="cpfa-filter-btn" data-filter="seminaires"><?php esc_html_e( 'Séminaires', 'cpfa-core' ); ?></button>
							<button class="cpfa-filter-btn" data-filter="concours"><?php esc_html_e( 'Concours', 'cpfa-core' ); ?></button>
							<button class="cpfa-filter-btn" data-filter="ressources"><?php esc_html_e( 'Ressources', 'cpfa-core' ); ?></button>
						</div>
					<?php elseif ( 'tabs' === $settings['filter_style'] ) : ?>
						<div class="cpfa-filter-tabs">
							<div class="cpfa-filter-tab active" data-filter=""><?php esc_html_e( 'Tout', 'cpfa-core' ); ?></div>
							<div class="cpfa-filter-tab" data-filter="formations"><?php esc_html_e( 'Formations', 'cpfa-core' ); ?></div>
							<div class="cpfa-filter-tab" data-filter="seminaires"><?php esc_html_e( 'Séminaires', 'cpfa-core' ); ?></div>
							<div class="cpfa-filter-tab" data-filter="concours"><?php esc_html_e( 'Concours', 'cpfa-core' ); ?></div>
							<div class="cpfa-filter-tab" data-filter="ressources"><?php esc_html_e( 'Ressources', 'cpfa-core' ); ?></div>
						</div>
					<?php endif; ?>

					<?php if ( 'yes' === $settings['show_search_filter'] ) : ?>
						<div class="cpfa-filter-search-wrapper">
							<input type="text" class="cpfa-filter-search" placeholder="<?php echo esc_attr( $settings['search_placeholder'] ); ?>">
							<span class="cpfa-search-icon">🔍</span>
						</div>
					<?php endif; ?>
				</div>
			<?php endif; ?>

			<div class="cpfa-catalogue-<?php echo esc_attr( $settings['layout'] ); ?>" <?php echo 'masonry' === $settings['layout'] ? 'data-masonry' : ''; ?>>
				<?php
				while ( $query->have_posts() ) :
					$query->the_post();
					$this->render_item( $settings );
				endwhile;
				wp_reset_postdata();
				?>
			</div>

			<?php if ( 'yes' === $settings['enable_ajax'] && $query->max_num_pages > 1 ) : ?>
				<div class="cpfa-pagination cpfa-pagination-<?php echo esc_attr( $settings['pagination_type'] ); ?>">
					<?php if ( 'load_more' === $settings['pagination_type'] ) : ?>
						<button class="cpfa-load-more" data-page="1" data-max="<?php echo esc_attr( $query->max_num_pages ); ?>">
							<span class="cpfa-load-more-text"><?php echo esc_html( $settings['load_more_text'] ); ?></span>
							<span class="cpfa-loader" style="display:none;">⏳</span>
						</button>
					<?php elseif ( 'numbers' === $settings['pagination_type'] ) : ?>
						<div class="cpfa-page-numbers">
							<?php
							echo paginate_links(
								array(
									'total'     => $query->max_num_pages,
									'current'   => 1,
									'format'    => '?paged=%#%',
									'prev_text' => '‹',
									'next_text' => '›',
								)
							);
							?>
						</div>
					<?php elseif ( 'infinite_scroll' === $settings['pagination_type'] ) : ?>
						<div class="cpfa-infinite-scroll-trigger" data-page="1" data-max="<?php echo esc_attr( $query->max_num_pages ); ?>">
							<span class="cpfa-loader" style="display:none;">⏳</span>
						</div>
					<?php endif; ?>
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

		// Get image size setting
		$image_size = isset( $settings['image_size'] ) ? $settings['image_size'] : 'medium';
		$image_ratio_class = ! empty( $settings['image_ratio'] ) ? ' cpfa-ratio-' . $settings['image_ratio'] : '';

		?>
		<div class="cpfa-catalogue-item<?php echo esc_attr( $image_ratio_class ); ?>" data-post-id="<?php the_ID(); ?>">
			<?php if ( 'yes' === $settings['show_image'] && has_post_thumbnail() ) : ?>
				<div class="cpfa-item-image">
					<a href="<?php the_permalink(); ?>">
						<?php the_post_thumbnail( $image_size ); ?>
					</a>
					<?php if ( 'yes' === $settings['show_type_badge'] ) : ?>
						<span class="cpfa-type-badge">
							<?php echo esc_html( get_post_type_object( $post_type )->labels->singular_name ); ?>
						</span>
					<?php endif; ?>
				</div>
			<?php endif; ?>

			<div class="cpfa-item-content">
				<h3 class="cpfa-item-title">
					<a href="<?php the_permalink(); ?>"><?php the_title(); ?></a>
				</h3>

				<?php if ( 'yes' === $settings['show_excerpt'] ) : ?>
					<div class="cpfa-item-excerpt">
						<?php
						if ( has_excerpt() ) {
							// Use custom excerpt length if set
							$excerpt_length = isset( $settings['excerpt_length'] ) ? $settings['excerpt_length'] : 20;
							$excerpt = wp_trim_words( get_the_excerpt(), $excerpt_length, '...' );
							echo wp_kses_post( $excerpt );
						}
						?>
					</div>
				<?php endif; ?>

				<?php if ( 'yes' === $settings['show_meta'] ) : ?>
					<div class="cpfa-item-meta">
						<?php if ( 'cpfa_ressource' === $post_type ) : ?>
							<?php if ( ! empty( $auteurs ) ) : ?>
								<span class="cpfa-meta-item cpfa-author">
									<span class="cpfa-meta-icon">📚</span>
									<span class="cpfa-meta-value"><?php echo esc_html( $auteurs ); ?></span>
								</span>
							<?php endif; ?>
							<?php if ( ! empty( $cote ) ) : ?>
								<span class="cpfa-meta-item cpfa-cote">
									<span class="cpfa-meta-icon">📋</span>
									<span class="cpfa-meta-value"><?php echo esc_html( $cote ); ?></span>
								</span>
							<?php endif; ?>
							<?php if ( ! empty( $annee ) ) : ?>
								<span class="cpfa-meta-item cpfa-year">
									<span class="cpfa-meta-icon">📅</span>
									<span class="cpfa-meta-value"><?php echo esc_html( $annee ); ?></span>
								</span>
							<?php endif; ?>
						<?php else : ?>
							<?php if ( ! empty( $prix ) ) : ?>
								<span class="cpfa-meta-item cpfa-price">
									<span class="cpfa-meta-icon">💰</span>
									<span class="cpfa-meta-value"><?php echo number_format( (int) $prix ); ?> FCFA</span>
								</span>
							<?php endif; ?>
							<?php if ( ! empty( $duree ) ) : ?>
								<span class="cpfa-meta-item cpfa-duration">
									<span class="cpfa-meta-icon">⏱️</span>
									<span class="cpfa-meta-value"><?php echo esc_html( $duree ); ?>h</span>
								</span>
							<?php endif; ?>
						<?php endif; ?>
					</div>
				<?php endif; ?>

				<?php if ( 'yes' === $settings['show_read_more'] ) : ?>
					<?php
					$read_more_text = ! empty( $settings['read_more_text'] ) ? $settings['read_more_text'] : __( 'En savoir plus', 'cpfa-core' );
					?>
					<a href="<?php the_permalink(); ?>" class="cpfa-item-link">
						<?php echo esc_html( $read_more_text ); ?>
						<span class="cpfa-link-arrow">→</span>
					</a>
				<?php endif; ?>
			</div>
		</div>
		<?php
	}
}
