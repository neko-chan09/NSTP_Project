<?php
// app/Http/Controllers/API/Mobile/Faculty/DashboardController.php

namespace App\Http\Controllers\API\Mobile\Faculty;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\ClassGroup;
use App\Models\AttendanceSession;
use App\Models\AttendanceLog;
use App\Models\Document;
use Carbon\Carbon;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Get faculty dashboard statistics.
     * GET /api/faculty/dashboard
     *
     * Scope: ONLY students enrolled in classes where teacher_id = current faculty.
     * This prevents double-counting students who belong to the same component
     * but are handled by a different faculty member.
     */
    public function stats(Request $request)
    {
        $faculty = $request->user();

        // ============================================================
        // Get the IDs of every class this faculty teaches
        // ============================================================
        $classIds = ClassGroup::where('teacher_id', $faculty->id)
            ->pluck('id')
            ->toArray();

        // ============================================================
        // Base student query — only students in THIS faculty's classes
        // ============================================================
        $studentsQuery = Student::query();

        if (empty($classIds)) {
            // Faculty has no classes → no students, ever
            $studentsQuery->whereRaw('1 = 0');
        } else {
            $studentsQuery->whereHas('classes', function ($q) use ($classIds) {
                $q->whereIn('classes.id', $classIds)
                  ->where('class_students.status', 'active');
            });
        }

        $totalStudents = (clone $studentsQuery)->count();

        // ============================================================
        // Students by completion status (scoped to this faculty's classes)
        // ============================================================
        $completedStudents = (clone $studentsQuery)
            ->where('completion_status', 'completed')
            ->count();

        $pendingStudents = (clone $studentsQuery)
            ->where('completion_status', 'pending')
            ->count();

        $inProgressStudents = (clone $studentsQuery)
            ->where('completion_status', 'in_progress')
            ->count();

        $deficientStudents = (clone $studentsQuery)
            ->where('completion_status', 'deficient')
            ->count();

        // ============================================================
        // Eligible students (scoped)
        // ============================================================
        $eligibleStudents = (clone $studentsQuery)
            ->where('is_eligible_for_completion', true)
            ->count();

        // ============================================================
        // Active sessions created by this faculty
        // ============================================================
        $activeSessions = AttendanceSession::where('faculty_id', $faculty->id)
            ->where('status', 'active')
            ->count();

        // ============================================================
        // Today's attendance (scoped to this faculty's sessions)
        // ============================================================
        $today = Carbon::today();

        $todayCheckins = AttendanceLog::whereHas('session', function ($query) use ($faculty) {
            $query->where('faculty_id', $faculty->id);
        })
            ->whereDate('check_in_at', $today)
            ->count();

        $todayAttendance = AttendanceLog::whereHas('session', function ($query) use ($faculty) {
            $query->where('faculty_id', $faculty->id);
        })
            ->whereDate('check_in_at', $today)
            ->with(['student.user', 'session'])
            ->get()
            ->map(function ($log) {
                return [
                    'student'    => $log->student->user->first_name . ' ' . $log->student->user->last_name,
                    'student_id' => $log->student->student_id,
                    'time'       => Carbon::parse($log->check_in_at)->format('h:i A'),
                    'status'     => $log->status ?? 'present',
                    'session_id' => $log->session->id ?? null,
                ];
            })
            ->values()
            ->all();

        // ============================================================
        // Pending documents from students in THIS faculty's classes only
        // ============================================================
        $pendingDocuments = 0;
        if (!empty($classIds)) {
            $pendingDocuments = Document::whereHas('student', function ($q) use ($classIds) {
                $q->whereHas('classes', function ($cq) use ($classIds) {
                    $cq->whereIn('classes.id', $classIds)
                       ->where('class_students.status', 'active');
                });
            })
                ->where('status', 'pending')
                ->count();
        }

        // ============================================================
        // Recent sessions (this faculty only)
        // ============================================================
        $recentSessions = AttendanceSession::where('faculty_id', $faculty->id)
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->with('class')
            ->get()
            ->map(function ($session) {
                return [
                    'id'         => $session->id,
                    'class_id'   => $session->class_id,
                    'class_name' => $session->class->name ?? null,
                    'component'  => $session->component,
                    'start_time' => $session->start_time,
                    'status'     => $session->status,
                    'logs_count' => $session->logs()->count(),
                ];
            });

        // ============================================================
        // Weekly attendance (this faculty only)
        // ============================================================
        $weeklyStats = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            $count = AttendanceLog::whereHas('session', function ($query) use ($faculty) {
                $query->where('faculty_id', $faculty->id);
            })
                ->whereDate('check_in_at', $date)
                ->count();

            $weeklyStats[] = [
                'date'  => $date->format('D'),
                'count' => $count,
            ];
        }

        // ============================================================
        // Component distribution — scoped to this faculty's classes
        // ============================================================
        $componentDistribution = [
            'cwts'       => 0,
            'rotc'       => 0,
            'lts'        => 0,
            'unassigned' => 0,
        ];

        if (!empty($classIds)) {
            $componentDistribution = [
                'cwts' => (clone $studentsQuery)
                    ->where('nstp_component_selected', 'cwts')
                    ->count(),
                'rotc' => (clone $studentsQuery)
                    ->where('nstp_component_selected', 'rotc')
                    ->count(),
                'lts' => (clone $studentsQuery)
                    ->where('nstp_component_selected', 'lts')
                    ->count(),
                'unassigned' => (clone $studentsQuery)
                    ->whereNull('nstp_component_selected')
                    ->count(),
            ];
        }

        // ============================================================
        // Response
        // ============================================================
        return response()->json([
            'success' => true,
            'data'    => [
                // Student Stats
                'my_students'            => $totalStudents,
                'completed_students'     => $completedStudents,
                'pending_students'       => $pendingStudents,
                'in_progress_students'   => $inProgressStudents,
                'deficient_students'     => $deficientStudents,
                'eligible_students'      => $eligibleStudents,
                'component_distribution' => $componentDistribution,

                // Attendance Stats
                'active_sessions'    => $activeSessions,
                'today_checkins'     => $todayCheckins,
                'today_attendance'   => $todayAttendance,
                'weekly_attendance'  => $weeklyStats,
                'recent_sessions'    => $recentSessions,

                // Document Stats
                'pending_documents' => $pendingDocuments,

                // Faculty Info
                'component'    => $faculty->nstp_component,
                'faculty_name' => $faculty->name,

                // Extra context for UI
                'class_count'  => count($classIds),
            ],
        ]);
    }
}