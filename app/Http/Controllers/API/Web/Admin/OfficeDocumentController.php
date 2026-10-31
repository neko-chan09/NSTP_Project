<?php

namespace App\Http\Controllers\API\Web\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use thiagoalessio\TesseractOCR\TesseractOCR;

class OfficeDocumentController extends Controller
{
    private function getTesseractPath(): string
    {
        // Run "where tesseract" in CMD to find your path
        // Examples (uncomment the correct one):
        // return 'C:\\Tesseract-OCR\\tesseract.exe';
        // return 'C:\\Program Files\\Tesseract-OCR\\tesseract.exe';
        return 'tesseract'; // only if it's in your system PATH
    }

    public function index()
    {
        $documents = DB::table('memos')->latest()->get()->map(function ($memo) {
            $fullPath = $memo->file_path ? Storage::disk('public')->path($memo->file_path) : null;
            $fileType = '';
            $fileSize = 0;

            if ($fullPath && file_exists($fullPath)) {
                $fileType = mime_content_type($fullPath);
                $fileSize = filesize($fullPath);
            }

            return [
                'id'              => $memo->id,
                'title'           => $memo->title,
                'description'     => $memo->content,
                'category'        => 'Memo',
                'file_path'       => $memo->file_path ?: '',
                'file_name'       => $memo->file_name ?: '',
                'file_type'       => $fileType,
                'file_size'       => $fileSize,
                'is_public'       => $memo->target_audience === 'all',
                'target_audience' => in_array($memo->target_audience, ['faculty', 'admin', 'students']) ? $memo->target_audience : 'all',
                'uploaded_by'     => $memo->created_by,
                'download_count'  => 0,
                'created_at'      => $memo->created_at,
                'updated_at'      => $memo->updated_at,
            ];
        });

        return response()->json(['success' => true, 'data' => $documents]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title'           => 'required|string',
            'file'            => 'required|file|max:10240',
            'description'     => 'nullable|string',
            'category'        => 'nullable|string',
            'is_public'       => 'nullable|boolean',
            'target_audience' => 'nullable|in:all,faculty,admin,students',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $file = $request->file('file');
        $path = $file->storeAs('office-documents', time() . '_' . $file->getClientOriginalName(), 'public');
        $fullPath = Storage::disk('public')->path($path);

        $extractedText = '';
        $ocrableTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff', 'image/webp',
        ];

        if (in_array($file->getMimeType(), $ocrableTypes)) {
            try {
                $tesseract = new TesseractOCR($fullPath);
                $tesseract->executable($this->getTesseractPath()); // ← uses the method above
                $tesseract->setLanguage('eng');
                $extractedText = trim($tesseract->run());
            } catch (\Exception $e) {
                \Log::warning('OCR failed: ' . $e->getMessage());
                $extractedText = '';
            }
        }

        $content = $request->description;
        if (empty($content) && !empty($extractedText)) {
            $content = $extractedText;
        }

        $id = DB::table('memos')->insertGetId([
            'title'           => $request->title,
            'content'         => $content ?: '',
            'file_path'       => $path,
            'file_name'       => $file->getClientOriginalName(),
            'target_audience' => $request->target_audience ?? 'all',
            'status'          => 'published',
            'created_by'      => $request->user()->id,
            'published_at'    => now(),
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);

        return response()->json([
            'success'  => true,
            'data'     => DB::table('memos')->find($id),
            'ocr_text' => $extractedText,
            'message'  => !empty($extractedText)
                ? 'Document uploaded and text extracted successfully.'
                : 'Document uploaded. No text extracted.',
        ], 201);
    }

    public function destroy($id)
    {
        $memo = DB::table('memos')->find($id);
        if (!$memo) {
            return response()->json(['message' => 'Document not found'], 404);
        }
        if ($memo->file_path) {
            Storage::disk('public')->delete($memo->file_path);
        }
        DB::table('memos')->where('id', $id)->delete();
        return response()->json(['success' => true, 'message' => 'Deleted']);
    }

   public function download($id)
{
    $memo = DB::table('memos')->find($id);
    if (!$memo || !$memo->file_path) {
        return response()->json(['message' => 'File not found'], 404);
    }
    
    // Check if file exists in storage
    if (!Storage::disk('public')->exists($memo->file_path)) {
        return response()->json(['message' => 'File not found on server'], 404);
    }
    
    // Get the file
    $file = Storage::disk('public')->get($memo->file_path);
    $mimeType = Storage::disk('public')->mimeType($memo->file_path);
    
    // Return the file with proper headers
    return response($file, 200)
        ->header('Content-Type', $mimeType)
        ->header('Content-Disposition', 'attachment; filename="' . $memo->file_name . '"')
        ->header('Access-Control-Allow-Origin', '*')
        ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}
}