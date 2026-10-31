<?php
// app/Models/Certificate.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Certificate extends Model
{
    protected $fillable = [
        'student_id', 
        'certificate_number', 
        'certificate_type',
        'activity_id', 
        'file_path', 
        'qr_code_path', 
        'description',
        'status', 
        'issued_by', 
        'issued_at'
    ];

    protected $casts = [
        'issued_at' => 'datetime',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function issuer()
    {
        return $this->belongsTo(User::class, 'issued_by');
    }
}