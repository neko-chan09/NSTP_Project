<?php
namespace App\Services;
use App\Models\AttendanceSession;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
class AttendanceSessionRules {
 public const FIELDS=['scheduled_start','scheduled_end','start_time','end_time','grace_period_minutes','require_location','latitude','longitude','geofence_radius','description'];
 public function snapshot(AttendanceSession $session):array {return $session->only(self::FIELDS);}
 public function remember(AttendanceSession $session):void {DB::table('attendance_session_revisions')->insertOrIgnore(['session_id'=>$session->id,'version'=>$session->rules_version??1,'rules'=>json_encode($this->snapshot($session)),'created_at'=>now()]);}
 public function capturePolicy(AttendanceSession $session,?int $version):AttendanceSession {
  $current=(int)($session->rules_version??1);$version=$version??1;
  if($version===$current)return $session;
  $row=DB::table('attendance_session_revisions')->where('session_id',$session->id)->where('version',$version)->first();
  if(!$row)throw ValidationException::withMessages(['session_version'=>'Session rules are no longer available. Refresh the session or ask faculty to review your attendance.']);
  $copy=clone $session;$data=json_decode($row->rules,true);
  foreach(self::FIELDS as $field)if(array_key_exists($field,$data))$copy->setAttribute($field,in_array($field,['scheduled_start','scheduled_end','start_time','end_time'])&&$data[$field]?Carbon::parse($data[$field])->setTimezone(config('app.timezone')):$data[$field]);
  return $copy;
 }
}
