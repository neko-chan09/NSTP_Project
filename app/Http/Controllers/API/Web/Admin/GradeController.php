<?php

namespace App\Http\Controllers\API\Web\Admin;

use App\Http\Controllers\Controller;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class GradeController extends Controller
{
    /**
     * Get all students with their grades
     */
    public function index(Request $request)
    {
        $query = Student::with('user');

        // Filter by component
        if ($request->filled('component')) {
            $query->where('nstp_component_selected', $request->component);
        }

        // Filter by grade status
        if ($request->filled('grade_status')) {
            if ($request->grade_status === 'passing') {
                $query->where('training_grade_percentage', '>=', 60);
            } elseif ($request->grade_status === 'failing') {
                $query->where('training_grade_percentage', '<', 60)
                      ->whereNotNull('training_grade_percentage');
            } elseif ($request->grade_status === 'ungraded') {
                $query->whereNull('training_grade_percentage');
            }
        }

        // Filter by grade level
        if ($request->filled('grade_level')) {
            $gradeLevels = [
                'excellent' => ['min' => 90, 'max' => 100],
                'good' => ['min' => 75, 'max' => 89],
                'satisfactory' => ['min' => 60, 'max' => 74],
                'deficient' => ['min' => 0, 'max' => 59],
            ];
            
            if (isset($gradeLevels[$request->grade_level])) {
                $query->whereBetween('training_grade_percentage', [
                    $gradeLevels[$request->grade_level]['min'],
                    $gradeLevels[$request->grade_level]['max']
                ]);
            }
        }

        // Search by name or student_id
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('student_id', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($userQuery) use ($search) {
                      $userQuery->where('first_name', 'like', "%{$search}%")
                          ->orWhere('last_name', 'like', "%{$search}%")
                          ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        $students = $query->orderBy('training_grade_percentage', 'desc')->get();

        // Transform data
        $students->transform(function ($student) {
            return [
                'id' => $student->id,
                'student_id' => $student->student_id,
                'name' => $student->user->first_name . ' ' . $student->user->last_name,
                'email' => $student->user->email,
                'component' => $student->nstp_component_selected,
                'completed_hours' => $student->completed_training_hours,
                'total_hours' => $student->total_training_hours ?? 90,
                'percentage' => $student->training_grade_percentage,
                'grade' => $student->training_grade,
                'grade_label' => $this->getGradeLabel($student->training_grade),
                'grade_remarks' => $student->training_grade_remarks,
                'is_passing' => ($student->training_grade_percentage ?? 0) >= 60,
                'status' => $student->completion_status,
                'grade_updated_at' => $student->grade_updated_at,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $students,
            'meta' => [
                'total' => $students->count(),
                'passing' => $students->filter(fn($s) => $s['is_passing'])->count(),
                'failing' => $students->filter(fn($s) => !$s['is_passing'] && $s['percentage'] !== null)->count(),
                'ungraded' => $students->filter(fn($s) => $s['percentage'] === null)->count(),
            ]
        ]);
    }

    /**
     * Get grade scale
     */
    public function getGradeScale()
    {
        $student = new Student();
        return response()->json([
            'success' => true,
            'data' => $student->getGradeScale(),
        ]);
    }

    /**
     * Get a specific student's grade
     */
    public function show($id)
    {
        $student = Student::with('user')->find($id);
        if (!$student) {
            return response()->json(['message' => 'Student not found'], 404);
        }

        $gradeData = $student->calculateTrainingGrade();

        return response()->json([
            'success' => true,
            'data' => [
                'student_id' => $student->student_id,
                'name' => $student->user->first_name . ' ' . $student->user->last_name,
                'completed_hours' => $student->completed_training_hours,
                'total_hours' => $student->total_training_hours ?? 90,
                'percentage' => $gradeData['percentage'],
                'grade' => $gradeData['grade'],
                'grade_label' => $gradeData['grade_label'],
                'grade_description' => $gradeData['grade_description'],
                'is_passing' => $gradeData['is_passing'],
                'is_excellent' => $gradeData['is_excellent'],
                'status' => $student->completion_status,
                'is_eligible' => $student->is_eligible_for_completion,
                'grade_updated_at' => $student->grade_updated_at,
            ]
        ]);
    }

    /**
     * Update grade for a specific student
     */
    public function updateGrade(Request $request, $id)
    {
        $student = Student::find($id);
        if (!$student) {
            return response()->json(['message' => 'Student not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'grade' => 'nullable|numeric|min:0|max:5',
            'percentage' => 'nullable|numeric|min:0|max:100',
            'remarks' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $student->update([
            'training_grade' => $request->grade,
            'training_grade_percentage' => $request->percentage,
            'training_grade_remarks' => $request->remarks,
            'grade_updated_at' => now(),
            'is_eligible_for_completion' => ($request->percentage ?? 0) >= 60,
        ]);

        // Update completion status
        $percentage = $request->percentage ?? 0;
        if ($percentage >= 90) {
            $student->completion_status = 'completed';
        } elseif ($percentage >= 60) {
            $student->completion_status = 'in_progress';
        } else {
            $student->completion_status = 'deficient';
        }
        $student->save();

        return response()->json([
            'success' => true,
            'message' => 'Grade updated successfully',
            'data' => [
                'id' => $student->id,
                'student_id' => $student->student_id,
                'grade' => $student->training_grade,
                'percentage' => $student->training_grade_percentage,
                'remarks' => $student->training_grade_remarks,
                'status' => $student->completion_status,
                'is_eligible' => $student->is_eligible_for_completion,
                'grade_label' => $this->getGradeLabel($student->training_grade),
            ]
        ]);
    }

    /**
     * Batch update grades
     */
    public function batchUpdateGrades(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'student_ids' => 'required|array',
            'student_ids.*' => 'exists:students,id',
            'percentage' => 'required|numeric|min:0|max:100',
            'remarks' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $gradeData = $this->getGradeFromPercentage($request->percentage);
        $isPassing = $request->percentage >= 60;
        $status = $request->percentage >= 90 ? 'completed' : ($isPassing ? 'in_progress' : 'deficient');

        $updated = Student::whereIn('id', $request->student_ids)->update([
            'training_grade' => $gradeData['grade'],
            'training_grade_percentage' => $request->percentage,
            'training_grade_remarks' => $request->remarks ?? $gradeData['description'],
            'grade_updated_at' => now(),
            'is_eligible_for_completion' => $isPassing,
            'completion_status' => $status,
        ]);

        return response()->json([
            'success' => true,
            'message' => "{$updated} students updated successfully",
            'data' => [
                'updated_count' => $updated,
                'grade' => $gradeData['grade'],
                'percentage' => $request->percentage,
                'grade_label' => $gradeData['label'],
            ]
        ]);
    }

    /**
     * Recalculate all grades
     */
    public function recalculateAllGrades(Request $request)
    {
        $query = Student::query();

        // Optionally filter by component
        if ($request->filled('component')) {
            $query->where('nstp_component_selected', $request->component);
        }

        $students = $query->get();
        $updated = 0;

        foreach ($students as $student) {
            $student->updateTrainingGrade();
            $updated++;
        }

        return response()->json([
            'success' => true,
            'message' => "Recalculated grades for {$updated} students",
            'data' => ['updated_count' => $updated]
        ]);
    }

    /**
     * Get grade statistics
     */
    public function getStats()
    {
        $totalStudents = Student::count();
        
        return response()->json([
            'success' => true,
            'data' => [
                'total' => $totalStudents,
                'excellent' => Student::where('training_grade_percentage', '>=', 90)->count(),
                'good' => Student::whereBetween('training_grade_percentage', [75, 89])->count(),
                'satisfactory' => Student::whereBetween('training_grade_percentage', [60, 74])->count(),
                'deficient' => Student::where('training_grade_percentage', '<', 60)
                                      ->whereNotNull('training_grade_percentage')->count(),
                'ungraded' => Student::whereNull('training_grade_percentage')->count(),
                'passing_rate' => $totalStudents > 0 
                    ? round((Student::where('training_grade_percentage', '>=', 60)->count() / $totalStudents) * 100, 2)
                    : 0,
                'average_grade' => $totalStudents > 0 
                    ? round(Student::avg('training_grade_percentage'), 2)
                    : 0,
                'average_grade_value' => $totalStudents > 0 
                    ? round(Student::avg('training_grade'), 2)
                    : 0,
            ]
        ]);
    }

    /**
     * Export grades to CSV
     */
    public function exportGrades(Request $request)
    {
        $query = Student::with('user');

        if ($request->filled('component')) {
            $query->where('nstp_component_selected', $request->component);
        }

        $students = $query->get();

        $headers = [
            'Student ID',
            'Name',
            'Email',
            'Component',
            'Completed Hours',
            'Total Hours',
            'Percentage',
            'Grade',
            'Grade Label',
            'Remarks',
            'Status',
            'Eligible'
        ];

        $rows = $students->map(function ($student) {
            $gradeData = $student->calculateTrainingGrade();
            return [
                $student->student_id,
                $student->user->first_name . ' ' . $student->user->last_name,
                $student->user->email,
                strtoupper($student->nstp_component_selected ?? 'N/A'),
                $student->completed_training_hours,
                $student->total_training_hours ?? 90,
                $gradeData['percentage'],
                $gradeData['grade'],
                $gradeData['grade_label'],
                $gradeData['grade_description'],
                $student->completion_status,
                $student->is_eligible_for_completion ? 'Yes' : 'No'
            ];
        });

        $csv = implode(',', $headers) . "\n";
        foreach ($rows as $row) {
            $csv .= implode(',', $row) . "\n";
        }

        return response($csv)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="grades_' . date('Y-m-d') . '.csv"');
    }

    // ============================================================
    // PRIVATE HELPER METHODS
    // ============================================================

    /**
     * Get grade label from grade value
     */
    private function getGradeLabel($grade)
    {
        if ($grade === null) return 'N/A';
        
        $scale = (new Student())->getGradeScale();
        foreach ($scale as $item) {
            if ($item['grade'] == $grade) {
                return $item['label'];
            }
        }
        return (string) $grade;
    }

    /**
     * Get grade from percentage
     */
    private function getGradeFromPercentage(float $percentage): array
    {
        $scale = (new Student())->getGradeScale();
        
        foreach ($scale as $grade) {
            if ($percentage >= $grade['threshold']) {
                return $grade;
            }
        }
        
        return [
            'grade' => 5.0,
            'label' => 'F',
            'threshold' => 0,
            'description' => 'Failed',
        ];
    }
}