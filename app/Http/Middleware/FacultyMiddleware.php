<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class FacultyMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, ['faculty'])) {
            return response()->json(['message' => 'Unauthorized. Faculty access required.'], 403);
        }

        return $next($request);
    }
}