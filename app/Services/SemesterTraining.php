<?php
namespace App\Services;
use App\Models\{Student,AcademicYear,AttendanceSession};
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
class SemesterTraining {
 const MINIMUM=54; const MAXIMUM=90;
 public function current():?AcademicYear {
  $periods=AcademicYear::where('is_current',true)->where('is_active',true)->limit(2)->get();
  return $periods->count()===1?$periods->first():null;
 }
 public static function capped(float $hours):float {return round(min(self::MAXIMUM,max(0,$hours)),2);}
 public static function eligible(float $hours):bool {return is_finite($hours)&&$hours>=self::MINIMUM&&$hours<=self::MAXIMUM;}
 public function periodFor(AttendanceSession $session,?int $existing=null):int {
  if($existing && AcademicYear::whereKey($existing)->exists())return $existing;
  $date=($session->scheduled_start??$session->start_time??now())->copy()->setTimezone('Asia/Manila')->toDateString();
  $classPeriod=$session->class?->academic_year_id;
  if($classPeriod){
   $p=AcademicYear::find($classPeriod);
   if(!$p || $date<$p->start_date->toDateString() || $date>$p->end_date->toDateString())throw ValidationException::withMessages(['semester'=>'The attendance schedule must fall within its class semester dates.']);
   return $p->id;
  }
  $current=$this->current();
  if($current && $date>=$current->start_date->toDateString() && $date<=$current->end_date->toDateString())return $current->id;
  $periods=AcademicYear::whereDate('start_date','<=',$date)->whereDate('end_date','>=',$date)->limit(2)->get();
  if($periods->count()===1)return $periods->first()->id;
  throw ValidationException::withMessages(['semester'=>'Assign this class to a semester with correct dates before recording attendance.']);
 }
 /** Caller holds the student row lock. Raw approval is retained; credit is allocated chronologically. */
 public function rebuild(Student $student,int $period):void {
  DB::table('student_semester_hours')->insertOrIgnore(['student_id'=>$student->id,'academic_year_id'=>$period,'manual_hours'=>0,'approved_hours'=>0,'credited_hours'=>0,'created_at'=>now(),'updated_at'=>now()]);
  $balance=DB::table('student_semester_hours')->where('student_id',$student->id)->where('academic_year_id',$period)->lockForUpdate()->first();
  $raw=max(0,(float)$balance->manual_hours);$remaining=max(0,self::MAXIMUM-$raw);
  $logs=DB::table('attendance_logs as l')->join('attendance_sessions as s','s.id','=','l.session_id')->where('l.student_id',$student->id)->where('l.academic_year_id',$period)->orderBy('l.check_in_at')->orderBy('l.id')->get(['l.id','l.approved_hours','l.credited_hours','l.review_status','l.attendance_mark','l.status','l.check_in_at','l.check_out_at','s.status as session_status']);
  foreach($logs as $log){$approved=$log->review_status==='approved' && in_array($log->attendance_mark??$log->status,['present','late']) && $log->session_status!=='cancelled' && $log->check_in_at && $log->check_out_at?max(0,(float)$log->approved_hours):0;$raw+=$approved;$credit=round(min($approved,$remaining),2);$remaining=max(0,round($remaining-$credit,2));if((float)$log->credited_hours!==$credit)DB::table('attendance_logs')->where('id',$log->id)->update(['credited_hours'=>$credit]);}
  DB::table('student_semester_hours')->where('id',$balance->id)->update(['approved_hours'=>round($raw,2),'credited_hours'=>self::capped($raw),'updated_at'=>now()]);
  $current=$this->current();
  if($current && (int)$current->id===$period)$this->project($student,$period,self::capped($raw));
 }
 private function project(Student $student,?int $period,float $hours):void {
  $student->forceFill(['training_academic_year_id'=>$period,'completed_training_hours'=>self::capped($hours),'total_training_hours'=>self::MAXIMUM]);
  $student->updateTrainingGrade();
 }
 public function projectCurrent(Student $student):void {
  $period=$this->current();$hours=$period?DB::table('student_semester_hours')->where('student_id',$student->id)->where('academic_year_id',$period->id)->value('credited_hours'):0;
  $this->project($student,$period?->id,(float)$hours);
 }
 public function activate(int $id):void {
  DB::transaction(function()use($id){
   AcademicYear::orderBy('id')->lockForUpdate()->get();$period=AcademicYear::findOrFail($id);
   if(!$period->is_active)throw ValidationException::withMessages(['semester'=>'Activate this semester before selecting it.']);
   AcademicYear::query()->update(['is_current'=>false]);$period->update(['is_current'=>true]);
   Student::orderBy('id')->chunkById(200,function($students){foreach($students as $student){$locked=Student::whereKey($student->id)->lockForUpdate()->first();$this->projectCurrent($locked);}});
  },3);
 }
 public function assignLegacy(Student $student,int $period,float $hours,string $reason,int $actor):void {
  DB::transaction(function()use($student,$period,$hours,$reason,$actor){
   $student=Student::whereKey($student->id)->lockForUpdate()->firstOrFail();
   $legacy=DB::table('student_training_legacy')->where('student_id',$student->id)->lockForUpdate()->first();
   if(!$legacy || $hours<=0 || $hours>(float)$legacy->unassigned_hours)throw ValidationException::withMessages(['hours'=>'Enter an amount no greater than the remaining unassigned historical hours.']);
   $this->rebuild($student,$period);
   DB::table('student_semester_hours')->where('student_id',$student->id)->where('academic_year_id',$period)->increment('manual_hours',$hours);
   DB::table('student_training_legacy')->where('student_id',$student->id)->decrement('unassigned_hours',$hours);
   $this->rebuild($student,$period);
   AuditTrail::record($actor,'training.legacy_assigned','student',$student->id,$reason,['academic_year_id'=>$period,'approved_hours'=>$hours]);
  },3);
 }
}
