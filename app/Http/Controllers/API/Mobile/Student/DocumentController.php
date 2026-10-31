<?php

namespace App\Http\Controllers\API\Mobile\Student;

use App\Http\Controllers\Controller;
use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller
{
    public function myDocuments(Request $request)
    {
        $student = $request->user()->student;
        $documents = Document::where('student_id', $student->id)->orderBy('created_at', 'desc')->get();
        return response()->json(['success' => true, 'data' => $documents]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
        'document_type' => 'required|string',
        'document_sub_type' => 'nullable|string|in:general,activity,class',
        'reference_id' => 'nullable|integer',
        'reference_name' => 'nullable|string|max:255',
        'file' => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120',
        'description' => 'nullable|string',
    ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $student = $request->user()->student;
        $file = $request->file('file');
        $fileName = time() . '_' . $file->getClientOriginalName();
        $filePath = $file->storeAs('documents/' . $student->student_id, $fileName, 'public');

        $document = Document::create([
        'student_id' => $student->id,
        'document_type' => $request->document_type,
        'document_sub_type' => $request->document_sub_type ?? 'general',
        'reference_id' => $request->reference_id,
        'reference_name' => $request->reference_name,
        'file_path' => $filePath,
        'file_name' => $fileName,
        'file_type' => $file->getClientMimeType(),
        'file_size' => $file->getSize(),
        'status' => 'pending',
        'description' => $request->description,
    ]);

        return response()->json([
            'success' => true,
            'message' => 'Document uploaded',
            'data' => $document
        ], 201);
    }

    public function download($id, Request $request)
{
    $document = Document::find($id);
    if (!$document) {
        return response()->json(['message' => 'Document not found'], 404);
    }

    $student = $request->user()->student;
    
    if ($document->student_id !== $student->id) {
        return response()->json(['message' => 'Unauthorized'], 403);
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

public function bulkUpload(Request $request)
{
    $request->validate([
        'files' => 'required|array',
        'files.*' => 'file|max:5120', // 5MB per file
        'metadata' => 'required|array',
        'metadata.*.document_type' => 'required|string',
        'metadata.*.description' => 'nullable|string',
    ]);

    $uploaded = [];
    foreach ($request->file('files') as $index => $file) {
        $metadata = $request->input("metadata.{$index}");
        // Process each file...
        $uploaded[] = $file->store('documents');
    }

    return response()->json(['success' => true, 'data' => $uploaded]);
}

    public function destroy($id, Request $request)
    {
        $document = Document::find($id);
        if (!$document) {
            return response()->json(['message' => 'Document not found'], 404);
        }

        $student = $request->user()->student;
        
        if ($document->student_id !== $student->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        if (Storage::disk('public')->exists($document->file_path)) {
            Storage::disk('public')->delete($document->file_path);
        }
        
        $document->delete();
        return response()->json(['success' => true, 'message' => 'Deleted']);
    }
}