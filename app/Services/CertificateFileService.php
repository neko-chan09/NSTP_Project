<?php
namespace App\Services;

use App\Models\Certificate;
use Illuminate\Support\Facades\Storage;

class CertificateFileService
{
    public function download(Certificate $certificate, bool $qr = false)
    {
        $path = $qr ? $certificate->qr_code_path : $certificate->file_path;
        abort_unless(is_string($path) && $path !== '' && !str_contains($path, '..') && !str_starts_with($path, '/'), 404, 'Certificate file is unavailable.');
        $disk = Storage::disk('public');
        abort_unless($disk->exists($path), 404, 'Certificate file is missing. Contact the NSTP office to restore it.');
        $name = preg_replace('/[^a-zA-Z0-9_-]/', '_', $certificate->certificate_number) ?: 'certificate';
        return $disk->download($path, $name . ($qr ? '-qr.png' : '.pdf'), [
            'Content-Type' => $qr ? 'image/png' : 'application/pdf',
            'Cache-Control' => 'private, no-store',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
