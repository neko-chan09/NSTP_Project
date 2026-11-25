<?php
// config/face.php

return [
    /*
    |--------------------------------------------------------------------------
    | Face Embedding
    |--------------------------------------------------------------------------
    */
    // Calibrate on real device captures before claiming biometric accuracy.
    'duplicate_threshold' => (float) env('FACE_DUPLICATE_THRESHOLD', 0.75),
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