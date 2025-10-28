/**
 * CPFA Library Widget Frontend Script
 *
 * Handles reservation interactions and UI enhancements
 *
 * @package CpfaCore
 * @version 1.1.0
 */

(function ($) {
	'use strict';

	/**
	 * Library Widget Handler
	 */
	var CPFALibraryWidget = {

		/**
		 * Initialize
		 */
		init: function () {
			this.bindEvents();
			this.enhanceUI();
		},

		/**
		 * Bind event listeners
		 */
		bindEvents: function () {
			// Reserve button click
			$(document).on('click', '.cpfa-reserve-available', this.handleReserve);

			// Search form enhancement
			$('.library-search-form').on('submit', this.handleSearch);

			// Add loading states
			$('.library-filter-select').on('change', function() {
				$(this).closest('.cpfa-library-widget').addClass('library-loading');
			});
		},

		/**
		 * Handle reserve button click
		 */
		handleReserve: function (e) {
			e.preventDefault();

			var $button = $(this);
			var resourceId = $button.data('resource-id');
			var resourceTitle = $button.data('resource-title');

			// Check if user is logged in
			if (typeof cpfaCore === 'undefined' || !cpfaCore.isLoggedIn) {
				CPFALibraryWidget.showNotification(
					'Vous devez être connecté pour réserver un livre',
					'warning'
				);
				return;
			}

			// Confirm reservation
			if (!confirm('Voulez-vous réserver "' + resourceTitle + '" ?')) {
				return;
			}

			// Show loading state
			$button.prop('disabled', true)
				.addClass('loading')
				.find('.cpfa-reserve-text')
				.text('Réservation...');

			// Send AJAX request
			$.ajax({
				url: cpfaCore.ajaxUrl,
				type: 'POST',
				data: {
					action: 'cpfa_reserve_resource',
					nonce: cpfaCore.nonce,
					resource_id: resourceId
				},
				success: function (response) {
					if (response.success) {
						CPFALibraryWidget.showNotification(
							response.data.message,
							'success'
						);

						// Update button state
						$button.removeClass('cpfa-reserve-available loading')
							.addClass('cpfa-reserve-unavailable')
							.prop('disabled', true)
							.html('<span class="cpfa-reserve-icon">🔒</span><span class="cpfa-reserve-text">Réservé</span>');

						// Update availability badge
						$button.closest('.library-item')
							.find('.availability-badge')
							.removeClass('available')
							.addClass('unavailable')
							.html('<span class="dashicons dashicons-no"></span> Emprunté');

					} else {
						CPFALibraryWidget.showNotification(
							response.data.message || 'Une erreur est survenue',
							'error'
						);

						// Reset button
						$button.prop('disabled', false)
							.removeClass('loading')
							.find('.cpfa-reserve-text')
							.text('Réserver');
					}
				},
				error: function () {
					CPFALibraryWidget.showNotification(
						'Erreur de connexion. Veuillez réessayer.',
						'error'
					);

					// Reset button
					$button.prop('disabled', false)
						.removeClass('loading')
						.find('.cpfa-reserve-text')
						.text('Réserver');
				}
			});
		},

		/**
		 * Handle search form submit
		 */
		handleSearch: function (e) {
			var $form = $(this);
			var $input = $form.find('.library-search-input');

			// Validate search term
			if ($input.val().trim().length < 2) {
				e.preventDefault();
				CPFALibraryWidget.showNotification(
					'Veuillez entrer au moins 2 caractères',
					'warning'
				);
				$input.focus();
				return false;
			}

			// Add loading state to widget
			$form.closest('.cpfa-library-widget').addClass('library-loading');
		},

		/**
		 * Enhance UI with animations and effects
		 */
		enhanceUI: function () {
			// Add smooth scroll to pagination
			$('.library-pagination a').on('click', function (e) {
				var href = $(this).attr('href');
				if (href && href.indexOf('#') !== 0) {
					$('html, body').animate({
						scrollTop: $('.cpfa-library-widget').offset().top - 100
					}, 600);
				}
			});

			// Add keyboard navigation
			$('.library-search-input').on('keydown', function (e) {
				if (e.key === 'Escape') {
					$(this).val('').blur();
				}
			});

			// Lazy load images if present
			if ('IntersectionObserver' in window) {
				var imageObserver = new IntersectionObserver(function (entries) {
					entries.forEach(function (entry) {
						if (entry.isIntersecting) {
							var img = entry.target;
							if (img.dataset.src) {
								img.src = img.dataset.src;
								img.removeAttribute('data-src');
								imageObserver.unobserve(img);
							}
						}
					});
				});

				$('.library-item img[data-src]').each(function () {
					imageObserver.observe(this);
				});
			}
		},

		/**
		 * Show notification
		 */
		showNotification: function (message, type) {
			type = type || 'info';

			// Create notification element
			var $notification = $('<div>', {
				'class': 'cpfa-notification cpfa-notification-' + type,
				'html': '<span class="cpfa-notification-icon">' + this.getIcon(type) + '</span>' +
					'<span class="cpfa-notification-message">' + message + '</span>' +
					'<button class="cpfa-notification-close">&times;</button>'
			});

			// Add to body
			$('body').append($notification);

			// Show with animation
			setTimeout(function () {
				$notification.addClass('show');
			}, 100);

			// Auto hide after 5 seconds
			setTimeout(function () {
				CPFALibraryWidget.hideNotification($notification);
			}, 5000);

			// Close button click
			$notification.find('.cpfa-notification-close').on('click', function () {
				CPFALibraryWidget.hideNotification($notification);
			});
		},

		/**
		 * Hide notification
		 */
		hideNotification: function ($notification) {
			$notification.removeClass('show');
			setTimeout(function () {
				$notification.remove();
			}, 300);
		},

		/**
		 * Get icon for notification type
		 */
		getIcon: function (type) {
			var icons = {
				'success': '✓',
				'error': '✗',
				'warning': '⚠',
				'info': 'ℹ'
			};
			return icons[type] || icons.info;
		}
	};

	/**
	 * Initialize when DOM is ready
	 */
	$(document).ready(function () {
		CPFALibraryWidget.init();
	});

	/**
	 * Reinitialize on Elementor preview
	 */
	$(window).on('elementor/frontend/init', function () {
		if (elementorFrontend && elementorFrontend.hooks) {
			elementorFrontend.hooks.addAction('frontend/element_ready/cpfa-library.default', function () {
				CPFALibraryWidget.init();
			});
		}
	});

})(jQuery);
