<?php
// app/Http/Controllers/API/Web/Admin/StudentImportController.php

namespace App\Http\Controllers\API\Web\Admin;

use App\Http\Controllers\Controller;
use App\Models\ImportBatch;
use App\Services\StudentImportService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class StudentImportController extends Controller
{
    public function __construct(protected StudentImportService $service) {}

    // ------------------------------------------------------------
    // Start a new import — parse + create batch — returns batch_id
    // ------------------------------------------------------------
    public function start(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file'        => 'required|file|mimes:csv,txt|max:51200', // 50 MB
            'mode'        => 'nullable|in:create,update,upsert',
            'school_year' => 'nullable|string|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors(),
            ], 422);
        }

        try {
            $batch = $this->service->beginBatch(
                $request->file('file'),
                $request->input('mode', 'upsert'),
                false,
                $request->input('school_year'),
                $request->user()->id
            );

            return response()->json([
                'success'    => true,
                'batch_id'   => $batch->id,
                'batch_code' => $batch->batch_code,
                'total_rows' => $batch->total_rows,
                'message'    => "Parsed {$batch->total_rows} rows. Ready to process.",
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to start import: ' . $e->getMessage(),
            ], 500);
        }
    }

    // ------------------------------------------------------------
    // Process the next chunk synchronously
    // ------------------------------------------------------------
    public function processChunk(Request $request, $id)
    {
        $batch = ImportBatch::find($id);
        if (!$batch) {
            return response()->json(['success' => false, 'message' => 'Batch not found'], 404);
        }

        $user = $request->user();
        if ($batch->user_id && $batch->user_id !== $user->id && !in_array($user->role, ['admin', 'super_admin'])) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        if (!$batch->is_running) {
            return response()->json([
                'success' => true,
                'data'    => $this->service->batchStatusPayload($batch),
                'message' => 'Batch already finished',
            ]);
        }

        $chunkSize = (int) $request->input('chunk_size', 50);
        $chunkSize = max(1, min($chunkSize, 200)); // clamp 1..200

        try {
            $payload = $this->service->processChunk($batch, $chunkSize);
            return response()->json([
                'success' => true,
                'data'    => $payload,
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('processChunk failed', [
                'batch_id' => $batch->id,
                'error'    => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Chunk failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    // ------------------------------------------------------------
    // Read current status
    // ------------------------------------------------------------
    public function status(Request $request, $id)
    {
        $batch = ImportBatch::find($id);
        if (!$batch) {
            return response()->json(['success' => false, 'message' => 'Batch not found'], 404);
        }

        $user = $request->user();
        if ($batch->user_id && $batch->user_id !== $user->id && !in_array($user->role, ['admin', 'super_admin'])) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        return response()->json([
            'success' => true,
            'data'    => $this->service->batchStatusPayload($batch),
        ]);
    }

    // ------------------------------------------------------------
    // Cancel a running batch
    // ------------------------------------------------------------
    public function cancel(Request $request, $id)
    {
        $batch = ImportBatch::find($id);
        if (!$batch) {
            return response()->json(['success' => false, 'message' => 'Batch not found'], 404);
        }

        $user = $request->user();
        if ($batch->user_id && $batch->user_id !== $user->id && !in_array($user->role, ['admin', 'super_admin'])) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        if (!$batch->is_running) {
            return response()->json(['success' => false, 'message' => 'Batch is not running'], 400);
        }

        $batch->update([
            'status'      => 'cancelled',
            'finished_at' => now(),
        ]);

        return response()->json(['success' => true, 'message' => 'Batch cancelled']);
    }

    // ------------------------------------------------------------
    // History
    // ------------------------------------------------------------
    public function history(Request $request)
    {
        $query = ImportBatch::where('type', 'student')
            ->orderBy('created_at', 'desc')
            ->limit(20);

        $user = $request->user();
        if (!in_array($user->role, ['admin', 'super_admin'])) {
            $query->where('user_id', $user->id);
        }

        $batches = $query->get()->map(fn ($b) => [
            'id'                => $b->id,
            'batch_code'        => $b->batch_code,
            'status'            => $b->status,
            'progress_percent'  => $b->progress_percent,
            'total_rows'        => $b->total_rows,
            'processed_rows'    => $b->processed_rows,
            'created_count'     => $b->created_count,
            'updated_count'     => $b->updated_count,
            'enrolled_count'    => $b->enrolled_count,
            'skipped_count'     => $b->skipped_count,
            'original_filename' => $b->original_filename,
            'created_at'        => $b->created_at->toIso8601String(),
            'finished_at'       => $b->finished_at?->toIso8601String(),
        ]);

        return response()->json(['success' => true, 'data' => $batches]);
    }
}