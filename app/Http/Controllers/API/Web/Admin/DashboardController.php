<?php
// app/Http/Controllers/API/Web/Admin/DashboardController.php

namespace App\Http\Controllers\API\Web\Admin;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\ActivityParticipation;
use App\Models\Document;
use App\Models\AttendanceSession;
use App\Models\AttendanceLog;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function stats()
    {
        $totalStudents = Student::count();
        $eligible = Student::where('is_eligible_for_completion', true)->count();
        $notEligible = $totalStudents - $eligible;
        $totalHours = Student::sum('completed_training_hours') ?? 0;
        $totalRequiredHours = Student::count() * 90;
        $completionRate = $totalStudents > 0 ? round(($eligible / $totalStudents) * 100, 2) : 0;
        
        $cwts = Student::where('nstp_component_selected', 'cwts')->count();
        $rotc = Student::where('nstp_component_selected', 'rotc')->count();
        $lts = Student::where('nstp_component_selected', 'lts')->count();
        $unassigned = Student::whereNull('nstp_component_selected')->count();
        
        $pendingDocuments = Document::where('status', 'pending')->count();
        $approvedDocuments = Document::where('status', 'approved')->count();
        $rejectedDocuments = Document::where('status', 'rejected')->count();
        $totalDocuments = Document::count();
        
        $today = Carbon::today();
        $todayAttendance = AttendanceLog::whereDate('check_in_at', $today)
            ->with(['student.user'])
            ->get()
            ->map(function ($log) {
                return [
                    'student' => $log->student->user->full_name,
                    'student_id' => $log->student->student_id,
                    'time' => Carbon::parse($log->check_in_at)->format('h:i A'),
                    'hours' => 1,
                    'status' => $log->status ?? 'present',
                ];
            })
            ->values()
            ->all();
        
        $todayCheckins = count($todayAttendance);
        $activeSessions = AttendanceSession::where('status', 'active')->count();
        $totalSessions = AttendanceSession::count();
        
        $pendingStudents = Student::where('completion_status', 'pending')->count();
        $inProgressStudents = Student::where('completion_status', 'in_progress')->count();
        $completedStudents = Student::where('completion_status', 'completed')->count();
        $deficientStudents = Student::where('completion_status', 'deficient')->count();
        
        $maleStudents = Student::whereHas('user', function($q) {
            $q->where('gender', 'male');
        })->count();
        
        $femaleStudents = Student::whereHas('user', function($q) {
            $q->where('gender', 'female');
        })->count();

        $recentActivities = ActivityParticipation::with(['student.user', 'activity'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($participation) {
                return [
                    'student' => $participation->student->user->full_name,
                    'activity' => $participation->activity->title ?? 'Unknown Activity',
                    'status' => $participation->attendance_status ?? 'registered',
                    'time' => Carbon::parse($participation->created_at)->format('h:i A'),
                ];
            })
            ->values()
            ->all();

        return response()->json([
            'success' => true,
            'data' => [
                'total_students' => $totalStudents,
                'eligible' => $eligible,
                'not_eligible' => $notEligible,
                'pending_students' => $pendingStudents,
                'in_progress_students' => $inProgressStudents,
                'completed_students' => $completedStudents,
                'deficient_students' => $deficientStudents,
                'cwts' => $cwts,
                'rotc' => $rotc,
                'lts' => $lts,
                'unassigned' => $unassigned,
                'male_students' => $maleStudents,
                'female_students' => $femaleStudents,
                'total_hours' => $totalHours,
                'total_required_hours' => $totalRequiredHours,
                'completion_rate' => $completionRate,
                'total_documents' => $totalDocuments,
                'pending_documents' => $pendingDocuments,
                'approved_documents' => $approvedDocuments,
                'rejected_documents' => $rejectedDocuments,
                'today_attendance' => $todayAttendance,
                'today_checkins' => $todayCheckins,
                'active_sessions' => $activeSessions,
                'total_sessions' => $totalSessions,
                'recent_activities' => $recentActivities,
            ]
        ]);
    }
}