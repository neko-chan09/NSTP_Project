<?php
// app/Models/BackupSchedule.php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BackupSchedule extends Model
{
    protected $table = 'backup_schedules';

    protected $fillable = [
        'name',
        'notes',
        'frequency',
        'time',
        'day_of_week',
        'day_of_month',
        'cron_expression',
        'retention_days',
        'is_active',
        'last_run_at',
        'next_run_at',
        'created_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'day_of_week' => 'integer',
        'day_of_month' => 'integer',
        'retention_days' => 'integer',
        'last_run_at' => 'datetime',
        'next_run_at' => 'datetime',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function backups(): HasMany
    {
        return $this->hasMany(SystemBackup::class, 'schedule_id');
    }

    // ============================================================
    // SCHEDULE MATH
    // ============================================================

    /**
     * Compute the next run timestamp from a base time (default: now).
     */
    public function computeNextRun(?Carbon $from = null): Carbon
    {
        $from = $from ?: Carbon::now();

        // Custom cron → best effort: schedule 1 hour from now
        // (true cron parsing would require dragonmantank/cron-expression
        // which is already pulled in by Laravel's scheduler)
        if (!empty($this->cron_expression)) {
            try {
                $cron = new \Cron\CronExpression($this->cron_expression);
                return Carbon::instance($cron->getNextRunDate($from));
            } catch (\Throwable $e) {
                // fall through to frequency-based
            }
        }

        [$hh, $mm] = array_pad(explode(':', (string) $this->time), 2, '00');
        $hh = (int) $hh;
        $mm = (int) $mm;

        switch ($this->frequency) {
            case 'weekly':
                $dow = $this->day_of_week ?? Carbon::SUNDAY;
                $next = $from->copy()->next($dow)->setTime($hh, $mm, 0);
                if ($next->lte($from)) {
                    $next->addWeek();
                }
                return $next;

            case 'monthly':
                $dom = min(max((int) ($this->day_of_month ?? 1), 1), 28);
                $next = $from->copy()->day($dom)->setTime($hh, $mm, 0);
                if ($next->lte($from)) {
                    $next->addMonth();
                }
                return $next;

            case 'daily':
            default:
                $next = $from->copy()->setTime($hh, $mm, 0);
                if ($next->lte($from)) {
                    $next->addDay();
                }
                return $next;
        }
    }

    /**
     * Advance next_run_at after a run.
     */
    public function markRun(): void
    {
        $this->last_run_at = Carbon::now();
        $this->next_run_at = $this->computeNextRun(Carbon::now()->addSecond());
        $this->save();
    }

    // ============================================================
    // HUMAN READABLE
    // ============================================================
    public function getFrequencyLabelAttribute(): string
    {
        switch ($this->frequency) {
            case 'daily':
                return "Daily at {$this->time}";
            case 'weekly':
                $days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                $d = $days[$this->day_of_week ?? 0] ?? 'Sun';
                return "Weekly on {$d} at {$this->time}";
            case 'monthly':
                return "Monthly on day {$this->day_of_month} at {$this->time}";
            case 'custom':
                return "Cron: {$this->cron_expression}";
            default:
                return ucfirst((string) $this->frequency);
        }
    }
}