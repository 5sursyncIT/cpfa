/**
 * CPFA Core Admin JavaScript
 * 
 * @package CpfaCore
 */

(function($) {
    'use strict';

    /**
     * Main CPFA Admin Object
     */
    var CpfaAdmin = {
        
        /**
         * Initialize
         */
        init: function() {
            this.initMetaBoxes();
            this.initMediaUpload();
            this.initColorPicker();
            this.initSettingsTabs();
            this.initPenaltyCalculator();
            this.initAjaxActions();
            this.initDatePickers();
        },

        /**
         * Initialize Meta Boxes
         */
        initMetaBoxes: function() {
            // Auto-calculate fields
            $('.cpfa-auto-calculate').on('change', function() {
                CpfaAdmin.calculatePenalty();
            });

            // Conditional fields
            $('[data-cpfa-condition]').each(function() {
                var $field = $(this);
                var condition = $field.data('cpfa-condition');
                var target = $field.data('cpfa-target');
                var value = $field.data('cpfa-value');

                CpfaAdmin.toggleConditionalField($field, target, value);

                $field.on('change', function() {
                    CpfaAdmin.toggleConditionalField($field, target, value);
                });
            });
        },

        /**
         * Toggle conditional field
         */
        toggleConditionalField: function($field, target, expectedValue) {
            var currentValue = $field.val();
            var $target = $(target);

            if (currentValue == expectedValue) {
                $target.slideDown();
            } else {
                $target.slideUp();
            }
        },

        /**
         * Initialize Media Upload
         */
        initMediaUpload: function() {
            var mediaUploader;

            $('.cpfa-media-upload-btn').on('click', function(e) {
                e.preventDefault();

                var $btn = $(this);
                var targetInput = $btn.data('target');
                var $input = $('#' + targetInput);
                var $preview = $('#' + targetInput + '_preview');

                // Create media uploader if it doesn't exist
                if (mediaUploader) {
                    mediaUploader.open();
                    return;
                }

                mediaUploader = wp.media({
                    title: 'Sélectionner un fichier',
                    button: {
                        text: 'Utiliser ce fichier'
                    },
                    multiple: false
                });

                mediaUploader.on('select', function() {
                    var attachment = mediaUploader.state().get('selection').first().toJSON();
                    $input.val(attachment.url);

                    // Show preview
                    if (attachment.type === 'image') {
                        $preview.html('<img src="' + attachment.url + '" alt="Preview">');
                    } else {
                        $preview.html('<a href="' + attachment.url + '" target="_blank">' + attachment.filename + '</a>');
                    }
                });

                mediaUploader.open();
            });

            // Remove media
            $('.cpfa-media-remove').on('click', function(e) {
                e.preventDefault();
                var targetInput = $(this).data('target');
                $('#' + targetInput).val('');
                $('#' + targetInput + '_preview').html('');
            });
        },

        /**
         * Initialize Color Picker
         */
        initColorPicker: function() {
            if ($.fn.wpColorPicker) {
                $('.cpfa-color-picker').wpColorPicker({
                    change: function(event, ui) {
                        var $preview = $(this).siblings('.cpfa-color-preview');
                        $preview.css('background-color', ui.color.toString());
                    }
                });
            }
        },

        /**
         * Initialize Settings Tabs
         */
        initSettingsTabs: function() {
            $('.cpfa-settings-tab').on('click', function(e) {
                e.preventDefault();
                var $tab = $(this);
                var target = $tab.data('tab');

                // Update tabs
                $('.cpfa-settings-tab').removeClass('active');
                $tab.addClass('active');

                // Update content
                $('.cpfa-tab-content').hide();
                $('#' + target).fadeIn();

                // Update URL hash
                window.location.hash = target;
            });

            // Activate tab from URL hash
            if (window.location.hash) {
                var hash = window.location.hash.substring(1);
                $('.cpfa-settings-tab[data-tab="' + hash + '"]').click();
            } else {
                $('.cpfa-settings-tab').first().click();
            }
        },

        /**
         * Calculate penalty automatically
         */
        calculatePenalty: function() {
            var $dateRetourPrevue = $('#_cpfa_emprunt_date_retour_prevue');
            var $dateRetourEffective = $('#_cpfa_emprunt_date_retour_effective');
            var $penalite = $('#_cpfa_emprunt_penalite');

            if (!$dateRetourPrevue.length || !$dateRetourEffective.length) {
                return;
            }

            var datePrevue = new Date($dateRetourPrevue.val());
            var dateEffective = new Date($dateRetourEffective.val());

            if (!datePrevue || !dateEffective || dateEffective <= datePrevue) {
                $penalite.val(0);
                return;
            }

            // Calculate days late
            var timeDiff = dateEffective - datePrevue;
            var daysLate = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

            // Penalty starts at day 4
            if (daysLate > 3) {
                var penaltyDays = daysLate - 3;
                var penalty = penaltyDays * 500; // 500 FCFA per day
                $penalite.val(penalty);

                // Show penalty info
                CpfaAdmin.showPenaltyInfo(daysLate, penalty);
            } else {
                $penalite.val(0);
            }
        },

        /**
         * Show penalty info
         */
        showPenaltyInfo: function(days, amount) {
            var $info = $('.cpfa-penalty-info');
            
            if (!$info.length) {
                $info = $('<div class="cpfa-penalty-info"></div>');
                $('#_cpfa_emprunt_penalite').parent().append($info);
            }

            var message = '<strong>⚠️ Retard de ' + days + ' jour(s)</strong><br>';
            message += 'Pénalité appliquée : <span class="cpfa-penalty-amount">' + 
                       CpfaAdmin.formatCurrency(amount) + '</span><br>';
            message += '<em>500 FCFA/jour à partir du 4ème jour de retard</em>';

            $info.html(message);
        },

        /**
         * Initialize Ajax Actions
         */
        initAjaxActions: function() {
            // Bulk actions
            $('.cpfa-bulk-action').on('click', function(e) {
                e.preventDefault();
                
                var $btn = $(this);
                var action = $btn.data('action');
                var selected = [];

                $('.cpfa-checkbox:checked').each(function() {
                    selected.push($(this).val());
                });

                if (selected.length === 0) {
                    alert('Veuillez sélectionner au moins un élément');
                    return;
                }

                if (!confirm('Êtes-vous sûr de vouloir effectuer cette action?')) {
                    return;
                }

                $.ajax({
                    url: ajaxurl,
                    type: 'POST',
                    data: {
                        action: 'cpfa_bulk_action',
                        bulk_action: action,
                        ids: selected,
                        nonce: $('#cpfa_admin_nonce').val()
                    },
                    beforeSend: function() {
                        $btn.prop('disabled', true).addClass('cpfa-admin-loading');
                    },
                    success: function(response) {
                        if (response.success) {
                            CpfaAdmin.showNotice('success', response.data.message);
                            setTimeout(function() {
                                location.reload();
                            }, 1500);
                        } else {
                            CpfaAdmin.showNotice('error', response.data.message);
                        }
                    },
                    error: function() {
                        CpfaAdmin.showNotice('error', 'Une erreur est survenue');
                    },
                    complete: function() {
                        $btn.prop('disabled', false).removeClass('cpfa-admin-loading');
                    }
                });
            });

            // Select all checkboxes
            $('#cpfa-select-all').on('change', function() {
                $('.cpfa-checkbox').prop('checked', $(this).prop('checked'));
            });
        },

        /**
         * Initialize Date Pickers
         */
        initDatePickers: function() {
            if ($.fn.datepicker) {
                $('.cpfa-datepicker').datepicker({
                    dateFormat: 'yy-mm-dd',
                    changeMonth: true,
                    changeYear: true,
                    yearRange: '-10:+10'
                });
            }
        },

        /**
         * Show admin notice
         */
        showNotice: function(type, message) {
            var $notice = $('<div class="cpfa-admin-notice ' + type + '">' + message + '</div>');
            
            $('.wrap h1').after($notice);
            
            setTimeout(function() {
                $notice.fadeOut(function() {
                    $(this).remove();
                });
            }, 5000);
        },

        /**
         * Format currency
         */
        formatCurrency: function(amount) {
            return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
        },

        /**
         * Format number
         */
        formatNumber: function(number) {
            return new Intl.NumberFormat('fr-FR').format(number);
        },

        /**
         * Confirm action
         */
        confirmAction: function(message) {
            return confirm(message || 'Êtes-vous sûr de vouloir effectuer cette action?');
        },

        /**
         * Show loading
         */
        showLoading: function($element) {
            $element.append('<span class="cpfa-admin-loading"></span>');
        },

        /**
         * Hide loading
         */
        hideLoading: function($element) {
            $element.find('.cpfa-admin-loading').remove();
        }
    };

    /**
     * Document ready
     */
    $(document).ready(function() {
        CpfaAdmin.init();
    });

    /**
     * Save meta box data with Ajax (optional enhancement)
     */
    $('#post').on('submit', function() {
        // Additional validation before save
        var isValid = true;

        // Validate required meta fields
        $('.cpfa-metabox-field[required]').each(function() {
            var $field = $(this).find('input, select, textarea');
            if (!$field.val()) {
                isValid = false;
                $field.css('border-color', 'red');
                CpfaAdmin.showNotice('error', 'Veuillez remplir tous les champs requis');
            } else {
                $field.css('border-color', '');
            }
        });

        return isValid;
    });

    /**
     * Auto-save draft periodically
     */
    setInterval(function() {
        if ($('#post').length && $('#auto_draft').val() != '1') {
            // Trigger WordPress autosave
            if (typeof wp !== 'undefined' && wp.autosave) {
                wp.autosave.server.triggerSave();
            }
        }
    }, 60000); // Every minute

    /**
     * Expose to global scope
     */
    window.CpfaAdmin = CpfaAdmin;

})(jQuery);
