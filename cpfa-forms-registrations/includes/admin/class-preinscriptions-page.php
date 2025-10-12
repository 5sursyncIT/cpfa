<?php
/**
 * Preinscriptions Admin Page Class.
 *
 * Displays and manages the list of pending subscriptions.
 *
 * @package CPFA_Forms
 */

namespace Cpfa\Forms\Admin;

/**
 * Preinscriptions_Page class.
 */
class Preinscriptions_Page {

	/**
	 * Single instance.
	 *
	 * @var Preinscriptions_Page
	 */
	private static $instance = null;

	/**
	 * Get instance.
	 *
	 * @return Preinscriptions_Page
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
		$this->init_hooks();
	}

	/**
	 * Initialize hooks.
	 */
	private function init_hooks() {
		add_action( 'admin_menu', array( $this, 'add_admin_page' ), 100 );
	}

	/**
	 * Add admin page to menu.
	 */
	public function add_admin_page() {
		add_submenu_page(
			'cpfa-library',
			__( 'Préinscriptions en attente', 'cpfa-forms' ),
			__( '📋 Préinscriptions', 'cpfa-forms' ),
			'manage_options',
			'cpfa-preinscriptions',
			array( $this, 'render_page' )
		);
	}

	/**
	 * Render admin page.
	 */
	public function render_page() {
		// Get filter parameters.
		$status_filter = isset( $_GET['status_filter'] ) ? sanitize_key( wp_unslash( $_GET['status_filter'] ) ) : 'awaiting_validation';
		$type_filter   = isset( $_GET['type_filter'] ) ? sanitize_key( wp_unslash( $_GET['type_filter'] ) ) : '';
		$search        = isset( $_GET['s'] ) ? sanitize_text_field( wp_unslash( $_GET['s'] ) ) : '';

		// Get statistics.
		$stats = $this->get_statistics();

		// Get abonnements list.
		$abonnements = $this->get_abonnements( $status_filter, $type_filter, $search );

		?>
		<div class="wrap cpfa-preinscriptions-page">
			<h1 class="wp-heading-inline">
				<?php esc_html_e( 'Préinscriptions Bibliothèque', 'cpfa-forms' ); ?>
			</h1>

			<!-- Statistics Cards -->
			<div class="cpfa-stats-grid">
				<div class="cpfa-stat-card">
					<div class="cpfa-stat-number"><?php echo esc_html( $stats['awaiting'] ); ?></div>
					<div class="cpfa-stat-label"><?php esc_html_e( 'En attente', 'cpfa-forms' ); ?></div>
				</div>
				<div class="cpfa-stat-card">
					<div class="cpfa-stat-number"><?php echo esc_html( $stats['active'] ); ?></div>
					<div class="cpfa-stat-label"><?php esc_html_e( 'Actifs', 'cpfa-forms' ); ?></div>
				</div>
				<div class="cpfa-stat-card">
					<div class="cpfa-stat-number"><?php echo esc_html( $stats['rejected'] ); ?></div>
					<div class="cpfa-stat-label"><?php esc_html_e( 'Rejetés', 'cpfa-forms' ); ?></div>
				</div>
				<div class="cpfa-stat-card">
					<div class="cpfa-stat-number"><?php echo esc_html( $stats['total'] ); ?></div>
					<div class="cpfa-stat-label"><?php esc_html_e( 'Total', 'cpfa-forms' ); ?></div>
				</div>
			</div>

			<!-- Filters -->
			<div class="cpfa-filters">
				<form method="get" action="">
					<input type="hidden" name="page" value="cpfa-preinscriptions">

					<div class="cpfa-filter-group">
						<label for="status_filter"><?php esc_html_e( 'Statut :', 'cpfa-forms' ); ?></label>
						<select name="status_filter" id="status_filter">
							<option value=""><?php esc_html_e( 'Tous les statuts', 'cpfa-forms' ); ?></option>
							<option value="awaiting_validation" <?php selected( $status_filter, 'awaiting_validation' ); ?>>
								<?php esc_html_e( 'En attente', 'cpfa-forms' ); ?>
							</option>
							<option value="actif" <?php selected( $status_filter, 'actif' ); ?>>
								<?php esc_html_e( 'Actif', 'cpfa-forms' ); ?>
							</option>
							<option value="rejected" <?php selected( $status_filter, 'rejected' ); ?>>
								<?php esc_html_e( 'Rejeté', 'cpfa-forms' ); ?>
							</option>
							<option value="expired" <?php selected( $status_filter, 'expired' ); ?>>
								<?php esc_html_e( 'Expiré', 'cpfa-forms' ); ?>
							</option>
						</select>
					</div>

					<div class="cpfa-filter-group">
						<label for="type_filter"><?php esc_html_e( 'Type :', 'cpfa-forms' ); ?></label>
						<select name="type_filter" id="type_filter">
							<option value=""><?php esc_html_e( 'Tous les types', 'cpfa-forms' ); ?></option>
							<option value="etudiant" <?php selected( $type_filter, 'etudiant' ); ?>>
								<?php esc_html_e( 'Étudiant', 'cpfa-forms' ); ?>
							</option>
							<option value="professionnel" <?php selected( $type_filter, 'professionnel' ); ?>>
								<?php esc_html_e( 'Professionnel', 'cpfa-forms' ); ?>
							</option>
							<option value="emprunt_domicile" <?php selected( $type_filter, 'emprunt_domicile' ); ?>>
								<?php esc_html_e( 'Emprunt à domicile', 'cpfa-forms' ); ?>
							</option>
						</select>
					</div>

					<div class="cpfa-filter-group">
						<label for="s"><?php esc_html_e( 'Rechercher :', 'cpfa-forms' ); ?></label>
						<input type="search" name="s" id="s" value="<?php echo esc_attr( $search ); ?>" placeholder="<?php esc_attr_e( 'Nom, email...', 'cpfa-forms' ); ?>">
					</div>

					<button type="submit" class="button">
						<?php esc_html_e( 'Filtrer', 'cpfa-forms' ); ?>
					</button>

					<?php if ( $status_filter || $type_filter || $search ) : ?>
						<a href="<?php echo esc_url( admin_url( 'admin.php?page=cpfa-preinscriptions' ) ); ?>" class="button">
							<?php esc_html_e( 'Réinitialiser', 'cpfa-forms' ); ?>
						</a>
					<?php endif; ?>
				</form>
			</div>

			<!-- Abonnements Table -->
			<?php if ( empty( $abonnements ) ) : ?>
				<div class="cpfa-admin-message info">
					<p><?php esc_html_e( 'Aucune préinscription trouvée.', 'cpfa-forms' ); ?></p>
				</div>
			<?php else : ?>
				<table class="wp-list-table widefat fixed striped cpfa-preinscriptions-table">
					<thead>
						<tr>
							<th><?php esc_html_e( '#', 'cpfa-forms' ); ?></th>
							<th><?php esc_html_e( 'Nom', 'cpfa-forms' ); ?></th>
							<th><?php esc_html_e( 'Email', 'cpfa-forms' ); ?></th>
							<th><?php esc_html_e( 'Type', 'cpfa-forms' ); ?></th>
							<th><?php esc_html_e( 'Montant', 'cpfa-forms' ); ?></th>
							<th><?php esc_html_e( 'Date', 'cpfa-forms' ); ?></th>
							<th><?php esc_html_e( 'Statut', 'cpfa-forms' ); ?></th>
							<th><?php esc_html_e( 'Actions', 'cpfa-forms' ); ?></th>
						</tr>
					</thead>
					<tbody>
						<?php foreach ( $abonnements as $abonnement ) : ?>
							<?php $this->render_abonnement_row( $abonnement ); ?>
						<?php endforeach; ?>
					</tbody>
				</table>
			<?php endif; ?>
		</div>
		<?php
	}

