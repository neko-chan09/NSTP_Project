<?php
namespace App\Http\Controllers\API\Web\SuperAdmin;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\PasswordRecoveryService;
use Illuminate\Http\Request;
class PasswordRecoveryController extends Controller {
    public function audit(Request $request) {
        abort_unless($request->user()?->role==='super_admin',403);
        return response()->json(\Illuminate\Support\Facades\DB::table('audit_events as a')->leftJoin('users as u','u.id','=','a.actor_id')->select('a.*','u.first_name','u.last_name')->orderByDesc('a.id')->paginate(25));
    }
    public function search(Request $request) {
        abort_unless($request->user()?->role==='super_admin',403);
        $data=$request->validate(['role'=>'required|in:admin,faculty,student','search'=>'required|string|min:2|max:255']);
        $term=trim($data['search']);
        $query=User::where('role',$data['role']);
        if($data['role']==='student') $query->where(fn($q)=>$q->where('student_id',$term)->orWhereHas('student',fn($s)=>$s->where('student_id',$term)));
        else $query->where(function($q) use($term) {
            $q->where('email',$term)->orWhere(function($names) use($term) {
                foreach(preg_split('/\s+/', $term) as $part) $names->where(fn($n)=>$n->where('first_name','like','%'.$part.'%')->orWhere('last_name','like','%'.$part.'%'));
            });
        });
        return response()->json(['data'=>$query->limit(20)->get(['id','first_name','last_name','email','role','student_id','is_active'])]);
    }
    public function reset(Request $request, int $id, PasswordRecoveryService $service) {
        abort_unless($request->user()?->role==='super_admin',403);
        $data=$request->validate(['new_password'=>'required|string|min:8|max:128|confirmed','reason'=>'required|string|min:3|max:500']);
        $user=User::findOrFail($id); abort_unless(in_array($user->role,['admin','faculty','student']),403,'This account cannot be reset here.');
        $service->replace($user,$data['new_password'],true,$request->user()->id,trim($data['reason']));
        return response()->json(['message'=>'Password reset. Existing sessions revoked; the user must change it at next login.']);
    }
}
