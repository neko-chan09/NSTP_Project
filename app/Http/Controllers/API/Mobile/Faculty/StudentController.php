<?php
// app/Http/Controllers/API/Mobile/Faculty/StudentController.php

namespace App\Http\Controllers\API\Mobile\Faculty;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\ClassGroup;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\Request;

class StudentController extends Controller

{

/**
     * Helper function to convert name to uppercase
     */
    private function toUpperCase($value)
    {
        if (empty($value)) return 'N/A';
        return strtoupper($value);
    }

    /**
     * Helper function to format gender for display
     */
    private function formatGender($gender)
    {
        if (empty($gender)) return 'N/A';
        return ucfirst(strtolower($gender));
    }

    /**
     * Helper function to get gender sort order
     * Male = 0, Female = 1, Others = 2
     */
    private function getGenderSortOrder($gender)
    {
        $genderLower = strtolower($gender ?? '');
        if ($genderLower === 'male') return 0;
        if ($genderLower === 'female') return 1;
        return 2;
    }

    /**
     * Get students under this faculty — ONLY those enrolled in
     * classes taught by this faculty.
     *
     * Sorted by gender (Male first, then Female).
     */
    public function index(Request $request)
    {
        $faculty = $request->user();

        // ============================================================
        // Collect the IDs of every class this faculty teaches
        // ============================================================
        $classIds = ClassGroup::where('teacher_id', $faculty->id)
            ->pluck('id')
            ->toArray();

        // ============================================================
        // Base query — only students enrolled in this faculty's classes
        // ============================================================
        $query = Student::with('user');

        if (empty($classIds)) {
            // No classes → no students
            $query->whereRaw('1 = 0');
        } else {
            $query->whereHas('classes', function ($q) use ($classIds) {
                $q->whereIn('classes.id', $classIds)
                  ->where('class_students.status', 'active');
            });
        }

        // ============================================================
        // Optional search — student_id, name, or email
        // ============================================================
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('student_id', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($userQuery) use ($search) {
                        $userQuery->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")
                            ->orWhereRaw(
                                "CONCAT(first_name, ' ', last_name) LIKE ?",
                                ["%{$search}%"]
                            );
                    });
            });
        }

        // ============================================================
        // Optional component filter (defensive: still within own classes)
        // ============================================================
        if ($request->filled('component')) {
            $query->where('nstp_component_selected', $request->component);
        }

        // ============================================================
        // Fetch + dedupe + sort by gender
        // ============================================================
        $students = $query
            ->orderBy('student_id')
            ->get()
            ->unique('id')                            // dedupe if enrolled in 2 classes
            ->sortBy(fn($s) => $this->getGenderSortOrder($s->gender))
            ->values();

        // ============================================================
        // Transform
        // ============================================================
        $transformedStudents = $students->map(function ($student) {
            return [
                'id' => $student->id,
                'student_id' => $student->student_id,
                'course' => $this->toUpperCase($student->course),
                'year_level' => $student->year_level,
                'section' => $this->toUpperCase($student->section),
                'nstp_component_selected' => $student->nstp_component_selected,
                'completion_status' => $student->completion_status,
                'is_eligible_for_completion' => $student->is_eligible_for_completion,
                'completed_training_hours' => $student->completed_training_hours,
                'total_training_hours' => $student->total_training_hours,
                'birth_date' => $student->birth_date,
                'gender' => $this->formatGender($student->gender),
                'address' => $this->toUpperCase($student->address),
                'emergency_contact_name' => $this->toUpperCase($student->emergency_contact_name),
                'emergency_contact_number' => $student->emergency_contact_number,
                'user' => [
                    'id' => $student->user->id,
                    'first_name' => $this->toUpperCase($student->user->first_name),
                    'last_name' => $this->toUpperCase($student->user->last_name),
                    'email' => strtolower($student->user->email),
                    'profile_photo' => $student->user->profile_photo,
                    'profile_photo_url' => $student->user->profile_photo_url,
                ],
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $transformedStudents,
            'meta' => [
                'total' => $transformedStudents->count(),
                'class_count' => count($classIds),
            ],
        ]);
    }
}