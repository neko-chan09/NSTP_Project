<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class MobileUserMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, ['student', 'faculty'])) {
            return response()->json(['message' => 'Unauthorized. Mobile access only.'], 403);
        }

        return $next($request);
    }
}