<?php
/**
 * Meta Keys Constants
 *
 * Centralized management of all meta keys used across the plugin
 * to prevent typos and ensure consistency.
 *
 * @package CpfaCore
 */

namespace Cpfa\Core;

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Meta Keys class.
 */
class Meta_Keys {

	// === Abonnement Meta Keys ===
	const ABONNEMENT_NUMERO_CARTE = '_cpfa_abonnement_numero_carte';
	const ABONNEMENT_NUMERO_MEMBRE = '_cpfa_abonnement_numero_membre';
	const ABONNEMENT_NOM = '_cpfa_abonnement_nom';
	const ABONNEMENT_PRENOM = '_cpfa_abonnement_prenom';
	const ABONNEMENT_EMAIL = '_cpfa_abonnement_email';
	const ABONNEMENT_TELEPHONE = '_cpfa_abonnement_telephone';
	const ABONNEMENT_DATE_DEBUT = '_cpfa_abonnement_date_debut';
	const ABONNEMENT_DATE_FIN = '_cpfa_abonnement_date_fin';
	const ABONNEMENT_STATUT = '_cpfa_abonnement_statut';
	const ABONNEMENT_QR_TOKEN = '_cpfa_abonnement_qr_token';
	const ABONNEMENT_TYPE = '_cpfa_abonnement_type';
	const ABONNEMENT_MEMBRE = '_cpfa_abonnement_membre';
	const ABONNEMENT_HISTORIQUE = '_cpfa_abonnement_historique';
	const ABONNEMENT_EXPIRED_LE = '_cpfa_abonnement_expired_le';

	// === Emprunt Meta Keys (STANDARDIZED) ===
	const EMPRUNT_ABONNE_ID = '_cpfa_emprunt_abonne_id';
	const EMPRUNT_RESSOURCE_ID = '_cpfa_emprunt_ressource_id';
	const EMPRUNT_DATE_EMPRUNT = '_cpfa_emprunt_date_emprunt';
	const EMPRUNT_DATE_RETOUR_PREVUE = '_cpfa_emprunt_date_retour_prevue';
	const EMPRUNT_DATE_RETOUR_EFFECTIVE = '_cpfa_emprunt_date_retour_effective';
	const EMPRUNT_STATUT = '_cpfa_emprunt_statut';
	const EMPRUNT_PENALITE = '_cpfa_emprunt_penalite'; // Singular form (STANDARDIZED)
	const EMPRUNT_PENALITE_PAYEE = '_cpfa_emprunt_penalite_payee'; // Singular form (STANDARDIZED)

	// === Formation Meta Keys ===
	const FORMATION_PRIX = '_cpfa_formation_prix';
	const FORMATION_DUREE = '_cpfa_formation_duree';
	const FORMATION_NIVEAU = '_cpfa_formation_niveau';
	const FORMATION_DATE_DEBUT = '_cpfa_formation_date_debut';
	const FORMATION_PLACES_DISPONIBLES = '_cpfa_formation_places_disponibles';

	// === Séminaire Meta Keys ===
	const SEMINAIRE_PRIX = '_cpfa_seminaire_prix';
	const SEMINAIRE_DATES = '_cpfa_seminaire_dates';
	const SEMINAIRE_LIEU = '_cpfa_seminaire_lieu';
	const SEMINAIRE_QUOTA = '_cpfa_seminaire_quota';

	// === Ressource Meta Keys ===
	const RESSOURCE_AUTEUR = '_cpfa_ressource_auteur';
	const RESSOURCE_AUTEURS = '_cpfa_ressource_auteurs';
	const RESSOURCE_ISBN = '_cpfa_ressource_isbn';
	const RESSOURCE_EDITEUR = '_cpfa_ressource_editeur';
	const RESSOURCE_ANNEE = '_cpfa_ressource_annee';
	const RESSOURCE_DISPONIBLE = '_cpfa_ressource_disponible';
	const RESSOURCE_QUANTITE = '_cpfa_ressource_quantite';
	const RESSOURCE_EMPLACEMENT = '_cpfa_ressource_emplacement';
	const RESSOURCE_STATUT_EMPRUNT = '_cpfa_ressource_statut_emprunt';
	const RESSOURCE_STATUT_PRET = '_cpfa_ressource_statut_pret';
	const RESSOURCE_EXCLU_PRET = '_cpfa_ressource_exclu_pret';
	const RESSOURCE_COTE = '_cpfa_ressource_cote';

	// === Verification Tokens ===
	const VERIFICATION_TOKEN = '_cpfa_verification_token';
	const VERIFICATION_TYPE = '_cpfa_verification_type';

	/**
	 * Get all meta keys as array.
	 *
	 * @return array All meta keys.
	 */
	public static function get_all_keys() {
		$reflection = new \ReflectionClass( __CLASS__ );
		return $reflection->getConstants();
	}

	/**
	 * Validate meta key exists.
	 *
	 * @param string $key Meta key to validate.
	 * @return bool True if valid.
	 */
	public static function is_valid_key( $key ) {
		return in_array( $key, self::get_all_keys(), true );
	}

	/**
	 * Get meta keys for a specific post type.
	 *
	 * @param string $post_type Post type.
	 * @return array Meta keys for the post type.
	 */
	public static function get_keys_for_post_type( $post_type ) {
		$prefix = strtoupper( str_replace( 'cpfa_', '', $post_type ) );
		$all_keys = self::get_all_keys();
		$type_keys = array();

		foreach ( $all_keys as $const_name => $key_value ) {
			if ( strpos( $const_name, $prefix . '_' ) === 0 ) {
				$type_keys[ $const_name ] = $key_value;
			}
		}

		return $type_keys;
	}
}
