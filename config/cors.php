<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => array_values(array_unique(array_filter(array_merge([env('APP_URL'),'https://orangered-oryx-492151.hostingersite.com','http://localhost:5173','http://127.0.0.1:5173'],explode(',',env('CORS_ALLOWED_ORIGINS','')))))),
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];