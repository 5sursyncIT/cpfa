/**
 * Library Operations Tabs Handler
 *
 * Handles tab switching for library operations page
 * (Emprunter, Retours, Pénalités)
 *
 * @package CpfaCore
 */

(function ($) {
	'use strict';

	$(document).ready(function () {
		// Tab switching handler
		$('.cpfa-operations-tabs .nav-tab').on('click', function (e) {
			e.preventDefault();

			var $tab = $(this);
			var target = $tab.attr('href');

			// Validate target
			if (!target || target.charAt(0) !== '#') {
				return;
			}

			// Remove active classes
			$('.nav-tab').removeClass('nav-tab-active');
			$('.cpfa-tab-content').hide().removeClass('cpfa-tab-active');

			// Add active classes
			$tab.addClass('nav-tab-active');
			$(target).show().addClass('cpfa-tab-active');

			// Store active tab in session storage
			try {
				sessionStorage.setItem('cpfa_active_tab', target);
			} catch (error) {
				// Silent fail if sessionStorage not available
			}

			// Trigger custom event for other scripts
			$(document).trigger('cpfa:tab:changed', [target]);
		});

		// Restore last active tab from session storage
		try {
			var lastActiveTab = sessionStorage.getItem('cpfa_active_tab');
			if (lastActiveTab) {
				$('.nav-tab[href="' + lastActiveTab + '"]').trigger('click');
			}
		} catch (error) {
			// Silent fail if sessionStorage not available
		}

		// Handle URL hash for direct tab linking
		if (window.location.hash) {
			var hash = window.location.hash;
			var $targetTab = $('.nav-tab[href="' + hash + '"]');
			if ($targetTab.length) {
				$targetTab.trigger('click');
			}
		}

		// Update URL hash when tab changes (without page jump)
		$(document).on('cpfa:tab:changed', function (e, target) {
			if (history.pushState) {
				history.pushState(null, null, target);
			}
		});
	});

})(jQuery);
