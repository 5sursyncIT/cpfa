<?php
/**
 * Library Manager
 *
 * Handles library operations: checkouts, returns, penalties, and member management
 *
 * @package CpfaCore
 */

namespace Cpfa\Core;

use Cpfa\Core\Services\Cache_Service;
use Cpfa\Core\Services\DB_Transaction;

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Use Config and Meta_Keys classes.
use Cpfa\Core\Config;
use Cpfa\Core\Meta_Keys;

/**
 * Library Manager class.
 */
class Library_Manager {

	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'admin_menu', array( $this, 'add_menu_pages' ), 6 );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ) );

		// Ajax handlers.
		add_action( 'wp_ajax_cpfa_checkout_resource', array( $this, 'ajax_checkout_resource' ) );
		add_action( 'wp_ajax_cpfa_return_resource', array( $this, 'ajax_return_resource' ) );
		add_action( 'wp_ajax_cpfa_search_subscriber', array( $this, 'ajax_search_subscriber' ) );
		add_action( 'wp_ajax_cpfa_search_resource', array( $this, 'ajax_search_resource' ) );
		add_action( 'wp_ajax_cpfa_mark_penalty_paid', array( $this, 'ajax_mark_penalty_paid' ) );
		add_action( 'wp_ajax_cpfa_refresh_stats', array( $this, 'ajax_refresh_stats' ) );
	}

	/**
	 * Add admin menu pages.
	 */
	public function add_menu_pages() {
		// Create main CPFA menu with library dashboard.
		add_menu_page(
			__( 'CPFA', 'cpfa-core' ),
			__( 'CPFA', 'cpfa-core' ),
			'manage_cpfa_biblio',
			'cpfa-library',
			array( $this, 'render_library_page' ),
			'dashicons-book-alt',
			20
		);

		// Dashboard principal
		add_submenu_page(
			'cpfa-library',
			__( 'Tableau de bord', 'cpfa-core' ),
			__( '📊 Tableau de bord', 'cpfa-core' ),
			'manage_cpfa_biblio',
			'cpfa-library',
			array( $this, 'render_library_page' )
		);

		// === Gestion Bibliothèque (Operations quotidiennes) ===
		add_submenu_page(
			'cpfa-library',
			__( 'Gestion Bibliothèque', 'cpfa-core' ),
			__( '📚 Gestion Bibliothèque', 'cpfa-core' ),
			'manage_cpfa_biblio',
			'cpfa-library-operations',
			array( $this, 'render_operations_page' )
		);
	}

	/**
	 * Enqueue scripts and styles.
	 *
	 * @param string $hook Current admin page hook.
	 */
	public function enqueue_scripts( $hook ) {
		if ( strpos( $hook, 'cpfa-library' ) === false ) {
			return;
		}

		// Enqueue Select2 (local copy - no CDN dependency).
		wp_enqueue_style(
			'select2',
			CPFA_CORE_PLUGIN_URL . 'assets/vendor/select2/select2.min.css',
			array(),
			'4.1.0'
		);

		wp_enqueue_style(
			'cpfa-library-manager',
			CPFA_CORE_PLUGIN_URL . 'assets/css/library-manager.css',
			array( 'select2' ),
			CPFA_CORE_VERSION
		);

		wp_enqueue_script(
			'select2',
			CPFA_CORE_PLUGIN_URL . 'assets/vendor/select2/select2.min.js',
			array( 'jquery' ),
			'4.1.0',
			true
		);

		// Enqueue tab handler (extracted from inline).
		wp_enqueue_script(
			'cpfa-library-tabs',
			CPFA_CORE_PLUGIN_URL . 'assets/js/library-tabs.js',
			array( 'jquery' ),
			CPFA_CORE_VERSION,
			true
		);

		wp_enqueue_script(
			'cpfa-library-manager',
			CPFA_CORE_PLUGIN_URL . 'assets/js/library-manager.js',
			array( 'jquery', 'select2', 'cpfa-library-tabs' ),
			CPFA_CORE_VERSION,
			true
		);

		// Use Config constants instead of magic numbers.
		wp_localize_script(
			'cpfa-library-manager',
			'cpfaLibrary',
			array(
				'ajaxUrl'       => admin_url( 'admin-ajax.php' ),
				'nonce'         => wp_create_nonce( 'cpfa-library-nonce' ),
				'penaltyRate'   => Config::PENALTY_RATE_PER_DAY,
				'gracePeriod'   => Config::GRACE_PERIOD_DAYS,
				'loanDuration'  => Config::LOAN_DURATION_DAYS,
				'i18n'          => array(
					'confirmCheckout' => __( 'Confirmer l\'emprunt ?', 'cpfa-core' ),
					'confirmReturn'   => __( 'Confirmer le retour ?', 'cpfa-core' ),
					'searchError'     => __( 'Erreur de recherche', 'cpfa-core' ),
					'loading'         => __( 'Chargement...', 'cpfa-core' ),
				),
			)
		);
	}

	/**
	 * Render main library page (Dashboard).
	 */
	public function render_library_page() {
		if ( ! current_user_can( 'manage_cpfa_biblio' ) ) {
			wp_die( esc_html__( 'Accès non autorisé.', 'cpfa-core' ) );
		}

		// Get statistics.
		$stats = $this->get_library_stats();

		include CPFA_CORE_PLUGIN_DIR . 'templates/admin/library-dashboard.php';
	}

	/**
	 * Render operations page (Emprunter, Retours, Pénalités).
	 */
	public function render_operations_page() {
		if ( ! current_user_can( 'manage_cpfa_biblio' ) ) {
			wp_die( esc_html__( 'Accès non autorisé.', 'cpfa-core' ) );
		}

		// Get active loans for returns
		$active_loans = $this->get_active_loans();

		// Get loans with penalties
		$loans_with_penalties = $this->get_loans_with_penalties();

		?>
		<div class="wrap cpfa-operations-page">
			<h1><?php esc_html_e( 'Gestion Bibliothèque', 'cpfa-core' ); ?></h1>

			<div class="cpfa-operations-tabs">
				<nav class="nav-tab-wrapper">
					<a href="#checkout" class="nav-tab nav-tab-active"><?php esc_html_e( '➕ Emprunter', 'cpfa-core' ); ?></a>
					<a href="#return" class="nav-tab"><?php esc_html_e( '↩️ Retours', 'cpfa-core' ); ?></a>
					<a href="#penalties" class="nav-tab"><?php esc_html_e( '💰 Pénalités', 'cpfa-core' ); ?></a>
				</nav>

				<div id="checkout" class="cpfa-tab-content cpfa-tab-active">
					<?php include CPFA_CORE_PLUGIN_DIR . 'templates/admin/library-checkout.php'; ?>
				</div>

				<div id="return" class="cpfa-tab-content" style="display: none;">
					<?php include CPFA_CORE_PLUGIN_DIR . 'templates/admin/library-return.php'; ?>
				</div>

				<div id="penalties" class="cpfa-tab-content" style="display: none;">
					<?php include CPFA_CORE_PLUGIN_DIR . 'templates/admin/library-penalties.php'; ?>
				</div>
			</div>
		</div>
		<?php
		// Tabs JS is now handled by library-tabs.js (enqueued separately).
	}

	/**
	 * Get library statistics.
	 *
	 * @return array Statistics.
	 */
	private function get_library_stats() {
		// Use cache with 5 minutes duration.
		return Cache_Service::remember(
			'library_stats',
			function () {
				return array(
					'total_resources'     => wp_count_posts( 'cpfa_ressource' )->publish ?? 0,
					'active_subscribers'  => $this->count_active_subscribers(),
					'active_loans'        => $this->count_active_loans(),
					'overdue_loans'       => $this->count_overdue_loans(),
					'total_penalties'     => $this->calculate_total_penalties(),
					'available_resources' => $this->count_available_resources(),
				);
			},
			5 * MINUTE_IN_SECONDS
		);
	}

	/**
	 * Count active subscribers.
	 *
	 * @return int Count.
	 */
	private function count_active_subscribers() {
		$args = array(
			'post_type'      => 'cpfa_abonnement',
			'post_status'    => 'publish',
			'posts_per_page' => -1,
			'meta_query'     => array(
				array(
					'key'     => Meta_Keys::ABONNEMENT_STATUT,
					'value'   => Config::STATUS_ACTIVE,
					'compare' => '=',
				),
			),
			'fields'         => 'ids',
		);

		$query = new \WP_Query( $args );
		return $query->found_posts;
	}

	/**
	 * Count active loans.
	 *
	 * @return int Count.
	 */
	private function count_active_loans() {
		$args = array(
			'post_type'      => 'cpfa_emprunt',
			'post_status'    => 'publish',
			'posts_per_page' => -1,
			'meta_query'     => array(
				array(
					'key'     => '_cpfa_emprunt_statut',
					'value'   => 'en_cours',
					'compare' => '=',
				),
			),
			'fields'         => 'ids',
		);

		$query = new \WP_Query( $args );
		return $query->found_posts;
	}

	/**
	 * Count overdue loans.
	 *
	 * @return int Count.
	 */
	private function count_overdue_loans() {
		$args = array(
			'post_type'      => 'cpfa_emprunt',
			'post_status'    => 'publish',
			'posts_per_page' => -1,
			'meta_query'     => array(
				array(
					'key'     => '_cpfa_emprunt_statut',
					'value'   => 'en_cours',
					'compare' => '=',
				),
				array(
					'key'     => '_cpfa_emprunt_date_retour_prevue',
					'value'   => gmdate( 'Y-m-d' ),
					'compare' => '<',
					'type'    => 'DATE',
				),
			),
			'fields'         => 'ids',
		);

		$query = new \WP_Query( $args );
		return $query->found_posts;
	}

	/**
	 * Calculate total penalties.
	 *
	 * @return int Total amount.
	 */
	private function calculate_total_penalties() {
		$args = array(
			'post_type'      => 'cpfa_emprunt',
			'post_status'    => 'publish',
			'posts_per_page' => -1,
			'meta_query'     => array(
				array(
					'key'     => '_cpfa_emprunt_penalite',
					'value'   => 0,
					'compare' => '>',
					'type'    => 'NUMERIC',
				),
			),
			'fields'         => 'ids',
		);

		$query = new \WP_Query( $args );
		$total = 0;

		foreach ( $query->posts as $loan_id ) {
			$penalty = get_post_meta( $loan_id, '_cpfa_emprunt_penalite', true );
			$total  += (int) $penalty;
		}

		return $total;
	}

	/**
	 * Count available resources.
	 *
	 * @return int Count.
	 */
	private function count_available_resources() {
		$args = array(
			'post_type'      => 'cpfa_ressource',
			'post_status'    => 'publish',
			'posts_per_page' => -1,
			'meta_query'     => array(
				array(
					'key'     => '_cpfa_ressource_statut_emprunt',
					'value'   => 'disponible',
					'compare' => '=',
				),
				array(
					'key'     => '_cpfa_ressource_exclu_pret',
					'value'   => '1',
					'compare' => '!=',
				),
			),
			'fields'         => 'ids',
		);

		$query = new \WP_Query( $args );
		return $query->found_posts;
	}

	/**
	 * Get active loans.
	 *
	 * @return array Loans.
	 */
	private function get_active_loans() {
		$args = array(
			'post_type'      => 'cpfa_emprunt',
			'post_status'    => 'publish',
			'posts_per_page' => -1,
			'meta_query'     => array(
				array(
					'key'     => '_cpfa_emprunt_statut',
					'value'   => 'en_cours',
					'compare' => '=',
				),
			),
			'orderby'        => 'meta_value',
			'meta_key'       => '_cpfa_emprunt_date_retour_prevue',
			'order'          => 'ASC',
		);

		return get_posts( $args );
	}

	/**
	 * Get loans with penalties.
	 *
	 * @return array Loans.
	 */
	private function get_loans_with_penalties() {
		$args = array(
			'post_type'      => 'cpfa_emprunt',
			'post_status'    => 'publish',
			'posts_per_page' => -1,
			'meta_query'     => array(
				array(
					'key'     => '_cpfa_emprunt_penalite',
					'value'   => 0,
					'compare' => '>',
					'type'    => 'NUMERIC',
				),
			),
			'orderby'        => 'meta_value_num',
			'meta_key'       => '_cpfa_emprunt_penalite',
			'order'          => 'DESC',
		);

		return get_posts( $args );
	}

	/**
	 * Ajax handler for checkout.
	 */
	public function ajax_checkout_resource() {
		check_ajax_referer( 'cpfa-library-nonce', 'nonce' );

		if ( ! current_user_can( 'manage_cpfa_biblio' ) ) {
			wp_send_json_error( array( 'message' => __( 'Accès non autorisé.', 'cpfa-core' ) ) );
		}

		$subscriber_id = isset( $_POST['subscriber_id'] ) ? absint( $_POST['subscriber_id'] ) : 0;
		$resource_id   = isset( $_POST['resource_id'] ) ? absint( $_POST['resource_id'] ) : 0;

		if ( ! $subscriber_id || ! $resource_id ) {
			wp_send_json_error( array( 'message' => __( 'Données invalides.', 'cpfa-core' ) ) );
		}

		// Validate subscriber.
		$subscriber_status = get_post_meta( $subscriber_id, '_cpfa_abonnement_statut', true );
		if ( 'actif' !== $subscriber_status ) {
			wp_send_json_error( array( 'message' => __( 'Abonnement inactif.', 'cpfa-core' ) ) );
		}

		// Check for existing penalties.
		if ( $this->subscriber_has_penalties( $subscriber_id ) ) {
			wp_send_json_error( array( 'message' => __( 'Abonné a des pénalités impayées.', 'cpfa-core' ) ) );
		}

		// Validate resource availability.
		$resource_status = get_post_meta( $resource_id, '_cpfa_ressource_statut_emprunt', true );
		$excluded        = get_post_meta( $resource_id, '_cpfa_ressource_exclu_pret', true );

		if ( 'disponible' !== $resource_status || '1' === $excluded ) {
			wp_send_json_error( array( 'message' => __( 'Ressource non disponible.', 'cpfa-core' ) ) );
		}

		// Create loan.
		$loan_id = $this->create_loan( $subscriber_id, $resource_id );

		if ( $loan_id ) {
			wp_send_json_success(
				array(
					'message' => __( 'Emprunt enregistré avec succès.', 'cpfa-core' ),
					'loan_id' => $loan_id,
				)
			);
		} else {
			wp_send_json_error( array( 'message' => __( 'Erreur lors de la création de l\'emprunt.', 'cpfa-core' ) ) );
		}
	}

	/**
	 * Ajax handler for return.
	 */
	public function ajax_return_resource() {
		check_ajax_referer( 'cpfa-library-nonce', 'nonce' );

		if ( ! current_user_can( 'manage_cpfa_biblio' ) ) {
			wp_send_json_error( array( 'message' => __( 'Accès non autorisé.', 'cpfa-core' ) ) );
		}

		$loan_id = isset( $_POST['loan_id'] ) ? absint( $_POST['loan_id'] ) : 0;

		if ( ! $loan_id ) {
			wp_send_json_error( array( 'message' => __( 'Données invalides.', 'cpfa-core' ) ) );
		}

		$result = $this->process_return( $loan_id );

		if ( $result ) {
			wp_send_json_success(
				array(
					'message' => __( 'Retour enregistré avec succès.', 'cpfa-core' ),
					'penalty' => $result['penalty'],
				)
			);
		} else {
			wp_send_json_error( array( 'message' => __( 'Erreur lors du retour.', 'cpfa-core' ) ) );
		}
	}

	/**
	 * Ajax handler for subscriber search.
	 */
	public function ajax_search_subscriber() {
		check_ajax_referer( 'cpfa-library-nonce', 'nonce' );

		$search = isset( $_POST['search'] ) ? sanitize_text_field( $_POST['search'] ) : '';

		if ( empty( $search ) ) {
			wp_send_json_success( array( 'results' => array() ) );
		}

		$args = array(
			'post_type'      => 'cpfa_abonnement',
			'post_status'    => 'publish',
			'posts_per_page' => 10,
			's'              => $search,
			'meta_query'     => array(
				array(
					'key'     => '_cpfa_abonnement_statut',
					'value'   => 'actif',
					'compare' => '=',
				),
			),
		);

		$subscribers = get_posts( $args );
		$results     = array();

		foreach ( $subscribers as $subscriber ) {
			$member_name = get_post_meta( $subscriber->ID, '_cpfa_abonnement_nom', true );
			$member_id   = get_post_meta( $subscriber->ID, '_cpfa_abonnement_numero_membre', true );

			$results[] = array(
				'id'    => $subscriber->ID,
				'label' => sprintf( '%s - %s', $member_id, $member_name ),
				'value' => $member_name,
			);
		}

		wp_send_json_success( array( 'results' => $results ) );
	}

	/**
	 * Ajax handler for resource search.
	 */
	public function ajax_search_resource() {
		check_ajax_referer( 'cpfa-library-nonce', 'nonce' );

		$search = isset( $_POST['search'] ) ? sanitize_text_field( $_POST['search'] ) : '';

		if ( empty( $search ) ) {
			wp_send_json_success( array( 'results' => array() ) );
		}

		$args = array(
			'post_type'      => 'cpfa_ressource',
			'post_status'    => 'publish',
			'posts_per_page' => 10,
			's'              => $search,
			'meta_query'     => array(
				array(
					'key'     => '_cpfa_ressource_statut_emprunt',
					'value'   => 'disponible',
					'compare' => '=',
				),
				array(
					'key'     => '_cpfa_ressource_exclu_pret',
					'value'   => '1',
					'compare' => '!=',
				),
			),
		);

		$resources = get_posts( $args );
		$results   = array();

		foreach ( $resources as $resource ) {
			$cote = get_post_meta( $resource->ID, '_cpfa_ressource_cote', true );

			$results[] = array(
				'id'    => $resource->ID,
				'label' => sprintf( '%s - %s', $cote, $resource->post_title ),
				'value' => $resource->post_title,
			);
		}

		wp_send_json_success( array( 'results' => $results ) );
	}

	/**
	 * Check if subscriber has unpaid penalties.
	 *
	 * @param int $subscriber_id Subscriber ID.
	 * @return bool True if has penalties.
	 */
	private function subscriber_has_penalties( $subscriber_id ) {
		$args = array(
			'post_type'      => 'cpfa_emprunt',
			'post_status'    => 'publish',
			'posts_per_page' => 1,
			'meta_query'     => array(
				array(
					'key'     => '_cpfa_emprunt_abonne_id',
					'value'   => $subscriber_id,
					'compare' => '=',
				),
				array(
					'key'     => '_cpfa_emprunt_penalite',
					'value'   => 0,
					'compare' => '>',
					'type'    => 'NUMERIC',
				),
				array(
					'key'     => '_cpfa_emprunt_penalite_payee',
					'value'   => '1',
					'compare' => '!=',
				),
			),
			'fields'         => 'ids',
		);

		$query = new \WP_Query( $args );
		return $query->found_posts > 0;
	}

	/**
	 * Create a new loan.
	 *
	 * @param int $subscriber_id Subscriber ID.
	 * @param int $resource_id   Resource ID.
	 * @return int|false Loan ID or false.
	 */
	private function create_loan( $subscriber_id, $resource_id ) {
		// Use transaction for data integrity.
		$result = DB_Transaction::safe_execute(
			function () use ( $subscriber_id, $resource_id ) {
				$date_emprunt       = gmdate( 'Y-m-d' );
				$date_retour_prevue = gmdate( 'Y-m-d', strtotime( '+30 days' ) );

				$subscriber_name = get_post_meta( $subscriber_id, '_cpfa_abonnement_nom', true );
				$resource_title  = get_the_title( $resource_id );

				$loan_id = wp_insert_post(
					array(
						'post_type'   => 'cpfa_emprunt',
						'post_title'  => sprintf( '%s - %s', $subscriber_name, $resource_title ),
						'post_status' => 'publish',
					)
				);

				if ( ! $loan_id || is_wp_error( $loan_id ) ) {
					throw new \Exception( 'Failed to create loan post' );
				}

				// Update loan metadata.
				update_post_meta( $loan_id, '_cpfa_emprunt_abonne_id', $subscriber_id );
				update_post_meta( $loan_id, '_cpfa_emprunt_ressource_id', $resource_id );
				update_post_meta( $loan_id, '_cpfa_emprunt_date_emprunt', $date_emprunt );
				update_post_meta( $loan_id, '_cpfa_emprunt_date_retour_prevue', $date_retour_prevue );
				update_post_meta( $loan_id, '_cpfa_emprunt_statut', 'en_cours' );
				update_post_meta( $loan_id, '_cpfa_emprunt_penalite', 0 );

				// Update resource status.
				$updated = update_post_meta( $resource_id, '_cpfa_ressource_statut_emprunt', 'emprunte' );

				if ( false === $updated ) {
					throw new \Exception( 'Failed to update resource status' );
				}

				// Invalidate cache.
				Cache_Service::delete( 'library_stats' );
				Cache_Service::flush_pattern( 'active_loans*' );

				return $loan_id;
			}
		);

		if ( is_wp_error( $result ) ) {
			error_log( 'CPFA Loan Creation Error: ' . $result->get_error_message() );
			return false;
		}

		// Send notification outside of transaction (non-critical).
		\Cpfa\Core\Services\Notification_Service::send_loan_confirmation( $result );

		return $result;
	}

	/**
	 * Process return.
	 *
	 * @param int $loan_id Loan ID.
	 * @return array|false Result or false.
	 */
	private function process_return( $loan_id ) {
		// Use transaction for data integrity.
		$result = DB_Transaction::safe_execute(
			function () use ( $loan_id ) {
				$date_retour_effective = gmdate( 'Y-m-d' );
				$resource_id           = get_post_meta( $loan_id, '_cpfa_emprunt_ressource_id', true );

				if ( ! $resource_id ) {
					throw new \Exception( 'Invalid resource ID for loan' );
				}

				// Calculate penalty.
				$penalty = $this->calculate_loan_penalty( $loan_id );

				// Update loan.
				update_post_meta( $loan_id, '_cpfa_emprunt_date_retour_effective', $date_retour_effective );
				update_post_meta( $loan_id, '_cpfa_emprunt_statut', 'termine' );
				update_post_meta( $loan_id, '_cpfa_emprunt_penalite', $penalty );

				// Update resource status.
				$updated = update_post_meta( $resource_id, '_cpfa_ressource_statut_emprunt', 'disponible' );

				if ( false === $updated ) {
					throw new \Exception( 'Failed to update resource status' );
				}

				// Invalidate cache.
				Cache_Service::delete( 'library_stats' );
				Cache_Service::flush_pattern( 'active_loans*' );
				Cache_Service::flush_pattern( 'loans_with_penalties*' );

				return array(
					'penalty' => $penalty,
				);
			}
		);

		if ( is_wp_error( $result ) ) {
			error_log( 'CPFA Return Processing Error: ' . $result->get_error_message() );
			return false;
		}

		return $result;
	}

	/**
	 * Calculate penalty for a loan.
	 *
	 * @param int $loan_id Loan ID.
	 * @return int Penalty amount.
	 */
	private function calculate_loan_penalty( $loan_id ) {
		$date_retour_prevue = get_post_meta( $loan_id, '_cpfa_emprunt_date_retour_prevue', true );
		$date_retour_effective = gmdate( 'Y-m-d' );

		if ( empty( $date_retour_prevue ) ) {
			return 0;
		}

		$date_prevue   = strtotime( $date_retour_prevue );
		$date_retour   = strtotime( $date_retour_effective );
		$jours_retard  = max( 0, floor( ( $date_retour - $date_prevue ) / DAY_IN_SECONDS ) );

		// Penalty starts from day 4 (3 days grace period).
		if ( $jours_retard <= 3 ) {
			return 0;
		}

		$jours_penalite = $jours_retard - 3;
		$penalite       = $jours_penalite * 500; // 500 FCFA per day.

		return $penalite;
	}

	/**
	 * Ajax handler for marking penalty as paid.
	 */
	public function ajax_mark_penalty_paid() {
		check_ajax_referer( 'cpfa-library-nonce', 'nonce' );

		if ( ! current_user_can( 'manage_cpfa_biblio' ) ) {
			wp_send_json_error( array( 'message' => __( 'Accès non autorisé.', 'cpfa-core' ) ) );
		}

		$loan_id = isset( $_POST['loan_id'] ) ? absint( $_POST['loan_id'] ) : 0;

		if ( ! $loan_id ) {
			wp_send_json_error( array( 'message' => __( 'Données invalides.', 'cpfa-core' ) ) );
		}

		// Mark penalty as paid.
		update_post_meta( $loan_id, '_cpfa_emprunt_penalite_payee', '1' );

		wp_send_json_success(
			array(
				'message' => __( 'Pénalité marquée comme payée.', 'cpfa-core' ),
			)
		);
	}

	/**
	 * Ajax handler for refreshing stats.
	 */
	public function ajax_refresh_stats() {
		check_ajax_referer( 'cpfa-refresh-stats', 'nonce' );

		if ( ! current_user_can( 'manage_cpfa_biblio' ) ) {
			wp_send_json_error( array( 'message' => __( 'Accès non autorisé.', 'cpfa-core' ) ) );
		}

		// Get fresh statistics
		$stats = $this->get_library_stats();

		wp_send_json_success( $stats );
	}
}
