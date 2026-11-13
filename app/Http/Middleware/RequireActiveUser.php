<?php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RequireActiveUser
{
    public function handle(Request $request, Closure $next)
    {
        abort_if($request->user()?->is_active === false, 403, 'This account is inactive. Contact the NSTP office.');
        return $next($request);
    }
}
