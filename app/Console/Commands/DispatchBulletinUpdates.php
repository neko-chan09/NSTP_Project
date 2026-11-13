<?php
namespace App\Console\Commands;

use App\Services\BulletinCommunityService;
use Illuminate\Console\Command;

class DispatchBulletinUpdates extends Command
{
    protected $signature = 'bulletin:dispatch-updates';
    protected $description = 'Deliver due bulletin notifications to eligible users';

    public function handle(BulletinCommunityService $service): int
    {
        $this->info('Processed ' . $service->dispatchDue() . ' bulletin updates.');
        return self::SUCCESS;
    }
}
