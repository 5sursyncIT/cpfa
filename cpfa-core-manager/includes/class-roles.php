<?php
/**
 * Roles and Capabilities Handler
 *
 * @package CpfaCore
 */

namespace Cpfa\Core;

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Roles class.
 */
class Roles {

	/**
	 * Create custom roles and capabilities.
	 */
	public static function create_roles() {
		// Add CPFA Manager role.
		add_role(
			'cpfa_manager',
			__( 'CPFA Manager', 'cpfa-core' ),
			array(
				'read'                   => true,
				'edit_posts'             => true,
				'delete_posts'           => true,
				'publish_posts'          => true,
				'upload_files'           => true,
				'manage_cpfa_biblio'     => true,
				'manage_cpfa_finance'    => true,
				'manage_cpfa_formations' => true,
			)
		);

		// Add capabilities to Administrator.
		$admin = get_role( 'administrator' );
		if ( $admin ) {
			self::add_cpfa_caps( $admin );
		}

		// Add capabilities to CPFA Manager.
		$cpfa_manager = get_role( 'cpfa_manager' );
		if ( $cpfa_manager ) {
			self::add_cpfa_caps( $cpfa_manager );
		}
	}

	/**
	 * Add CPFA capabilities to a role.
	 *
	 * @param \WP_Role $role Role object.
	 */
	private static function add_cpfa_caps( $role ) {
		$post_types = array( 'formation', 'seminaire', 'concours', 'ressource', 'abonnement', 'emprunt' );

		foreach ( $post_types as $type ) {
			$role->add_cap( "edit_cpfa_{$type}" );
			$role->add_cap( "read_cpfa_{$type}" );
			$role->add_cap( "delete_cpfa_{$type}" );
			$role->add_cap( "edit_cpfa_{$type}s" );
			$role->add_cap( "edit_others_cpfa_{$type}s" );
			$role->add_cap( "publish_cpfa_{$type}s" );
			$role->add_cap( "read_private_cpfa_{$type}s" );
			$role->add_cap( "delete_cpfa_{$type}s" );
			$role->add_cap( "delete_private_cpfa_{$type}s" );
			$role->add_cap( "delete_published_cpfa_{$type}s" );
			$role->add_cap( "delete_others_cpfa_{$type}s" );
			$role->add_cap( "edit_private_cpfa_{$type}s" );
			$role->add_cap( "edit_published_cpfa_{$type}s" );
		}

		// Add custom CPFA capabilities.
		$role->add_cap( 'manage_cpfa_biblio' );
		$role->add_cap( 'manage_cpfa_finance' );
		$role->add_cap( 'manage_cpfa_formations' );
	}

	/**
	 * Remove custom roles and capabilities.
	 */
	public static function remove_roles() {
		remove_role( 'cpfa_manager' );

		// Remove capabilities from Administrator.
		$admin = get_role( 'administrator' );
		if ( $admin ) {
			self::remove_cpfa_caps( $admin );
		}
	}

	/**
	 * Remove CPFA capabilities from a role.
	 *
	 * @param \WP_Role $role Role object.
	 */
	private static function remove_cpfa_caps( $role ) {
		$post_types = array( 'formation', 'seminaire', 'concours', 'ressource', 'abonnement', 'emprunt' );

		foreach ( $post_types as $type ) {
			$role->remove_cap( "edit_cpfa_{$type}" );
			$role->remove_cap( "read_cpfa_{$type}" );
			$role->remove_cap( "delete_cpfa_{$type}" );
			$role->remove_cap( "edit_cpfa_{$type}s" );
			$role->remove_cap( "edit_others_cpfa_{$type}s" );
			$role->remove_cap( "publish_cpfa_{$type}s" );
			$role->remove_cap( "read_private_cpfa_{$type}s" );
			$role->remove_cap( "delete_cpfa_{$type}s" );
			$role->remove_cap( "delete_private_cpfa_{$type}s" );
			$role->remove_cap( "delete_published_cpfa_{$type}s" );
			$role->remove_cap( "delete_others_cpfa_{$type}s" );
			$role->remove_cap( "edit_private_cpfa_{$type}s" );
			$role->remove_cap( "edit_published_cpfa_{$type}s" );
		}

		$role->remove_cap( 'manage_cpfa_biblio' );
		$role->remove_cap( 'manage_cpfa_finance' );
		$role->remove_cap( 'manage_cpfa_formations' );
	}
}
