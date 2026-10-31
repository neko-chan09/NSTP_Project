<?php
// app/Models/SystemBackup.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SystemBackup extends Model
{
    protected $fillable = [
        'backup_name',
        'file_path',
        'disk',
        'file_size',
        'tables_count',
        'storage_files_count',
        'type',           // 'manual' | 'auto'
        'triggered_by',   // 'manual' | 'scheduled' | 'auto'
        'schedule_id',
        'status',
        'notes',
        'error_message',
        'created_by',
        'started_at',
        'completed_at',
        'finished_at',
    ];

    protected $casts = [
        'started_at'   => 'datetime',
        'completed_at' => 'datetime',
        'finished_at'  => 'datetime',
        'file_size'    => 'integer',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function schedule(): BelongsTo
    {
        return $this->belongsTo(BackupSchedule::class, 'schedule_id');
    }

    public function getHumanFileSizeAttribute(): string
    {
        $bytes = $this->file_size ?? 0;
        if ($bytes < 1024) return "{$bytes} B";
        if ($bytes < 1024 * 1024) return round($bytes / 1024, 2) . ' KB';
        if ($bytes < 1024 * 1024 * 1024) return round($bytes / 1024 / 1024, 2) . ' MB';
        return round($bytes / 1024 / 1024 / 1024, 2) . ' GB';
    }

    public function getStatusColorAttribute(): string
    {
        return match ($this->status) {
            'completed'  => 'success',
            'processing' => 'warning',
            'failed'     => 'danger',
            default      => 'secondary',
        };
    }
}