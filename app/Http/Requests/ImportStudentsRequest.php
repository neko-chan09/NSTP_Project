<?php
// app/Http/Requests/ImportStudentsRequest.php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ImportStudentsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role, ['super_admin', 'admin']);
    }

    public function rules(): array
    {
        return [
            'file'        => 'required|file|mimes:csv,txt|max:20480',
            'mode'        => 'nullable|in:create,update,upsert',
            'school_year' => 'nullable|string|max:20',
            'dry_run'     => 'nullable|boolean',
        ];
    }
}