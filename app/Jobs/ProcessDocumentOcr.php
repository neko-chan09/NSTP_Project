<?php

namespace App\Jobs;

use App\Models\Document;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Smalot\PdfParser\Parser;
use Spatie\PdfToImage\Pdf;
use thiagoalessio\TesseractOCR\TesseractOCR;

class ProcessDocumentOcr implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 600; // 10 minutes for large files
    public $tries = 3;

    protected Document $document;

    /**
     * Create a new job instance.
     */
    public function __construct(Document $document)
    {
        $this->document = $document;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            $this->document->update(['ocr_processed' => false]);

            $filePath = $this->document->file_path;
            $fullPath = Storage::disk('public')->path($filePath);
            $extension = strtolower(pathinfo($fullPath, PATHINFO_EXTENSION));

            $extractedText = '';

            // Handle different file types
            if (in_array($extension, ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'])) {
                // Image files: use Tesseract OCR
                $extractedText = $this->ocrImage($fullPath);
            } elseif ($extension === 'pdf') {
                // PDF files: try extracting embedded text first
                $extractedText = $this->extractPdfText($fullPath);
                
                // If no text found, convert PDF to images and run OCR
                if (empty(trim($extractedText))) {
                    $extractedText = $this->ocrPdf($fullPath);
                }
            } else {
                // Unsupported file type
                $extractedText = "Unsupported file type for OCR: " . $extension;
                Log::warning('Unsupported file type for OCR', [
                    'document_id' => $this->document->id,
                    'extension' => $extension
                ]);
            }

            // Update the document with extracted text
            $this->document->update([
                'extracted_text' => $extractedText,
                'ocr_processed' => true,
            ]);

            Log::info('OCR completed successfully', [
                'document_id' => $this->document->id,
                'text_length' => strlen($extractedText)
            ]);

        } catch (\Exception $e) {
            Log::error('OCR processing failed: ' . $e->getMessage(), [
                'document_id' => $this->document->id,
                'trace' => $e->getTraceAsString()
            ]);

            $this->document->update([
                'extracted_text' => 'OCR failed: ' . $e->getMessage(),
                'ocr_processed' => true,
            ]);

            // Re-throw to mark job as failed
            throw $e;
        }
    }

    /**
     * Extract text from an image using Tesseract OCR.
     */
    protected function ocrImage(string $imagePath): string
    {
        if (!class_exists(TesseractOCR::class)) {
            throw new \Exception('TesseractOCR is not installed. Run: composer require thiagoalessio/tesseract_ocr');
        }

        return (new TesseractOCR($imagePath))
            ->lang('eng') // Add more languages if needed: 'eng+fil'
            ->run();
    }

    /**
     * Extract text from a PDF using smalot/pdfparser.
     */
    protected function extractPdfText(string $pdfPath): string
    {
        if (!class_exists(Parser::class)) {
            throw new \Exception('PDF Parser is not installed. Run: composer require smalot/pdfparser');
        }

        $parser = new Parser();
        $pdf = $parser->parseFile($pdfPath);
        return $pdf->getText();
    }

    /**
     * OCR a PDF by converting pages to images first.
     * Requires: spatie/pdf-to-image and imagick extension.
     */
    protected function ocrPdf(string $pdfPath): string
    {
        if (!class_exists(Pdf::class)) {
            throw new \Exception('PDF to Image is not installed. Run: composer require spatie/pdf-to-image');
        }

        if (!extension_loaded('imagick')) {
            throw new \Exception('Imagick extension is required for PDF OCR');
        }

        $pdf = new Pdf($pdfPath);
        $pageCount = $pdf->getNumberOfPages();
        $allText = '';

        // Limit to first 10 pages to avoid timeout
        $maxPages = min($pageCount, 10);

        for ($page = 1; $page <= $maxPages; $page++) {
            try {
                // Convert page to image
                $imagePath = tempnam(sys_get_temp_dir(), 'pdf_page_') . '.png';
                $pdf->setPage($page)->saveImage($imagePath);

                // Run OCR on the image
                if (class_exists(TesseractOCR::class)) {
                    $pageText = (new TesseractOCR($imagePath))
                        ->lang('eng')
                        ->run();

                    $allText .= "\n\n--- Page $page ---\n\n" . $pageText;
                }

                // Clean up temp file
                if (file_exists($imagePath)) {
                    unlink($imagePath);
                }

            } catch (\Exception $e) {
                Log::warning("Failed to OCR PDF page $page", [
                    'document_id' => $this->document->id,
                    'error' => $e->getMessage()
                ]);
            }
        }

        return trim($allText);
    }
}