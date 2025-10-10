/**
 * CPFA Core Frontend JavaScript
 * 
 * @package CpfaCore
 */

(function($) {
    'use strict';

    /**
     * Main CPFA Core Object
     */
    var CpfaCore = {
        
        /**
         * Initialize
         */
        init: function() {
            this.initTabs();
            this.initAccordions();
            this.initModals();
            this.initTooltips();
            this.initFormValidation();
            this.initAjaxActions();
        },

        /**
         * Initialize Tabs
         */
        initTabs: function() {
            $('.cpfa-tabs').each(function() {
                var $tabs = $(this);
                var $navLinks = $tabs.find('.cpfa-tab-link');
                var $contents = $tabs.find('.cpfa-tab-content');

                $navLinks.on('click', function(e) {
                    e.preventDefault();
                    var target = $(this).data('tab');
                    
                    // Update nav
                    $navLinks.removeClass('active');
                    $(this).addClass('active');
                    
                    // Update content
                    $contents.removeClass('active');
                    $('#' + target).addClass('active');
                });

                // Activate first tab by default
                if (!$navLinks.filter('.active').length) {
                    $navLinks.first().click();
                }
            });
        },

        /**
         * Initialize Accordions
         */
        initAccordions: function() {
            $('.cpfa-accordion-header').on('click', function() {
                var $header = $(this);
                var $content = $header.next('.cpfa-accordion-content');
                var $accordion = $header.closest('.cpfa-accordion');

                // Close other items if single mode
                if ($accordion.hasClass('cpfa-accordion-single')) {
                    $accordion.find('.cpfa-accordion-content').not($content).slideUp();
                    $accordion.find('.cpfa-accordion-header').not($header).removeClass('active');
                }

                // Toggle current item
                $header.toggleClass('active');
                $content.slideToggle();
            });
        },

        /**
         * Initialize Modals
         */
        initModals: function() {
            // Open modal
            $('[data-cpfa-modal]').on('click', function(e) {
                e.preventDefault();
                var modalId = $(this).data('cpfa-modal');
                $('#' + modalId).fadeIn().addClass('active');
                $('body').addClass('cpfa-modal-open');
            });

            // Close modal
            $('.cpfa-modal-close, .cpfa-modal-overlay').on('click', function() {
                $(this).closest('.cpfa-modal').fadeOut().removeClass('active');
                $('body').removeClass('cpfa-modal-open');
            });

            // Close on ESC key
            $(document).on('keydown', function(e) {
                if (e.key === 'Escape') {
                    $('.cpfa-modal.active').fadeOut().removeClass('active');
                    $('body').removeClass('cpfa-modal-open');
                }
            });
        },

        /**
         * Initialize Tooltips
         */
        initTooltips: function() {
            $('[data-cpfa-tooltip]').each(function() {
                var $el = $(this);
                var text = $el.data('cpfa-tooltip');
                var position = $el.data('cpfa-tooltip-position') || 'top';

                $el.on('mouseenter', function() {
                    var $tooltip = $('<div class="cpfa-tooltip cpfa-tooltip-' + position + '">' + text + '</div>');
                    $('body').append($tooltip);

                    var offset = $el.offset();
                    var elWidth = $el.outerWidth();
                    var elHeight = $el.outerHeight();
                    var ttWidth = $tooltip.outerWidth();
                    var ttHeight = $tooltip.outerHeight();

                    var top, left;

                    switch(position) {
                        case 'top':
                            top = offset.top - ttHeight - 10;
                            left = offset.left + (elWidth / 2) - (ttWidth / 2);
                            break;
                        case 'bottom':
                            top = offset.top + elHeight + 10;
                            left = offset.left + (elWidth / 2) - (ttWidth / 2);
                            break;
                        case 'left':
                            top = offset.top + (elHeight / 2) - (ttHeight / 2);
                            left = offset.left - ttWidth - 10;
                            break;
                        case 'right':
                            top = offset.top + (elHeight / 2) - (ttHeight / 2);
                            left = offset.left + elWidth + 10;
                            break;
                    }

                    $tooltip.css({ top: top, left: left }).fadeIn();
                });

                $el.on('mouseleave', function() {
                    $('.cpfa-tooltip').fadeOut(function() {
                        $(this).remove();
                    });
                });
            });
        },

        /**
         * Initialize Form Validation
         */
        initFormValidation: function() {
            $('form.cpfa-validate').on('submit', function(e) {
                var $form = $(this);
                var isValid = true;

                // Remove previous errors
                $form.find('.cpfa-error').remove();
                $form.find('.cpfa-form-control').removeClass('cpfa-error-field');

                // Validate required fields
                $form.find('[required]').each(function() {
                    var $field = $(this);
                    var value = $field.val().trim();

                    if (!value) {
                        isValid = false;
                        CpfaCore.showFieldError($field, 'Ce champ est requis');
                    }
                });

                // Validate email fields
                $form.find('input[type="email"]').each(function() {
                    var $field = $(this);
                    var value = $field.val().trim();
                    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

                    if (value && !emailRegex.test(value)) {
                        isValid = false;
                        CpfaCore.showFieldError($field, 'Email invalide');
                    }
                });

                if (!isValid) {
                    e.preventDefault();
                    // Scroll to first error
                    $('html, body').animate({
                        scrollTop: $form.find('.cpfa-error-field').first().offset().top - 100
                    }, 500);
                }
            });
        },

        /**
         * Show field error
         */
        showFieldError: function($field, message) {
            $field.addClass('cpfa-error-field');
            $field.after('<span class="cpfa-error">' + message + '</span>');
        },

        /**
         * Initialize Ajax Actions
         */
        initAjaxActions: function() {
            // Handle Ajax form submissions
            $('form.cpfa-ajax-form').on('submit', function(e) {
                e.preventDefault();
                var $form = $(this);
                var $submit = $form.find('[type="submit"]');
                var formData = new FormData(this);

                formData.append('action', $form.data('action'));
                formData.append('nonce', cpfaCore.nonce);

                $.ajax({
                    url: cpfaCore.ajaxUrl,
                    type: 'POST',
                    data: formData,
                    processData: false,
                    contentType: false,
                    beforeSend: function() {
                        $submit.prop('disabled', true).addClass('loading');
                        $form.find('.cpfa-message').remove();
                    },
                    success: function(response) {
                        if (response.success) {
                            CpfaCore.showMessage($form, 'success', response.data.message);
                            if (response.data.redirect) {
                                setTimeout(function() {
                                    window.location.href = response.data.redirect;
                                }, 1500);
                            } else {
                                $form[0].reset();
                            }
                        } else {
                            CpfaCore.showMessage($form, 'error', response.data.message);
                        }
                    },
                    error: function() {
                        CpfaCore.showMessage($form, 'error', 'Une erreur est survenue');
                    },
                    complete: function() {
                        $submit.prop('disabled', false).removeClass('loading');
                    }
                });
            });
        },

        /**
         * Show message
         */
        showMessage: function($container, type, message) {
            var alertClass = type === 'success' ? 'cpfa-alert-success' : 'cpfa-alert-danger';
            var $message = $('<div class="cpfa-alert cpfa-message ' + alertClass + '">' + message + '</div>');
            
            $container.prepend($message);
            
            setTimeout(function() {
                $message.fadeOut(function() {
                    $(this).remove();
                });
            }, 5000);
        },

        /**
         * Utility: Debounce
         */
        debounce: function(func, wait) {
            var timeout;
            return function() {
                var context = this;
                var args = arguments;
                clearTimeout(timeout);
                timeout = setTimeout(function() {
                    func.apply(context, args);
                }, wait);
            };
        },

        /**
         * Utility: Format number
         */
        formatNumber: function(number, separator) {
            separator = separator || ' ';
            return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator);
        },

        /**
         * Utility: Format currency
         */
        formatCurrency: function(amount, currency) {
            currency = currency || 'FCFA';
            return this.formatNumber(amount) + ' ' + currency;
        }
    };

    /**
     * Document ready
     */
    $(document).ready(function() {
        CpfaCore.init();
    });

    /**
     * Expose to global scope
     */
    window.CpfaCore = CpfaCore;

})(jQuery);
