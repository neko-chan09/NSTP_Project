<?php
namespace App\Http\Controllers\API\Shared;
use App\Http\Controllers\Controller;
use App\Models\{AttendanceLog,AttendanceSession,Student};
use App\Services\{AttendanceAccess,AttendanceLedger,AuditTrail};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
class ClassRecordController extends Controller {
    public function show(Request $request,int $id) {
        $class=app(AttendanceAccess::class)->class($request->user(),$id,true);
        $students=$class->students()->with('user')->when($request->filled('course'),fn($q)=>$q->where('students.course',$request->course))->when($request->filled('section'),fn($q)=>$q->where('students.section',$request->section))->orderBy('course')->orderBy('section')->get();
        $sessions=AttendanceSession::where('class_id',$id)->with(['logs.student.user'])->latest('id')->paginate(30,['*'],'session_page');
        return response()->json(['data'=>['class'=>$class->only(['id','name','school_year','component_type']),'students'=>$students,'sessions'=>$sessions->items(),'session_meta'=>['current_page'=>$sessions->currentPage(),'last_page'=>$sessions->lastPage()]]]);
    }
    public function mine(Request $request) {
        $student=$request->user()->student;abort_unless($student,403);
        $sessions=AttendanceSession::with('class')->with(['logs'=>fn($q)=>$q->where('student_id',$student->id)])
            ->where('status','!=','cancelled')->whereHas('class.students',fn($q)=>$q->where('students.id',$student->id))
            ->where(function($q){$q->whereBetween('scheduled_start',[now()->subDays(7),now()])->orWhere(function($q){$q->whereNull('scheduled_start')->whereBetween('start_time',[now()->subDays(7),now()]);});})
            ->latest('id')->limit(50)->get();
        return response()->json(['data'=>$sessions]);
    }
    public function manual(Request $request,int $sessionId,AttendanceLedger $ledger) {
        $session=app(AttendanceAccess::class)->session($request->user(),$sessionId,true);
        $data=$request->validate(['student_id'=>'required|integer|exists:students,id','status'=>'required|in:present,late,absent,excused','check_in_at'=>'nullable|date','check_out_at'=>'nullable|date|after_or_equal:check_in_at','reason'=>'required|string|min:3|max:500','review_status'=>'sometimes|in:approved,rejected']);
        abort_unless($session->class->allStudentsWithPivot()->where('students.id',$data['student_id'])->exists(),403,'Student is not enrolled in this class.');
        if(in_array($data['status'],['present','late'])) $request->validate(['check_in_at'=>'required|date|before_or_equal:now']);
        if($request->filled('check_out_at')) $request->validate(['check_in_at'=>'required|date','check_out_at'=>'date|before_or_equal:now']);
        $log=DB::transaction(function()use($session,$data,$request,$ledger){
            $student=Student::whereKey($data['student_id'])->lockForUpdate()->firstOrFail();
            $log=AttendanceLog::firstOrNew(['session_id'=>$session->id,'student_id'=>$student->id]);
            $before=$log->only(['status','attendance_mark','check_in_at','check_out_at','review_status','credited_hours']);
            $mark=$data['status'];
            $log->fill(['status'=>$mark==='excused'?'absent':$mark,'attendance_mark'=>$mark,'check_in_at'=>in_array($mark,['present','late'])?($data['check_in_at']??null):null,'check_out_at'=>in_array($mark,['present','late'])?($data['check_out_at']??null):null,'review_status'=>$data['review_status']??'approved','recorded_by'=>$request->user()->id,'reviewed_by'=>$request->user()->id,'remarks'=>trim($data['reason'])]);
            $log->save();$ledger->credit($log,$session,$student);
            AuditTrail::record($request->user()->id,'attendance.manual','attendance_log',$log->id,trim($data['reason']),['before'=>$before,'after'=>$log->only(['status','attendance_mark','check_in_at','check_out_at','review_status','credited_hours'])]);
            return $log->fresh();
        });
        return response()->json(['data'=>$log,'message'=>'Attendance saved with audit history.']);
    }
    public function checkout(Request $request,int $sessionId,AttendanceLedger $ledger) {
        $session=app(AttendanceAccess::class)->session($request->user(),$sessionId);
        $student=$request->user()->student;abort_unless($student,403);
        $log=DB::transaction(function()use($request,$session,$student,$ledger){
            $student=Student::whereKey($student->id)->lockForUpdate()->firstOrFail();
            $log=AttendanceLog::where('session_id',$session->id)->where('student_id',$student->id)->firstOrFail();
            abort_unless($log->check_in_at,422,'Time in before recording time out.');
            if($log->check_out_at)return $log;
            abort_if(now()->lt($log->check_in_at),422,'Time out cannot precede time in.');
            $log->check_out_at=now();$log->save();$ledger->credit($log,$session,$student);
            AuditTrail::record($request->user()->id,'attendance.checkout','attendance_log',$log->id);
            return $log;
        });
        return response()->json(['data'=>$log,'message'=>'Time out saved. Pending records need faculty review before credit.']);
    }
}
