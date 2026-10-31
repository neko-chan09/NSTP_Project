<?php
// app/Services/ScheduledBackupService.php

namespace App\Services;

use App\Models\BackupSchedule;
use App\Models\SystemBackup;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class ScheduledBackupService
{
    public function __construct(
        protected BackupService $backupService
    ) {}

    /**
     * Find every active schedule whose next_run_at has passed
     * and run it. Called by the Artisan command every minute.
     */
    public function runDue(): int
    {
        $now = Carbon::now();

        $due = BackupSchedule::where('is_active', true)
            ->where(function ($q) use ($now) {
                $q->whereNull('next_run_at')
                  ->orWhere('next_run_at', '<=', $now);
            })
            ->get();

        $ran = 0;

        foreach ($due as $schedule) {
            try {
                $this->runSchedule($schedule);
                $ran++;
            } catch (\Throwable $e) {
                Log::error('[ScheduledBackup] Failed schedule #' . $schedule->id . ': ' . $e->getMessage());
                // Push next_run_at forward so we don't hammer on failure
                $schedule->markRun();
            }
        }

        // Purge old backups per retention policy
        $this->purgeOldBackups();

        return $ran;
    }

    /**
     * Run a single schedule now (used both by runner and "Run now").
     */
    public function runSchedule(BackupSchedule $schedule): SystemBackup
    {
        $backup = $this->backupService->createBackup(
            'auto',
            $schedule->created_by
        );

        // Attach schedule metadata
        $backup->update([
            'triggered_by' => 'scheduled',
            'schedule_id'  => $schedule->id,
            'notes'        => $backup->notes
                ? $backup->notes
                : "Auto backup from schedule: {$schedule->name}",
        ]);

        $schedule->markRun();

        return $backup;
    }

    /**
     * Delete backups older than their schedule's retention_days.
     * Manual backups (schedule_id = null) are never auto-deleted.
     */
    public function purgeOldBackups(): int
    {
        $deleted = 0;

        $schedules = BackupSchedule::whereNotNull('retention_days')
            ->where('retention_days', '>', 0)
            ->get();

        foreach ($schedules as $schedule) {
            $cutoff = Carbon::now()->subDays($schedule->retention_days);

            $oldBackups = SystemBackup::where('schedule_id', $schedule->id)
                ->where('created_at', '<', $cutoff)
                ->get();

            foreach ($oldBackups as $backup) {
                try {
                    $this->backupService->deleteBackup($backup);
                    $deleted++;
                } catch (\Throwable $e) {
                    Log::warning(
                        '[ScheduledBackup] Could not purge backup #' .
                        $backup->id . ': ' . $e->getMessage()
                    );
                }
            }
        }

        return $deleted;
    }
}