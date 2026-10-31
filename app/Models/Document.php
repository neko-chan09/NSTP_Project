<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    protected $fillable = [
    'student_id', 'document_type', 'file_path', 'file_name',
    'file_type', 'file_size', 'status', 'rejection_reason',
    'verified_by', 'verified_at', 'extracted_text', 'ocr_processed' // add these
];

    protected $casts = [
        'verified_at' => 'datetime',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function verifier()
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}