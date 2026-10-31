<?php
// app/Http/Controllers/API/DocumentOCRController.php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use thiagoalessio\TesseractOCR\TesseractOCR;
use thiagoalessio\TesseractOCR\Option;
use Illuminate\Support\Facades\Log;

class DocumentOCRController extends Controller
{
    /**
     * Get the Tesseract executable path based on OS
     */
    private function getTesseractPath(): string
    {
        // Check if running on Windows
        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            // Common Windows paths for Tesseract
            $paths = [
                'C:\\Program Files\\Tesseract-OCR\\tesseract.exe',
                'C:\\Program Files (x86)\\Tesseract-OCR\\tesseract.exe',
                'C:\\Users\\' . getenv('USERNAME') . '\\AppData\\Local\\Programs\\Tesseract-OCR\\tesseract.exe',
            ];
            
            foreach ($paths as $path) {
                if (file_exists($path)) {
                    return $path;
                }
            }
            
            // Try to find it using where command
            $output = shell_exec('where tesseract 2>nul');
            if ($output) {
                $lines = explode("\n", trim($output));
                if (!empty($lines) && file_exists($lines[0])) {
                    return $lines[0];
                }
            }
            
            // Fallback - assume it's in PATH
            return 'tesseract';
        }
        
        // Linux/Mac - assume it's in PATH
        return 'tesseract';
    }

    /**
     * Check if Tesseract is installed and accessible
     */
    private function isTesseractAvailable(): bool
    {
        try {
            $tesseract = new TesseractOCR();
            $tesseract->executable($this->getTesseractPath());
            $tesseract->version();
            return true;
        } catch (\Exception $e) {
            Log::error('Tesseract not available: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Perform OCR on a document
     */
    public function ocrDocument($id)
    {
        try {
            $document = Document::find($id);
            if (!$document) {
                return response()->json([
                    'success' => false,
                    'message' => 'Document not found'
                ], 404);
            }

            // Check if file exists
            $filePath = Storage::disk('public')->path($document->file_path);
            if (!file_exists($filePath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'File not found on server'
                ], 404);
            }

            // Check if Tesseract is available
            if (!$this->isTesseractAvailable()) {
                return response()->json([
                    'success' => false,
                    'message' => 'OCR service is not available. Please install Tesseract OCR.'
                ], 503);
            }

            // Only process images
            $imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff'];
            $fileMime = $document->file_type;
            
            // Also check file extension for images
            $imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'tif'];
            $extension = strtolower(pathinfo($document->file_name, PATHINFO_EXTENSION));
            
            if (!in_array($fileMime, $imageTypes) && !in_array($extension, $imageExtensions)) {
                return response()->json([
                    'success' => false,
                    'message' => 'OCR only supports image files. Supported formats: JPG, PNG, GIF, WebP, BMP, TIFF'
                ], 400);
            }

            Log::info('Starting OCR for document: ' . $document->id . ' - ' . $document->file_name);

            // Run Tesseract OCR
            $tesseract = new TesseractOCR($filePath);
            $tesseract->executable($this->getTesseractPath());
            $tesseract->setLanguage('eng');
            
            // Try different page segmentation modes for better results
            // PSM 6 = Assume a single uniform block of text
            // PSM 3 = Fully automatic page segmentation, but no OSD
            $tesseract->setOption('psm', 6);
            
            $extractedText = trim($tesseract->run());

            Log::info('OCR completed for document: ' . $document->id . ' - Text length: ' . strlen($extractedText));

            // Update document with extracted text
            $document->update([
                'extracted_text' => $extractedText,
                'ocr_processed' => true,
            ]);

            // Calculate confidence
            $confidence = $this->calculateConfidence($extractedText);

            return response()->json([
                'success' => true,
                'message' => 'OCR completed successfully',
                'data' => [
                    'extracted_text' => $extractedText,
                    'confidence' => $confidence,
                    'document_id' => $document->id,
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('OCR failed: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'OCR processing failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Calculate confidence score for OCR result
     */
    private function calculateConfidence($text): float
    {
        if (empty($text)) return 0;
        
        $wordCount = str_word_count($text);
        $charCount = strlen($text);
        
        // Basic heuristics for confidence
        $confidence = 0;
        
        // Length-based scoring
        if ($wordCount > 100) $confidence += 40;
        else if ($wordCount > 50) $confidence += 30;
        else if ($wordCount > 20) $confidence += 15;
        else if ($wordCount > 5) $confidence += 5;
        
        if ($charCount > 500) $confidence += 20;
        else if ($charCount > 200) $confidence += 15;
        else if ($charCount > 100) $confidence += 10;
        else if ($charCount > 50) $confidence += 5;
        
        // Check for common words (indicates readable text)
        $commonWords = ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 
                        'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
                        'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
                        'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their'];
        
        $foundCommon = 0;
        foreach ($commonWords as $word) {
            if (stripos($text, $word) !== false) $foundCommon++;
        }
        $confidence += ($foundCommon / count($commonWords)) * 25;
        
        // Check for capitalization and punctuation (indicates proper text)
        if (preg_match('/[A-Z]/', $text)) $confidence += 5;
        if (preg_match('/[.!?]/', $text)) $confidence += 5;
        if (preg_match('/[0-9]/', $text)) $confidence += 5;
        
        return min(round($confidence, 1), 100);
    }

    /**
     * Get OCR status for a document
     */
    public function getOCRStatus($id)
    {
        $document = Document::find($id);
        if (!$document) {
            return response()->json([
                'success' => false,
                'message' => 'Document not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'ocr_processed' => $document->ocr_processed,
                'has_text' => !empty($document->extracted_text),
                'text_length' => strlen($document->extracted_text ?? ''),
                'extracted_text' => $document->extracted_text,
            ]
        ]);
    }
}