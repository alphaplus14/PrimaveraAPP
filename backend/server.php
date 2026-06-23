<?php

/**
 * Laravel - built-in PHP web server router.
 * Emulates Apache mod_rewrite for php artisan serve.
 */

$uri = urldecode(
    parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? ''
);

// Serve static files directly from public/ if they exist
if ($uri !== '/' && file_exists(__DIR__.'/public'.$uri)) {
    return false;
}

require_once __DIR__.'/public/index.php';
