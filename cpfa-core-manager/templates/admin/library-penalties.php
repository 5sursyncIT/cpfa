<?php
/**
 * Library Penalties Template
 *
 * @package CpfaCore
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>

<div class="wrap cpfa-library-penalties">
	<h1><?php esc_html_e( 'Gestion des pénalités', 'cpfa-core' ); ?></h1>

	<?php if ( ! empty( $loans_with_penalties ) ) : ?>
		<div class="cpfa-penalties-summary">
			<?php
			$total_unpaid = 0;
			foreach ( $loans_with_penalties as $loan ) {
				$penalty      = get_post_meta( $loan->ID, '_cpfa_emprunt_penalite', true );
				$penalty_paid = get_post_meta( $loan->ID, '_cpfa_emprunt_penalite_payee', true );

				if ( '1' !== $penalty_paid ) {
					$total_unpaid += (int) $penalty;
				}
			}
			?>
			<div class="notice notice-warning">
				<p>
					<strong><?php esc_html_e( 'Total des pénalités impayées:', 'cpfa-core' ); ?></strong>
					<?php echo esc_html( number_format_i18n( $total_unpaid ) ); ?> FCFA
				</p>
			</div>
		</div>

		<table class="wp-list-table widefat fixed striped">
			<thead>
				<tr>
					<th><?php esc_html_e( 'Abonné', 'cpfa-core' ); ?></th>
					<th><?php esc_html_e( 'Ressource', 'cpfa-core' ); ?></th>
					<th><?php esc_html_e( 'Date retour prévue', 'cpfa-core' ); ?></th>
					<th><?php esc_html_e( 'Date retour effective', 'cpfa-core' ); ?></th>
					<th><?php esc_html_e( 'Jours de retard', 'cpfa-core' ); ?></th>
					<th><?php esc_html_e( 'Pénalité', 'cpfa-core' ); ?></th>
					<th><?php esc_html_e( 'Statut paiement', 'cpfa-core' ); ?></th>
					<th><?php esc_html_e( 'Action', 'cpfa-core' ); ?></th>
				</tr>
			</thead>
			<tbody>
				<?php foreach ( $loans_with_penalties as $loan ) : ?>
					<?php
					$subscriber_id        = get_post_meta( $loan->ID, '_cpfa_emprunt_abonne_id', true );
					$resource_id          = get_post_meta( $loan->ID, '_cpfa_emprunt_ressource_id', true );
					$date_retour_prevue   = get_post_meta( $loan->ID, '_cpfa_emprunt_date_retour_prevue', true );
					$date_retour_effective = get_post_meta( $loan->ID, '_cpfa_emprunt_date_retour_effective', true );
					$penalty              = get_post_meta( $loan->ID, '_cpfa_emprunt_penalite', true );
					$penalty_paid         = get_post_meta( $loan->ID, '_cpfa_emprunt_penalite_payee', true );

					$subscriber_name = get_post_meta( $subscriber_id, '_cpfa_abonnement_nom', true );
					$subscriber_num  = get_post_meta( $subscriber_id, '_cpfa_abonnement_numero_membre', true );
					$resource_title  = get_the_title( $resource_id );

					$days_late = 0;
					if ( ! empty( $date_retour_prevue ) ) {
						if ( ! empty( $date_retour_effective ) ) {
							$days_late = max( 0, floor( ( strtotime( $date_retour_effective ) - strtotime( $date_retour_prevue ) ) / DAY_IN_SECONDS ) );
						} else {
							$days_late = max( 0, floor( ( time() - strtotime( $date_retour_prevue ) ) / DAY_IN_SECONDS ) );
						}
					}

					$is_paid = '1' === $penalty_paid;
					?>
					<tr class="<?php echo $is_paid ? '' : 'unpaid-penalty'; ?>">
						<td>
							<strong><?php echo esc_html( $subscriber_name ); ?></strong>
							<div class="row-actions">
								<span><?php echo esc_html( $subscriber_num ); ?></span>
							</div>
						</td>
						<td>
							<strong><?php echo esc_html( $resource_title ); ?></strong>
							<div class="row-actions">
								<span><?php echo esc_html( get_post_meta( $resource_id, '_cpfa_ressource_cote', true ) ); ?></span>
							</div>
						</td>
						<td><?php echo esc_html( $date_retour_prevue ? gmdate( 'd/m/Y', strtotime( $date_retour_prevue ) ) : '-' ); ?></td>
						<td><?php echo esc_html( $date_retour_effective ? gmdate( 'd/m/Y', strtotime( $date_retour_effective ) ) : __( 'Non retourné', 'cpfa-core' ) ); ?></td>
						<td>
							<span class="badge badge-warning"><?php echo esc_html( $days_late ); ?> jours</span>
						</td>
						<td>
							<strong class="penalty-amount"><?php echo esc_html( number_format_i18n( (int) $penalty ) ); ?> FCFA</strong>
							<div class="row-actions">
								<span class="penalty-calc">
									<?php
									/* translators: 1: number of days, 2: penalty rate */
									echo esc_html( sprintf( __( '(%d - 3) × 500 FCFA', 'cpfa-core' ), $days_late ) );
									?>
								</span>
							</div>
						</td>
						<td>
							<?php if ( $is_paid ) : ?>
								<span class="badge badge-success">
									<span class="dashicons dashicons-yes-alt"></span>
									<?php esc_html_e( 'Payée', 'cpfa-core' ); ?>
								</span>
							<?php else : ?>
								<span class="badge badge-danger">
									<span class="dashicons dashicons-warning"></span>
									<?php esc_html_e( 'Impayée', 'cpfa-core' ); ?>
								</span>
							<?php endif; ?>
						</td>
						<td>
							<?php if ( ! $is_paid ) : ?>
								<button type="button" class="button button-small cpfa-mark-paid-btn" data-loan-id="<?php echo esc_attr( $loan->ID ); ?>">
									<?php esc_html_e( 'Marquer comme payée', 'cpfa-core' ); ?>
								</button>
							<?php else : ?>
								<button type="button" class="button button-small" disabled>
									<?php esc_html_e( 'Payée', 'cpfa-core' ); ?>
								</button>
							<?php endif; ?>
						</td>
					</tr>
				<?php endforeach; ?>
			</tbody>
		</table>
	<?php else : ?>
		<div class="notice notice-success">
			<p><?php esc_html_e( 'Aucune pénalité enregistrée. Excellent !', 'cpfa-core' ); ?></p>
		</div>
	<?php endif; ?>

	<div id="penalty-message" class="notice" style="display: none; margin-top: 20px;"></div>
</div>
