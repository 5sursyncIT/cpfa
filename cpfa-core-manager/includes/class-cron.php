<?php
/**
 * Cron Jobs Handler
 *
 * @package CpfaCore
 */

namespace Cpfa\Core;

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Cron class.
 */
class Cron {

	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'cpfa_daily_cron', array( $this, 'daily_tasks' ) );
		add_action( 'cpfa_hourly_cron', array( $this, 'hourly_tasks' ) );
	}

	/**
	 * Schedule cron events.
	 */
	public static function schedule_events() {
		if ( ! wp_next_scheduled( 'cpfa_daily_cron' ) ) {
			wp_schedule_event( time(), 'daily', 'cpfa_daily_cron' );
		}

		if ( ! wp_next_scheduled( 'cpfa_hourly_cron' ) ) {
			wp_schedule_event( time(), 'hourly', 'cpfa_hourly_cron' );
		}
	}

	/**
	 * Clear scheduled events.
	 */
	public static function clear_scheduled_events() {
		wp_clear_scheduled_hook( 'cpfa_daily_cron' );
		wp_clear_scheduled_hook( 'cpfa_hourly_cron' );
	}

	/**
	 * Daily tasks.
	 */
	public function daily_tasks() {
		$this->send_loan_reminders();
		$this->check_expired_subscriptions();
		$this->calculate_overdue_penalties();
	}

	/**
	 * Hourly tasks.
	 */
	public function hourly_tasks() {
		$this->cleanup_transients();
	}

	/**
	 * Send loan reminders.
	 */
	private function send_loan_reminders() {
		$today = current_time( 'Y-m-d' );

		// Get loans due in 3 days.
		$args = array(
			'post_type'      => 'cpfa_emprunt',
			'posts_per_page' => -1,
			'meta_query'     => array(
				array(
					'key'     => '_cpfa_emprunt_date_retour_prevue',
					'value'   => date( 'Y-m-d', strtotime( '+3 days' ) ),
					'compare' => '=',
				),
				array(
					'key'     => '_cpfa_emprunt_date_retour_effective',
					'compare' => 'NOT EXISTS',
				),
			),
		);

		$loans = get_posts( $args );

		foreach ( $loans as $loan ) {
			// Send reminder email (placeholder).
			do_action( 'cpfa_send_loan_reminder', $loan->ID, 'upcoming' );
		}

		// Get overdue loans.
		$overdue_args = array(
			'post_type'      => 'cpfa_emprunt',
			'posts_per_page' => -1,
			'meta_query'     => array(
				array(
					'key'     => '_cpfa_emprunt_date_retour_prevue',
					'value'   => $today,
					'compare' => '<',
				),
				array(
					'key'     => '_cpfa_emprunt_date_retour_effective',
					'compare' => 'NOT EXISTS',
				),
			),
		);

		$overdue_loans = get_posts( $overdue_args );

		foreach ( $overdue_loans as $loan ) {
			do_action( 'cpfa_send_loan_reminder', $loan->ID, 'overdue' );
		}
	}

	/**
	 * Check expired subscriptions.
	 */
	private function check_expired_subscriptions() {
		$today = current_time( 'Y-m-d' );

		// Get subscriptions expiring soon (30, 7, 1 days).
		$reminder_days = array( 30, 7, 1 );

		foreach ( $reminder_days as $days ) {
			$expiry_date = date( 'Y-m-d', strtotime( "+{$days} days" ) );

			$args = array(
				'post_type'      => 'cpfa_abonnement',
				'posts_per_page' => -1,
				'meta_query'     => array(
					array(
						'key'     => '_cpfa_abonnement_date_fin',
						'value'   => $expiry_date,
						'compare' => '=',
					),
					array(
						'key'     => '_cpfa_abonnement_statut',
						'value'   => 'actif',
						'compare' => '=',
					),
				),
			);

			$subscriptions = get_posts( $args );

			foreach ( $subscriptions as $subscription ) {
				do_action( 'cpfa_send_subscription_expiry_reminder', $subscription->ID, $days );
			}
		}

		// Mark expired subscriptions.
		$expired_args = array(
			'post_type'      => 'cpfa_abonnement',
			'posts_per_page' => -1,
			'meta_query'     => array(
				array(
					'key'     => '_cpfa_abonnement_date_fin',
					'value'   => $today,
					'compare' => '<',
				),
				array(
					'key'     => '_cpfa_abonnement_statut',
					'value'   => 'actif',
					'compare' => '=',
				),
			),
		);

		$expired = get_posts( $expired_args );

		foreach ( $expired as $subscription ) {
			update_post_meta( $subscription->ID, '_cpfa_abonnement_statut', 'expire' );
		}
	}

	/**
	 * Calculate overdue penalties.
	 */
	private function calculate_overdue_penalties() {
		$today = current_time( 'Y-m-d' );

		$args = array(
			'post_type'      => 'cpfa_emprunt',
			'posts_per_page' => -1,
			'meta_query'     => array(
				array(
					'key'     => '_cpfa_emprunt_date_retour_prevue',
					'value'   => $today,
					'compare' => '<',
				),
				array(
					'key'     => '_cpfa_emprunt_date_retour_effective',
					'compare' => 'NOT EXISTS',
				),
			),
		);

		$overdue_loans = get_posts( $args );

		foreach ( $overdue_loans as $loan ) {
			$date_retour_prevue = get_post_meta( $loan->ID, '_cpfa_emprunt_date_retour_prevue', true );
			$prevue             = strtotime( $date_retour_prevue );
			$now                = strtotime( $today );
			$diff_days          = ( $now - $prevue ) / DAY_IN_SECONDS;

			// Penalty: 500 FCFA/day starting from day 4.
			if ( $diff_days > 3 ) {
				$penalty = ( $diff_days - 3 ) * 500;
				update_post_meta( $loan->ID, '_cpfa_emprunt_penalite', $penalty );
			}
		}
	}

	/**
	 * Cleanup transients.
	 */
	private function cleanup_transients() {
		// Delete expired transients.
		global $wpdb;
		$wpdb->query(
			"DELETE FROM {$wpdb->options}
			WHERE option_name LIKE '_transient_timeout_cpfa_%'
			AND option_value < UNIX_TIMESTAMP()"
		);
	}
}
