<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class StudentMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        // The user is already authenticated via 'auth:sanctum'
        $user = $request->user();

        if (!$user || $user->role !== 'student') {
            return response()->json(['message' => 'Unauthorized. Student access required.'], 403);
        }

        return $next($request);
    }
}