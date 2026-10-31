<?php
// app/Models/OCRText.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OCRText extends Model
{
    use HasFactory;

    // Explicitly specify the table name
    protected $table = 'ocr_texts';

    protected $fillable = [
        'document_id',
        'extracted_text',
        'confidence',
        'file_name',
        'file_path',
        'processed_at',
        'document_type',
    ];

    protected $casts = [
        'confidence' => 'float',
        'processed_at' => 'datetime',
    ];

    public function document()
    {
        return $this->belongsTo(Document::class);
    }
}