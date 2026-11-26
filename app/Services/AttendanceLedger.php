<?php
namespace App\Services;
use App\Models\AttendanceLog;
use App\Models\AttendanceSession;
use App\Models\Student;
use Carbon\Carbon;
class AttendanceLedger {
    /** Must run inside a transaction after locking the student row. */
    public function credit(AttendanceLog $log, AttendanceSession $session, Student $student): void {
        $hours=0;
        $mark=$log->attendance_mark ?? $log->status;
        if($session->status!=='cancelled' && $log->review_status==='approved' && in_array($mark,['present','late']) && $log->check_in_at && $log->check_out_at) {
            $start=$session->scheduled_start ?? $session->start_time;
            $end=$session->scheduled_end ?? $session->end_time;
            $in=$start && $log->check_in_at->lt($start) ? $start : $log->check_in_at;
            $out=$end && $log->check_out_at->gt($end) ? $end : $log->check_out_at;
            $hours=round(max(0,$in->diffInSeconds($out,false))/3600,2);
        }
        $service=app(SemesterTraining::class);
        $period=$service->periodFor($session,$log->academic_year_id?(int)$log->academic_year_id:null);
        $log->forceFill(['academic_year_id'=>$period,'approved_hours'=>$hours]);$log->save();
        $service->rebuild($student,$period);
        $log->refresh();

    }
    public function afterEnd(AttendanceSession $session, Carbon $time): bool {
        $end=$session->scheduled_end ?? $session->end_time;
        if($session->status==='closed' && $session->end_time && (!$end || $session->end_time->lt($end))) $end=$session->end_time;
        return $end && $time->gt($end);
    }
}
