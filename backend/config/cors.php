<?php

/*
| Orígenes permitidos. En local se usan los puertos de Vite; en producción
| se definen vía la variable de entorno CORS_ALLOWED_ORIGINS (lista separada
| por comas), por ejemplo:
|
|   CORS_ALLOWED_ORIGINS=https://finca.midominio.com,https://www.finca.midominio.com
*/

$envOrigins = array_filter(array_map(
    'trim',
    explode(',', (string) env('CORS_ALLOWED_ORIGINS', ''))
));

$defaultOrigins = [
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
];

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => $envOrigins ?: $defaultOrigins,

    'allowed_origins_patterns' => array_filter(array_map(
        'trim',
        explode(',', (string) env('CORS_ALLOWED_ORIGINS_PATTERNS', ''))
    )),

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,
];
