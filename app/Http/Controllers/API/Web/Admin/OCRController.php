<?php
// app/Http/Controllers/API/Web/Admin/OCRController.php

namespace App\Http\Controllers\API\Web\Admin;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\OCRText;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class OCRController extends Controller
{
    /**
     * Save OCR extracted text to system
     */
    public function saveOCR(Request $request)
    {
        try {
            Log::info('OCR Save Request received', [
                'document_id' => $request->document_id,
                'document_type' => $request->document_type,
                'text_length' => strlen($request->extracted_text ?? '')
            ]);

            $validator = Validator::make($request->all(), [
                'document_id' => 'required|integer',
                'extracted_text' => 'required|string|min:1',
                'confidence' => 'nullable|numeric|min:0|max:100',
                'file_name' => 'nullable|string|max:255',
                'document_type' => 'nullable|in:student,office',
            ]);

            if ($validator->fails()) {
                Log::error('OCR Validation Failed', $validator->errors()->toArray());
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $documentType = $request->document_type ?? 'student';
            $document = null;
            
            // Find the document based on type
            if ($documentType === 'office') {
                $document = DB::table('memos')->where('id', $request->document_id)->first();
                if (!$document) {
                    Log::error('Office document not found', ['id' => $request->document_id]);
                    return response()->json([
                        'success' => false,
                        'message' => 'Office document not found'
                    ], 404);
                }
            } else {
                $document = Document::find($request->document_id);
                if (!$document) {
                    Log::error('Student document not found', ['id' => $request->document_id]);
                    return response()->json([
                        'success' => false,
                        'message' => 'Document not found'
                    ], 404);
                }
            }

            // Create OCR text record
            $ocrText = OCRText::create([
                'document_id' => $request->document_id,
                'extracted_text' => $request->extracted_text,
                'confidence' => $request->confidence ?? 0,
                'file_name' => $request->file_name ?? ($document->file_name ?? 'unknown'),
                'document_type' => $documentType,
                'processed_at' => now(),
            ]);

            Log::info('OCR record created', ['ocr_id' => $ocrText->id]);

            // Generate and save text file
            $fileName = 'ocr_' . $request->document_id . '_' . time() . '.txt';
            $filePath = 'ocr_texts/' . $fileName;
            
            $content = $this->generateOCRFileContent($ocrText, $document, $documentType);
            
            // Create directory if it doesn't exist
            if (!Storage::disk('public')->exists('ocr_texts')) {
                Storage::disk('public')->makeDirectory('ocr_texts');
            }
            
            Storage::disk('public')->put($filePath, $content);
            
            // Update record with file path
            $ocrText->update([
                'file_path' => $filePath,
            ]);

            Log::info('OCR file saved', ['path' => $filePath]);

            // Update document with extracted text if it's a student document
            if ($documentType === 'student' && isset($document) && $document) {
                try {
                    $document->update([
                        'extracted_text' => $request->extracted_text,
                        'ocr_processed' => true,
                    ]);
                    Log::info('Student document updated', ['document_id' => $document->id]);
                } catch (\Exception $e) {
                    Log::warning('Failed to update document: ' . $e->getMessage());
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'OCR text saved successfully',
                'data' => [
                    'ocr_id' => $ocrText->id,
                    'file_path' => $filePath,
                    'download_url' => url('/api/ocr-texts/' . $ocrText->id . '/download'),
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('OCR Save Error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Failed to save OCR text: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Download saved OCR text file
     */
    public function downloadOCR($id)
    {
        try {
            $ocrText = OCRText::find($id);
            if (!$ocrText) {
                return response()->json([
                    'success' => false,
                    'message' => 'OCR record not found'
                ], 404);
            }

            if (!$ocrText->file_path) {
                return response()->json([
                    'success' => false,
                    'message' => 'File not found'
                ], 404);
            }

            if (!Storage::disk('public')->exists($ocrText->file_path)) {
                return response()->json([
                    'success' => false,
                    'message' => 'File not found on server'
                ], 404);
            }

            return Storage::disk('public')->download(
                $ocrText->file_path,
                'ocr_text_' . $ocrText->document_id . '.txt'
            );

        } catch (\Exception $e) {
            Log::error('OCR Download Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to download OCR file: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all OCR texts for a document
     */
    public function getOCRHistory($documentId)
    {
        try {
            $ocrTexts = OCRText::where('document_id', $documentId)
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'document_id' => $item->document_id,
                        'extracted_text' => $item->extracted_text,
                        'confidence' => round($item->confidence, 1),
                        'file_name' => $item->file_name,
                        'file_path' => $item->file_path,
                        'processed_at' => $item->processed_at ? $item->processed_at->format('Y-m-d H:i:s') : null,
                        'created_at' => $item->created_at->format('Y-m-d H:i:s'),
                        'download_url' => $item->file_path ? url('/api/ocr-texts/' . $item->id . '/download') : null,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $ocrTexts,
            ]);

        } catch (\Exception $e) {
            Log::error('OCR History Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to get OCR history: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete OCR record
     */
    public function deleteOCR($id)
    {
        try {
            $ocrText = OCRText::find($id);
            if (!$ocrText) {
                return response()->json([
                    'success' => false,
                    'message' => 'OCR record not found'
                ], 404);
            }

            if ($ocrText->file_path && Storage::disk('public')->exists($ocrText->file_path)) {
                Storage::disk('public')->delete($ocrText->file_path);
            }

            $ocrText->delete();

            return response()->json([
                'success' => true,
                'message' => 'OCR record deleted successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('OCR Delete Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete OCR record: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get OCR statistics
     */
    public function getStats()
    {
        try {
            $total = OCRText::count();
            $today = OCRText::whereDate('created_at', today())->count();
            $averageConfidence = OCRText::avg('confidence') ?? 0;
            
            $recent = OCRText::with('document')
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get()
                ->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'document_id' => $item->document_id,
                        'confidence' => round($item->confidence, 1),
                        'file_name' => $item->file_name,
                        'processed_at' => $item->processed_at ? $item->processed_at->format('Y-m-d H:i:s') : null,
                        'created_at' => $item->created_at->format('Y-m-d H:i:s'),
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => [
                    'total' => $total,
                    'today' => $today,
                    'average_confidence' => round($averageConfidence, 1),
                    'recent' => $recent,
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('OCR Stats Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to get OCR statistics: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate OCR file content
     */
    private function generateOCRFileContent($ocrText, $document, $documentType)
    {
        $content = "==================================================\n";
        $content .= "OCR EXTRACTED TEXT\n";
        $content .= "==================================================\n\n";
        $content .= "Document ID: " . $ocrText->document_id . "\n";
        $content .= "Document Type: " . ucfirst($documentType) . "\n";
        $content .= "Original File: " . ($ocrText->file_name ?? 'N/A') . "\n";
        $content .= "Extracted On: " . now()->format('F d, Y h:i A') . "\n";
        $content .= "Confidence Score: " . round($ocrText->confidence) . "%\n\n";
        $content .= "--------------------------------------------------\n";
        $content .= "EXTRACTED TEXT\n";
        $content .= "--------------------------------------------------\n\n";
        $content .= $ocrText->extracted_text . "\n\n";
        $content .= "--------------------------------------------------\n";
        $content .= "END OF EXTRACTED TEXT\n";
        $content .= "==================================================\n";
        
        return $content;
    }
}