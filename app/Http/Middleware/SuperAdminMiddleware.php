<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class SuperAdminMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        if (!$request->user() || $request->user()->role !== 'super_admin') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Super admin access required.'
            ], 403);
        }

        return $next($request);
    }
}