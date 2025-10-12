/**
 * Library Manager JavaScript
 *
 * @package CpfaCore
 */

(function($) {
	'use strict';

	// Library Manager object
	const LibraryManager = {
		/**
		 * Initialize
		 */
		init: function() {
			this.initSelect2();
			this.initCheckoutForm();
			this.initReturnButtons();
			this.initPenaltyButtons();
		},

		/**
		 * Initialize Select2 for autocomplete
		 */
		initSelect2: function() {
			// Subscriber autocomplete
			if ($('#subscriber-id').length) {
				$('#subscriber-id').select2({
					placeholder: 'Rechercher un abonné par nom ou numéro...',
					minimumInputLength: 2,
					allowClear: true,
					width: '100%',
					ajax: {
						url: cpfaLibrary.ajaxUrl,
						dataType: 'json',
						delay: 250,
						data: function(params) {
							return {
								action: 'cpfa_search_subscriber',
								nonce: cpfaLibrary.nonce,
								search: params.term,
								page: params.page || 1
							};
						},
						processResults: function(data) {
							if (!data.success || !data.data.results) {
								return { results: [] };
							}
							return {
								results: data.data.results.map(function(item) {
									return {
										id: item.id,
										text: item.label
									};
								})
							};
						},
						cache: true
					}
				});
			}

			// Resource autocomplete
			if ($('#resource-id').length) {
				$('#resource-id').select2({
					placeholder: 'Rechercher une ressource par titre ou cote...',
					minimumInputLength: 2,
					allowClear: true,
					width: '100%',
					ajax: {
						url: cpfaLibrary.ajaxUrl,
						dataType: 'json',
						delay: 250,
						data: function(params) {
							return {
								action: 'cpfa_search_resource',
								nonce: cpfaLibrary.nonce,
								search: params.term,
								page: params.page || 1
							};
						},
						processResults: function(data) {
							if (!data.success || !data.data.results) {
								return { results: [] };
							}
							return {
								results: data.data.results.map(function(item) {
									return {
										id: item.id,
										text: item.label
									};
								})
							};
						},
						cache: true
					}
				});
			}
		},

		/**
		 * Initialize checkout form
		 */
		initCheckoutForm: function() {
			const self = this;

			// Form submission
			$('#cpfa-checkout-form').on('submit', function(e) {
				e.preventDefault();
				self.submitCheckout();
			});
		},

		/**
		 * Submit checkout form
		 */
		submitCheckout: function() {
			const subscriberId = $('#subscriber-id').val();
			const resourceId = $('#resource-id').val();
			const $form = $('#cpfa-checkout-form');
			const $button = $('#submit-checkout');
			const $message = $('#checkout-message');

			// Validate
			if (!subscriberId || !resourceId) {
				this.showMessage($message, 'error', 'Veuillez sélectionner un abonné et une ressource.');
				return;
			}

			// Confirm
			if (!confirm(cpfaLibrary.i18n.confirmCheckout)) {
				return;
			}

			// Disable button
			$button.prop('disabled', true).addClass('cpfa-loading');

			// Submit
			$.ajax({
				url: cpfaLibrary.ajaxUrl,
				type: 'POST',
				dataType: 'json',
				data: {
					action: 'cpfa_checkout_resource',
					nonce: cpfaLibrary.nonce,
					subscriber_id: subscriberId,
					resource_id: resourceId
				},
				success: function(response) {
					if (response.success) {
						this.showMessage($message, 'success', response.data.message);

						// Reset form after 2 seconds
						setTimeout(function() {
							$form[0].reset();
							$('#subscriber-id, #resource-id').val(null).trigger('change'); // Clear Select2
							$message.slideUp();
						}, 2000);
					} else {
						this.showMessage($message, 'error', response.data.message);
					}
				}.bind(this),
				error: function() {
					this.showMessage($message, 'error', 'Erreur lors de la communication avec le serveur.');
				}.bind(this),
				complete: function() {
					$button.prop('disabled', false).removeClass('cpfa-loading');
				}
			});
		},

		/**
		 * Initialize return buttons
		 */
		initReturnButtons: function() {
			const self = this;

			$('.cpfa-return-btn').on('click', function() {
				const loanId = $(this).data('loan-id');
				const $button = $(this);

				if (!confirm(cpfaLibrary.i18n.confirmReturn)) {
					return;
				}

				$button.prop('disabled', true).addClass('cpfa-loading');

				$.ajax({
					url: cpfaLibrary.ajaxUrl,
					type: 'POST',
					dataType: 'json',
					data: {
						action: 'cpfa_return_resource',
						nonce: cpfaLibrary.nonce,
						loan_id: loanId
					},
					success: function(response) {
						const $message = $('#return-message');

						if (response.success) {
							self.showMessage($message, 'success', response.data.message);

							// Remove row from table
							$button.closest('tr').fadeOut(500, function() {
								$(this).remove();

								// Check if table is empty
								if ($('.cpfa-loans-list tbody tr').length === 0) {
									location.reload();
								}
							});
						} else {
							self.showMessage($message, 'error', response.data.message);
							$button.prop('disabled', false).removeClass('cpfa-loading');
						}
					},
					error: function() {
						const $message = $('#return-message');
						self.showMessage($message, 'error', 'Erreur lors de la communication avec le serveur.');
						$button.prop('disabled', false).removeClass('cpfa-loading');
					}
				});
			});
		},

		/**
		 * Initialize penalty buttons
		 */
		initPenaltyButtons: function() {
			const self = this;

			$('.cpfa-mark-paid-btn').on('click', function() {
				const loanId = $(this).data('loan-id');
				const $button = $(this);
				const $row = $button.closest('tr');

				if (!confirm('Confirmer le paiement de cette pénalité ?')) {
					return;
				}

				$button.prop('disabled', true).addClass('cpfa-loading');

				$.ajax({
					url: cpfaLibrary.ajaxUrl,
					type: 'POST',
					dataType: 'json',
					data: {
						action: 'cpfa_mark_penalty_paid',
						nonce: cpfaLibrary.nonce,
						loan_id: loanId
					},
					success: function(response) {
						const $message = $('#penalty-message');

						if (response.success) {
							self.showMessage($message, 'success', 'Pénalité marquée comme payée.');

							// Update row
							$row.removeClass('unpaid-penalty');
							$row.find('.badge-danger')
								.removeClass('badge-danger')
								.addClass('badge-success')
								.html('<span class="dashicons dashicons-yes-alt"></span> Payée');

							$button.replaceWith('<button type="button" class="button button-small" disabled>Payée</button>');
						} else {
							self.showMessage($message, 'error', response.data.message || 'Erreur lors du marquage.');
							$button.prop('disabled', false).removeClass('cpfa-loading');
						}
					},
					error: function() {
						const $message = $('#penalty-message');
						self.showMessage($message, 'error', 'Erreur lors de la communication avec le serveur.');
						$button.prop('disabled', false).removeClass('cpfa-loading');
					}
				});
			});
		},

		/**
		 * Show message
		 */
		showMessage: function($element, type, message) {
			const classes = {
				success: 'notice notice-success',
				error: 'notice notice-error',
				info: 'notice notice-info'
			};

			$element
				.removeClass('notice-success notice-error notice-info')
				.addClass(classes[type] || classes.info)
				.html('<p>' + message + '</p>')
				.slideDown();

			// Auto-hide success messages
			if (type === 'success') {
				setTimeout(function() {
					$element.slideUp();
				}, 5000);
			}
		}
	};

	// Initialize on document ready
	$(document).ready(function() {
		LibraryManager.init();
	});

})(jQuery);
