<?php
/**
 * Library Checkout Template
 *
 * @package CpfaCore
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>

<div class="wrap cpfa-library-checkout">
	<h1><?php esc_html_e( 'Enregistrer un emprunt', 'cpfa-core' ); ?></h1>

	<div class="cpfa-checkout-form">
		<form id="cpfa-checkout-form" class="cpfa-form">
			<div class="form-section">
				<h2><?php esc_html_e( '1. Sélectionner l\'abonné', 'cpfa-core' ); ?></h2>
				<div class="form-field">
					<label for="subscriber-search"><?php esc_html_e( 'Rechercher un abonné', 'cpfa-core' ); ?></label>
					<input type="text" id="subscriber-search" class="regular-text" placeholder="<?php esc_attr_e( 'Nom ou numéro de membre...', 'cpfa-core' ); ?>" />
					<input type="hidden" id="subscriber-id" name="subscriber_id" value="" />
					<p class="description"><?php esc_html_e( 'Tapez le nom ou le numéro de membre pour rechercher', 'cpfa-core' ); ?></p>
				</div>

				<div id="subscriber-info" class="info-card" style="display: none;">
					<h3><?php esc_html_e( 'Informations de l\'abonné', 'cpfa-core' ); ?></h3>
					<div class="info-grid">
						<div><strong><?php esc_html_e( 'Nom:', 'cpfa-core' ); ?></strong> <span id="subscriber-name"></span></div>
						<div><strong><?php esc_html_e( 'Numéro:', 'cpfa-core' ); ?></strong> <span id="subscriber-number"></span></div>
						<div><strong><?php esc_html_e( 'Type:', 'cpfa-core' ); ?></strong> <span id="subscriber-type"></span></div>
						<div><strong><?php esc_html_e( 'Statut:', 'cpfa-core' ); ?></strong> <span id="subscriber-status"></span></div>
					</div>
				</div>
			</div>

			<div class="form-section">
				<h2><?php esc_html_e( '2. Sélectionner la ressource', 'cpfa-core' ); ?></h2>
				<div class="form-field">
					<label for="resource-search"><?php esc_html_e( 'Rechercher une ressource', 'cpfa-core' ); ?></label>
					<input type="text" id="resource-search" class="regular-text" placeholder="<?php esc_attr_e( 'Titre ou cote...', 'cpfa-core' ); ?>" />
					<input type="hidden" id="resource-id" name="resource_id" value="" />
					<p class="description"><?php esc_html_e( 'Tapez le titre ou la cote pour rechercher', 'cpfa-core' ); ?></p>
				</div>

				<div id="resource-info" class="info-card" style="display: none;">
					<h3><?php esc_html_e( 'Informations de la ressource', 'cpfa-core' ); ?></h3>
					<div class="info-grid">
						<div><strong><?php esc_html_e( 'Titre:', 'cpfa-core' ); ?></strong> <span id="resource-title"></span></div>
						<div><strong><?php esc_html_e( 'Cote:', 'cpfa-core' ); ?></strong> <span id="resource-cote"></span></div>
						<div><strong><?php esc_html_e( 'Type:', 'cpfa-core' ); ?></strong> <span id="resource-type"></span></div>
						<div><strong><?php esc_html_e( 'Auteur:', 'cpfa-core' ); ?></strong> <span id="resource-author"></span></div>
					</div>
				</div>
			</div>

			<div class="form-section">
				<h2><?php esc_html_e( '3. Détails de l\'emprunt', 'cpfa-core' ); ?></h2>
				<div class="loan-details">
					<div class="detail-item">
						<strong><?php esc_html_e( 'Date d\'emprunt:', 'cpfa-core' ); ?></strong>
						<span><?php echo esc_html( gmdate( 'd/m/Y' ) ); ?></span>
					</div>
					<div class="detail-item">
						<strong><?php esc_html_e( 'Date de retour prévue:', 'cpfa-core' ); ?></strong>
						<span><?php echo esc_html( gmdate( 'd/m/Y', strtotime( '+30 days' ) ) ); ?></span>
					</div>
					<div class="detail-item">
						<strong><?php esc_html_e( 'Durée:', 'cpfa-core' ); ?></strong>
						<span><?php esc_html_e( '30 jours', 'cpfa-core' ); ?></span>
					</div>
					<div class="detail-item info-box">
						<span class="dashicons dashicons-info"></span>
						<span><?php esc_html_e( 'Pénalité de 500 FCFA/jour à partir du 4ème jour de retard', 'cpfa-core' ); ?></span>
					</div>
				</div>
			</div>

			<div class="form-actions">
				<button type="submit" class="button button-primary button-large" id="submit-checkout">
					<span class="dashicons dashicons-yes"></span>
					<?php esc_html_e( 'Enregistrer l\'emprunt', 'cpfa-core' ); ?>
				</button>
				<a href="<?php echo esc_url( admin_url( 'admin.php?page=cpfa-library' ) ); ?>" class="button button-large">
					<?php esc_html_e( 'Annuler', 'cpfa-core' ); ?>
				</a>
			</div>

			<div id="checkout-message" class="notice" style="display: none;"></div>
		</form>
	</div>
</div>
