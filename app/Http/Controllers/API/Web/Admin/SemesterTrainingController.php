<?php
namespace App\Http\Controllers\API\Web\Admin;
use App\Http\Controllers\Controller;
use App\Models\{AcademicYear,Student};
use App\Services\{SemesterTraining,AuditTrail};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
class SemesterTrainingController extends Controller {
 public function index(SemesterTraining $service){return response()->json(['data'=>['current'=>$service->current(),'periods'=>AcademicYear::orderByDesc('start_date')->get(),'minimum'=>54,'maximum'=>90,'unassigned_legacy_hours'=>(float)DB::table('student_training_legacy')->sum('unassigned_hours'),'unassigned_attendance_hours'=>(float)DB::table('attendance_logs')->whereNull('academic_year_id')->sum('approved_hours')]]);}
 public function assignLegacy(Request $request,SemesterTraining $service){
  $data=$request->validate(['student_id'=>'required|string|exists:students,student_id','academic_year_id'=>'required|integer|exists:academic_years,id','hours'=>'required|numeric|gt:0','reason'=>'required|string|min:3|max:500']);
  $student=Student::where('student_id',$data['student_id'])->firstOrFail();$service->assignLegacy($student,(int)$data['academic_year_id'],(float)$data['hours'],$data['reason'],$request->user()->id);
  return response()->json(['message'=>'Historical hours assigned to the selected semester. Credits remain capped at 90.']);
 }
 public function assignLog(Request $request,int $id,SemesterTraining $service){
  $data=$request->validate(['academic_year_id'=>'required|integer|exists:academic_years,id','reason'=>'required|string|min:3|max:500']);
  DB::transaction(function()use($id,$data,$service,$request){
   $row=DB::table('attendance_logs')->where('id',$id)->first();abort_unless($row,404);
   $student=Student::whereKey($row->student_id)->lockForUpdate()->firstOrFail();$log=\App\Models\AttendanceLog::whereKey($id)->lockForUpdate()->firstOrFail();
   abort_if($log->academic_year_id!==null,409,'This attendance record already has a semester.');
   $period=AcademicYear::findOrFail($data['academic_year_id']);$date=($log->session->scheduled_start??$log->session->start_time??$log->check_in_at)?->copy()->setTimezone('Asia/Manila')->toDateString();
   abort_unless($date && $date>=$period->start_date->toDateString() && $date<=$period->end_date->toDateString(),422,'The attendance schedule does not fall within the selected semester.');
   $log->forceFill(['academic_year_id'=>$period->id])->save();$service->rebuild($student,$period->id);
   AuditTrail::record($request->user()->id,'training.attendance_semester_assigned','attendance_log',$id,$data['reason'],['academic_year_id'=>$period->id]);
  },3);
  return response()->json(['message'=>'Attendance assigned and semester credits recalculated.']);
 }
}
