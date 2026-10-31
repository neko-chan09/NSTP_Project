<?php
// app/Http/Requests/ImportClassStudentsRequest.php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ImportClassStudentsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role, ['super_admin', 'admin']);
    }

    public function rules(): array
    {
        return [
            'file'        => 'required|file|mimes:csv,txt|max:20480',
            'school_year' => 'nullable|string|max:20',
            'dry_run'     => 'nullable|boolean',
        ];
    }
}