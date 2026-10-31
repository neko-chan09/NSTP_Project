<?php
// app/Http/Requests/ImportFacultyRequest.php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ImportFacultyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'super_admin';
    }

    public function rules(): array
    {
        return [
            'file'    => 'required|file|mimes:csv,txt|max:10240',
            'mode'    => 'nullable|in:create,update,upsert',
            'dry_run' => 'nullable|boolean',
        ];
    }
}