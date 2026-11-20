<?php
// routes/console.php

use Illuminate\Support\Facades\Schedule;
use App\Services\BackupService;

// Daily backup at 2:00 AM
Schedule::call(function () {
    if(!\App\Models\BackupSchedule::where('is_active',true)->exists())app(BackupService::class)->createBackup('auto');
})->dailyAt('02:00')->timezone('Asia/Manila')
    ->name('daily-backup')
    ->withoutOverlapping();


Schedule::command('backup:run-due')
    ->everyMinute()
    ->withoutOverlapping()
    ->runInBackground();

Schedule::command('bulletin:dispatch-updates')->everyMinute()->withoutOverlapping();

\Illuminate\Support\Facades\Artisan::command('backup:test-restore {id} {--connection=}', function() {
    $connection=$this->option('connection');if(!$connection){$this->error('Choose an isolated test connection with --connection.');return 1;}
    try{$backup=\App\Models\SystemBackup::findOrFail($this->argument('id'));$result=app(\App\Services\BackupService::class)->testRestore($backup,$connection);$this->info(json_encode($result));return 0;}catch(\Throwable $e){$this->error($e->getMessage());return 1;}
});
