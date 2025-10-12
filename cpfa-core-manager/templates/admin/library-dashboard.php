<?php
/**
 * Library Dashboard Template
 *
 * @package CpfaCore
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>

<div class="wrap cpfa-library-dashboard">
	<h1>
		<?php esc_html_e( 'Gestion de la Bibliothèque', 'cpfa-core' ); ?>
		<button type="button" id="cpfa-refresh-stats" class="button" style="margin-left: 10px;">
			<span class="dashicons dashicons-update"></span>
			<?php esc_html_e( 'Actualiser', 'cpfa-core' ); ?>
		</button>
	</h1>

	<div class="cpfa-library-stats" id="cpfa-stats-container">
		<div class="stat-card">
			<div class="stat-icon">📚</div>
			<div class="stat-content">
				<div class="stat-number" data-stat="total_resources"><?php echo esc_html( number_format_i18n( $stats['total_resources'] ) ); ?></div>
				<div class="stat-label"><?php esc_html_e( 'Ressources totales', 'cpfa-core' ); ?></div>
			</div>
		</div>

		<div class="stat-card">
			<div class="stat-icon">✅</div>
			<div class="stat-content">
				<div class="stat-number" data-stat="available_resources"><?php echo esc_html( number_format_i18n( $stats['available_resources'] ) ); ?></div>
				<div class="stat-label"><?php esc_html_e( 'Disponibles', 'cpfa-core' ); ?></div>
			</div>
		</div>

		<div class="stat-card">
			<div class="stat-icon">👥</div>
			<div class="stat-content">
				<div class="stat-number" data-stat="active_subscribers"><?php echo esc_html( number_format_i18n( $stats['active_subscribers'] ) ); ?></div>
				<div class="stat-label"><?php esc_html_e( 'Abonnés actifs', 'cpfa-core' ); ?></div>
			</div>
		</div>

		<div class="stat-card">
			<div class="stat-icon">📖</div>
			<div class="stat-content">
				<div class="stat-number" data-stat="active_loans"><?php echo esc_html( number_format_i18n( $stats['active_loans'] ) ); ?></div>
				<div class="stat-label"><?php esc_html_e( 'Emprunts en cours', 'cpfa-core' ); ?></div>
			</div>
		</div>

		<div class="stat-card warning">
			<div class="stat-icon">⚠️</div>
			<div class="stat-content">
				<div class="stat-number" data-stat="overdue_loans"><?php echo esc_html( number_format_i18n( $stats['overdue_loans'] ) ); ?></div>
				<div class="stat-label"><?php esc_html_e( 'Retards', 'cpfa-core' ); ?></div>
			</div>
		</div>

		<div class="stat-card danger">
			<div class="stat-icon">💰</div>
			<div class="stat-content">
				<div class="stat-number" data-stat="total_penalties"><?php echo esc_html( number_format_i18n( $stats['total_penalties'] ) ); ?> FCFA</div>
				<div class="stat-label"><?php esc_html_e( 'Pénalités', 'cpfa-core' ); ?></div>
			</div>
		</div>
	</div>

	<script>
	jQuery(document).ready(function($) {
		// Auto-refresh stats every 30 seconds
		let refreshInterval = setInterval(refreshStats, 30000);

		// Manual refresh button
		$('#cpfa-refresh-stats').on('click', function() {
			refreshStats();
		});

		function refreshStats() {
			const $button = $('#cpfa-refresh-stats');
			$button.prop('disabled', true).find('.dashicons').addClass('spin');

			$.ajax({
				url: ajaxurl,
				type: 'POST',
				data: {
					action: 'cpfa_refresh_stats',
					nonce: '<?php echo wp_create_nonce( 'cpfa-refresh-stats' ); ?>'
				},
				success: function(response) {
					if (response.success && response.data) {
						updateStats(response.data);
					}
				},
				complete: function() {
					$button.prop('disabled', false).find('.dashicons').removeClass('spin');
				}
			});
		}

		function updateStats(stats) {
			$('[data-stat="total_resources"]').text(stats.total_resources.toLocaleString());
			$('[data-stat="available_resources"]').text(stats.available_resources.toLocaleString());
			$('[data-stat="active_subscribers"]').text(stats.active_subscribers.toLocaleString());
			$('[data-stat="active_loans"]').text(stats.active_loans.toLocaleString());
			$('[data-stat="overdue_loans"]').text(stats.overdue_loans.toLocaleString());
			$('[data-stat="total_penalties"]').text(stats.total_penalties.toLocaleString() + ' FCFA');
		}
	});
	</script>
	<style>
	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
	.dashicons.spin {
		animation: spin 1s linear infinite;
	}
	</style>

	<div class="cpfa-quick-actions">
		<h2><?php esc_html_e( 'Actions rapides', 'cpfa-core' ); ?></h2>
		<div class="action-buttons">
			<a href="<?php echo esc_url( admin_url( 'admin.php?page=cpfa-library-checkout' ) ); ?>" class="button button-primary button-hero">
				<span class="dashicons dashicons-arrow-right-alt"></span>
				<?php esc_html_e( 'Nouveau prêt', 'cpfa-core' ); ?>
			</a>
			<a href="<?php echo esc_url( admin_url( 'admin.php?page=cpfa-library-return' ) ); ?>" class="button button-hero">
				<span class="dashicons dashicons-arrow-left-alt"></span>
				<?php esc_html_e( 'Retour', 'cpfa-core' ); ?>
			</a>
			<a href="<?php echo esc_url( admin_url( 'post-new.php?post_type=cpfa_abonnement' ) ); ?>" class="button button-hero">
				<span class="dashicons dashicons-plus"></span>
				<?php esc_html_e( 'Nouvel abonnement', 'cpfa-core' ); ?>
			</a>
			<a href="<?php echo esc_url( admin_url( 'admin.php?page=cpfa-library-penalties' ) ); ?>" class="button button-hero">
				<span class="dashicons dashicons-warning"></span>
				<?php esc_html_e( 'Gérer pénalités', 'cpfa-core' ); ?>
			</a>
		</div>
	</div>

	<div class="cpfa-recent-activity">
		<h2><?php esc_html_e( 'Activité récente', 'cpfa-core' ); ?></h2>
		<?php
		$recent_loans = get_posts(
			array(
				'post_type'      => 'cpfa_emprunt',
				'posts_per_page' => 10,
				'orderby'        => 'date',
				'order'          => 'DESC',
			)
		);

		if ( ! empty( $recent_loans ) ) :
			?>
			<table class="wp-list-table widefat fixed striped">
				<thead>
					<tr>
						<th><?php esc_html_e( 'Date', 'cpfa-core' ); ?></th>
						<th><?php esc_html_e( 'Abonné', 'cpfa-core' ); ?></th>
						<th><?php esc_html_e( 'Ressource', 'cpfa-core' ); ?></th>
						<th><?php esc_html_e( 'Retour prévu', 'cpfa-core' ); ?></th>
						<th><?php esc_html_e( 'Statut', 'cpfa-core' ); ?></th>
					</tr>
				</thead>
				<tbody>
					<?php foreach ( $recent_loans as $loan ) : ?>
						<?php
						$subscriber_id      = get_post_meta( $loan->ID, '_cpfa_emprunt_abonne_id', true );
						$resource_id        = get_post_meta( $loan->ID, '_cpfa_emprunt_ressource_id', true );
						$date_retour_prevue = get_post_meta( $loan->ID, '_cpfa_emprunt_date_retour_prevue', true );
						$statut             = get_post_meta( $loan->ID, '_cpfa_emprunt_statut', true );

						$subscriber_name = get_post_meta( $subscriber_id, '_cpfa_abonnement_nom', true );
						$resource_title  = get_the_title( $resource_id );

						$is_overdue = 'en_cours' === $statut && strtotime( $date_retour_prevue ) < time();
						?>
						<tr>
							<td><?php echo esc_html( get_the_date( '', $loan ) ); ?></td>
							<td><?php echo esc_html( $subscriber_name ); ?></td>
							<td><?php echo esc_html( $resource_title ); ?></td>
							<td class="<?php echo $is_overdue ? 'overdue' : ''; ?>">
								<?php echo esc_html( gmdate( 'd/m/Y', strtotime( $date_retour_prevue ) ) ); ?>
							</td>
							<td>
								<span class="status-badge status-<?php echo esc_attr( $statut ); ?>">
									<?php
									$statuts = array(
										'en_cours' => __( 'En cours', 'cpfa-core' ),
										'termine'  => __( 'Terminé', 'cpfa-core' ),
									);
									echo esc_html( $statuts[ $statut ] ?? $statut );
									?>
								</span>
							</td>
						</tr>
					<?php endforeach; ?>
				</tbody>
			</table>
		<?php else : ?>
			<p><?php esc_html_e( 'Aucune activité récente.', 'cpfa-core' ); ?></p>
		<?php endif; ?>
	</div>
</div>
