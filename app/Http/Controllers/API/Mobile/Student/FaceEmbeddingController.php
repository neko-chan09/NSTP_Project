<?php
// app/Http/Controllers/API/Mobile/Student/FaceEmbeddingController.php

namespace App\Http\Controllers\API\Mobile\Student;

use App\Http\Controllers\Controller;
use App\Models\FaceEmbedding;
use App\Services\FaceMatchingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class FaceEmbeddingController extends Controller
{
    protected FaceMatchingService $matching;

    public function __construct(FaceMatchingService $matching)
    {
        $this->matching = $matching;
    }

    /**
     * POST /api/student/face-embeddings
     * Stores 3 pose embeddings for the authenticated student.
     */
    public function store(Request $request)
    {
        $size = (int) config('face.embedding_size', 192);

        $validator = Validator::make($request->all(), [
            'embeddings' => 'required|array',
            'embeddings.front' => "required|array|size:{$size}",
            'embeddings.left'  => "required|array|size:{$size}",
            'embeddings.right' => "required|array|size:{$size}",
            'embeddings.front.*' => 'numeric',
            'embeddings.left.*'  => 'numeric',
            'embeddings.right.*' => 'numeric',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $student = $request->user()->student;
        if (!$student) {
            return response()->json([
                'success' => false,
                'message' => 'Student profile not found',
            ], 404);
        }

        try {
            DB::transaction(function () use ($student, $request) {
                // Replace old embeddings
                FaceEmbedding::where('student_id', $student->id)->delete();

                foreach (['front', 'left', 'right'] as $pose) {
                    $raw = $request->input("embeddings.{$pose}");
                    $normalized = $this->matching->l2Normalize(
                        array_map('floatval', $raw)
                    );

                    FaceEmbedding::create([
                        'student_id' => $student->id,
                        'pose' => $pose,
                        'embedding' => $normalized,
                        'confidence' => 1.0,
                    ]);
                }
            });

            return response()->json([
                'success' => true,
                'message' => 'Face registered successfully',
                'data' => [
                    'registered_at' => now()->toIso8601String(),
                    'poses_stored' => ['front', 'left', 'right'],
                ],
            ]);
        } catch (\Throwable $e) {
            Log::error('face_embeddings.store failed', [
                'student_id' => $student->id,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to store face embeddings',
            ], 500);
        }
    }

    /**
     * GET /api/student/face-status
     */
    public function status(Request $request)
    {
        $student = $request->user()->student;
        if (!$student) {
            return response()->json(['success' => false, 'message' => 'Student not found'], 404);
        }

        $count = FaceEmbedding::where('student_id', $student->id)->count();
        $latest = FaceEmbedding::where('student_id', $student->id)
            ->orderByDesc('updated_at')
            ->first();

        return response()->json([
            'success' => true,
            'data' => [
                'has_face' => $count >= 3,
                'registered_at' => $latest?->updated_at?->toIso8601String(),
                'poses_count' => $count,
            ],
        ]);
    }

    /**
     * DELETE /api/student/face-embeddings
     */
    public function destroy(Request $request)
    {
        $student = $request->user()->student;
        if (!$student) {
            return response()->json(['success' => false, 'message' => 'Student not found'], 404);
        }

        FaceEmbedding::where('student_id', $student->id)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Face data cleared. Please re-register.',
        ]);
    }
}