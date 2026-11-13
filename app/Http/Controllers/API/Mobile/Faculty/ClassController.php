<?php
// app/Http/Controllers/API/Mobile/Faculty/ClassController.php

namespace App\Http\Controllers\API\Mobile\Faculty;

use App\Http\Controllers\Controller;
use App\Models\ClassGroup;
use App\Models\LearningMaterial;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class ClassController extends Controller
{
    public function index(Request $request)
    {
        try {
            $teacher = $request->user();
            $classes = ClassGroup::where('teacher_id', $teacher->id)
                ->with('teacher')
                ->withCount('students')
                ->orderBy('created_at', 'desc')
                ->get();
            return response()->json(['success' => true, 'data' => $classes]);
        } catch (\Exception $e) {
            Log::error('Error fetching classes: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch classes: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function show(Request $request, $id)
{
    try {
        $teacher = $request->user();
        if ($teacher->role !== 'faculty') {
            return response()->json(['message' => 'Faculty access required'], 403);
        }

        $class = ClassGroup::where('id', $id)
            ->where('teacher_id', $teacher->id)
            ->with(['teacher', 'students.user', 'academicYear'])
            ->withCount('students')
            ->first();

        if (!$class) {
            return response()->json(['message' => 'Class not found or not yours'], 404);
        }

        // Ensure class_code and school_year are explicitly present
        $class->makeVisible(['class_code', 'school_year', 'academic_year_id']);

        return response()->json(['success' => true, 'data' => $class]);
    } catch (\Exception $e) {
        Log::error('Error showing class: ' . $e->getMessage());
        return response()->json([
            'success' => false,
            'message' => 'Failed to load class: ' . $e->getMessage(),
        ], 500);
    }
}
    public function store(Request $request)
    {
        try {
            $teacher = $request->user();
            $validator = Validator::make($request->all(), [
                'name'           => 'required|string|max:255',
                'description'    => 'nullable|string',
                'component_type' => 'nullable|in:cwts,rotc,lts,all',
                'class_code'     => 'nullable|string|max:50|unique:classes,class_code',
                'school_year'    => 'nullable|string|max:20',
            ]);
            if ($validator->fails()) {
                return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
            }

            $classCode = $request->class_code;
            if (empty($classCode)) {
                do {
                    $classCode = 'CLS-' . strtoupper(\Illuminate\Support\Str::random(6));
                } while (ClassGroup::where('class_code', $classCode)->exists());
            }

            $class = ClassGroup::create([
                'teacher_id'     => $teacher->id,
                'name'           => $request->name,
                'description'    => $request->description,
                'component_type' => $request->input('component_type', 'all'),
                'class_code'     => $classCode,
                'school_year'    => $request->school_year,
                'status'         => 'active',
            ]);

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

    public function update(Request $request, $id)
    {
        try {
            $teacher = $request->user();
            $class = ClassGroup::where('id', $id)->where('teacher_id', $teacher->id)->first();
            if (!$class) {
                return response()->json(['message' => 'Class not found or not yours'], 404);
            }
            $validator = Validator::make($request->all(), [
                'name'           => 'sometimes|string|max:255',
                'description'    => 'nullable|string',
                'component_type' => 'nullable|in:cwts,rotc,lts,all',
                'class_code'     => 'nullable|string|max:50|unique:classes,class_code,' . $id,
                'school_year'    => 'nullable|string|max:20',
            ]);
            if ($validator->fails()) {
                return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
            }

            $class->update($request->only([
                'name', 'description', 'component_type', 'class_code', 'school_year',
            ]));

            return response()->json([
                'success' => true,
                'message' => 'Class updated',
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

    public function archive(Request $request, $id)
    {
        try {
            $teacher = $request->user();
            $class = ClassGroup::where('id', $id)->where('teacher_id', $teacher->id)->first();
            if (!$class) {
                return response()->json(['message' => 'Class not found or not yours'], 404);
            }
            $class->status = $class->status === 'active' ? 'archived' : 'active';
            $class->save();
            return response()->json(['success' => true, 'message' => 'Class status updated', 'data' => $class]);
        } catch (\Exception $e) {
            Log::error('Error toggling archive: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update class status: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function destroy(Request $request, $id)
    {
        return response()->json(['message' => 'Class deletion is disabled. Archive the class instead.'], 405);
    }

    public function students(Request $request, $id)
    {
        try {
            $teacher = $request->user();
            $class = ClassGroup::where('id', $id)->where('teacher_id', $teacher->id)->first();
            if (!$class) {
                return response()->json(['message' => 'Class not found or not yours'], 404);
            }
            $students = $class->students()->with('user')->get();
            return response()->json(['success' => true, 'data' => $students]);
        } catch (\Exception $e) {
            Log::error('Error fetching students: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch students: ' . $e->getMessage(),
            ], 500);
        }
    }

    // NOTE: regenerateCode() method REMOVED — no more join_code concept.
}