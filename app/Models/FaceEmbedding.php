<?php
// app/Models/FaceEmbedding.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FaceEmbedding extends Model
{
    protected $fillable = [
        'student_id',
        'pose',
        'embedding',
        'confidence',
    ];

    protected $casts = [
        'embedding' => 'array',
        'confidence' => 'float',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}