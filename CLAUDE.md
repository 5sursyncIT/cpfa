# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a WordPress multi-plugin system for **CPFA (Centre de Perfectionnement de la Fonction Administrative)** - a training center and library management system. The project consists of **3 modular plugins** that work together to handle formations, seminars, contests, registrations, payments, library management, and PDF document generation.

**Requirements**: WordPress 6.0+, PHP 8.0+, UTF-8 encoding

**Key Technologies**:
- WordPress native functionality (Meta Boxes, Settings API)
- Gravity Forms or Forminator for form handling
- Elementor for frontend widgets (8 custom widgets)
- mPDF for PDF generation
- Composer for dependency management (PSR-4 autoload)
- Payment gateways: Wave, Orange Money, PayDunya

## Plugin Architecture

### Plugin 1: CPFA Core Manager (`cpfa-core-manager`)
**Main responsibilities**:
- Custom Post Types (CPT): formations, seminars, contests, library resources, subscriptions, loans
- Taxonomies for categorization
- User roles and capabilities (`cpfa_manager`)
- Shared services (QR codes, notifications, payments abstraction)
- REST API endpoints for public catalog access
- WordPress native Meta Boxes for all CPTs
- Settings API for configuration pages

**Custom Post Types**:
- `cpfa_formation` - Training courses (type, duration, level, price, brochure)
- `cpfa_seminaire` - Seminars (dates, location, quota, price, poster)
- `cpfa_concours` - Contests (calendar, conditions, required documents)
- `cpfa_ressource` - Library resources (call number, authors, keywords, loan status)
- `cpfa_abonnement` - Library subscriptions (member, type, dates, status, deposit)
- `cpfa_emprunt` - Loans (subscriber, resource, dates, penalties)

**Access meta data**: Use `get_post_meta($post_id, '_cpfa_formation_type', true)` pattern
**Access settings**: Use `get_option('cpfa_logo')` pattern

### Plugin 2: CPFA Forms & Registrations (`cpfa-forms-registrations`)
**Main responsibilities**:
- Form handling for registrations (formations, seminars, contests, library)
- Payment processing and webhook handling
- Integration with Gravity Forms/Forminator
- Email notifications with HTML templates
- Admin UI for managing registrations
- REST API for form submission and payment verification

**Payment Gateway Interface**: `Cpfa\Payments\GatewayInterface`
- `createPayment()`, `verifyWebhook()`, `status()`, `refund()`
- Webhook route: `/cpfa/v1/payments/{gateway}/webhook`
- Payment statuses: `pending`, `paid`, `failed`, `expired`

### Plugin 3: CPFA PDF Generator (`cpfa-pdf-generator`)
**Main responsibilities**:
- PDF generation using mPDF
- Templates: member cards, receipts, certificates, convocations, attestations
- QR code integration for verification
- Storage in `wp-content/uploads/cpfa-pdf/{year}/{month}/`
- Triggered by payment completion events

## Development Commands

Since this is a fresh project, typical commands will be:

**Install dependencies**:
```bash
composer install
```

**WordPress standards checking**:
```bash
vendor/bin/phpcs --standard=WordPress path/to/plugin
```

**Run tests**:
```bash
vendor/bin/phpunit
```

**Generate translation files**:
```bash
wp i18n make-pot . languages/cpfa-core.pot
```

## Code Structure Patterns

### Meta Box Implementation Pattern
```php
// Add meta box
add_action('add_meta_boxes', function() {
  add_meta_box('id', 'Title', 'callback_function', 'cpfa_formation', 'normal', 'high');
});

// Save meta data
add_action('save_post', function($post_id) {
  // Verify nonce
  if (!isset($_POST['nonce_name']) || !wp_verify_nonce($_POST['nonce_name'], 'action')) return;

  // Check autosave
  if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;

  // Check permissions
  if (!current_user_can('edit_post', $post_id)) return;

  // Save with prefix underscore for private meta
  update_post_meta($post_id, '_cpfa_field_name', sanitize_text_field($_POST['field_name']));
});
```

### Settings API Pattern
```php
add_action('admin_menu', function() {
  add_options_page('CPFA Settings', 'CPFA', 'manage_options', 'cpfa-settings', 'cpfa_settings_page');
});

add_action('admin_init', function() {
  register_setting('cpfa_settings', 'cpfa_option_name');
  add_settings_section('section_id', 'Section Title', null, 'cpfa-settings');
  add_settings_field('field_id', 'Field Label', 'callback', 'cpfa-settings', 'section_id');
});
```

### REST API Pattern
```php
add_action('rest_api_init', function() {
  register_rest_route('cpfa/v1', '/endpoint', [
    'methods' => 'GET|POST',
    'callback' => 'handler_function',
    'permission_callback' => '__return_true' // or custom capability check
  ]);
});
```

### Payment Webhook Pattern
```php
function cpfa_handle_webhook(WP_REST_Request $req) {
  $gateway = sanitize_key($req['gateway']);
  $payload = $req->get_body();
  $signature = $req->get_header('X-Signature');

  $gw = Cpfa\Payments\GatewayRegistry::get($gateway);
  if (!$gw || !$gw->verifyWebhook($payload, $signature)) {
    return new WP_REST_Response(['ok' => false], 403);
  }

  $event = $gw->parseEvent($payload);
  do_action('cpfa_payment_event', $gateway, $event);
  return ['ok' => true];
}
```

