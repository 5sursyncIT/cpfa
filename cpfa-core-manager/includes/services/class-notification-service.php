<?php
/**
 * Notification Service
 *
 * @package CpfaCore
 */

namespace Cpfa\Core\Services;

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Notification Service class.
 */
class Notification_Service {

	/**
	 * Send email notification.
	 *
	 * @param string $to      Recipient email.
	 * @param string $subject Email subject.
	 * @param string $message Email message.
	 * @param array  $args    Additional arguments.
	 * @return bool True on success, false on failure.
	 */
	public static function send_email( $to, $subject, $message, $args = array() ) {
		$defaults = array(
			'template'    => 'default',
			'headers'     => array(),
			'attachments' => array(),
		);

		$args = wp_parse_args( $args, $defaults );

		// Load template if specified.
		if ( ! empty( $args['template'] ) && 'default' !== $args['template'] ) {
			$message = self::load_email_template( $args['template'], $message, $args );
		} else {
			$message = self::wrap_email_template( $message );
		}

		// Set headers.
		$headers = array_merge(
			array(
				'Content-Type: text/html; charset=UTF-8',
				'From: ' . get_option( 'cpfa_email_from_name', get_bloginfo( 'name' ) ) . ' <' . get_option( 'cpfa_email_from_address', get_option( 'admin_email' ) ) . '>',
			),
			$args['headers']
		);

		// Apply filters.
		$to      = apply_filters( 'cpfa_email_to', $to, $args );
		$subject = apply_filters( 'cpfa_email_subject', $subject, $args );
		$message = apply_filters( 'cpfa_email_message', $message, $args );
		$headers = apply_filters( 'cpfa_email_headers', $headers, $args );

		// Send email.
		$result = wp_mail( $to, $subject, $message, $headers, $args['attachments'] );

		// Log if enabled.
		if ( get_option( 'cpfa_log_emails', false ) ) {
			self::log_email( $to, $subject, $result );
		}

		return $result;
	}

	/**
	 * Load email template.
	 *
	 * @param string $template Template name.
	 * @param string $content  Email content.
	 * @param array  $args     Template arguments.
	 * @return string Rendered template.
	 */
	private static function load_email_template( $template, $content, $args = array() ) {
		$template_path = CPFA_CORE_PLUGIN_DIR . 'templates/emails/' . $template . '.php';

		if ( ! file_exists( $template_path ) ) {
			return self::wrap_email_template( $content );
		}

		ob_start();
		include $template_path;
		return ob_get_clean();
	}

