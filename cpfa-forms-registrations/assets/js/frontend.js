/**
 * CPFA Forms - Frontend JavaScript
 *
 * Handles form interactivity and AJAX submission
 */

(function ($) {
	'use strict';

	/**
	 * Abonnement Form Handler
	 */
	const CpfaAbonnementForm = {
		/**
		 * Initialize
		 */
		init() {
			this.cacheElements();
			this.bindEvents();
		},

		/**
		 * Cache DOM elements
		 */
		cacheElements() {
			this.$form = $('#cpfa-abonnement-form');
			this.$submitBtn = $('#cpfa-submit-btn');
			this.$messagesContainer = $('#cpfa-form-messages');
			this.$typeRadios = $('input[name="cpfa_type"]');
			this.$amountDisplay = $('#cpfa-amount-display');
			this.$priceDisplay = $('.cpfa-price-display');
		},

		/**
		 * Bind events
		 */
		bindEvents() {
			const self = this;

			// Update price when type changes
			this.$typeRadios.on('change', function () {
				self.updatePrice($(this));
			});

			// Handle form submission
			this.$form.on('submit', function (e) {
				e.preventDefault();
				self.handleSubmit();
			});
		},

		/**
		 * Update displayed price based on selected type
		 */
		updatePrice($radio) {
			const price = $radio.data('price');
			const formattedPrice = this.formatPrice(price);

			this.$amountDisplay.text(formattedPrice);
			this.$priceDisplay.addClass('visible');
		},

		/**
		 * Format price in FCFA
		 */
		formatPrice(price) {
			return new Intl.NumberFormat('fr-FR', {
				style: 'currency',
				currency: 'XOF',
				minimumFractionDigits: 0,
			})
				.format(price)
				.replace('XOF', 'FCFA');
		},

		/**
		 * Validate form before submission
		 */
		validateForm() {
			// Check if photo file is provided and valid
			const photoFile = $('#cpfa_photo')[0].files[0];
			if (photoFile) {
				const photoSize = photoFile.size;
				const photoType = photoFile.type;

				if (photoSize > 2 * 1024 * 1024) {
					this.showError('La photo est trop volumineuse. Taille max : 2 MB');
					return false;
				}

				if (!['image/jpeg', 'image/png'].includes(photoType)) {
					this.showError('Format de photo invalide. Utilisez JPG ou PNG.');
					return false;
				}
			}

			// Check if CNI file is provided and valid
			const cniFile = $('#cpfa_cni')[0].files[0];
			if (cniFile) {
				const cniSize = cniFile.size;
				const cniType = cniFile.type;

				if (cniSize > 5 * 1024 * 1024) {
					this.showError('La CNI est trop volumineuse. Taille max : 5 MB');
					return false;
				}

				if (!['image/jpeg', 'image/png', 'application/pdf'].includes(cniType)) {
					this.showError('Format de CNI invalide. Utilisez JPG, PNG ou PDF.');
					return false;
				}
			}

			// Check if type is selected
			if (!$('input[name="cpfa_type"]:checked').length) {
				this.showError('Veuillez sélectionner un type d\'abonnement.');
				return false;
			}

			// Check RGPD consents
			if (!$('input[name="cpfa_consent_rgpd"]').is(':checked')) {
				this.showError('Vous devez accepter la politique de confidentialité.');
				return false;
			}

			if (!$('input[name="cpfa_consent_photo"]').is(':checked')) {
				this.showError('Vous devez autoriser l\'utilisation de votre photo.');
				return false;
			}

			return true;
		},

		/**
		 * Handle form submission
		 */
		handleSubmit() {
			// Validate form
			if (!this.validateForm()) {
				return;
			}

			// Prepare form data
			const formData = new FormData(this.$form[0]);
			formData.append('action', 'cpfa_submit_abonnement');

			// Disable submit button
			this.setLoadingState(true);

			// Clear previous messages
			this.clearMessages();

			// Send AJAX request
			$.ajax({
				url: cpfaForms.ajaxUrl,
				type: 'POST',
				data: formData,
				processData: false,
				contentType: false,
				success: (response) => {
					if (response.success) {
						this.handleSuccess(response.data);
					} else {
						this.handleError(response.data);
					}
				},
				error: (xhr) => {
					let message = cpfaForms.strings.error;

					if (xhr.responseJSON && xhr.responseJSON.data && xhr.responseJSON.data.message) {
						message = xhr.responseJSON.data.message;
					}

					this.showError(message);
					this.setLoadingState(false);
				},
			});
		},

		/**
		 * Handle successful submission
		 */
		handleSuccess(data) {
			const message = `
				<div class="cpfa-success-message">
					<h3>✅ ${data.message}</h3>
					<p><strong>Numéro de préinscription :</strong> ${data.numero_preinscription}</p>
					<p>Vous allez recevoir un email de confirmation à l'adresse : <strong>${data.email}</strong></p>
					<p>Votre abonnement sera activé sous 24-48h ouvrées après vérification de votre paiement.</p>
					<p>Vous recevrez votre carte membre par email dès validation.</p>
				</div>
			`;

			this.showSuccess(message);

			// Reset form
			this.$form[0].reset();
			this.$priceDisplay.removeClass('visible');

			// Scroll to message
			this.scrollToMessages();

			// Re-enable button
			this.setLoadingState(false);
		},

		/**
		 * Handle error
		 */
		handleError(data) {
			const message = data.message || cpfaForms.strings.error;
			this.showError(message);
			this.setLoadingState(false);
			this.scrollToMessages();
		},

		/**
		 * Show success message
		 */
		showSuccess(message) {
			this.$messagesContainer.html(`<div class="cpfa-message cpfa-message-success">${message}</div>`);
		},

		/**
		 * Show error message
		 */
		showError(message) {
			this.$messagesContainer.html(`<div class="cpfa-message cpfa-message-error">${message}</div>`);
		},

		/**
		 * Clear messages
		 */
		clearMessages() {
			this.$messagesContainer.html('');
		},

		/**
		 * Set loading state
		 */
		setLoadingState(isLoading) {
			if (isLoading) {
				this.$submitBtn.prop('disabled', true).text('Envoi en cours...');
				this.$submitBtn.after('<span class="cpfa-loading"><span class="spinner"></span></span>');
			} else {
				this.$submitBtn.prop('disabled', false).text(cpfaForms.strings.submitBtn || 'Soumettre ma demande');
				$('.cpfa-loading').remove();
			}
		},

		/**
		 * Scroll to messages
		 */
		scrollToMessages() {
			if (this.$messagesContainer.length) {
				$('html, body').animate(
					{
						scrollTop: this.$messagesContainer.offset().top - 100,
					},
					500
				);
			}
		},
	};

	/**
	 * Initialize when DOM is ready
	 */
	$(document).ready(function () {
		if ($('#cpfa-abonnement-form').length) {
			CpfaAbonnementForm.init();
		}
	});
})(jQuery);
