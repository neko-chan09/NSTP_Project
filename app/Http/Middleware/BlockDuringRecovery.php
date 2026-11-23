<?php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class BlockDuringRecovery
{
    public function handle(Request $request, Closure $next)
    {
        if (is_file(storage_path('framework/nstp-recovery.lock'))) {
            return response()->json(['message'=>'The system is recovering a backup. Please wait for the administrator to finish.'],503)->header('Retry-After','60');
        }
        return $next($request);
    }
}