	/**
	 * Render a single abonnement row.
	 *
	 * @param \WP_Post $abonnement Abonnement post.
	 */
	private function render_abonnement_row( $abonnement ) {
		$nom                   = get_post_meta( $abonnement->ID, '_cpfa_abonnement_nom', true );
		$prenom                = get_post_meta( $abonnement->ID, '_cpfa_abonnement_prenom', true );
		$email                 = get_post_meta( $abonnement->ID, '_cpfa_abonnement_email', true );
		$type                  = get_post_meta( $abonnement->ID, '_cpfa_abonnement_type', true );
		$montant               = get_post_meta( $abonnement->ID, '_cpfa_abonnement_montant', true );
		$statut                = get_post_meta( $abonnement->ID, '_cpfa_abonnement_statut', true );
		$numero_preinscription = get_post_meta( $abonnement->ID, '_cpfa_abonnement_numero_preinscription', true );

		$type_labels = array(
			'etudiant'         => __( 'Étudiant', 'cpfa-forms' ),
			'professionnel'    => __( 'Professionnel', 'cpfa-forms' ),
			'emprunt_domicile' => __( 'Emprunt domicile', 'cpfa-forms' ),
		);

		$status_labels = array(
			'awaiting_validation' => __( 'En attente', 'cpfa-forms' ),
			'actif'               => __( 'Actif', 'cpfa-forms' ),
			'rejected'            => __( 'Rejeté', 'cpfa-forms' ),
			'expired'             => __( 'Expiré', 'cpfa-forms' ),
		);

		$status_classes = array(
			'awaiting_validation' => 'awaiting',
			'actif'               => 'active',
			'rejected'            => 'rejected',
			'expired'             => 'expired',
		);
		?>
		<tr>
			<td><strong><?php echo esc_html( $numero_preinscription ); ?></strong></td>
			<td>
				<strong><?php echo esc_html( $prenom . ' ' . $nom ); ?></strong>
			</td>
			<td><?php echo esc_html( $email ); ?></td>
			<td><?php echo esc_html( isset( $type_labels[ $type ] ) ? $type_labels[ $type ] : $type ); ?></td>
			<td><?php echo esc_html( number_format( $montant, 0, ',', ' ' ) . ' FCFA' ); ?></td>
			<td><?php echo esc_html( get_the_date( 'd/m/Y H:i', $abonnement->ID ) ); ?></td>
			<td>
				<span class="cpfa-status-badge <?php echo esc_attr( isset( $status_classes[ $statut ] ) ? $status_classes[ $statut ] : '' ); ?>">
					<?php echo esc_html( isset( $status_labels[ $statut ] ) ? $status_labels[ $statut ] : $statut ); ?>
				</span>
			</td>
			<td>
				<div class="cpfa-action-buttons">
					<button type="button" class="cpfa-action-btn view cpfa-view-details" data-id="<?php echo esc_attr( $abonnement->ID ); ?>" title="<?php esc_attr_e( 'Voir les détails', 'cpfa-forms' ); ?>">
						👁️ <?php esc_html_e( 'Voir', 'cpfa-forms' ); ?>
					</button>

					<?php if ( 'awaiting_validation' === $statut ) : ?>
						<button type="button" class="cpfa-action-btn validate cpfa-validate-btn" data-id="<?php echo esc_attr( $abonnement->ID ); ?>" title="<?php esc_attr_e( 'Valider', 'cpfa-forms' ); ?>">
							✅ <?php esc_html_e( 'Valider', 'cpfa-forms' ); ?>
						</button>
						<button type="button" class="cpfa-action-btn reject cpfa-reject-btn" data-id="<?php echo esc_attr( $abonnement->ID ); ?>" title="<?php esc_attr_e( 'Rejeter', 'cpfa-forms' ); ?>">
							❌ <?php esc_html_e( 'Rejeter', 'cpfa-forms' ); ?>
						</button>
						<button type="button" class="cpfa-action-btn request cpfa-request-justif-btn" data-id="<?php echo esc_attr( $abonnement->ID ); ?>" title="<?php esc_attr_e( 'Demander justificatif', 'cpfa-forms' ); ?>">
							🔄 <?php esc_html_e( 'Justificatif', 'cpfa-forms' ); ?>
						</button>
					<?php endif; ?>

					<?php if ( 'actif' === $statut ) : ?>
						<?php
						$carte_pdf_url = get_post_meta( $abonnement->ID, '_cpfa_carte_pdf_url', true );
						if ( $carte_pdf_url ) :
							?>
							<a href="<?php echo esc_url( $carte_pdf_url ); ?>" class="cpfa-action-btn view" target="_blank" title="<?php esc_attr_e( 'Télécharger la carte', 'cpfa-forms' ); ?>">
								📄 <?php esc_html_e( 'Carte', 'cpfa-forms' ); ?>
							</a>
						<?php endif; ?>
					<?php endif; ?>
				</div>
			</td>
		</tr>
		<?php
	}

