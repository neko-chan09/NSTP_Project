<?php
// routes/console.php

use Illuminate\Support\Facades\Schedule;
use App\Services\BackupService;

// Daily backup at 2:00 AM
Schedule::call(function () {
    app(BackupService::class)->createBackup('auto');
})->dailyAt('02:00')
    ->name('daily-backup')
    ->withoutOverlapping();


Schedule::command('backup:run-due')
    ->everyMinute()
    ->withoutOverlapping()
    ->runInBackground();

Schedule::command('bulletin:dispatch-updates')->everyMinute()->withoutOverlapping();