	/**
	 * Wrap content in default email template.
	 *
	 * @param string $content Email content.
	 * @return string Wrapped content.
	 */
	private static function wrap_email_template( $content ) {
		$logo = get_option( 'cpfa_logo', '' );

		ob_start();
		?>
		<!DOCTYPE html>
		<html>
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<style>
				body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
				.email-wrapper { max-width: 600px; margin: 0 auto; padding: 20px; }
				.email-header { background: #2c5aa0; color: #fff; padding: 20px; text-align: center; }
				.email-header img { max-height: 60px; }
				.email-body { background: #fff; padding: 30px; border: 1px solid #ddd; }
				.email-footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
			</style>
		</head>
		<body>
			<div class="email-wrapper">
				<div class="email-header">
					<?php if ( $logo ) : ?>
						<img src="<?php echo esc_url( $logo ); ?>" alt="<?php echo esc_attr( get_bloginfo( 'name' ) ); ?>">
					<?php else : ?>
						<h2><?php echo esc_html( get_bloginfo( 'name' ) ); ?></h2>
					<?php endif; ?>
				</div>
				<div class="email-body">
					<?php echo wp_kses_post( $content ); ?>
				</div>
				<div class="email-footer">
					<p>&copy; <?php echo esc_html( date( 'Y' ) . ' ' . get_bloginfo( 'name' ) ); ?></p>
					<p><?php echo esc_html( get_option( 'cpfa_coordonnees', '' ) ); ?></p>
				</div>
			</div>
		</body>
		</html>
		<?php
		return ob_get_clean();
	}

	/**
	 * Send loan reminder.
	 *
	 * @param int    $loan_id Loan ID.
	 * @param string $type    Reminder type (upcoming, overdue).
	 * @return bool True on success.
	 */
	public static function send_loan_reminder( $loan_id, $type = 'upcoming' ) {
		$abonne_id  = get_post_meta( $loan_id, '_cpfa_emprunt_abonne', true );
		$abonnement = get_post( $abonne_id );

		if ( ! $abonnement ) {
			return false;
		}

		$email = get_post_meta( $abonne_id, '_cpfa_abonnement_email', true );
		if ( ! $email ) {
			return false;
		}

		$ressource_id = get_post_meta( $loan_id, '_cpfa_emprunt_ressource', true );
		$ressource    = get_post( $ressource_id );
		$date_retour  = get_post_meta( $loan_id, '_cpfa_emprunt_date_retour_prevue', true );

		if ( 'upcoming' === $type ) {
			$subject = __( 'Rappel: Retour de votre emprunt bientôt', 'cpfa-core' );
			$message = sprintf(
				__( 'Bonjour,<br><br>Nous vous rappelons que votre emprunt "%s" doit être retourné le %s.<br><br>Merci de votre attention.', 'cpfa-core' ),
				esc_html( $ressource->post_title ),
				esc_html( date_i18n( 'j F Y', strtotime( $date_retour ) ) )
			);
		} else {
			$penalite = get_post_meta( $loan_id, '_cpfa_emprunt_penalite', true );
			$subject  = __( 'URGENT: Emprunt en retard', 'cpfa-core' );
			$message  = sprintf(
				__( 'Bonjour,<br><br>Votre emprunt "%s" est en retard depuis le %s.<br><br>Pénalité actuelle: %s FCFA (500 FCFA/jour à partir du 4ème jour).<br><br>Merci de régulariser rapidement.', 'cpfa-core' ),
				esc_html( $ressource->post_title ),
				esc_html( date_i18n( 'j F Y', strtotime( $date_retour ) ) ),
				number_format( $penalite )
			);
		}

		return self::send_email( $email, $subject, $message, array( 'template' => 'loan-reminder' ) );
	}

	/**
	 * Send subscription expiry reminder.
	 *
	 * @param int $subscription_id Subscription ID.
	 * @param int $days_remaining  Days remaining.
	 * @return bool True on success.
	 */
	public static function send_subscription_expiry_reminder( $subscription_id, $days_remaining ) {
		$email = get_post_meta( $subscription_id, '_cpfa_abonnement_email', true );
		if ( ! $email ) {
			return false;
		}

		$date_fin = get_post_meta( $subscription_id, '_cpfa_abonnement_date_fin', true );

		$subject = __( 'Votre abonnement CPFA arrive à expiration', 'cpfa-core' );
		$message = sprintf(
			__( 'Bonjour,<br><br>Votre abonnement à la bibliothèque CPFA arrive à expiration dans %d jours (le %s).<br><br>Pour renouveler votre abonnement, veuillez nous contacter.', 'cpfa-core' ),
			$days_remaining,
			date_i18n( 'j F Y', strtotime( $date_fin ) )
		);

		return self::send_email( $email, $subject, $message, array( 'template' => 'subscription-expiry' ) );
	}

	/**
	 * Send payment confirmation.
	 *
	 * @param int    $post_id Post ID.
	 * @param string $type    Type (formation, seminaire, etc).
	 * @param array  $data    Payment data.
	 * @return bool True on success.
	 */
	public static function send_payment_confirmation( $post_id, $type, $data ) {
		if ( ! isset( $data['email'] ) ) {
			return false;
		}

		$subject = __( 'Confirmation de paiement - CPFA', 'cpfa-core' );
		$message = sprintf(
			__( 'Bonjour,<br><br>Nous avons bien reçu votre paiement de %s FCFA pour %s.<br><br>Référence: %s<br><br>Vous recevrez prochainement votre reçu et autres documents.', 'cpfa-core' ),
			number_format( $data['amount'] ),
			esc_html( $data['title'] ),
			esc_html( $data['reference'] )
		);

		return self::send_email( $data['email'], $subject, $message, array( 'template' => 'payment-confirmation' ) );
	}

	/**
	 * Log email.
	 *
	 * @param string $to      Recipient.
	 * @param string $subject Subject.
	 * @param bool   $result  Send result.
	 */
	private static function log_email( $to, $subject, $result ) {
		$log_entry = sprintf(
			'[%s] Email %s to %s - Subject: %s',
			current_time( 'Y-m-d H:i:s' ),
			$result ? 'sent' : 'failed',
			$to,
			$subject
		);

		error_log( $log_entry );

		// Store in option for admin review.
		$logs = get_option( 'cpfa_email_logs', array() );
		array_unshift( $logs, $log_entry );
		$logs = array_slice( $logs, 0, 100 ); // Keep last 100.
		update_option( 'cpfa_email_logs', $logs );
	}

	/**
	 * Send SMS (placeholder for future SMS provider integration).
	 *
	 * @param string $phone   Phone number.
	 * @param string $message SMS message.
	 * @return bool True on success.
	 */
	public static function send_sms( $phone, $message ) {
		// Placeholder for SMS provider integration.
		do_action( 'cpfa_send_sms', $phone, $message );
		return apply_filters( 'cpfa_sms_result', false, $phone, $message );
	}
}
