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

<?php
// Récupérer tous les abonnés actifs
$abonnes = get_posts(
	array(
		'post_type'      => 'cpfa_abonnement',
		'posts_per_page' => -1,
		'post_status'    => 'publish',
		'meta_query'     => array(
			array(
				'key'     => '_cpfa_abonnement_statut',
				'value'   => 'active',
				'compare' => '=',
			),
		),
		'orderby'        => 'title',
		'order'          => 'ASC',
	)
);

// Récupérer toutes les ressources disponibles
$ressources = get_posts(
	array(
		'post_type'      => 'cpfa_ressource',
		'posts_per_page' => -1,
		'post_status'    => 'publish',
		'meta_query'     => array(
			array(
				'key'     => '_cpfa_ressource_exclu_pret',
				'value'   => '1',
				'compare' => '!=',
			),
		),
		'orderby'        => 'title',
		'order'          => 'ASC',
	)
);
?>

<div class="wrap cpfa-library-checkout">
	<h1><?php esc_html_e( 'Enregistrer un emprunt', 'cpfa-core' ); ?></h1>

	<div class="cpfa-checkout-form">
		<form id="cpfa-checkout-form" class="cpfa-form">
			<div class="form-section">
				<h2><?php esc_html_e( '1. Sélectionner l\'abonné', 'cpfa-core' ); ?></h2>
				<div class="form-field">
					<label for="subscriber-id"><?php esc_html_e( 'Rechercher un abonné', 'cpfa-core' ); ?></label>
					<select id="subscriber-id" name="subscriber_id" class="regular-text">
						<option value=""><?php esc_html_e( '-- Sélectionner un abonné --', 'cpfa-core' ); ?></option>
						<?php foreach ( $abonnes as $abonne_post ) : ?>
							<?php
							$nom = get_post_meta( $abonne_post->ID, '_cpfa_abonnement_nom', true );
							$prenom = get_post_meta( $abonne_post->ID, '_cpfa_abonnement_prenom', true );
							$numero_carte = get_post_meta( $abonne_post->ID, '_cpfa_abonnement_numero_carte', true );
							$type = get_post_meta( $abonne_post->ID, '_cpfa_abonnement_type', true );
							$display_name = trim( $prenom . ' ' . $nom );
							if ( $numero_carte ) {
								$display_name .= ' (' . $numero_carte . ')';
							}
							?>
							<option value="<?php echo esc_attr( $abonne_post->ID ); ?>"
									data-name="<?php echo esc_attr( trim( $prenom . ' ' . $nom ) ); ?>"
									data-number="<?php echo esc_attr( $numero_carte ); ?>"
									data-type="<?php echo esc_attr( $type ); ?>"
									data-status="active">
								<?php echo esc_html( $display_name ); ?>
							</option>
						<?php endforeach; ?>
					</select>
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
					<label for="resource-id"><?php esc_html_e( 'Rechercher une ressource', 'cpfa-core' ); ?></label>
					<select id="resource-id" name="resource_id" class="regular-text">
						<option value=""><?php esc_html_e( '-- Sélectionner une ressource --', 'cpfa-core' ); ?></option>
						<?php foreach ( $ressources as $ressource_post ) : ?>
							<?php
							$cote = get_post_meta( $ressource_post->ID, '_cpfa_ressource_cote', true );
							$auteurs = get_post_meta( $ressource_post->ID, '_cpfa_ressource_auteurs', true );
							$display_name = $ressource_post->post_title;
							if ( $cote ) {
								$display_name .= ' [' . $cote . ']';
							}
							if ( $auteurs ) {
								$display_name .= ' - ' . $auteurs;
							}
							?>
							<option value="<?php echo esc_attr( $ressource_post->ID ); ?>"
									data-title="<?php echo esc_attr( $ressource_post->post_title ); ?>"
									data-cote="<?php echo esc_attr( $cote ); ?>"
									data-author="<?php echo esc_attr( $auteurs ); ?>"
									data-type="<?php echo esc_attr( get_post_type( $ressource_post->ID ) ); ?>">
								<?php echo esc_html( $display_name ); ?>
							</option>
						<?php endforeach; ?>
					</select>
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
