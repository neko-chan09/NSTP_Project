<?php
// app/Http/Controllers/API/Web/Admin/ClassController.php

namespace App\Http\Controllers\API\Web\Admin;

use App\Http\Controllers\Controller;
use App\Models\ClassGroup;
use App\Models\User;
use App\Services\ClassImportService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class ClassController extends Controller
{
    // ============================================================
    // INDEX
    // ============================================================
    public function index(Request $request)
    {
        try {
            $query = ClassGroup::with(['teacher', 'academicYear'])
                ->withCount('students');

            if ($request->user()->role === 'faculty') {
                $query->where('teacher_id', $request->user()->id);
            }

            if ($request->filled('component_type') && $request->component_type !== 'all') {
                $query->where('component_type', $request->component_type);
            }
            if ($request->filled('status') && $request->status !== 'all') {
                $query->where('status', $request->status);
            }
            if ($request->filled('school_year') && $request->school_year !== 'all') {
                $query->where('school_year', $request->school_year);
            }
            if ($request->filled('academic_year_id') && $request->academic_year_id !== 'all') {
                $query->where('academic_year_id', $request->academic_year_id);
            }
            if ($request->filled('search')) {
                $s = $request->search;
                $query->where(function ($q) use ($s) {
                    $q->where('name', 'like', "%{$s}%")
                      ->orWhere('description', 'like', "%{$s}%")
                      ->orWhere('class_code', 'like', "%{$s}%");
                });
            }

            $classes = $query->orderBy('school_year', 'desc')
                ->orderBy('created_at', 'desc')
                ->get();

            $classes->each(function ($class) {
                if ($class->teacher) {
                    $class->teacher->makeHidden(['password', 'remember_token', 'deleted_at']);
                }
            });

            return response()->json(['success' => true, 'data' => $classes]);
        } catch (\Exception $e) {
            Log::error('Error fetching classes: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch classes: ' . $e->getMessage(),
            ], 500);
        }
    }

    // ============================================================
    // STORE — manual class creation
    // ============================================================
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'name'             => 'required|string|max:255',
                'description'      => 'nullable|string',
                'component_type'   => 'required|in:cwts,rotc,lts,all',
                'teacher_id'       => 'nullable|exists:users,id',
                'class_code'       => 'nullable|string|max:50|unique:classes,class_code',
                'school_year'      => 'nullable|string|max:20',
                'academic_year_id' => 'nullable|exists:academic_years,id',
            ]);

            if ($validator->fails()) {
                return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
            }

            // Auto-generate class_code if not provided
            $classCode = $request->class_code;
            if (empty($classCode)) {
                do {
                    $classCode = 'CLS-' . strtoupper(\Illuminate\Support\Str::random(6));
                } while (ClassGroup::where('class_code', $classCode)->exists());
            }

            $class = ClassGroup::create([
                'teacher_id'       => $request->teacher_id ?? $request->user()->id,
                'name'             => $request->name,
                'description'      => $request->description,
                'component_type'   => $request->component_type,
                'class_code'       => $classCode,
                'school_year'      => $request->school_year,
                'academic_year_id' => $request->academic_year_id,
                'status'           => 'active',
            ]);

            $class->load('teacher');

            return response()->json([
                'success' => true,
                'message' => 'Class created successfully',
                'data'    => $class,
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating class: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create class: ' . $e->getMessage(),
            ], 500);
        }
    }

    // ============================================================
    // SHOW
    // ============================================================
    public function show($id)
    {
        try {
            $class = ClassGroup::with(['teacher', 'students.user', 'academicYear'])
                ->withCount('students')
                ->find($id);

            if (!$class) {
                return response()->json(['success' => false, 'message' => 'Class not found'], 404);
            }
            if ($class->teacher) {
                $class->teacher->makeHidden(['password', 'remember_token', 'deleted_at']);
            }

            return response()->json(['success' => true, 'data' => $class]);
        } catch (\Exception $e) {
            Log::error('Error fetching class: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch class: ' . $e->getMessage(),
            ], 500);
        }
    }

    // ============================================================
    // UPDATE
    // ============================================================
    public function update(Request $request, $id)
    {
        try {
            $class = ClassGroup::find($id);
            if (!$class) {
                return response()->json(['success' => false, 'message' => 'Class not found'], 404);
            }

            $validator = Validator::make($request->all(), [
                'name'             => 'sometimes|string|max:255',
                'description'      => 'nullable|string',
                'component_type'   => 'sometimes|in:cwts,rotc,lts,all',
                'status'           => 'sometimes|in:active,archived',
                'teacher_id'       => 'nullable|exists:users,id',
                'class_code'       => 'nullable|string|max:50|unique:classes,class_code,' . $id,
                'school_year'      => 'nullable|string|max:20',
                'academic_year_id' => 'nullable|exists:academic_years,id',
            ]);

            if ($validator->fails()) {
                return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
            }

            $class->update($request->only([
                'name', 'description', 'component_type', 'status',
                'teacher_id', 'class_code', 'school_year', 'academic_year_id',
            ]));

            $class->load('teacher');

            return response()->json([
                'success' => true,
                'message' => 'Class updated successfully',
                'data'    => $class,
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating class: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update class: ' . $e->getMessage(),
            ], 500);
        }
    }

    // ============================================================
    // DESTROY
    // ============================================================
    public function destroy($id)
    {
        return response()->json(['message' => 'Class deletion is disabled. Archive the class instead.'], 405);
    }

    // ============================================================
    // TOGGLE ARCHIVE
    // ============================================================
    public function toggleArchive($id)
    {
        try {
            $class = ClassGroup::find($id);
            if (!$class) {
                return response()->json(['success' => false, 'message' => 'Class not found'], 404);
            }
            $class->status = $class->status === 'active' ? 'archived' : 'active';
            $class->save();
            return response()->json([
                'success' => true,
                'message' => 'Class status updated',
                'data'    => $class,
            ]);
        } catch (\Exception $e) {
            Log::error('Error toggling archive: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update class status: ' . $e->getMessage(),
            ], 500);
        }
    }

    // ============================================================
    // STUDENTS
    // ============================================================
    public function getStudents($id)
    {
        try {
            $class = ClassGroup::with(['students.user'])->find($id);
            if (!$class) {
                return response()->json(['success' => false, 'message' => 'Class not found'], 404);
            }

            $students = $class->students()->with('user')->get()->map(function ($s) {
                return [
                    'id'         => $s->id,
                    'student_id' => $s->student_id,
                    'user'       => [
                        'first_name' => $s->user->first_name ?? '',
                        'last_name'  => $s->user->last_name ?? '',
                        'email'      => $s->user->email ?? '',
                    ],
                    'course'     => $s->course,
                    'year_level' => $s->year_level,
                    'section'    => $s->section,
                ];
            });

            return response()->json(['success' => true, 'data' => $students]);
        } catch (\Exception $e) {
            Log::error('Error fetching students: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch students: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function addStudents(Request $request, $id)
    {
        try {
            $class = ClassGroup::find($id);
            if (!$class) {
                return response()->json(['success' => false, 'message' => 'Class not found'], 404);
            }
            $validator = Validator::make($request->all(), [
                'student_ids'   => 'required|array',
                'student_ids.*' => 'exists:students,id',
            ]);
            if ($validator->fails()) {
                return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
            }
            $class->students()->syncWithoutDetaching($request->student_ids);
            return response()->json([
                'success' => true,
                'message' => 'Students added successfully',
                'data'    => $class->students()->get(),
            ]);
        } catch (\Exception $e) {
            Log::error('Error adding students: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to add students: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function removeStudent($classId, $studentId)
    {
        try {
            $class = ClassGroup::find($classId);
            if (!$class) {
                return response()->json(['success' => false, 'message' => 'Class not found'], 404);
            }
            $class->students()->detach($studentId);
            return response()->json(['success' => true, 'message' => 'Student removed from class']);
        } catch (\Exception $e) {
            Log::error('Error removing student: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to remove student: ' . $e->getMessage(),
            ], 500);
        }
    }

    // ============================================================
    // FACULTY LIST
    // ============================================================
    public function getFaculty()
    {
        try {
            $faculty = User::where('role', 'faculty')
                ->select('id', 'first_name', 'last_name', 'email', 'nstp_component')
                ->orderBy('first_name')
                ->get();
            return response()->json(['success' => true, 'data' => $faculty]);
        } catch (\Exception $e) {
            Log::error('Error fetching faculty: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch faculty: ' . $e->getMessage(),
            ], 500);
        }
    }

    // ============================================================
    // EXPORT
    // ============================================================
    public function exportCsv(Request $request)
    {
        try {
            $query = ClassGroup::with(['teacher']);
            if ($request->filled('school_year') && $request->school_year !== 'all') {
                $query->where('school_year', $request->school_year);
            }
            if ($request->filled('component_type') && $request->component_type !== 'all') {
                $query->where('component_type', $request->component_type);
            }
            if ($request->filled('status') && $request->status !== 'all') {
                $query->where('status', $request->status);
            }

            $classes = $query->orderBy('class_code')->get();

            $headers = [
                'class_code', 'component', 'section', 'school_year',
                'class_name', 'last_name', 'first_name', 'email',
                'students_count', 'status',
            ];

            $csv = implode(',', $headers) . "\n";
            foreach ($classes as $cls) {
                $section = '';
                if (preg_match('/Section\s+([A-Z0-9]+)/i', $cls->name, $m)) {
                    $section = $m[1];
                }
                $row = [
                    $cls->class_code ?? '',
                    $cls->component_type ?? '',
                    $section,
                    $cls->school_year ?? '',
                    $cls->name ?? '',
                    $cls->teacher->last_name ?? '',
                    $cls->teacher->first_name ?? '',
                    $cls->teacher->email ?? '',
                    $cls->students()->count(),
                    $cls->status ?? '',
                ];
                $csv .= implode(',', array_map(function ($v) {
                    $v = (string) $v;
                    return (str_contains($v, ',') || str_contains($v, '"'))
                        ? '"' . str_replace('"', '""', $v) . '"'
                        : $v;
                }, $row)) . "\n";
            }

            $bom = chr(239) . chr(187) . chr(191);
            return response($bom . $csv)
                ->header('Content-Type', 'text/csv; charset=UTF-8')
                ->header('Content-Disposition', 'attachment; filename="classes_' . date('Y-m-d') . '.csv"');
        } catch (\Exception $e) {
            Log::error('Class CSV export error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function schoolYears(Request $request)
    {
        $years = ClassGroup::query()
            ->whereNotNull('school_year')
            ->distinct()
            ->orderBy('school_year', 'desc')
            ->pluck('school_year');
        return response()->json(['success' => true, 'data' => $years]);
    }
}