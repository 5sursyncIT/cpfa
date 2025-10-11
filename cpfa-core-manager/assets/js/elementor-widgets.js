/**
 * CPFA Elementor Widgets JavaScript
 * 
 * @package CpfaCore
 */

(function($) {
    'use strict';

    /**
     * Main CPFA Elementor Widgets Object
     */
    var CpfaElementorWidgets = {
        
        /**
         * Initialize all widgets
         */
        init: function() {
            this.initCatalogueWidget();
            this.initSearchWidget();
            this.initStatsWidget();
            this.initUpcomingEventsWidget();
            this.initReserveButton();
        },

        /**
         * Initialize Catalogue Widget
         */
        initCatalogueWidget: function() {
            $('.cpfa-catalogue-widget').each(function() {
                var $widget = $(this);
                var $loadMore = $widget.find('.cpfa-load-more');
                var $filters = $widget.find('.cpfa-catalogue-filters');

                // Load More functionality
                $loadMore.on('click', function(e) {
                    e.preventDefault();
                    var $btn = $(this);
                    var page = parseInt($btn.data('page')) + 1;
                    var maxPages = parseInt($btn.data('max'));

                    if (page <= maxPages) {
                        CpfaElementorWidgets.loadMoreItems($widget, page);
                        $btn.data('page', page);
                    }

                    if (page >= maxPages) {
                        $btn.hide();
                    }
                });

                // Filters functionality
                if ($filters.length) {
                    var filterTimeout;
                    
                    $filters.find('select').on('change', function() {
                        CpfaElementorWidgets.filterCatalogue($widget);
                    });

                    $filters.find('input').on('keyup', function() {
                        clearTimeout(filterTimeout);
                        filterTimeout = setTimeout(function() {
                            CpfaElementorWidgets.filterCatalogue($widget);
                        }, 300);
                    });
                }
            });
        },

        /**
         * Load more catalogue items via Ajax
         */
        loadMoreItems: function($widget, page) {
            var settings = $widget.data('settings');
            var $container = $widget.find('.cpfa-catalogue-grid, .cpfa-catalogue-list');
            var $btn = $widget.find('.cpfa-load-more');

            $.ajax({
                url: cpfaElementor.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'cpfa_load_more_catalogue',
                    page: page,
                    settings: settings,
                    nonce: cpfaElementor.nonce
                },
                beforeSend: function() {
                    $btn.addClass('loading').prop('disabled', true);
                },
                success: function(response) {
                    if (response.success && response.data.html) {
                        $container.append(response.data.html);
                        
                        // Trigger animation
                        var $newItems = $container.children().slice(-settings.posts_per_page);
                        $newItems.css('opacity', 0).animate({opacity: 1}, 500);
                    }
                },
                error: function() {
                    console.error('CPFA: Erreur lors du chargement des éléments');
                },
                complete: function() {
                    $btn.removeClass('loading').prop('disabled', false);
                }
            });
        },

        /**
         * Filter catalogue items
         */
        filterCatalogue: function($widget) {
            var filters = {};
            var $filtersContainer = $widget.find('.cpfa-catalogue-filters');
            
            $filtersContainer.find('select, input').each(function() {
                var $field = $(this);
                var name = $field.attr('class').replace('cpfa-filter-', '');
                var value = $field.val();
                
                if (value) {
                    filters[name] = value;
                }
            });

            var $container = $widget.find('.cpfa-catalogue-grid, .cpfa-catalogue-list');

            $.ajax({
                url: cpfaElementor.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'cpfa_filter_catalogue',
                    filters: filters,
                    nonce: cpfaElementor.nonce
                },
                beforeSend: function() {
                    $container.css('opacity', 0.5);
                },
                success: function(response) {
                    if (response.success && response.data.html) {
                        $container.html(response.data.html);
                    }
                },
                complete: function() {
                    $container.css('opacity', 1);
                }
            });
        },

        /**
         * Initialize Search Widget
         */
        initSearchWidget: function() {
            $('.cpfa-search-widget').each(function() {
                var $widget = $(this);
                var $searchInput = $widget.find('.cpfa-search-input');
                var searchTimeout;

                $searchInput.on('keyup', function() {
                    clearTimeout(searchTimeout);
                    var query = $(this).val().trim();
                    
                    searchTimeout = setTimeout(function() {
                        if (query.length >= 3 || query.length === 0) {
                            CpfaElementorWidgets.performSearch($widget, query);
                        }
                    }, 300);
                });

                // Search on Enter key
                $searchInput.on('keypress', function(e) {
                    if (e.which === 13) {
                        e.preventDefault();
                        var query = $(this).val().trim();
                        if (query.length >= 3) {
                            CpfaElementorWidgets.performSearch($widget, query);
                        }
                    }
                });
            });
        },

        /**
         * Perform search via Ajax
         */
        performSearch: function($widget, query) {
            var $results = $widget.find('.cpfa-search-results');

            if (!$results.length) {
                $results = $('<div class="cpfa-search-results"></div>');
                $widget.append($results);
            }

            if (query.length === 0) {
                $results.empty();
                return;
            }

            $.ajax({
                url: cpfaElementor.restUrl + '/search',
                type: 'GET',
                data: {
                    q: query
                },
                beforeSend: function() {
                    $results.html('<div class="cpfa-search-loading">Recherche en cours...</div>');
                },
                success: function(response) {
                    if (response.length > 0) {
                        var html = '';
                        response.forEach(function(item) {
                            html += '<div class="cpfa-search-result-item">';
                            html += '<h4 class="cpfa-search-result-title"><a href="' + item.link + '">' + item.title + '</a></h4>';
                            html += '<p>' + item.excerpt + '</p>';
                            html += '</div>';
                        });
                        $results.html(html);
                    } else {
                        $results.html('<div class="cpfa-search-no-results">Aucun résultat trouvé</div>');
                    }
                },
                error: function() {
                    $results.html('<div class="cpfa-search-error">Erreur lors de la recherche</div>');
                }
            });
        },

        /**
         * Initialize Stats Widget
         */
        initStatsWidget: function() {
            $('.cpfa-stats-widget').each(function() {
                var $widget = $(this);
                
                // Use Intersection Observer for animation on scroll
                if ('IntersectionObserver' in window) {
                    var observer = new IntersectionObserver(function(entries) {
                        entries.forEach(function(entry) {
                            if (entry.isIntersecting) {
                                CpfaElementorWidgets.animateCounters($widget);
                                observer.unobserve(entry.target);
                            }
                        });
                    }, {
                        threshold: 0.5
                    });
                    
                    observer.observe($widget[0]);
                } else {
                    // Fallback for older browsers
                    CpfaElementorWidgets.animateCounters($widget);
                }
            });
        },

        /**
         * Animate stat counters
         */
        animateCounters: function($widget) {
            $widget.find('.cpfa-counter').each(function() {
                var $counter = $(this);
                var target = parseInt($counter.text().replace(/\s/g, ''));
                var duration = parseInt($counter.data('duration')) || 2000;
                var separator = $counter.data('separator') || ' ';

                if (isNaN(target)) return;

                $counter.text('0');

                $({count: 0}).animate({count: target}, {
                    duration: duration,
                    easing: 'swing',
                    step: function() {
                        var formatted = Math.floor(this.count).toString();
                        if (separator) {
                            formatted = formatted.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
                        }
                        $counter.text(formatted);
                    },
                    complete: function() {
                        var formatted = target.toString();
                        if (separator) {
                            formatted = formatted.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
                        }
                        $counter.text(formatted);
                    }
                });
            });
        },

        /**
         * Initialize Upcoming Events Widget
         */
        initUpcomingEventsWidget: function() {
            $('.cpfa-upcoming-events-widget').each(function() {
                var $widget = $(this);
                
                // Initialize countdowns
                $widget.find('.cpfa-countdown').each(function() {
                    var $countdown = $(this);
                    var targetDate = $countdown.data('date');
                    
                    if (targetDate) {
                        CpfaElementorWidgets.updateCountdown($countdown, targetDate);
                        
                        // Update every minute
                        setInterval(function() {
                            CpfaElementorWidgets.updateCountdown($countdown, targetDate);
                        }, 60000);
                    }
                });
            });
        },

        /**
         * Update countdown timer
         */
        updateCountdown: function($countdown, targetDate) {
            var target = new Date(targetDate).getTime();
            var now = new Date().getTime();
            var difference = target - now;

            if (difference <= 0) {
                $countdown.text('Événement en cours');
                return;
            }

            var days = Math.floor(difference / (1000 * 60 * 60 * 24));
            var hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            var minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

            var text = '';
            if (days > 0) {
                text = days + ' jour' + (days > 1 ? 's' : '');
            } else if (hours > 0) {
                text = hours + ' heure' + (hours > 1 ? 's' : '');
            } else {
                text = minutes + ' minute' + (minutes > 1 ? 's' : '');
            }

            $countdown.text('Dans ' + text);
        },

        /**
         * Initialize Reserve Button
         */
        initReserveButton: function() {
            $(document).on('click', '.cpfa-reserve-button.cpfa-reserve-available', function(e) {
                e.preventDefault();

                var $btn = $(this);
                var resourceId = $btn.data('resource-id');
                var resourceTitle = $btn.data('resource-title');

                // Vérifier si l'utilisateur est connecté
                if (typeof cpfaElementor === 'undefined' || !cpfaElementor.isUserLoggedIn) {
                    alert('Vous devez être connecté pour réserver une ressource.');
                    // Rediriger vers la page de connexion
                    window.location.href = cpfaElementor.loginUrl || '/wp-login.php';
                    return;
                }

                // Demander confirmation
                if (!confirm('Voulez-vous réserver "' + resourceTitle + '" ?')) {
                    return;
                }

                // Envoyer la demande de réservation via Ajax
                $.ajax({
                    url: cpfaElementor.ajaxUrl,
                    type: 'POST',
                    data: {
                        action: 'cpfa_reserve_resource',
                        resource_id: resourceId,
                        nonce: cpfaElementor.nonce
                    },
                    beforeSend: function() {
                        $btn.addClass('processing').prop('disabled', true);
                        $btn.find('.cpfa-reserve-icon').text('⏳');
                    },
                    success: function(response) {
                        if (response.success) {
                            // Succès
                            $btn.removeClass('processing cpfa-reserve-available')
                                .addClass('success cpfa-reserve-unavailable')
                                .prop('disabled', true);
                            $btn.find('.cpfa-reserve-icon').text('✅');
                            $btn.html($btn.html().replace(/Réserver/, 'Réservé'));

                            // Afficher un message de succès
                            alert(response.data.message || 'Réservation effectuée avec succès !');

                            // Optionnel: recharger la page après 2 secondes
                            setTimeout(function() {
                                location.reload();
                            }, 2000);
                        } else {
                            // Erreur
                            $btn.removeClass('processing');
                            $btn.find('.cpfa-reserve-icon').text('📖');
                            alert(response.data.message || 'Une erreur est survenue lors de la réservation.');
                        }
                    },
                    error: function(xhr, status, error) {
                        $btn.removeClass('processing');
                        $btn.find('.cpfa-reserve-icon').text('📖');
                        alert('Erreur de connexion. Veuillez réessayer.');
                        console.error('CPFA Reserve Error:', error);
                    }
                });
            });
        },

        /**
         * Utility: Debounce function
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
        }
    };

    /**
     * Initialize on document ready
     */
    $(document).ready(function() {
        CpfaElementorWidgets.init();
    });

    /**
     * Reinitialize after Elementor editor changes
     */
    $(window).on('elementor/frontend/init', function() {
        elementorFrontend.hooks.addAction('frontend/element_ready/widget', function($scope) {
            // Check if the widget is a CPFA widget
            if ($scope.find('.cpfa-catalogue-widget, .cpfa-search-widget, .cpfa-stats-widget, .cpfa-upcoming-events-widget').length) {
                CpfaElementorWidgets.init();
            }
        });
    });

    /**
     * Expose to global scope
     */
    window.CpfaElementorWidgets = CpfaElementorWidgets;

})(jQuery);