	/**
	 * Get statistics.
	 *
	 * @return array
	 */
	private function get_statistics() {
		$awaiting = $this->count_by_status( 'awaiting_validation' );
		$active   = $this->count_by_status( 'actif' );
		$rejected = $this->count_by_status( 'rejected' );

		return array(
			'awaiting' => $awaiting,
			'active'   => $active,
			'rejected' => $rejected,
			'total'    => $awaiting + $active + $rejected,
		);
	}

	/**
	 * Count abonnements by status.
	 *
	 * @param string $status Status to count.
	 * @return int
	 */
	private function count_by_status( $status ) {
		$count = get_posts(
			array(
				'post_type'      => 'cpfa_abonnement',
				'posts_per_page' => -1,
				'fields'         => 'ids',
				'meta_query'     => array(
					array(
						'key'     => '_cpfa_abonnement_statut',
						'value'   => $status,
						'compare' => '=',
					),
				),
			)
		);

		return count( $count );
	}

	/**
	 * Get abonnements list with filters.
	 *
	 * @param string $status_filter Status filter.
	 * @param string $type_filter   Type filter.
	 * @param string $search        Search term.
	 * @return array
	 */
	private function get_abonnements( $status_filter = '', $type_filter = '', $search = '' ) {
		$args = array(
			'post_type'      => 'cpfa_abonnement',
			'posts_per_page' => 50,
			'orderby'        => 'date',
			'order'          => 'DESC',
			'meta_query'     => array( 'relation' => 'AND' ),
		);

		// Status filter.
		if ( ! empty( $status_filter ) ) {
			$args['meta_query'][] = array(
				'key'     => '_cpfa_abonnement_statut',
				'value'   => $status_filter,
				'compare' => '=',
			);
		}

		// Type filter.
		if ( ! empty( $type_filter ) ) {
			$args['meta_query'][] = array(
				'key'     => '_cpfa_abonnement_type',
				'value'   => $type_filter,
				'compare' => '=',
			);
		}

		// Search.
		if ( ! empty( $search ) ) {
			$args['meta_query'][] = array(
				'relation' => 'OR',
				array(
					'key'     => '_cpfa_abonnement_nom',
					'value'   => $search,
					'compare' => 'LIKE',
				),
				array(
					'key'     => '_cpfa_abonnement_prenom',
					'value'   => $search,
					'compare' => 'LIKE',
				),
				array(
					'key'     => '_cpfa_abonnement_email',
					'value'   => $search,
					'compare' => 'LIKE',
				),
			);
		}

		return get_posts( $args );
	}
}
