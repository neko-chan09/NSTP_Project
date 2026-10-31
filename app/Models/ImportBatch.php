<?php
// app/Models/ImportBatch.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ImportBatch extends Model
{
    protected $table = 'import_batches';

    protected $fillable = [
        'batch_code', 'type', 'status',
        'total_rows', 'processed_rows',
        'created_count', 'updated_count', 'enrolled_count', 'skipped_count',
        'mode', 'school_year',
        'rows_json', 'errors_json', 'warnings_json',
        'user_id', 'original_filename',
        'started_at', 'finished_at',
    ];

    protected $casts = [
        'started_at'  => 'datetime',
        'finished_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getProgressPercentAttribute(): float
    {
        if ($this->total_rows <= 0) return 0;
        return round(($this->processed_rows / $this->total_rows) * 100, 2);
    }

    public function getIsRunningAttribute(): bool
    {
        return in_array($this->status, ['pending', 'processing'], true);
    }
}