<?php

namespace App\Http\Controllers\API\Mobile\Student;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\Certificate;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Get student dashboard statistics.
     * GET /api/student/dashboard
     *
     * Provides comprehensive stats for a student's NSTP progress including:
     * - Completed vs required training hours and completion percentage
     * - Current status (pending, in_progress, completed, deficient)
     * - Document approval status
     * - Certificate count
     * - NSTP component and eligibility status
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse Student dashboard statistics
     */
    public function stats(Request $request)
    {
        $student = $request->user()->student;

        if (!$student) {
            return response()->json([
                'success' => true,
                'data' => [
                    'completed_hours' => 0,
                    'required_hours' => 90,
                    'completion_percentage' => 0,
                    'status' => 'pending',
                    'documents_approved' => 0,
                    'documents_pending' => 0,
                    'certificates_count' => 0,
                    'nstp_component' => null,
                    'is_eligible' => false,
                ]
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'completed_hours' => $student->completed_training_hours,
                'required_hours' => 90,
                'completion_percentage' => round(($student->completed_training_hours / 90) * 100, 2),
                'status' => $student->completion_status,
                'documents_approved' => Document::where('student_id', $student->id)->where('status', 'approved')->count(),
                'documents_pending' => Document::where('student_id', $student->id)->where('status', 'pending')->count(),
                'certificates_count' => Certificate::where('student_id', $student->id)->count(),
                'nstp_component' => $student->nstp_component_selected,
                'is_eligible' => $student->is_eligible_for_completion,
            ]
        ]);
    }
}