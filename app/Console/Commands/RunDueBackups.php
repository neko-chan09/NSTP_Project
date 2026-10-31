<?php
// app/Console/Commands/RunDueBackups.php

namespace App\Console\Commands;

use App\Services\ScheduledBackupService;
use Illuminate\Console\Command;

class RunDueBackups extends Command
{
    protected $signature = 'backup:run-due
                            {--purge-only : Only purge old backups, do not run schedules}';

    protected $description = 'Run any backup schedules that are due and purge expired backups';

    public function handle(ScheduledBackupService $service): int
    {
        if ($this->option('purge-only')) {
            $purged = $service->purgeOldBackups();
            $this->info("Purged {$purged} old backups.");
            return self::SUCCESS;
        }

        $ran = $service->runDue();
        $this->info("Ran {$ran} scheduled backup(s).");
        return self::SUCCESS;
    }
}