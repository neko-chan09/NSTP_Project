<?php

use Illuminate\Support\Facades\Route;

Route::view('/{any}', 'app')->where('any', '.*');

// routes/web.php

Route::get('/debug-storage', function () {
    $publicPath = public_path('storage');
    $storagePath = storage_path('app/public');

    return [
        'public_storage_exists' => file_exists($publicPath),
        'public_storage_is_link' => is_link($publicPath),
        'public_storage_target' => is_link($publicPath) ? readlink($publicPath) : 'N/A',
        'storage_path' => $storagePath,
        'storage_path_exists' => file_exists($storagePath),
        'profile_photos_path' => $storagePath . '/profile_photos',
        'profile_photos_exists' => file_exists($storagePath . '/profile_photos'),
        'profile_photos_files' => file_exists($storagePath . '/profile_photos')
            ? scandir($storagePath . '/profile_photos')
            : 'Folder not found',
        'public_storage_profile_photos' => public_path('storage/profile_photos'),
        'public_storage_profile_photos_exists' => file_exists(public_path('storage/profile_photos')),
    ];
});
