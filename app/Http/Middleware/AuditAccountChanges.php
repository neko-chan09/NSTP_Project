<?php
namespace App\Http\Middleware;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Services\AuditTrail;
class AuditAccountChanges {
    public function handle(Request $request,Closure $next) {
        if(!in_array($request->method(),['POST','PUT','PATCH','DELETE'])||!preg_match('#^api/(admin/(students|grades)|superadmin/(users|faculty/import)|profile|student/profile)(/|$)#',$request->path())||(str_contains($request->path(),'reset-password')||str_ends_with($request->path(),'/preview')))return $next($request);
        return DB::transaction(function()use($request,$next){
            $response=$next($request);
            if($response->getStatusCode()<300) AuditTrail::record($request->user()?->id,'record.'.strtolower($request->method()),'account_or_grade',is_numeric($request->route('id'))?(int)$request->route('id'):null,null,['path'=>$request->path(),'fields'=>array_values(array_diff(array_keys($request->except(['password','current_password','otp','new_password','password_confirmation','new_password_confirmation','profile_photo'])),['_method']))]);
            return $response;
        });
    }
}
