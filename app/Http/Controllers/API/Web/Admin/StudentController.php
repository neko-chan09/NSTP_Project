<?php
// app/Http/Controllers/API/Web/Admin/StudentController.php

namespace App\Http\Controllers\API\Web\Admin;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use App\Http\Requests\ImportStudentsRequest;
use App\Services\StudentImportService;

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
     * Display a listing of students with search, filter, and pagination
     * Sorted by gender (Male first, then Female)
     */
    public function index(Request $request)
    {
        $query = Student::with('user');

        // Search by student_id, name, or email
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('student_id', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($userQuery) use ($search) {
                        $userQuery->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")
                            ->orWhereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ["%{$search}%"]);
                    });
            });
        }

        // Filter by component
        if ($request->filled('component')) {
            $query->where('nstp_component_selected', $request->component);
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('completion_status', $request->status);
        }

        // Filter by eligibility
        if ($request->filled('eligible')) {
            $query->where('is_eligible_for_completion', $request->eligible === 'true');
        }

        // Filter by course
        if ($request->filled('course')) {
            $query->where('course', $request->course);
        }

        // Filter by section
        if ($request->filled('section')) {
            $query->where('section', $request->section);
        }

        // Get all students first (for sorting by gender)
        $students = $query->orderBy('student_id')->get();

        // Sort by gender: Male first, then Female, then Others
        $sortedStudents = $students->sortBy(function ($student) {
            return $this->getGenderSortOrder($student->gender);
        })->values();

        // Transform the data with UPPERCASE names
        $transformedStudents = $sortedStudents->map(function ($student) {
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
                'completed_at' => $student->completed_at,
                'created_at' => $student->created_at,
                'updated_at' => $student->updated_at,
                'user' => [
                    'id' => $student->user->id,
                    'first_name' => $this->toUpperCase($student->user->first_name),
                    'last_name' => $this->toUpperCase($student->user->last_name),
                    'middle_name' => $this->toUpperCase($student->user->middle_name),
                    'email' => strtolower($student->user->email),
                    'contact_number' => $student->user->contact_number,
                    'profile_photo' => $student->user->profile_photo,
                    'profile_photo_url' => $student->user->profile_photo_url,
                    'role' => $student->user->role,
                    'is_active' => $student->user->is_active,
                ]
            ];
        });

        // Convert to pagination (preserve sorting order)
        $perPage = $request->input('per_page', 15);
        $currentPage = $request->input('page', 1);
        $total = $transformedStudents->count();
        $paginatedData = $transformedStudents->slice(($currentPage - 1) * $perPage, $perPage)->values();

        return response()->json([
            'success' => true,
            'data' => $paginatedData,
            'meta' => [
                'current_page' => (int) $currentPage,
                'last_page' => (int) ceil($total / $perPage),
                'per_page' => (int) $perPage,
                'total' => (int) $total,
                'from' => $paginatedData->isEmpty() ? 0 : (($currentPage - 1) * $perPage) + 1,
                'to' => $paginatedData->isEmpty() ? 0 : (($currentPage - 1) * $perPage) + $paginatedData->count(),
            ]
        ]);
    }

    /**
     * Display the specified student with full details
     * With UPPERCASE names
     */
    public function show($id)
    {
        $student = Student::with([
            'user',
            'documents',
            'certificates',
            'activityParticipations.activity',
            'trainingHoursLogs'
        ])->find($id);

        if (!$student) {
            return response()->json([
                'success' => false,
                'message' => 'Student not found'
            ], 404);
        }

        // Add computed stats
        $studentData = $student->toArray();
        $studentData['documents_count'] = $student->documents->count();
        $studentData['certificates_count'] = $student->certificates->count();
        $studentData['activities_attended'] = $student->activityParticipations->count();
        $studentData['completion_percentage'] = $student->total_training_hours > 0
            ? round(($student->completed_training_hours / $student->total_training_hours) * 100, 2)
            : 0;

        // Apply UPPERCASE to names
        if (isset($studentData['user'])) {
            $studentData['user']['first_name'] = $this->toUpperCase($student->user->first_name);
            $studentData['user']['last_name'] = $this->toUpperCase($student->user->last_name);
            $studentData['user']['middle_name'] = $this->toUpperCase($student->user->middle_name);
            $studentData['user']['email'] = strtolower($student->user->email);
            $studentData['user']['profile_photo_url'] = $student->user->profile_photo_url;
        }

        // Apply UPPERCASE to student fields
        $studentData['course'] = $this->toUpperCase($student->course);
        $studentData['section'] = $this->toUpperCase($student->section);
        $studentData['address'] = $this->toUpperCase($student->address);
        $studentData['gender'] = $this->formatGender($student->gender);
        $studentData['emergency_contact_name'] = $this->toUpperCase($student->emergency_contact_name);

        return response()->json([
            'success' => true,
            'data' => $studentData
        ]);
    }

    public function update(Request $request, $id)
    {
        $student = Student::find($id);
        if (!$student) {
            return response()->json([
                'success' => false,
                'message' => 'Student not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'first_name' => 'sometimes|string|max:255',
            'last_name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $student->user_id,
            'student_id' => 'sometimes|string|unique:students,student_id,' . $id,
            'course' => 'nullable|string|max:255',
            'year_level' => 'nullable|integer|min:1|max:5',
            'section' => 'nullable|string|max:50',
            'nstp_component_selected' => 'nullable|in:cwts,rotc,lts',
            'completion_status' => 'nullable|in:pending,in_progress,completed,deficient',
            'is_eligible_for_completion' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
            // Add unique constraint for contact_number, ignore current user
            'contact_number' => 'nullable|string|max:20|unique:users,contact_number,' . $student->user_id,
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Update user
        $userData = [];
        if ($request->has('first_name')) {
            $userData['first_name'] = $request->first_name;
            $userData['name'] = $request->first_name . ' ' . ($request->last_name ?? $student->user->last_name);
        }
        if ($request->has('last_name')) {
            $userData['last_name'] = $request->last_name;
            $userData['name'] = ($request->first_name ?? $student->user->first_name) . ' ' . $request->last_name;
        }
        if ($request->has('email')) {
            $userData['email'] = $request->email;
        }
        if ($request->has('course')) {
            $userData['course'] = $request->course;
        }
        if ($request->has('year_level')) {
            $userData['year_level'] = $request->year_level;
        }
        if ($request->has('section')) {
            $userData['section'] = $request->section;
        }
        if ($request->has('is_active')) {
            $userData['is_active'] = $request->is_active;
        }

        if (!empty($userData)) {
            $student->user->update($userData);
        }

        // Update student
        $studentData = $request->only([
            'course',
            'year_level',
            'section',
            'nstp_component_selected',
            'completion_status',
            'is_eligible_for_completion'
        ]);

        if (!empty($studentData)) {
            $student->update($studentData);
        }

        // If password is provided, update it
        if ($request->filled('password')) {
            $student->user->update([
                'password' => Hash::make($request->password)
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Student updated successfully',
            'data' => $student->fresh()->load('user')
        ]);
    }

    /**
     * Remove the specified student (soft delete or hard delete)
     */
    public function destroy($id)
    {
        $student = Student::find($id);
        if (!$student) {
            return response()->json([
                'success' => false,
                'message' => 'Student not found'
            ], 404);
        }

        // Delete related data first (or use cascade)
        // The user will be deleted automatically via cascade if you have foreign key constraints
        $student->user->delete(); // soft delete user if using soft deletes
        $student->delete();

        return response()->json([
            'success' => true,
            'message' => 'Student deleted successfully'
        ]);
    }

    /**
     * Bulk delete students
     */
    public function bulkDestroy(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'ids' => 'required|array',
            'ids.*' => 'exists:students,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $students = Student::whereIn('id', $request->ids)->get();
        $deletedCount = 0;

        foreach ($students as $student) {
            $student->user->delete();
            $student->delete();
            $deletedCount++;
        }

        return response()->json([
            'success' => true,
            'message' => "{$deletedCount} students deleted successfully",
            'deleted_count' => $deletedCount
        ]);
    }

    /**
     * Get student statistics (for dashboard or summary)
     */
    public function stats()
    {
        $students = Student::with('user')->get();

        $maleCount = $students->filter(fn($s) => strtolower($s->gender ?? '') === 'male')->count();
        $femaleCount = $students->filter(fn($s) => strtolower($s->gender ?? '') === 'female')->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total' => $students->count(),
                'by_component' => [
                    'cwts' => Student::where('nstp_component_selected', 'cwts')->count(),
                    'rotc' => Student::where('nstp_component_selected', 'rotc')->count(),
                    'lts' => Student::where('nstp_component_selected', 'lts')->count(),
                    'unassigned' => Student::whereNull('nstp_component_selected')->count(),
                ],
                'by_status' => [
                    'pending' => Student::where('completion_status', 'pending')->count(),
                    'in_progress' => Student::where('completion_status', 'in_progress')->count(),
                    'completed' => Student::where('completion_status', 'completed')->count(),
                    'deficient' => Student::where('completion_status', 'deficient')->count(),
                ],
                'by_gender' => [
                    'male' => $maleCount,
                    'female' => $femaleCount,
                    'unspecified' => $students->count() - ($maleCount + $femaleCount),
                ],
                'eligible_count' => Student::where('is_eligible_for_completion', true)->count(),
                'not_eligible_count' => Student::where('is_eligible_for_completion', false)->count(),
            ]
        ]);
    }

    // ============================================================
    // This method is kept for the public test route
    // You can remove it if not needed
    // ============================================================
    public function getuser(Request $request)
    {
        $search = $request->search;

        $students = Student::paginate(5);
        return response()->json($students);
    }

    public function getFaceEncodings(Request $request)
    {
        $students = Student::whereNotNull('face_encoding')
            ->select('id', 'student_id', 'face_encoding', 'face_confidence')
            ->get()
            ->map(function ($student) {
                return [
                    'id' => $student->id,
                    'student_id' => $student->student_id,
                    'face_encoding' => json_decode($student->face_encoding, true),
                    'face_confidence' => $student->face_confidence,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $students
        ]);
    }

    /**
     * Update student face encoding
     */
    public function updateFaceEncoding(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'face_encoding' => 'required|array',
            'face_confidence' => 'required|numeric|min:0|max:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $student = Student::find($id);
        if (!$student) {
            return response()->json([
                'success' => false,
                'message' => 'Student not found'
            ], 404);
        }

        $student->update([
            'face_encoding' => json_encode($request->face_encoding),
            'face_confidence' => $request->face_confidence,
            'face_registered_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Face encoding updated successfully',
            'data' => [
                'id' => $student->id,
                'face_confidence' => $student->face_confidence,
                'face_registered_at' => $student->face_registered_at,
            ]
        ]);
    }

    /**
     * Check if a student has a registered face
     */
    public function hasFaceRegistered($id)
    {
        $student = Student::find($id);
        if (!$student) {
            return response()->json([
                'success' => false,
                'message' => 'Student not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'has_face' => !is_null($student->face_encoding),
                'face_confidence' => $student->face_confidence,
                'face_registered_at' => $student->face_registered_at,
            ]
        ]);
    }

    /**
     * Store a newly created student
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'student_id' => 'required|string|unique:students,student_id',
            'course' => 'nullable|string|max:255',
            'year_level' => 'nullable|integer|min:1|max:5',
            'section' => 'nullable|string|max:50',
            'nstp_component_selected' => 'nullable|in:cwts,rotc,lts',
            'contact_number' => 'nullable|string|max:20|unique:users,contact_number',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Create user - REMOVED 'name' field
        $user = User::create([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'student_id' => $request->student_id,
            'role' => 'student',
            'course' => $request->course,
            'year_level' => $request->year_level,
            'section' => $request->section,
            'contact_number' => $request->contact_number,
            'is_active' => true,
        ]);

        // Create student
        $student = Student::create([
            'user_id' => $user->id,
            'student_id' => $request->student_id,
            'course' => $request->course,
            'year_level' => $request->year_level,
            'section' => $request->section,
            'nstp_component_selected' => $request->nstp_component_selected,
            'completion_status' => 'pending',
            'is_eligible_for_completion' => false,
            'total_training_hours' => 0,
            'completed_training_hours' => 0,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Student created successfully',
            'data' => $student->load('user')
        ], 201);
    }


    public function getCourses(Request $request)
    {
        try {
            // Optional: Check if user is authenticated
            if (!$request->user()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 401);
            }

            $courses = Student::whereNotNull('course')
                ->distinct()
                ->orderBy('course')
                ->pluck('course')
                ->toArray();

            // Also get courses from users table if students table doesn't have them
            if (empty($courses)) {
                $courses = User::whereNotNull('course')
                    ->distinct()
                    ->orderBy('course')
                    ->pluck('course')
                    ->toArray();
            }

            // If still empty, provide default options
            if (empty($courses)) {
                $courses = ['BSIT', 'BSCS', 'BSN', 'BSCE', 'BSBA', 'BSIS', 'BSA', 'BSEd', 'BSPsych', 'BSMath'];
            }

            return response()->json([
                'success' => true,
                'data' => $courses
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch courses: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all unique sections from students
     * Accessible by both Admin and Faculty
     */
    public function getSections(Request $request)
    {
        try {
            if (!$request->user()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 401);
            }

            $sections = Student::whereNotNull('section')
                ->distinct()
                ->orderBy('section')
                ->pluck('section')
                ->toArray();

            // Also get sections from users table if students table doesn't have them
            if (empty($sections)) {
                $sections = User::whereNotNull('section')
                    ->distinct()
                    ->orderBy('section')
                    ->pluck('section')
                    ->toArray();
            }

            // If still empty, provide default options
            if (empty($sections)) {
                $sections = ['A', 'B', 'C', 'D', 'E'];
            }

            return response()->json([
                'success' => true,
                'data' => $sections
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch sections: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all unique year levels
     * Accessible by both Admin and Faculty
     */
    public function getYearLevels(Request $request)
    {
        try {
            if (!$request->user()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 401);
            }

            $yearLevels = Student::whereNotNull('year_level')
                ->distinct()
                ->orderBy('year_level')
                ->pluck('year_level')
                ->toArray();

            // If no year levels in students table, get from users
            if (empty($yearLevels)) {
                $yearLevels = User::whereNotNull('year_level')
                    ->distinct()
                    ->orderBy('year_level')
                    ->pluck('year_level')
                    ->toArray();
            }

            // Sort and convert to integers
            sort($yearLevels);
            $yearLevels = array_map('intval', $yearLevels);

            // If still empty, provide default options
            if (empty($yearLevels)) {
                $yearLevels = [1, 2, 3, 4];
            }

            return response()->json([
                'success' => true,
                'data' => $yearLevels
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch year levels: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all unique components
     * Accessible by both Admin and Faculty
     */
    public function getComponents(Request $request)
    {
        try {
            if (!$request->user()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 401);
            }

            $components = Student::whereNotNull('nstp_component_selected')
                ->distinct()
                ->orderBy('nstp_component_selected')
                ->pluck('nstp_component_selected')
                ->toArray();

            // Also get from users
            $userComponents = User::whereNotNull('nstp_component')
                ->distinct()
                ->orderBy('nstp_component')
                ->pluck('nstp_component')
                ->toArray();

            // Merge and get unique values
            $allComponents = array_unique(array_merge($components, $userComponents));
            sort($allComponents);

            // Map to readable labels
            $componentLabels = [
                'cwts' => 'CWTS',
                'rotc' => 'ROTC',
                'lts' => 'LTS',
            ];

            $formattedComponents = array_map(function ($comp) use ($componentLabels) {
                return [
                    'value' => $comp,
                    'label' => $componentLabels[$comp] ?? strtoupper($comp)
                ];
            }, $allComponents);

            // If still empty, provide default options
            if (empty($formattedComponents)) {
                $formattedComponents = [
                    ['value' => 'cwts', 'label' => 'CWTS'],
                    ['value' => 'rotc', 'label' => 'ROTC'],
                    ['value' => 'lts', 'label' => 'LTS'],
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $formattedComponents
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch components: ' . $e->getMessage()
            ], 500);
        }
    }

    // ============================================================
    // EXPORT (full round-trip with all fields)
    // ============================================================
    public function export(Request $request)
    {
        $query = Student::with(['user', 'classes']);

        if ($request->filled('component')) {
            $query->where('nstp_component_selected', $request->component);
        }
        if ($request->filled('status')) {
            $query->where('completion_status', $request->status);
        }
        if ($request->filled('course')) {
            $query->where('course', $request->course);
        }
        if ($request->filled('section')) {
            $query->where('section', $request->section);
        }

        $students = $query->orderBy('student_id')->get();

        // Sort by gender (Male → Female → Other)
        $students = $students->sortBy(function ($student) {
            $g = strtolower($student->gender ?? '');
            if ($g === 'male') return 0;
            if ($g === 'female') return 1;
            return 2;
        })->values();

        $headers = [
            'student_id',
            'first_name',
            'last_name',
            'email',
            'password',
            'course',
            'year_level',
            'section',
            'nstp_component',
            'gender',
            'birth_date',
            'address',
            'contact_number',
            'emergency_contact_name',
            'emergency_contact_number',
            'serial_no',
            'class_code',
            'school_year',
            'completion_status',
            'completed_hours',
            'total_hours',
            'is_eligible',
        ];

        $csv  = chr(239) . chr(187) . chr(191); // BOM
        $csv .= implode(',', $headers) . "\n";

        foreach ($students as $s) {
            $firstClass = $s->classes->first();

            $row = [
                $s->student_id,
                $s->user->first_name ?? '',
                $s->user->last_name ?? '',
                $s->user->email ?? '',
                '', // password intentionally blank in exports
                $s->course ?? '',
                $s->year_level ?? '',
                $s->section ?? '',
                $s->nstp_component_selected ?? '',
                $this->formatGender($s->gender),
                $s->birth_date ? $s->birth_date->format('Y-m-d') : '',
                $this->toUpperCase($s->address ?? ''),
                $s->user->contact_number ?? '',
                $this->toUpperCase($s->emergency_contact_name ?? ''),
                $s->emergency_contact_number ?? '',
                $s->serial_no ?? '',
                $firstClass->class_code ?? '',
                $firstClass->school_year ?? '',
                $s->completion_status ?? '',
                $s->completed_training_hours ?? 0,
                $s->total_training_hours ?? 90,
                $s->is_eligible_for_completion ? 'yes' : 'no',
            ];

            $csv .= implode(',', array_map(function ($v) {
                $v = (string) $v;
                return (str_contains($v, ',') || str_contains($v, '"') || str_contains($v, "\n"))
                    ? '"' . str_replace('"', '""', $v) . '"'
                    : $v;
            }, $row)) . "\n";
        }

        return response($csv)
            ->header('Content-Type', 'text/csv; charset=UTF-8')
            ->header('Content-Disposition', 'attachment; filename="students_' . date('Y-m-d') . '.csv"');
    }

    public function templateCsv()
    {
        $headers = [
            'student_id',
            'class_code',
            'component',
            'section',
            'last_name',
            'first_name',
            'email',
            'course',
            'year_level',
            'gender',
            'birth_date',
            'address',
            'contact_number',
            'emergency_contact_name',
            'emergency_contact_number',
            'serial_no',
            'school_year',
        ];

        $sample = [
            '2024-48213',
            'CLS-000043',
            'cwts',
            'K',
            'ABA',
            'CHANY MAE JEAN',
            'aba.chany7741@gmail.com',
            'BSIT',
            '1',
            'female',
            '2005-05-15',
            'POBLACION, OPOL, MISAMIS ORIENTAL',
            '09171234567',
            'MARIA ABA',
            '09181234567',
            'SN-00001',
            '2025-2026',
        ];

        $csv  = chr(239) . chr(187) . chr(191); // BOM
        $csv .= implode(',', $headers) . "\n";
        $csv .= implode(',', $sample) . "\n";

        return response($csv)
            ->header('Content-Type', 'text/csv; charset=UTF-8')
            ->header('Content-Disposition', 'attachment; filename="students_template.csv"');
    }

    // ============================================================
    // IMPORT
    // ============================================================
    public function import(
        ImportStudentsRequest $request,
        StudentImportService $importer
    ) {
        try {
            $result = $importer->import(
                $request->file('file'),
                $request->input('mode', 'upsert'),
                (bool) $request->input('dry_run', false),
                $request->input('school_year'),
            );

            $message = $request->input('dry_run')
                ? 'Dry-run preview generated.'
                : "Imported: {$result['created']} created, {$result['updated']} updated, {$result['enrolled']} enrolled, {$result['skipped']} skipped.";

            return response()->json([
                'success' => true,
                'dry_run' => (bool) $request->input('dry_run', false),
                'message' => $message,
                'data'    => $result,
            ]);
        } catch (\Throwable $e) {
            Log::error('Student import error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Import failed: ' . $e->getMessage(),
            ], 500);
        }
    }
}