## Elementor Widget Structure

The project includes **8 custom Elementor widgets** across the 3 plugins:

**Core Manager widgets**:
1. `cpfa-catalogue` - Display formations/seminars/contests with filters and Ajax pagination
2. `cpfa-search` - Advanced search with real-time filtering
3. `cpfa-stats` - Animated counters and statistics
4. `cpfa-upcoming-events` - Upcoming events with countdown

**Forms widgets**:
5. `cpfa-registration-form` - Dynamic registration forms
6. `cpfa-payment-widget` - Payment interface with QR codes
7. `cpfa-registration-status` - Check registration status
8. `cpfa-user-dashboard` - User account dashboard

**PDF widgets**:
9. `cpfa-qr-verify` - QR code scanner for verification
10. `cpfa-document-gallery` - PDF document gallery

**Widget registration pattern**:
```php
add_action('elementor/widgets/register', function($widgets_manager) {
  $widgets_manager->register(new \Cpfa\Core\Elementor\Widgets\CatalogueWidget());
});
```

**Base widget structure**: Extend `\Elementor\Widget_Base`
- `get_name()` - Unique widget ID
- `get_title()` - Widget display name
- `get_icon()` - Elementor icon class
- `get_categories()` - Return `['cpfa-widgets']`
- `register_controls()` - Define Elementor controls
- `render()` - Output HTML

## Library Business Rules

**Subscription types and pricing**:
- Student: 10,000 FCFA
- Professional: 15,000 FCFA
- Home loan: 50,000 FCFA (includes 35,000 FCFA deposit)

**Loan rules**:
- Duration: 30 days
- No duplicate loans of same item
- Some items marked as "excluded from loan"
- **Late fees**: 500 FCFA/day starting from Day 4 after due date
- Borrowing blocked if penalties owed
- Deposit not refunded if item lost/damaged or not returned

**Automated reminders**: Day -3, Day +1, Day +4, weekly until return

## Security Best Practices

- **Always verify nonces**: `wp_verify_nonce()` for all forms and AJAX
- **Check capabilities**: `current_user_can('manage_cpfa_biblio')` before operations
- **Sanitize inputs**: Use `sanitize_text_field()`, `sanitize_email()`, etc.
- **Escape outputs**: Use `esc_html()`, `esc_attr()`, `esc_url()`
- **File uploads**: Whitelist MIME types, enforce size limits
- **Prepared statements**: Use `$wpdb->prepare()` for custom queries
- **REST auth**: Verify nonces or cookies for authenticated endpoints
- **Webhook security**: Verify signatures with provider's secret

## GDPR Compliance

- Export/Erase data providers for WP privacy tools
- Configurable data retention periods in settings
- Consent checkboxes on all forms
- Document data purposes in privacy policy

## Internationalization

- **Text domains**: `cpfa-core`, `cpfa-forms`, `cpfa-pdf`
- Use `__()`, `_e()`, `esc_html__()` for all strings
- Generate `.pot` files for translation
- Load with `load_plugin_textdomain()`

## Cron Jobs

**Core Manager schedules**:
- `cpfa_daily` - Loan reminders, subscription expiration notices
- `cpfa_hourly` - Cleanup transients, retry pending webhooks

**Register custom intervals if needed**:
```php
add_filter('cron_schedules', function($schedules) {
  $schedules['cpfa_custom'] = ['interval' => 3600, 'display' => 'Custom interval'];
  return $schedules;
});
```

## Key WordPress Hooks

**Payment completion** (Forms plugin):
```php
do_action('cpfa_payment_event', $gateway, $event);
```

**PDF generation triggers** (PDF plugin):
- Listen to `cpfa_payment_event` with status `paid`
- Generate appropriate document based on registration type

**Custom capabilities**:
- `edit_cpfa_formation`, `edit_cpfa_formations`
- `manage_cpfa_biblio`
- `manage_cpfa_finance`

## File Organization

Expected structure per plugin:
```
cpfa-plugin-name/
├── cpfa-plugin-name.php          # Main plugin file
├── includes/
│   ├── class-cpt.php              # Custom Post Types
│   ├── class-meta-boxes.php       # Meta box definitions
│   ├── class-settings.php         # Settings API
│   ├── class-rest-api.php         # REST endpoints
│   ├── elementor/
│   │   └── widgets/               # Elementor widgets
│   └── services/                  # Shared services (QR, payments, etc)
├── templates/                     # PHP/HTML templates
├── assets/
│   ├── css/
│   └── js/
├── languages/                     # Translation files (.pot)
└── tests/                         # PHPUnit tests
```

## Testing Approach

- **Unit tests**: Services (QR, PDF, penalties), calculations, token verification
- **E2E tests**: Payment flows (mocked), PDF generation, webhooks
- **Performance**: REST pagination, caching with transients
- **Standards**: Use phpcs with WordPress Coding Standards

## Important Notes

- **NO ACF Pro dependency** - All custom fields use native WordPress Meta Boxes
- Field names follow pattern: `_cpfa_{cpt_name}_{field_name}` (underscore prefix for private)
- All CPTs must have `'supports' => ['custom-fields']` enabled
- Use `wp_object_cache` or transients for expensive queries
- Batch operations via WP-Cron for heavy tasks
- QR codes generated via `endroid/qr-code` Composer package
