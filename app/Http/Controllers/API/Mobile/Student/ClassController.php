<?php
// app/Http/Controllers/API/Mobile/Student/ClassController.php

namespace App\Http\Controllers\API\Mobile\Student;

use App\Http\Controllers\Controller;
use App\Models\ClassGroup;
use App\Models\LearningMaterial;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class ClassController extends Controller
{
    // ============================================================
    // MY CLASSES
    // ============================================================
    public function myClasses(Request $request)
    {
        try {
            $student = $request->user()->student;
            if (!$student) {
                return response()->json(['success' => false, 'message' => 'Student profile not found'], 404);
            }

            $classes = $student->classes()
                ->with('teacher')
                ->withCount(['students' => function ($query) {
                    $query->where('class_students.status', 'active');
                }])
                ->orderBy('classes.created_at', 'desc')
                ->select('classes.*')
                ->get();

            return response()->json(['success' => true, 'data' => $classes]);
        } catch (\Exception $e) {
            Log::error('Error fetching student classes: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch classes: ' . $e->getMessage(),
            ], 500);
        }
    }

    // ============================================================
    // SHOW CLASS
    // ============================================================
    public function show(Request $request, $id)
    {
        try {
            $student = $request->user()->student;
            if (!$student) {
                return response()->json(['success' => false, 'message' => 'Student profile not found'], 404);
            }

            $class = ClassGroup::where('id', $id)
                ->whereHas('students', function ($query) use ($student) {
                    $query->where('students.id', $student->id)
                          ->where('class_students.status', 'active');
                })
                ->with(['teacher', 'students' => function ($query) {
                    $query->where('class_students.status', 'active')->with('user');
                }])
                ->first();

            if (!$class) {
                return response()->json(['success' => false, 'message' => 'Class not found'], 404);
            }

            return response()->json(['success' => true, 'data' => $class]);
        } catch (\Exception $e) {
            Log::error('Error showing student class: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to load class: ' . $e->getMessage(),
            ], 500);
        }
    }

    // ============================================================
    // MATERIALS LIST
    // ============================================================
    public function materials(Request $request, $classId)
    {
        try {
            $student = $request->user()->student;
            if (!$student) {
                return response()->json(['success' => false, 'message' => 'Student profile not found'], 404);
            }

            $class = ClassGroup::where('id', $classId)
                ->whereHas('students', function ($query) use ($student) {
                    $query->where('students.id', $student->id)
                          ->where('class_students.status', 'active');
                })
                ->first();

            if (!$class) {
                return response()->json(['success' => false, 'message' => 'Class not found'], 404);
            }

            $materials = $class->materials()
                ->with('creator')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json(['success' => true, 'data' => $materials]);
        } catch (\Exception $e) {
            Log::error('Error fetching materials: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch materials: ' . $e->getMessage(),
            ], 500);
        }
    }

    // ============================================================
    // DOWNLOAD MATERIAL (STUDENT)
    // ============================================================
    public function downloadMaterial(Request $request, $materialId)
    {
        try {
            $student = $request->user()->student;
            if (!$student) {
                return response()->json(['success' => false, 'message' => 'Student profile not found'], 404);
            }

            $material = LearningMaterial::find($materialId);
            if (!$material) {
                return response()->json(['success' => false, 'message' => 'Material not found'], 404);
            }

            // Student must be enrolled in the class that owns this material
            $class = $material->classGroup;
            if (!$class || !$class->students()->where('students.id', $student->id)->exists()) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }

            $filePath = Storage::disk('public')->path($material->file_path);
            if (!file_exists($filePath)) {
                return response()->json(['success' => false, 'message' => 'File not found on storage'], 404);
            }

            $mime = $this->resolveMime($material->file_name, $material->file_type);
            $size = filesize($filePath);
            $safe = $this->asciiFallbackName($material->file_name);

            return response()->streamDownload(function () use ($filePath) {
                $handle = fopen($filePath, 'rb');
                if ($handle === false) {
                    return;
                }
                fpassthru($handle);
                fclose($handle);
            }, $material->file_name, [
                'Content-Type' => $mime,
                'Content-Length' => (string) $size,
                'Content-Disposition' => sprintf(
                    'attachment; filename="%s"; filename*=UTF-8\'\'%s',
                    $safe,
                    rawurlencode($material->file_name)
                ),
                'Accept-Ranges' => 'bytes',
                'Cache-Control' => 'no-cache, must-revalidate',
                'Pragma' => 'no-cache',
                'Expires' => '0',
                'X-Content-Type-Options' => 'nosniff',
            ]);
        } catch (\Exception $e) {
            Log::error('Error downloading material: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to download: ' . $e->getMessage(),
            ], 500);
        }
    }

    // ============================================================
    // HELPERS
    // ============================================================
    private function resolveMime(string $fileName, ?string $serverMime): string
    {
        $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

        $map = [
            'pdf'  => 'application/pdf',
            'doc'  => 'application/msword',
            'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'ppt'  => 'application/vnd.ms-powerpoint',
            'pptx' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'xls'  => 'application/vnd.ms-excel',
            'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'csv'  => 'text/csv',
            'txt'  => 'text/plain',
            'jpg'  => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png'  => 'image/png',
            'gif'  => 'image/gif',
            'webp' => 'image/webp',
            'zip'  => 'application/zip',
            'rar'  => 'application/vnd.rar',
            'mp4'  => 'video/mp4',
            'mp3'  => 'audio/mpeg',
        ];

        if (isset($map[$ext])) return $map[$ext];
        if (!empty($serverMime) && $serverMime !== 'application/octet-stream') return $serverMime;
        return 'application/octet-stream';
    }

    private function asciiFallbackName(string $fileName): string
    {
        $ascii = preg_replace('/[^\x20-\x7E]/', '_', $fileName);
        return $ascii !== '' ? $ascii : 'file';
    }
}