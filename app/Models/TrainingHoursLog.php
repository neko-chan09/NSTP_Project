<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TrainingHoursLog extends Model
{
    protected $fillable = [
        'student_id', 'activity_id', 'hours_earned', 'date_logged',
        'description', 'type', 'verified_by', 'verified_at'
    ];

    protected $casts = [
        'date_logged' => 'date',
        'verified_at' => 'datetime',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function activity(): BelongsTo
    {
        return $this->belongsTo(Activity::class);
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}