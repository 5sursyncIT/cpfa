<?php
/**
 * Library Return Template
 *
 * @package CpfaCore
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>

<div class="wrap cpfa-library-return">
	<h1><?php esc_html_e( 'Enregistrer un retour', 'cpfa-core' ); ?></h1>

	<?php if ( ! empty( $active_loans ) ) : ?>
		<div class="cpfa-loans-list">
			<table class="wp-list-table widefat fixed striped">
				<thead>
					<tr>
						<th><?php esc_html_e( 'Abonné', 'cpfa-core' ); ?></th>
						<th><?php esc_html_e( 'Ressource', 'cpfa-core' ); ?></th>
						<th><?php esc_html_e( 'Date emprunt', 'cpfa-core' ); ?></th>
						<th><?php esc_html_e( 'Retour prévu', 'cpfa-core' ); ?></th>
						<th><?php esc_html_e( 'Jours restants', 'cpfa-core' ); ?></th>
						<th><?php esc_html_e( 'Pénalité estimée', 'cpfa-core' ); ?></th>
						<th><?php esc_html_e( 'Action', 'cpfa-core' ); ?></th>
					</tr>
				</thead>
				<tbody>
					<?php foreach ( $active_loans as $loan ) : ?>
						<?php
						$subscriber_id      = get_post_meta( $loan->ID, '_cpfa_emprunt_abonne', true );
						$resource_id        = get_post_meta( $loan->ID, '_cpfa_emprunt_ressource', true );
						$date_emprunt       = get_post_meta( $loan->ID, '_cpfa_emprunt_date_emprunt', true );
						$date_retour_prevue = get_post_meta( $loan->ID, '_cpfa_emprunt_date_retour_prevue', true );

						$subscriber_name = get_post_meta( $subscriber_id, '_cpfa_abonnement_nom', true );
						$resource_title  = get_the_title( $resource_id );

						$today          = strtotime( gmdate( 'Y-m-d' ) );
						$due_date       = strtotime( $date_retour_prevue );
						$days_remaining = floor( ( $due_date - $today ) / DAY_IN_SECONDS );

						// Calculate penalty.
						$days_late = max( 0, -$days_remaining );
						$penalty   = max( 0, ( $days_late - 3 ) * 500 );

						$is_overdue = $days_remaining < 0;
						?>
						<tr class="<?php echo $is_overdue ? 'overdue' : ''; ?>">
							<td>
								<strong><?php echo esc_html( $subscriber_name ); ?></strong>
								<div class="row-actions">
									<span><?php echo esc_html( get_post_meta( $subscriber_id, '_cpfa_abonnement_numero_membre', true ) ); ?></span>
								</div>
							</td>
							<td>
								<strong><?php echo esc_html( $resource_title ); ?></strong>
								<div class="row-actions">
									<span><?php echo esc_html( get_post_meta( $resource_id, '_cpfa_ressource_cote', true ) ); ?></span>
								</div>
							</td>
							<td><?php echo esc_html( gmdate( 'd/m/Y', strtotime( $date_emprunt ) ) ); ?></td>
							<td class="<?php echo $is_overdue ? 'overdue-text' : ''; ?>">
								<?php echo esc_html( gmdate( 'd/m/Y', $due_date ) ); ?>
							</td>
							<td>
								<?php if ( $is_overdue ) : ?>
									<span class="badge badge-danger">
										<?php
										/* translators: %d: number of days */
										echo esc_html( sprintf( __( '%d jours de retard', 'cpfa-core' ), abs( $days_remaining ) ) );
										?>
									</span>
								<?php else : ?>
									<span class="badge badge-success">
										<?php
										/* translators: %d: number of days */
										echo esc_html( sprintf( __( '%d jours', 'cpfa-core' ), $days_remaining ) );
										?>
									</span>
								<?php endif; ?>
							</td>
							<td>
								<?php if ( $penalty > 0 ) : ?>
									<span class="penalty-amount"><?php echo esc_html( number_format_i18n( $penalty ) ); ?> FCFA</span>
								<?php else : ?>
									<span class="no-penalty">-</span>
								<?php endif; ?>
							</td>
							<td>
								<button type="button" class="button button-primary cpfa-return-btn" data-loan-id="<?php echo esc_attr( $loan->ID ); ?>">
									<span class="dashicons dashicons-arrow-left-alt"></span>
									<?php esc_html_e( 'Retourner', 'cpfa-core' ); ?>
								</button>
							</td>
						</tr>
					<?php endforeach; ?>
				</tbody>
			</table>
		</div>
	<?php else : ?>
		<div class="notice notice-info">
			<p><?php esc_html_e( 'Aucun emprunt en cours.', 'cpfa-core' ); ?></p>
		</div>
		<p>
			<a href="<?php echo esc_url( admin_url( 'admin.php?page=cpfa-library-checkout' ) ); ?>" class="button button-primary">
				<?php esc_html_e( 'Enregistrer un nouvel emprunt', 'cpfa-core' ); ?>
			</a>
		</p>
	<?php endif; ?>

	<div id="return-message" class="notice" style="display: none; margin-top: 20px;"></div>
</div>
