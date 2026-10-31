<?php
// config/face.php

return [
    /*
    |--------------------------------------------------------------------------
    | Face Embedding
    |--------------------------------------------------------------------------
    */
    'embedding_size' => (int) env('FACE_EMBEDDING_SIZE', 192),

    /*
    |--------------------------------------------------------------------------
    | Match Threshold
    |--------------------------------------------------------------------------
    | Cosine similarity threshold for a successful match.
    | Typical MobileFaceNet ranges:
    |   0.4  → lenient
    |   0.5  → balanced (recommended)
    |   0.6  → strict
    */
    'match_threshold' => (float) env('FACE_MATCH_THRESHOLD', 0.5),
];