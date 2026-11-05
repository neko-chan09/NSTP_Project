<?php

namespace App\Http\Controllers\API\Mobile\Faculty;

use App\Http\Controllers\Controller;
use App\Models\LearningMaterial;
use App\Models\ClassGroup;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class LearningMaterialController extends Controller
{
    // ============================================================
    // ALLOWED UPLOAD TYPES
    // ============================================================
    private const ALLOWED_MIMES = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/csv',
        'text/plain',
        'application/csv',
        'application/vnd.ms-excel',
    ];

    private const ALLOWED_EXTENSIONS = [
        'pdf', 'doc', 'docx',
        'ppt', 'pptx',
        'csv', 'txt',
    ];

    // ============================================================
    // INDEX — list materials for a class owned by this faculty
    // ============================================================
    public function index(Request $request, $classId)
    {
        $teacher = $request->user();
        $class = ClassGroup::where('id', $classId)
            ->where('teacher_id', $teacher->id)
            ->first();

        if (!$class) {
            return response()->json(['message' => 'Class not found or not yours'], 404);
        }

        $materials = $class->materials()->orderBy('created_at', 'desc')->get();

        return response()->json(['success' => true, 'data' => $materials]);
    }

    // ============================================================
    // STORE — upload a single material
    // ============================================================
    public function store(Request $request, $classId)
    {
        try {
            $teacher = $request->user();
            $class = ClassGroup::where('id', $classId)
                ->where('teacher_id', $teacher->id)
                ->first();

            if (!$class) {
                return response()->json(['message' => 'Class not found or not yours'], 404);
            }

            Log::info('Material upload attempt', [
                'class_id' => $classId,
                'user_id' => $teacher->id,
            ]);

            $validator = Validator::make($request->all(), [
                'title'       => 'required|string|max:255',
                'description' => 'nullable|string',
                'topic'       => 'nullable|string|max:100',
                'file'        => 'required|file|max:10240',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $file = $request->file('file');
            if (!$file) {
                return response()->json(['message' => 'No file uploaded'], 422);
            }

            $ext = strtolower($file->getClientOriginalExtension());
            $mime = strtolower($file->getMimeType() ?: '');

            $extOk  = in_array($ext, self::ALLOWED_EXTENSIONS, true);
            $mimeOk = in_array($mime, self::ALLOWED_MIMES, true);

            if (!$extOk && !$mimeOk) {
                return response()->json([
                    'message' => 'Unsupported file type. Allowed: PDF, DOC/DOCX, PPT/PPTX, CSV.',
                    'detected' => ['extension' => $ext, 'mime' => $mime],
                ], 422);
            }

            $fileName = time() . '_' . preg_replace('/[^A-Za-z0-9._-]/', '_', $file->getClientOriginalName());
            $filePath = $file->storeAs('learning_materials/' . $classId, $fileName, 'public');

            $material = LearningMaterial::create([
                'class_id'    => $classId,
                'title'       => $request->title,
                'description' => $request->description,
                'file_path'   => $filePath,
                'file_name'   => $file->getClientOriginalName(),
                'file_type'   => $mime ?: 'application/octet-stream',
                'file_size'   => $file->getSize(),
                'topic'       => $request->topic,
                'created_by'  => $teacher->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Material uploaded',
                'data'    => $material,
            ], 201);
        } catch (\Exception $e) {
            Log::error('Material upload error: ' . $e->getMessage());
            return response()->json(['message' => 'Server error: ' . $e->getMessage()], 500);
        }
    }

    // ============================================================
    // STORE BULK — upload several materials in one request
    // Expects: topic?, description?, files[i], metadata[i][title],
    //          metadata[i][description]?
    // ============================================================
    public function storeBulk(Request $request, $classId)
    {
        $teacher = $request->user();
        $class = ClassGroup::where('id', $classId)
            ->where('teacher_id', $teacher->id)
            ->first();

        if (!$class) {
            return response()->json(['message' => 'Class not found or not yours'], 404);
        }

        $validator = Validator::make($request->all(), [
            'topic'                    => 'nullable|string|max:100',
            'description'              => 'nullable|string',
            'files'                    => 'required|array|min:1|max:20',
            'files.*'                  => 'required|file|max:10240',
            'metadata'                 => 'required|array',
            'metadata.*.title'         => 'required|string|max:255',
            'metadata.*.description'   => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => $validator->errors()->first(),
                'errors'  => $validator->errors(),
            ], 422);
        }

        $files    = $request->file('files', []);
        $metadata = $request->input('metadata', []);

        // Check every file type before storing anything
        foreach ($files as $i => $file) {
            $ext  = strtolower($file->getClientOriginalExtension());
            $mime = strtolower($file->getMimeType() ?: '');

            if (!in_array($ext, self::ALLOWED_EXTENSIONS, true)
                && !in_array($mime, self::ALLOWED_MIMES, true)) {
                return response()->json([
                    'message' => 'Unsupported file type for "' . $file->getClientOriginalName()
                        . '". Allowed: PDF, DOC/DOCX, PPT/PPTX, CSV, TXT.',
                ], 422);
            }
        }

        $storedPaths = [];

        try {
            $created = DB::transaction(function () use ($files, $metadata, $request, $classId, $teacher, &$storedPaths) {
                $out = [];

                foreach ($files as $i => $file) {
                    $mime     = strtolower($file->getMimeType() ?: '');
                    $fileName = time() . '_' . $i . '_' . preg_replace('/[^A-Za-z0-9._-]/', '_', $file->getClientOriginalName());
                    $filePath = $file->storeAs('learning_materials/' . $classId, $fileName, 'public');
                    $storedPaths[] = $filePath;

                    $meta = $metadata[$i] ?? [];
                    $desc = !empty($meta['description']) ? $meta['description'] : $request->input('description');

                    $out[] = LearningMaterial::create([
                        'class_id'    => $classId,
                        'title'       => $meta['title'],
                        'description' => $desc,
                        'file_path'   => $filePath,
                        'file_name'   => $file->getClientOriginalName(),
                        'file_type'   => $mime ?: 'application/octet-stream',
                        'file_size'   => $file->getSize(),
                        'topic'       => $request->input('topic'),
                        'created_by'  => $teacher->id,
                    ]);
                }

                return $out;
            });
        } catch (\Throwable $e) {
            // Remove any files already written so nothing is left orphaned
            foreach ($storedPaths as $path) {
                Storage::disk('public')->delete($path);
            }
            Log::error('Bulk material upload error: ' . $e->getMessage());
            return response()->json(['message' => 'Server error: ' . $e->getMessage()], 500);
        }

        return response()->json([
            'success' => true,
            'message' => count($created) . ' material(s) uploaded',
            'data'    => $created,
        ], 201);
    }

    // ============================================================
    // UPDATE
    // ============================================================
    public function update(Request $request, $id)
    {
        $teacher = $request->user();
        $material = LearningMaterial::where('id', $id)
            ->whereHas('classGroup', function ($query) use ($teacher) {
                $query->where('teacher_id', $teacher->id);
            })
            ->first();

        if (!$material) {
            return response()->json(['message' => 'Material not found or not yours'], 404);
        }

        $validator = Validator::make($request->all(), [
            'title'       => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'topic'       => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $material->update($request->only(['title', 'description', 'topic']));

        return response()->json([
            'success' => true,
            'message' => 'Material updated',
            'data'    => $material->fresh(),
        ]);
    }

    // ============================================================
    // DOWNLOAD (FACULTY)
    // ============================================================
    public function download(Request $request, $materialId)
    {
        $teacher = $request->user();

        $material = LearningMaterial::where('id', $materialId)
            ->whereHas('classGroup', function ($query) use ($teacher) {
                $query->where('teacher_id', $teacher->id);
            })
            ->first();

        if (!$material) {
            return response()->json(['message' => 'Material not found or not yours'], 404);
        }

        $filePath = Storage::disk('public')->path($material->file_path);
        if (!file_exists($filePath)) {
            return response()->json(['message' => 'File not found on storage'], 404);
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
    }

    // ============================================================
    // DESTROY
    // ============================================================
    public function destroy(Request $request, $id)
    {
        $teacher = $request->user();
        $material = LearningMaterial::where('id', $id)
            ->whereHas('classGroup', function ($query) use ($teacher) {
                $query->where('teacher_id', $teacher->id);
            })
            ->first();

        if (!$material) {
            return response()->json(['message' => 'Material not found or not yours'], 404);
        }

        if (Storage::disk('public')->exists($material->file_path)) {
            Storage::disk('public')->delete($material->file_path);
        }

        $material->delete();

        return response()->json(['success' => true, 'message' => 'Material deleted']);
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