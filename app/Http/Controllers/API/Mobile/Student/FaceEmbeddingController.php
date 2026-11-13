<?php
// app/Http/Controllers/API/Mobile/Student/FaceEmbeddingController.php

namespace App\Http\Controllers\API\Mobile\Student;

use App\Http\Controllers\Controller;
use App\Models\FaceEmbedding;
use App\Services\FaceMatchingService;
use Illuminate\Database\QueryException;
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
     * One-time registration. Returns 409 if the student already has a face.
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

        foreach (['front', 'left', 'right'] as $pose) {
            if (!FaceMatchingService::validVector($request->input("embeddings.{$pose}"))) {
                return response()->json(['message' => 'A face capture is invalid. Please scan all three poses again.'], 422);
            }
        }

        $student = $request->user()->student;
        if (!$student) {
            return response()->json([
                'success' => false,
                'message' => 'Student profile not found',
            ], 404);
        }

        $alreadyRegistered = false;

        try {
            DB::transaction(function () use ($student, $request, &$alreadyRegistered) {
                // Lock any existing rows so concurrent requests can't both pass.
                $exists = FaceEmbedding::where('student_id', $student->id)
                    ->lockForUpdate()
                    ->exists();

                if ($exists) {
                    $alreadyRegistered = true;
                    return;
                }

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
        } catch (QueryException $e) {
            // Unique (student_id, pose) violated by a simultaneous request
            if (($e->errorInfo[0] ?? null) === '23000') {
                $alreadyRegistered = true;
            } else {
                Log::error('face_embeddings.store failed', [
                    'student_id' => $student->id,
                    'error' => $e->getMessage(),
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to store face embeddings',
                ], 500);
            }
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

        if ($alreadyRegistered) {
            return response()->json([
                'success' => false,
                'message' => 'Face already registered. Contact your admin to reset it.',
            ], 409);
        }

        return response()->json([
            'success' => true,
            'message' => 'Face registered successfully',
            'data' => [
                'registered_at' => now()->toIso8601String(),
                'poses_stored' => ['front', 'left', 'right'],
            ],
        ]);
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

    public function template(Request $request)
    {
        $student = $request->user()->student;
        abort_unless($student, 404);
        $stored = FaceEmbedding::where('student_id', $student->id)->get()->keyBy('pose');
        $data = [];
        foreach (['front', 'left', 'right'] as $pose) {
            $vector = $stored->get($pose)?->embedding;
            if (!is_array($vector) || count($vector) !== (int) config('face.embedding_size', 192)) {
                return response()->json(['message' => 'A complete face template is not registered.'], 404)->header('Cache-Control', 'no-store');
            }
            $data[$pose] = array_map('floatval', $vector);
        }
        return response()->json(['data' => $data])->header('Cache-Control', 'private, no-store');
    }

    // NOTE: the student-facing destroy() was removed on purpose.
    // Resetting a face is admin-only (see AdminFaceResetController).
}
