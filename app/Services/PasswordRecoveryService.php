<?php
namespace App\Services;
use App\Models\User;
use App\Models\PasswordResetOtp;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
class PasswordRecoveryService {
    public function replace(User $user, string $password, bool $temporary, ?int $actor, ?string $reason=null): void {
        DB::transaction(function() use($user,$password,$temporary,$actor,$reason) {
            $locked=User::whereKey($user->id)->lockForUpdate()->firstOrFail();
            abort_if(Hash::check($password,$locked->password),422,'Choose a password different from the current password.');
            $locked->forceFill(['password'=>Hash::make($password),'must_change_password'=>$temporary])->save();
            $locked->tokens()->delete(); PasswordResetOtp::whereRaw('LOWER(email) = ?',[mb_strtolower($locked->email)])->delete();
            AuditTrail::record($actor,$temporary?'password.admin_reset':'password.self_reset','user',$locked->id,$reason,['role'=>$locked->role,'temporary'=>$temporary]);
        });
    }
}
