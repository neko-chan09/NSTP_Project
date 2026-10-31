<?php
// app/Http/Controllers/API/Web/SuperAdmin/BackupController.php

namespace App\Http\Controllers\API\Web\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\BackupSchedule;
use App\Models\SystemBackup;
use App\Services\BackupService;
use App\Services\ScheduledBackupService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class BackupController extends Controller
{
    protected BackupService $service;
    protected ScheduledBackupService $scheduler;

    public function __construct(
        BackupService $service,
        ScheduledBackupService $scheduler
    ) {
        $this->service = $service;
        $this->scheduler = $scheduler;
    }

    // ============================================================
    // EXISTING: manual backups
    // ============================================================

    public function index()
    {
        try {
            $backups = SystemBackup::with([
                'creator:id,first_name,last_name,email',
                'schedule:id,name',
            ])
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($b) {
                    return [
                        'id' => $b->id,
                        'backup_name' => $b->backup_name,
                        'file_path' => $b->file_path,
                        'file_size' => $b->file_size,
                        'human_file_size' => $b->human_file_size,
                        'tables_count' => $b->tables_count,
                        'storage_files_count' => $b->storage_files_count,
                        'type' => $b->type,
                        'triggered_by' => $b->triggered_by,
                        'schedule_id' => $b->schedule_id,
                        'schedule_name' => $b->schedule?->name,
                        'status' => $b->status,
                        'status_color' => $b->status_color,
                        'notes' => $b->notes,
                        'error_message' => $b->error_message,
                        'created_by' => $b->created_by,
                        'creator_name' => $b->creator
                            ? "{$b->creator->first_name} {$b->creator->last_name}"
                            : 'System',
                        'started_at' => $b->started_at,
                        'completed_at' => $b->completed_at,
                        'finished_at' => $b->finished_at,
                        'created_at' => $b->created_at,
                        'download_url' => url("/api/superadmin/backups/{$b->id}/download"),
                    ];
                });

            return response()->json(['success' => true, 'data' => $backups]);
        } catch (\Throwable $e) {
            Log::error('Backup index error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch backups: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'notes' => 'nullable|string|max:500',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors'  => $validator->errors(),
                ], 422);
            }

            $backup = $this->service->createBackup(
                'manual',
                $request->user()->id
            );

            $backup->update(['triggered_by' => 'manual']);

            if ($request->filled('notes')) {
                $backup->update(['notes' => $request->notes]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Backup created successfully',
                'data'    => $backup->fresh(),
            ], 201);
        } catch (\Throwable $e) {
            Log::error('Backup store error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Backup failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function download($id)
    {
        $backup = SystemBackup::find($id);

        if (!$backup) {
            return response()->json([
                'success' => false,
                'message' => 'Backup not found',
            ], 404);
        }

        if (!Storage::disk($backup->disk ?? 'local')->exists($backup->file_path)) {
            return response()->json([
                'success' => false,
                'message' => 'Backup file not found on disk',
            ], 404);
        }

        return Storage::disk($backup->disk ?? 'local')->download(
            $backup->file_path,
            $backup->backup_name . '.zip'
        );
    }

    public function destroy($id)
    {
        try {
            $backup = SystemBackup::find($id);

            if (!$backup) {
                return response()->json([
                    'success' => false,
                    'message' => 'Backup not found',
                ], 404);
            }

            $this->service->deleteBackup($backup);

            return response()->json([
                'success' => true,
                'message' => 'Backup deleted successfully',
            ]);
        } catch (\Throwable $e) {
            Log::error('Backup delete error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete backup: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function restore(Request $request, $id)
    {
        try {
            $backup = SystemBackup::find($id);

            if (!$backup) {
                return response()->json([
                    'success' => false,
                    'message' => 'Backup not found',
                ], 404);
            }

            if ($backup->status !== 'completed') {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot restore from an incomplete backup',
                ], 422);
            }

            $this->service->restoreBackup($backup);

            return response()->json([
                'success' => true,
                'message' => 'Restore completed successfully',
            ]);
        } catch (\Throwable $e) {
            Log::error('Backup restore error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Restore failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function stats()
    {
        try {
            $total = SystemBackup::count();
            $lastBackup = SystemBackup::where('status', 'completed')
                ->orderBy('finished_at', 'desc')
                ->first();

            return response()->json([
                'success' => true,
                'data' => [
                    'total_backups'    => $total,
                    'total_size'       => SystemBackup::sum('file_size'),
                    'last_backup_at'   => $lastBackup?->finished_at,
                    'last_backup_name' => $lastBackup?->backup_name,
                    'last_status'      => $lastBackup?->status,
                ],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    // ============================================================
    // NEW: SCHEDULES CRUD
    // ============================================================

    public function indexSchedules()
    {
        try {
            $schedules = BackupSchedule::with(['creator:id,first_name,last_name,email'])
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function (BackupSchedule $s) {
                    return [
                        'id' => $s->id,
                        'name' => $s->name,
                        'notes' => $s->notes,
                        'frequency' => $s->frequency,
                        'frequency_label' => $s->frequency_label,
                        'time' => $s->time,
                        'day_of_week' => $s->day_of_week,
                        'day_of_month' => $s->day_of_month,
                        'cron_expression' => $s->cron_expression,
                        'retention_days' => $s->retention_days,
                        'is_active' => $s->is_active,
                        'last_run_at' => $s->last_run_at,
                        'next_run_at' => $s->next_run_at,
                        'created_by' => $s->created_by,
                        'creator_name' => $s->creator
                            ? "{$s->creator->first_name} {$s->creator->last_name}"
                            : 'System',
                        'backups_count' => $s->backups()->count(),
                        'created_at' => $s->created_at,
                        'updated_at' => $s->updated_at,
                    ];
                });

            return response()->json(['success' => true, 'data' => $schedules]);
        } catch (\Throwable $e) {
            Log::error('Schedule index error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch schedules: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function storeSchedule(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'notes' => 'nullable|string|max:500',
                'frequency' => 'required|in:daily,weekly,monthly,custom',
                'time' => 'nullable|string|regex:/^\d{2}:\d{2}$/',
                'day_of_week' => 'nullable|integer|min:0|max:6',
                'day_of_month' => 'nullable|integer|min:1|max:28',
                'cron_expression' => 'nullable|string|max:120',
                'retention_days' => 'nullable|integer|min:1|max:3650',
                'is_active' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors(),
                ], 422);
            }

            $schedule = new BackupSchedule($request->only([
                'name',
                'notes',
                'frequency',
                'time',
                'day_of_week',
                'day_of_month',
                'cron_expression',
                'retention_days',
                'is_active',
            ]));

            $schedule->created_by = $request->user()->id;
            $schedule->next_run_at = $schedule->computeNextRun();
            $schedule->save();

            return response()->json([
                'success' => true,
                'message' => 'Schedule created successfully',
                'data' => $schedule,
            ], 201);
        } catch (\Throwable $e) {
            Log::error('Schedule store error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create schedule: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function updateSchedule(Request $request, $id)
    {
        try {
            $schedule = BackupSchedule::find($id);
            if (!$schedule) {
                return response()->json([
                    'success' => false,
                    'message' => 'Schedule not found',
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|string|max:255',
                'notes' => 'nullable|string|max:500',
                'frequency' => 'sometimes|in:daily,weekly,monthly,custom',
                'time' => 'nullable|string|regex:/^\d{2}:\d{2}$/',
                'day_of_week' => 'nullable|integer|min:0|max:6',
                'day_of_month' => 'nullable|integer|min:1|max:28',
                'cron_expression' => 'nullable|string|max:120',
                'retention_days' => 'nullable|integer|min:1|max:3650',
                'is_active' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors(),
                ], 422);
            }

            $schedule->fill($request->only([
                'name',
                'notes',
                'frequency',
                'time',
                'day_of_week',
                'day_of_month',
                'cron_expression',
                'retention_days',
                'is_active',
            ]));

            // Recompute next run whenever timing fields change
            $schedule->next_run_at = $schedule->computeNextRun();
            $schedule->save();

            return response()->json([
                'success' => true,
                'message' => 'Schedule updated successfully',
                'data' => $schedule,
            ]);
        } catch (\Throwable $e) {
            Log::error('Schedule update error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update schedule: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function toggleSchedule($id)
    {
        try {
            $schedule = BackupSchedule::find($id);
            if (!$schedule) {
                return response()->json([
                    'success' => false,
                    'message' => 'Schedule not found',
                ], 404);
            }

            $schedule->is_active = !$schedule->is_active;
            if ($schedule->is_active && !$schedule->next_run_at) {
                $schedule->next_run_at = $schedule->computeNextRun();
            }
            $schedule->save();

            return response()->json([
                'success' => true,
                'message' => $schedule->is_active ? 'Schedule activated' : 'Schedule paused',
                'data' => $schedule,
            ]);
        } catch (\Throwable $e) {
            Log::error('Schedule toggle error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to toggle schedule: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function destroySchedule($id)
    {
        try {
            $schedule = BackupSchedule::find($id);
            if (!$schedule) {
                return response()->json([
                    'success' => false,
                    'message' => 'Schedule not found',
                ], 404);
            }

            $schedule->delete();

            return response()->json([
                'success' => true,
                'message' => 'Schedule deleted successfully',
            ]);
        } catch (\Throwable $e) {
            Log::error('Schedule delete error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete schedule: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Force-run a schedule immediately (ignores next_run_at).
     */
    public function runScheduleNow(Request $request, $id)
    {
        try {
            $schedule = BackupSchedule::find($id);
            if (!$schedule) {
                return response()->json([
                    'success' => false,
                    'message' => 'Schedule not found',
                ], 404);
            }

            $backup = $this->scheduler->runSchedule($schedule);

            return response()->json([
                'success' => true,
                'message' => 'Scheduled backup started',
                'data' => $backup,
            ]);
        } catch (\Throwable $e) {
            Log::error('Schedule run-now error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to run schedule: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Manually purge old backups across all schedules.
     */
    public function purgeNow()
    {
        try {
            $deleted = $this->scheduler->purgeOldBackups();
            return response()->json([
                'success' => true,
                'message' => "Purged {$deleted} old backup(s).",
                'deleted' => $deleted,
            ]);
        } catch (\Throwable $e) {
            Log::error('Purge now error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Purge failed: ' . $e->getMessage(),
            ], 500);
        }
    }
}