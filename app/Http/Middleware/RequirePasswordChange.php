<?php
namespace App\Http\Middleware;
use Closure;
use Illuminate\Http\Request;
class RequirePasswordChange {
    public function handle(Request $request, Closure $next) {
        $allowed=['api/me','api/logout','api/change-password-first-login'];
        if($request->user()?->must_change_password && !in_array($request->path(),$allowed,true)) {
            return response()->json(['message'=>'Change your temporary password before continuing.','code'=>'PASSWORD_CHANGE_REQUIRED'],403);
        }
        return $next($request);
    }
}
