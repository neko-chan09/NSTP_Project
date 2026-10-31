<?php

namespace App\Http\Controllers\API\Web\Admin;

use App\Http\Controllers\Controller;
use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Helpers\NotificationHelper;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;


class DocumentController extends Controller
{

public function download($id)
{
    $document = Document::find($id);
    if (!$document) {
        return response()->json(['message' => 'Document not found'], 404);
    }

    if (!Storage::disk('public')->exists($document->file_path)) {
        return response()->json(['message' => 'File not found'], 404);
    }

    $file = Storage::disk('public')->get($document->file_path);
    $mimeType = Storage::disk('public')->mimeType($document->file_path);

    return response($file, 200)
        ->header('Content-Type', $mimeType)
        ->header('Content-Disposition', 'attachment; filename="' . $document->file_name . '"')
        ->header('Access-Control-Allow-Origin', '*')
        ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}
    public function index()
    {
        $documents = Document::with('student.user')->get();
        return response()->json(['success' => true, 'data' => $documents]);
    }

   public function verify(Request $request, $id)
{
    $document = Document::find($id);
    if (!$document) {
        return response()->json(['message' => 'Document not found'], 404);
    }

    $validator = Validator::make($request->all(), [
        'status' => 'required|in:approved,rejected',
        'rejection_reason' => 'required_if:status,rejected|nullable|string',
    ]);

    if ($validator->fails()) {
        return response()->json(['errors' => $validator->errors()], 422);
    }

    $document->update([
        'status' => $request->status,
        'verified_by' => $request->user()->id,
        'verified_at' => now(),
        'rejection_reason' => $request->status === 'rejected' ? $request->rejection_reason : null,
    ]);

    // Send notification if student exists
    try {
        $student = $document->student;
        if ($student) {
            $type = $document->document_type;
            $status = $request->status;
            $title = $status === 'approved' ? 'Document Approved' : 'Document Rejected';
            $message = $status === 'approved'
                ? "Your {$type} has been approved."
                : "Your {$type} was rejected. Reason: " . ($document->rejection_reason ?? 'No reason provided.');
            NotificationHelper::sendToStudent(
                $student,
                $title,
                $message,
                'document',
                ['id' => $document->id]
            );
        }
    } catch (\Exception $e) {
        Log::error('Notification failed for document ' . $id . ': ' . $e->getMessage());
        // Verification still succeeds, notification is best-effort
    }

    return response()->json(['success' => true, 'message' => 'Document verified', 'data' => $document]);
}
}