/**
 * CPFA Forms - Admin JavaScript
 *
 * Handles admin functionality (QR upload, AJAX validation)
 */

(function ($) {
	'use strict';

	/**
	 * QR Code Upload Handler
	 */
	const CpfaQRUpload = {
		/**
		 * Initialize
		 */
		init() {
			this.bindEvents();
		},

		/**
		 * Bind events
		 */
		bindEvents() {
			const self = this;

			// Upload QR code button
			$(document).on('click', '.cpfa-upload-qr-btn', function (e) {
				e.preventDefault();
				const targetInput = $(this).data('target');
				self.openMediaUploader(targetInput, $(this));
			});

			// Remove QR code button
			$(document).on('click', '.cpfa-remove-qr-btn', function (e) {
				e.preventDefault();
				const targetInput = $(this).data('target');
				self.removeQRCode(targetInput, $(this));
			});
		},

		/**
		 * Open WordPress media uploader
		 */
		openMediaUploader(targetInputId, $button) {
			const $targetInput = $('#' + targetInputId);
			const $container = $button.closest('.cpfa-qr-upload');

			// Create media uploader if not exists
			const mediaUploader = wp.media({
				title: 'Sélectionner un QR Code',
				button: {
					text: 'Utiliser ce QR Code',
				},
				multiple: false,
				library: {
					type: ['image/jpeg', 'image/png'],
				},
			});

			// When an image is selected
			mediaUploader.on('select', function () {
				const attachment = mediaUploader.state().get('selection').first().toJSON();

				// Update hidden input with URL
				$targetInput.val(attachment.url);

				// Remove existing preview if any
				$container.find('.cpfa-qr-preview').remove();
				$container.find('.cpfa-remove-qr-btn').remove();

				// Add preview
				$button.after(
					'<button type="button" class="button cpfa-remove-qr-btn" data-target="' +
						targetInputId +
						'">Supprimer</button>' +
						'<div class="cpfa-qr-preview">' +
						'<img src="' +
						attachment.url +
						'" alt="QR Code" style="max-width: 200px; margin-top: 10px; border: 1px solid #ddd; padding: 5px;">' +
						'</div>'
				);
			});

			// Open media uploader
			mediaUploader.open();
		},

		/**
		 * Remove QR code
		 */
		removeQRCode(targetInputId, $button) {
			const $targetInput = $('#' + targetInputId);
			const $container = $button.closest('.cpfa-qr-upload');

			// Clear input
			$targetInput.val('');

			// Remove preview and button
			$container.find('.cpfa-qr-preview').remove();
			$button.remove();
		},
	};

	/**
	 * Preinscription Management
	 */
	const CpfaPreinscriptionAdmin = {
		/**
		 * Initialize
		 */
		init() {
			this.bindEvents();
		},

		/**
		 * Bind events
		 */
		bindEvents() {
			const self = this;

			// View details
			$(document).on('click', '.cpfa-view-details', function (e) {
				e.preventDefault();
				const abonnementId = $(this).data('id');
				self.viewDetails(abonnementId);
			});

			// Validate abonnement
			$(document).on('click', '.cpfa-validate-btn', function (e) {
				e.preventDefault();
				const abonnementId = $(this).data('id');
				self.showValidateModal(abonnementId);
			});

			// Reject abonnement
			$(document).on('click', '.cpfa-reject-btn', function (e) {
				e.preventDefault();
				const abonnementId = $(this).data('id');
				self.showRejectModal(abonnementId);
			});

			// Request justification
			$(document).on('click', '.cpfa-request-justif-btn', function (e) {
				e.preventDefault();
				const abonnementId = $(this).data('id');
				self.requestJustification(abonnementId);
			});

			// Submit validation form
			$(document).on('submit', '#cpfa-validate-form', function (e) {
				e.preventDefault();
				self.submitValidation($(this));
			});

			// Submit rejection form
			$(document).on('submit', '#cpfa-reject-form', function (e) {
				e.preventDefault();
				self.submitRejection($(this));
			});
		},

		/**
		 * View details modal
		 */
		viewDetails(abonnementId) {
			// AJAX to get details
			$.post(
				cpfaFormsAdmin.ajaxUrl,
				{
					action: 'cpfa_get_abonnement_details',
					nonce: cpfaFormsAdmin.nonce,
					id: abonnementId,
				},
				function (response) {
					if (response.success) {
						// Show modal with details
						const data = response.data;
						let modalContent = '<div class="cpfa-details-modal">';
						modalContent += '<h2>Détails de la préinscription</h2>';
						modalContent += '<div class="cpfa-detail-section">';
						modalContent += '<h3>Informations personnelles</h3>';
						modalContent += '<p><strong>Nom :</strong> ' + data.nom + ' ' + data.prenom + '</p>';
						modalContent += '<p><strong>Email :</strong> ' + data.email + '</p>';
						modalContent += '<p><strong>Téléphone :</strong> ' + data.telephone + '</p>';
						modalContent += '</div>';
						modalContent += '<div class="cpfa-detail-section">';
						modalContent += '<h3>Abonnement</h3>';
						modalContent += '<p><strong>Type :</strong> ' + data.type + '</p>';
						modalContent += '<p><strong>Montant :</strong> ' + data.montant + '</p>';
						modalContent += '<p><strong>Date :</strong> ' + data.date + '</p>';
						modalContent += '</div>';
						if (data.photo) {
							modalContent += '<div class="cpfa-detail-section">';
							modalContent += '<h3>Photo</h3>';
							modalContent += '<img src="' + data.photo + '" style="max-width: 200px;">';
							modalContent += '</div>';
						}
						modalContent += '</div>';

						// Create dialog
						$(modalContent).dialog({
							title: 'Détails de la préinscription #' + abonnementId,
							width: 600,
							modal: true,
							buttons: {
								Fermer: function () {
									$(this).dialog('close');
								},
							},
						});
					}
				}
			);
		},

		/**
		 * Show validate modal
		 */
		showValidateModal(abonnementId) {
			const modalContent = `
				<form id="cpfa-validate-form">
					<input type="hidden" name="abonnement_id" value="${abonnementId}">
					<p>
						<label for="transaction_ref">Référence de transaction *</label><br>
						<input type="text" id="transaction_ref" name="transaction_ref" class="widefat" required>
					</p>
					<p>
						<label for="gateway">Gateway *</label><br>
						<select id="gateway" name="gateway" class="widefat" required>
							<option value="wave">Wave</option>
							<option value="orange_money">Orange Money</option>
						</select>
					</p>
					<p>
						<label>
							<input type="checkbox" name="send_email" checked>
							Envoyer l'email avec la carte membre
						</label>
					</p>
				</form>
			`;

			$(modalContent).dialog({
				title: 'Valider la préinscription',
				width: 500,
				modal: true,
				buttons: {
					'Valider l\'abonnement': function () {
						$('#cpfa-validate-form').submit();
					},
					Annuler: function () {
						$(this).dialog('close');
					},
				},
			});
		},

		/**
		 * Show reject modal
		 */
		showRejectModal(abonnementId) {
			const modalContent = `
				<form id="cpfa-reject-form">
					<input type="hidden" name="abonnement_id" value="${abonnementId}">
					<p>
						<label>Motif du rejet *</label><br>
						<label><input type="radio" name="motif" value="paiement_non_recu" required> Paiement non reçu</label><br>
						<label><input type="radio" name="motif" value="montant_incorrect"> Montant incorrect</label><br>
						<label><input type="radio" name="motif" value="photo_illisible"> Photo illisible</label><br>
						<label><input type="radio" name="motif" value="informations_incompletes"> Informations incomplètes</label><br>
						<label><input type="radio" name="motif" value="autre"> Autre (préciser ci-dessous)</label>
					</p>
					<p>
						<label for="details">Détails :</label><br>
						<textarea id="details" name="details" class="widefat" rows="4"></textarea>
					</p>
					<p>
						<label>
							<input type="checkbox" name="send_email" checked>
							Envoyer l'email à l'utilisateur
						</label>
					</p>
				</form>
			`;

			$(modalContent).dialog({
				title: 'Rejeter la préinscription',
				width: 500,
				modal: true,
				buttons: {
					'Confirmer le rejet': function () {
						$('#cpfa-reject-form').submit();
					},
					Annuler: function () {
						$(this).dialog('close');
					},
				},
			});
		},

		/**
		 * Submit validation
		 */
		submitValidation($form) {
			const data = $form.serialize();

			$.post(
				cpfaFormsAdmin.ajaxUrl,
				{
					action: 'cpfa_validate_abonnement',
					nonce: cpfaFormsAdmin.nonce,
					...Object.fromEntries(new URLSearchParams(data)),
				},
				function (response) {
					if (response.success) {
						alert('Abonnement validé avec succès !');
						location.reload();
					} else {
						alert('Erreur : ' + (response.data.message || 'Une erreur est survenue'));
					}
				}
			);
		},

		/**
		 * Submit rejection
		 */
		submitRejection($form) {
			const data = $form.serialize();

			$.post(
				cpfaFormsAdmin.ajaxUrl,
				{
					action: 'cpfa_reject_abonnement',
					nonce: cpfaFormsAdmin.nonce,
					...Object.fromEntries(new URLSearchParams(data)),
				},
				function (response) {
					if (response.success) {
						alert('Préinscription rejetée.');
						location.reload();
					} else {
						alert('Erreur : ' + (response.data.message || 'Une erreur est survenue'));
					}
				}
			);
		},

		/**
		 * Request justification
		 */
		requestJustification(abonnementId) {
			const message = prompt('Message personnalisé (optionnel) :');

			if (message !== null) {
				// null means user cancelled
				$.post(
					cpfaFormsAdmin.ajaxUrl,
					{
						action: 'cpfa_request_justificatif',
						nonce: cpfaFormsAdmin.nonce,
						id: abonnementId,
						message: message,
					},
					function (response) {
						if (response.success) {
							alert('Email envoyé avec succès.');
						} else {
							alert('Erreur : ' + (response.data.message || 'Une erreur est survenue'));
						}
					}
				);
			}
		},
	};

	/**
	 * Initialize on DOM ready
	 */
	$(document).ready(function () {
		CpfaQRUpload.init();

		// Only init preinscription admin on the relevant page
		if ($('.cpfa-preinscriptions-page').length) {
			CpfaPreinscriptionAdmin.init();
		}
	});
})(jQuery);
