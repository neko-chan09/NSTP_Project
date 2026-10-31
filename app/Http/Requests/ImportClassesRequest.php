<?php
// app/Http/Requests/ImportClassesRequest.php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ImportClassesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role, ['super_admin', 'admin']);
    }

    public function rules(): array
    {
        return [
            'file'        => 'required|file|mimes:csv,txt|max:10240',
            'school_year' => 'nullable|string|max:20',
            'dry_run'     => 'nullable|boolean',
        ];
    }
}