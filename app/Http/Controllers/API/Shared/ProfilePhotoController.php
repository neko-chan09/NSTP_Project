<?php
namespace App\Http\Controllers\API\Shared;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Support\Facades\Storage;

class ProfilePhotoController extends Controller
{
    public function show(int $userId)
    {
        $user = User::findOrFail($userId);
        $path = ltrim(preg_replace('#^(storage/|public/)#', '', (string) $user->profile_photo), '/');
        abort_unless(str_starts_with($path, 'profile_photos/') && !str_contains($path, '..') && Storage::disk('public')->exists($path), 404);
        return Storage::disk('public')->response($path, null, ['Cache-Control' => 'public, max-age=300', 'X-Content-Type-Options' => 'nosniff']);
    }
}
