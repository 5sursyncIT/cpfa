<?php
/**
 * Meta Boxes Handler
 *
 * @package CpfaCore
 */

namespace Cpfa\Core\MetaBoxes;

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Meta Boxes class.
 */
class Meta_Boxes {

	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'add_meta_boxes', array( $this, 'add_meta_boxes' ) );
		add_action( 'save_post', array( $this, 'save_meta_boxes' ), 10, 2 );
	}

	/**
	 * Add meta boxes for all CPTs.
	 */
	public function add_meta_boxes() {
		// Formation meta box.
		add_meta_box(
			'cpfa_formation_details',
			__( 'Détails de la formation', 'cpfa-core' ),
			array( $this, 'render_formation_meta_box' ),
			'cpfa_formation',
			'normal',
			'high'
		);

		// Seminaire meta box.
		add_meta_box(
			'cpfa_seminaire_details',
			__( 'Détails du séminaire', 'cpfa-core' ),
			array( $this, 'render_seminaire_meta_box' ),
			'cpfa_seminaire',
			'normal',
			'high'
		);

		// Concours meta box.
		add_meta_box(
			'cpfa_concours_details',
			__( 'Détails du concours', 'cpfa-core' ),
			array( $this, 'render_concours_meta_box' ),
			'cpfa_concours',
			'normal',
			'high'
		);

		// Ressource meta box.
		add_meta_box(
			'cpfa_ressource_details',
			__( 'Informations bibliographiques', 'cpfa-core' ),
			array( $this, 'render_ressource_meta_box' ),
			'cpfa_ressource',
			'normal',
			'high'
		);

		// Abonnement meta box.
		add_meta_box(
			'cpfa_abonnement_details',
			__( 'Détails de l\'abonnement', 'cpfa-core' ),
			array( $this, 'render_abonnement_meta_box' ),
			'cpfa_abonnement',
			'normal',
			'high'
		);

		// Emprunt meta box.
		add_meta_box(
			'cpfa_emprunt_details',
			__( 'Détails de l\'emprunt', 'cpfa-core' ),
			array( $this, 'render_emprunt_meta_box' ),
			'cpfa_emprunt',
			'normal',
			'high'
		);
	}

	/**
	 * Render Formation meta box.
	 *
	 * @param \WP_Post $post Post object.
	 */
	public function render_formation_meta_box( $post ) {
		wp_nonce_field( 'cpfa_formation_meta_box', 'cpfa_formation_meta_box_nonce' );

		$type    = get_post_meta( $post->ID, '_cpfa_formation_type', true );
		$duree   = get_post_meta( $post->ID, '_cpfa_formation_duree', true );
		$niveau  = get_post_meta( $post->ID, '_cpfa_formation_niveau', true );
		$prix    = get_post_meta( $post->ID, '_cpfa_formation_prix', true );
		$brochure = get_post_meta( $post->ID, '_cpfa_formation_brochure', true );

		?>
		<table class="form-table">
			<tr>
				<th><label for="cpfa_formation_type"><?php esc_html_e( 'Type', 'cpfa-core' ); ?></label></th>
				<td>
					<select name="cpfa_formation_type" id="cpfa_formation_type" class="regular-text">
						<option value="diplomante" <?php selected( $type, 'diplomante' ); ?>><?php esc_html_e( 'Diplômante', 'cpfa-core' ); ?></option>
						<option value="certifiante" <?php selected( $type, 'certifiante' ); ?>><?php esc_html_e( 'Certifiante', 'cpfa-core' ); ?></option>
						<option value="qualifiante" <?php selected( $type, 'qualifiante' ); ?>><?php esc_html_e( 'Qualifiante', 'cpfa-core' ); ?></option>
					</select>
				</td>
			</tr>
			<tr>
				<th><label for="cpfa_formation_duree"><?php esc_html_e( 'Durée (heures)', 'cpfa-core' ); ?></label></th>
				<td><input type="number" name="cpfa_formation_duree" id="cpfa_formation_duree" value="<?php echo esc_attr( $duree ); ?>" class="regular-text" /></td>
			</tr>
			<tr>
				<th><label for="cpfa_formation_niveau"><?php esc_html_e( 'Niveau requis', 'cpfa-core' ); ?></label></th>
				<td><input type="text" name="cpfa_formation_niveau" id="cpfa_formation_niveau" value="<?php echo esc_attr( $niveau ); ?>" class="regular-text" /></td>
			</tr>
			<tr>
				<th><label for="cpfa_formation_prix"><?php esc_html_e( 'Prix (FCFA)', 'cpfa-core' ); ?></label></th>
				<td><input type="number" name="cpfa_formation_prix" id="cpfa_formation_prix" value="<?php echo esc_attr( $prix ); ?>" class="regular-text" /></td>
			</tr>
			<tr>
				<th><label for="cpfa_formation_brochure"><?php esc_html_e( 'Brochure PDF (URL)', 'cpfa-core' ); ?></label></th>
				<td>
					<input type="url" name="cpfa_formation_brochure" id="cpfa_formation_brochure" value="<?php echo esc_url( $brochure ); ?>" class="regular-text" />
					<button type="button" class="button cpfa-upload-button"><?php esc_html_e( 'Télécharger', 'cpfa-core' ); ?></button>
				</td>
			</tr>
		</table>
		<?php
	}

	/**
	 * Render Seminaire meta box.
	 *
	 * @param \WP_Post $post Post object.
	 */
	public function render_seminaire_meta_box( $post ) {
		wp_nonce_field( 'cpfa_seminaire_meta_box', 'cpfa_seminaire_meta_box_nonce' );

		$dates   = get_post_meta( $post->ID, '_cpfa_seminaire_dates', true );
		$lieu    = get_post_meta( $post->ID, '_cpfa_seminaire_lieu', true );
		$quota   = get_post_meta( $post->ID, '_cpfa_seminaire_quota', true );
		$prix    = get_post_meta( $post->ID, '_cpfa_seminaire_prix', true );
		$affiche = get_post_meta( $post->ID, '_cpfa_seminaire_affiche', true );

		?>
		<table class="form-table">
			<tr>
				<th><label for="cpfa_seminaire_dates"><?php esc_html_e( 'Dates', 'cpfa-core' ); ?></label></th>
				<td><input type="text" name="cpfa_seminaire_dates" id="cpfa_seminaire_dates" value="<?php echo esc_attr( $dates ); ?>" class="regular-text" placeholder="ex: 15-17 juin 2025" /></td>
			</tr>
			<tr>
				<th><label for="cpfa_seminaire_lieu"><?php esc_html_e( 'Lieu', 'cpfa-core' ); ?></label></th>
				<td><input type="text" name="cpfa_seminaire_lieu" id="cpfa_seminaire_lieu" value="<?php echo esc_attr( $lieu ); ?>" class="regular-text" /></td>
			</tr>
			<tr>
				<th><label for="cpfa_seminaire_quota"><?php esc_html_e( 'Quota participants', 'cpfa-core' ); ?></label></th>
				<td><input type="number" name="cpfa_seminaire_quota" id="cpfa_seminaire_quota" value="<?php echo esc_attr( $quota ); ?>" class="regular-text" /></td>
			</tr>
			<tr>
				<th><label for="cpfa_seminaire_prix"><?php esc_html_e( 'Prix (FCFA)', 'cpfa-core' ); ?></label></th>
				<td><input type="number" name="cpfa_seminaire_prix" id="cpfa_seminaire_prix" value="<?php echo esc_attr( $prix ); ?>" class="regular-text" /></td>
			</tr>
			<tr>
				<th><label for="cpfa_seminaire_affiche"><?php esc_html_e( 'Affiche (URL)', 'cpfa-core' ); ?></label></th>
				<td>
					<input type="url" name="cpfa_seminaire_affiche" id="cpfa_seminaire_affiche" value="<?php echo esc_url( $affiche ); ?>" class="regular-text" />
					<button type="button" class="button cpfa-upload-button"><?php esc_html_e( 'Télécharger', 'cpfa-core' ); ?></button>
				</td>
			</tr>
		</table>
		<?php
	}

	/**
	 * Render Concours meta box.
	 *
	 * @param \WP_Post $post Post object.
	 */
	public function render_concours_meta_box( $post ) {
		wp_nonce_field( 'cpfa_concours_meta_box', 'cpfa_concours_meta_box_nonce' );

		$calendrier = get_post_meta( $post->ID, '_cpfa_concours_calendrier', true );
		$conditions = get_post_meta( $post->ID, '_cpfa_concours_conditions', true );
		$pieces     = get_post_meta( $post->ID, '_cpfa_concours_pieces', true );

		?>
		<table class="form-table">
			<tr>
				<th><label for="cpfa_concours_calendrier"><?php esc_html_e( 'Calendrier', 'cpfa-core' ); ?></label></th>
				<td><textarea name="cpfa_concours_calendrier" id="cpfa_concours_calendrier" rows="5" class="large-text"><?php echo esc_textarea( $calendrier ); ?></textarea></td>
			</tr>
			<tr>
				<th><label for="cpfa_concours_conditions"><?php esc_html_e( 'Conditions d\'admission', 'cpfa-core' ); ?></label></th>
				<td><textarea name="cpfa_concours_conditions" id="cpfa_concours_conditions" rows="5" class="large-text"><?php echo esc_textarea( $conditions ); ?></textarea></td>
			</tr>
			<tr>
				<th><label for="cpfa_concours_pieces"><?php esc_html_e( 'Pièces à fournir', 'cpfa-core' ); ?></label></th>
				<td><textarea name="cpfa_concours_pieces" id="cpfa_concours_pieces" rows="5" class="large-text"><?php echo esc_textarea( $pieces ); ?></textarea></td>
			</tr>
		</table>
		<?php
	}

	/**
	 * Render Ressource meta box.
	 *
	 * @param \WP_Post $post Post object.
	 */
	public function render_ressource_meta_box( $post ) {
		wp_nonce_field( 'cpfa_ressource_meta_box', 'cpfa_ressource_meta_box_nonce' );

		$cote        = get_post_meta( $post->ID, '_cpfa_ressource_cote', true );
		$auteurs     = get_post_meta( $post->ID, '_cpfa_ressource_auteurs', true );
		$mots_cles   = get_post_meta( $post->ID, '_cpfa_ressource_mots_cles', true );
		$statut_pret = get_post_meta( $post->ID, '_cpfa_ressource_statut_pret', true );
		$exclu_pret  = get_post_meta( $post->ID, '_cpfa_ressource_exclu_pret', true );

		?>
		<table class="form-table">
			<tr>
				<th><label for="cpfa_ressource_cote"><?php esc_html_e( 'Cote', 'cpfa-core' ); ?></label></th>
				<td><input type="text" name="cpfa_ressource_cote" id="cpfa_ressource_cote" value="<?php echo esc_attr( $cote ); ?>" class="regular-text" /></td>
			</tr>
			<tr>
				<th><label for="cpfa_ressource_auteurs"><?php esc_html_e( 'Auteur(s)', 'cpfa-core' ); ?></label></th>
				<td><input type="text" name="cpfa_ressource_auteurs" id="cpfa_ressource_auteurs" value="<?php echo esc_attr( $auteurs ); ?>" class="regular-text" /></td>
			</tr>
			<tr>
				<th><label for="cpfa_ressource_mots_cles"><?php esc_html_e( 'Mots-clés', 'cpfa-core' ); ?></label></th>
				<td><input type="text" name="cpfa_ressource_mots_cles" id="cpfa_ressource_mots_cles" value="<?php echo esc_attr( $mots_cles ); ?>" class="regular-text" placeholder="Séparés par des virgules" /></td>
			</tr>
			<tr>
				<th><label for="cpfa_ressource_statut_pret"><?php esc_html_e( 'Statut prêt', 'cpfa-core' ); ?></label></th>
				<td>
					<select name="cpfa_ressource_statut_pret" id="cpfa_ressource_statut_pret" class="regular-text">
						<option value="disponible" <?php selected( $statut_pret, 'disponible' ); ?>><?php esc_html_e( 'Disponible', 'cpfa-core' ); ?></option>
						<option value="emprunte" <?php selected( $statut_pret, 'emprunte' ); ?>><?php esc_html_e( 'Emprunté', 'cpfa-core' ); ?></option>
						<option value="reserve" <?php selected( $statut_pret, 'reserve' ); ?>><?php esc_html_e( 'Réservé', 'cpfa-core' ); ?></option>
					</select>
				</td>
			</tr>
			<tr>
				<th><label for="cpfa_ressource_exclu_pret"><?php esc_html_e( 'Exclu du prêt', 'cpfa-core' ); ?></label></th>
				<td>
					<label>
						<input type="checkbox" name="cpfa_ressource_exclu_pret" id="cpfa_ressource_exclu_pret" value="1" <?php checked( $exclu_pret, '1' ); ?> />
						<?php esc_html_e( 'Cette ressource ne peut pas être empruntée', 'cpfa-core' ); ?>
					</label>
				</td>
			</tr>
		</table>
		<?php
	}

	/**
	 * Render Abonnement meta box.
	 *
	 * @param \WP_Post $post Post object.
	 */
	public function render_abonnement_meta_box( $post ) {
		wp_nonce_field( 'cpfa_abonnement_meta_box', 'cpfa_abonnement_meta_box_nonce' );

		$membre      = get_post_meta( $post->ID, '_cpfa_abonnement_membre', true );
		$type        = get_post_meta( $post->ID, '_cpfa_abonnement_type', true );
		$date_debut  = get_post_meta( $post->ID, '_cpfa_abonnement_date_debut', true );
		$date_fin    = get_post_meta( $post->ID, '_cpfa_abonnement_date_fin', true );
		$statut      = get_post_meta( $post->ID, '_cpfa_abonnement_statut', true );
		$caution     = get_post_meta( $post->ID, '_cpfa_abonnement_caution', true );
		$numero_carte = get_post_meta( $post->ID, '_cpfa_abonnement_numero_carte', true );

		?>
		<table class="form-table">
			<?php if ( $numero_carte ) : ?>
			<tr>
				<th><label for="cpfa_abonnement_numero_carte"><?php esc_html_e( 'Numéro de Carte', 'cpfa-core' ); ?></label></th>
				<td><input type="text" id="cpfa_abonnement_numero_carte" value="<?php echo esc_attr( $numero_carte ); ?>" class="regular-text" readonly /></td>
			</tr>
			<?php endif; ?>
			<tr>
				<th><label for="cpfa_abonnement_membre"><?php esc_html_e( 'Membre (ID ou nom)', 'cpfa-core' ); ?></label></th>
				<td><input type="text" name="cpfa_abonnement_membre" id="cpfa_abonnement_membre" value="<?php echo esc_attr( $membre ); ?>" class="regular-text" /></td>
			</tr>
			<tr>
				<th><label for="cpfa_abonnement_type"><?php esc_html_e( 'Type d\'abonnement', 'cpfa-core' ); ?></label></th>
				<td>
					<select name="cpfa_abonnement_type" id="cpfa_abonnement_type" class="regular-text">
						<option value="etudiant" <?php selected( $type, 'etudiant' ); ?>><?php esc_html_e( 'Étudiant (10,000 FCFA)', 'cpfa-core' ); ?></option>
						<option value="professionnel" <?php selected( $type, 'professionnel' ); ?>><?php esc_html_e( 'Professionnel (15,000 FCFA)', 'cpfa-core' ); ?></option>
						<option value="emprunt_domicile" <?php selected( $type, 'emprunt_domicile' ); ?>><?php esc_html_e( 'Emprunt domicile (50,000 FCFA)', 'cpfa-core' ); ?></option>
					</select>
				</td>
			</tr>
			<tr>
				<th><label for="cpfa_abonnement_date_debut"><?php esc_html_e( 'Date début', 'cpfa-core' ); ?></label></th>
				<td><input type="date" name="cpfa_abonnement_date_debut" id="cpfa_abonnement_date_debut" value="<?php echo esc_attr( $date_debut ); ?>" class="regular-text" /></td>
			</tr>
			<tr>
				<th><label for="cpfa_abonnement_date_fin"><?php esc_html_e( 'Date fin', 'cpfa-core' ); ?></label></th>
				<td><input type="date" name="cpfa_abonnement_date_fin" id="cpfa_abonnement_date_fin" value="<?php echo esc_attr( $date_fin ); ?>" class="regular-text" /></td>
			</tr>
			<tr>
				<th><label for="cpfa_abonnement_statut"><?php esc_html_e( 'Statut', 'cpfa-core' ); ?></label></th>
				<td>
					<select name="cpfa_abonnement_statut" id="cpfa_abonnement_statut" class="regular-text">
						<option value="actif" <?php selected( $statut, 'actif' ); ?>><?php esc_html_e( 'Actif', 'cpfa-core' ); ?></option>
						<option value="expire" <?php selected( $statut, 'expire' ); ?>><?php esc_html_e( 'Expiré', 'cpfa-core' ); ?></option>
						<option value="suspendu" <?php selected( $statut, 'suspendu' ); ?>><?php esc_html_e( 'Suspendu', 'cpfa-core' ); ?></option>
					</select>
				</td>
			</tr>
			<tr>
				<th><label for="cpfa_abonnement_caution"><?php esc_html_e( 'Caution (FCFA)', 'cpfa-core' ); ?></label></th>
				<td><input type="number" name="cpfa_abonnement_caution" id="cpfa_abonnement_caution" value="<?php echo esc_attr( $caution ); ?>" class="regular-text" placeholder="35000" /></td>
			</tr>
		</table>
		<?php
	}

	/**
	 * Render Emprunt meta box.
	 *
	 * @param \WP_Post $post Post object.
	 */
	public function render_emprunt_meta_box( $post ) {
		wp_nonce_field( 'cpfa_emprunt_meta_box', 'cpfa_emprunt_meta_box_nonce' );

		$abonne               = get_post_meta( $post->ID, '_cpfa_emprunt_abonne_id', true );
		$ressource            = get_post_meta( $post->ID, '_cpfa_emprunt_ressource_id', true );
		$date_sortie          = get_post_meta( $post->ID, '_cpfa_emprunt_date_sortie', true );
		$date_retour_prevue   = get_post_meta( $post->ID, '_cpfa_emprunt_date_retour_prevue', true );
		$date_retour_effective = get_post_meta( $post->ID, '_cpfa_emprunt_date_retour_effective', true );
		$penalite             = get_post_meta( $post->ID, '_cpfa_emprunt_penalite', true );

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
				'orderby'        => 'title',
				'order'          => 'ASC',
			)
		);

		?>
		<table class="form-table">
			<tr>
				<th><label for="cpfa_emprunt_abonne"><?php esc_html_e( 'Abonné (ID)', 'cpfa-core' ); ?></label></th>
				<td>
					<select name="cpfa_emprunt_abonne" id="cpfa_emprunt_abonne" class="regular-text">
						<option value=""><?php esc_html_e( '-- Sélectionner un abonné --', 'cpfa-core' ); ?></option>
						<?php foreach ( $abonnes as $abonne_post ) : ?>
							<?php
							$nom = get_post_meta( $abonne_post->ID, '_cpfa_abonnement_nom', true );
							$prenom = get_post_meta( $abonne_post->ID, '_cpfa_abonnement_prenom', true );
							$numero_carte = get_post_meta( $abonne_post->ID, '_cpfa_abonnement_numero_carte', true );
							$display_name = trim( $prenom . ' ' . $nom );
							if ( $numero_carte ) {
								$display_name .= ' (' . $numero_carte . ')';
							}
							?>
							<option value="<?php echo esc_attr( $abonne_post->ID ); ?>" <?php selected( $abonne, $abonne_post->ID ); ?>>
								<?php echo esc_html( $display_name ); ?>
							</option>
						<?php endforeach; ?>
					</select>
				</td>
			</tr>
			<tr>
				<th><label for="cpfa_emprunt_ressource"><?php esc_html_e( 'Ressource (ID)', 'cpfa-core' ); ?></label></th>
				<td>
					<select name="cpfa_emprunt_ressource" id="cpfa_emprunt_ressource" class="regular-text">
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
							<option value="<?php echo esc_attr( $ressource_post->ID ); ?>" <?php selected( $ressource, $ressource_post->ID ); ?>>
								<?php echo esc_html( $display_name ); ?>
							</option>
						<?php endforeach; ?>
					</select>
				</td>
			</tr>
			<tr>
				<th><label for="cpfa_emprunt_date_sortie"><?php esc_html_e( 'Date de sortie', 'cpfa-core' ); ?></label></th>
				<td><input type="date" name="cpfa_emprunt_date_sortie" id="cpfa_emprunt_date_sortie" value="<?php echo esc_attr( $date_sortie ); ?>" class="regular-text" /></td>
			</tr>
			<tr>
				<th><label for="cpfa_emprunt_date_retour_prevue"><?php esc_html_e( 'Date de retour prévue', 'cpfa-core' ); ?></label></th>
				<td><input type="date" name="cpfa_emprunt_date_retour_prevue" id="cpfa_emprunt_date_retour_prevue" value="<?php echo esc_attr( $date_retour_prevue ); ?>" class="regular-text" /></td>
			</tr>
			<tr>
				<th><label for="cpfa_emprunt_date_retour_effective"><?php esc_html_e( 'Date de retour effective', 'cpfa-core' ); ?></label></th>
				<td><input type="date" name="cpfa_emprunt_date_retour_effective" id="cpfa_emprunt_date_retour_effective" value="<?php echo esc_attr( $date_retour_effective ); ?>" class="regular-text" /></td>
			</tr>
			<tr>
				<th><label for="cpfa_emprunt_penalite"><?php esc_html_e( 'Pénalité (FCFA)', 'cpfa-core' ); ?></label></th>
				<td>
					<input type="number" name="cpfa_emprunt_penalite" id="cpfa_emprunt_penalite" value="<?php echo esc_attr( $penalite ); ?>" class="regular-text" readonly />
					<p class="description"><?php esc_html_e( '500 FCFA/jour à partir du 4ème jour de retard', 'cpfa-core' ); ?></p>
				</td>
			</tr>
		</table>
		<?php
	}

	/**
	 * Save meta box data.
	 *
	 * @param int      $post_id Post ID.
	 * @param \WP_Post $post    Post object.
	 */
	public function save_meta_boxes( $post_id, $post ) {
		// Check if our nonce is set and verify it.
		$nonce_name = 'cpfa_' . $post->post_type . '_meta_box_nonce';
		if ( ! isset( $_POST[ $nonce_name ] ) || ! wp_verify_nonce( $_POST[ $nonce_name ], 'cpfa_' . $post->post_type . '_meta_box' ) ) {
			return;
		}

		// Check if not autosave.
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}

		// Check user permissions.
		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}

		// Get post type and save appropriate fields.
		switch ( $post->post_type ) {
			case 'cpfa_formation':
				$this->save_formation_fields( $post_id );
				break;
			case 'cpfa_seminaire':
				$this->save_seminaire_fields( $post_id );
				break;
			case 'cpfa_concours':
				$this->save_concours_fields( $post_id );
				break;
			case 'cpfa_ressource':
				$this->save_ressource_fields( $post_id );
				break;
			case 'cpfa_abonnement':
				$this->save_abonnement_fields( $post_id );
				break;
			case 'cpfa_emprunt':
				$this->save_emprunt_fields( $post_id );
				break;
		}
	}

	/**
	 * Save Formation fields.
	 *
	 * @param int $post_id Post ID.
	 */
	private function save_formation_fields( $post_id ) {
		$fields = array( 'type', 'duree', 'niveau', 'prix', 'brochure' );
		foreach ( $fields as $field ) {
			if ( isset( $_POST[ 'cpfa_formation_' . $field ] ) ) {
				$value = sanitize_text_field( $_POST[ 'cpfa_formation_' . $field ] );
				update_post_meta( $post_id, '_cpfa_formation_' . $field, $value );
			}
		}
	}

	/**
	 * Save Seminaire fields.
	 *
	 * @param int $post_id Post ID.
	 */
	private function save_seminaire_fields( $post_id ) {
		$fields = array( 'dates', 'lieu', 'quota', 'prix', 'affiche' );
		foreach ( $fields as $field ) {
			if ( isset( $_POST[ 'cpfa_seminaire_' . $field ] ) ) {
				$value = sanitize_text_field( $_POST[ 'cpfa_seminaire_' . $field ] );
				update_post_meta( $post_id, '_cpfa_seminaire_' . $field, $value );
			}
		}
	}

	/**
	 * Save Concours fields.
	 *
	 * @param int $post_id Post ID.
	 */
	private function save_concours_fields( $post_id ) {
		$fields = array( 'calendrier', 'conditions', 'pieces' );
		foreach ( $fields as $field ) {
			if ( isset( $_POST[ 'cpfa_concours_' . $field ] ) ) {
				$value = sanitize_textarea_field( $_POST[ 'cpfa_concours_' . $field ] );
				update_post_meta( $post_id, '_cpfa_concours_' . $field, $value );
			}
		}
	}

	/**
	 * Save Ressource fields.
	 *
	 * @param int $post_id Post ID.
	 */
	private function save_ressource_fields( $post_id ) {
		$fields = array( 'cote', 'auteurs', 'mots_cles', 'statut_pret' );
		foreach ( $fields as $field ) {
			if ( isset( $_POST[ 'cpfa_ressource_' . $field ] ) ) {
				$value = sanitize_text_field( $_POST[ 'cpfa_ressource_' . $field ] );
				update_post_meta( $post_id, '_cpfa_ressource_' . $field, $value );
			}
		}

		// Handle checkbox for exclu_pret.
		$exclu_pret = isset( $_POST['cpfa_ressource_exclu_pret'] ) ? '1' : '0';
		update_post_meta( $post_id, '_cpfa_ressource_exclu_pret', $exclu_pret );
	}

	/**
	 * Save Abonnement fields.
	 *
	 * @param int $post_id Post ID.
	 */
	private function save_abonnement_fields( $post_id ) {
		$fields = array( 'membre', 'type', 'date_debut', 'date_fin', 'statut', 'caution' );
		foreach ( $fields as $field ) {
			if ( isset( $_POST[ 'cpfa_abonnement_' . $field ] ) ) {
				$value = sanitize_text_field( $_POST[ 'cpfa_abonnement_' . $field ] );
				update_post_meta( $post_id, '_cpfa_abonnement_' . $field, $value );
			}
		}
	}

	/**
	 * Save Emprunt fields.
	 *
	 * @param int $post_id Post ID.
	 */
	private function save_emprunt_fields( $post_id ) {
		$fields = array( 'abonne', 'ressource', 'date_sortie', 'date_retour_prevue', 'date_retour_effective', 'penalite' );
		foreach ( $fields as $field ) {
			if ( isset( $_POST[ 'cpfa_emprunt_' . $field ] ) ) {
				$value = sanitize_text_field( $_POST[ 'cpfa_emprunt_' . $field ] );
				update_post_meta( $post_id, '_cpfa_emprunt_' . $field, $value );
			}
		}

		// Calculate penalty if late.
		$this->calculate_penalty( $post_id );
	}

	/**
	 * Calculate penalty for late return.
	 *
	 * @param int $post_id Post ID.
	 */
	private function calculate_penalty( $post_id ) {
		$date_retour_prevue    = get_post_meta( $post_id, '_cpfa_emprunt_date_retour_prevue', true );
		$date_retour_effective = get_post_meta( $post_id, '_cpfa_emprunt_date_retour_effective', true );

		if ( empty( $date_retour_prevue ) || empty( $date_retour_effective ) ) {
			return;
		}

		$prevue    = strtotime( $date_retour_prevue );
		$effective = strtotime( $date_retour_effective );
		$diff_days = ( $effective - $prevue ) / DAY_IN_SECONDS;

		// Penalty: 500 FCFA/day starting from day 4.
		if ( $diff_days > 3 ) {
			$penalty = ( $diff_days - 3 ) * 500;
			update_post_meta( $post_id, '_cpfa_emprunt_penalite', $penalty );
		} else {
			update_post_meta( $post_id, '_cpfa_emprunt_penalite', 0 );
		}
	}
}
