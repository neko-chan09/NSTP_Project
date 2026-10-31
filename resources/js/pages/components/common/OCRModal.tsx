// src/components/common/OCRModal.tsx
import React, { useState, useEffect } from 'react';
import { extractTextFromImage, formatOCRText } from '../../../utils/ocr';
import { ocrApi } from '../../../services/api';
import { 
  generateOCRTextFile, 
  generateOCRMarkdownFile, 
  generateOCRJSONFile,
  downloadOCRFile,
  saveOCRToCache 
} from '../../../utils/ocrFileGenerator';
import OCRHistory from './OCRHistory';
import toast from 'react-hot-toast';

interface OCRProgress {
  status: 'loading' | 'recognizing' | 'done' | 'error';
  progress: number;
  message?: string;
}

interface OCRModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  fileName: string;
  documentTitle?: string;
  documentId: number;
  onTextExtracted: (text: string) => void;
  existingText?: string;
}

const OCRModal: React.FC<OCRModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  fileName,
  documentTitle,
  documentId,
  onTextExtracted,
  existingText = '',
}) => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<OCRProgress>({
    status: 'loading',
    progress: 0,
    message: 'Initializing OCR...',
  });
  const [extractedText, setExtractedText] = useState(existingText);
  const [showFullText, setShowFullText] = useState(false);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (existingText) {
        setExtractedText(existingText);
        setConfidence(null);
        setError(null);
      } else {
        startOCR();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const startOCR = async () => {
    setLoading(true);
    setError(null);
    setProgress({
      status: 'loading',
      progress: 5,
      message: 'Preparing OCR...',
    });

    try {
      const result = await extractTextFromImage(imageUrl, (p) => {
        setProgress(p);
      });

      if (result && result.text) {
        setExtractedText(result.text);
        setConfidence(result.confidence);
        
        // Save to cache
        saveOCRToCache(documentId, result.text, result.confidence);
        
        onTextExtracted(result.text);
        setProgress({
          status: 'done',
          progress: 100,
          message: `OCR complete with ${Math.round(result.confidence)}% confidence`,
        });
        toast.success('Text extracted successfully!');
      } else if (result && !result.text) {
        setError('No text could be extracted from this image. The image may not contain readable text.');
        setProgress({
          status: 'error',
          progress: 0,
          message: 'No text found',
        });
      } else {
        setError('Failed to extract text from image. Please try again.');
        setProgress({
          status: 'error',
          progress: 0,
          message: 'Failed to extract text',
        });
      }
    } catch (err: any) {
      console.error('OCR error:', err);
      setError(err.message || 'An error occurred during OCR');
      setProgress({
        status: 'error',
        progress: 0,
        message: err.message || 'An error occurred during OCR',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (format: 'txt' | 'md' | 'json') => {
    if (!extractedText) {
      toast.error('No text to download');
      return;
    }

    const timestamp = new Date().toLocaleString();
    const title = documentTitle || fileName.replace(/\.[^/.]+$/, '');
    const options = {
      fileName: fileName.replace(/\.[^/.]+$/, ''),
      documentTitle: title,
      extractedText: extractedText,
      confidence: confidence || 0,
      timestamp: timestamp,
      documentId: documentId,
    };

    let content = '';
    let fileType = format;
    
    switch (format) {
      case 'md':
        content = generateOCRMarkdownFile(options);
        break;
      case 'json':
        content = generateOCRJSONFile(options);
        break;
      default:
        content = generateOCRTextFile(options);
        break;
    }

    downloadOCRFile(content, options.fileName, format);
    setShowDownloadMenu(false);
    toast.success(`Downloaded as ${format.toUpperCase()} file`);
  };

  const handleSaveToSystem = async () => {
    if (!extractedText) {
      toast.error('No text to save');
      return;
    }

    if (!documentId || isNaN(documentId)) {
      toast.error('Invalid Document ID. Please refresh and try again.');
      console.error('Invalid documentId:', documentId);
      return;
    }

    setSaving(true);
    try {
      const loadingToast = toast.loading('Saving OCR text to system...');
      
      // Determine document type from URL
      const documentType: 'office' | 'student' = window.location.pathname.includes('library') ? 'office' : 'student';
      
      const payload = {
        document_id: documentId,
        extracted_text: extractedText,
        confidence: confidence || 0,
        file_name: fileName,
        document_type: documentType,
      };

      console.log('📤 Sending OCR save payload:', payload);

      const response = await ocrApi.saveOCR(payload);

      toast.dismiss(loadingToast);
      
      if (response) {
        toast.success('OCR text saved to system successfully!');
        setShowDownloadMenu(false);
        
        // Show download option
        if (response.download_url) {
          toast.success(
            <div>
              <span>File saved! </span>
              <button 
                onClick={() => window.open(response.download_url, '_blank')}
                className="text-gold-500 underline ml-2"
              >
                Download
              </button>
            </div>,
            { duration: 5000 }
          );
        }
      }
    } catch (error: any) {
      console.error('❌ Error saving OCR:', error);
      
      let errorMessage = 'Failed to save OCR text to system';
      if (error.errors) {
        const errorDetails = Object.values(error.errors).flat().join(', ');
        errorMessage = `${errorMessage}: ${errorDetails}`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleViewHistory = () => {
    setShowHistory(true);
  };

  const handleApplyText = () => {
    if (extractedText) {
      onTextExtracted(extractedText);
      onClose();
      toast.success('Text applied successfully!');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'loading':
        return 'text-blue-500';
      case 'recognizing':
        return 'text-amber-500';
      case 'done':
        return 'text-emerald-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-slate-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'loading':
        return 'fa-spinner fa-spin';
      case 'recognizing':
        return 'fa-eye';
      case 'done':
        return 'fa-check-circle';
      case 'error':
        return 'fa-exclamation-circle';
      default:
        return 'fa-file';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal max-w-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>
              <i className="fas fa-robot text-gold-500 mr-2" />
              OCR Text Extraction
            </h3>
            <div className="flex gap-2">
              <button
                className="btn btn-info btn-sm"
                onClick={handleViewHistory}
                title="View OCR History"
              >
                <i className="fas fa-history" /> History
              </button>
              <button className="modal-close" onClick={onClose}>×</button>
            </div>
          </div>

          <div className="modal-body">
            <div className="mb-4">
              <p className="text-sm text-slate-500">
                <i className="fas fa-file mr-2" />
                {fileName}
              </p>
              {documentTitle && (
                <p className="text-sm text-slate-500">
                  <i className="fas fa-tag mr-2" />
                  {documentTitle}
                </p>
              )}
            </div>

            {/* Progress */}
            {loading && (
              <div className="mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <i className={`fas ${getStatusIcon(progress.status)} ${getStatusColor(progress.status)}`} />
                  <span className={`text-sm font-medium ${getStatusColor(progress.status)}`}>
                    {progress.message || 'Processing...'}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      progress.status === 'error' ? 'bg-red-500' :
                      progress.status === 'done' ? 'bg-emerald-500' :
                      'bg-gold-500'
                    }`}
                    style={{ width: `${Math.min(progress.progress, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && !loading && (
              <div className="alert alert-danger mb-4">
                <i className="fas fa-exclamation-triangle mr-2" />
                {error}
                <button
                  className="btn btn-primary btn-sm ml-3"
                  onClick={startOCR}
                >
                  <i className="fas fa-redo" /> Retry
                </button>
              </div>
            )}

            {/* Confidence */}
            {confidence !== null && !loading && !error && (
              <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium text-slate-600">Confidence:</span>
                <span className={`badge ${
                  confidence >= 90 ? 'badge-success' :
                  confidence >= 70 ? 'badge-warning' :
                  'badge-danger'
                }`}>
                  {Math.round(confidence)}%
                </span>
                <span className="text-sm text-slate-500">
                  {confidence >= 90 ? 'Excellent' : confidence >= 70 ? 'Good' : 'Low'}
                </span>
              </div>
            )}

            {/* Extracted Text */}
            {extractedText && !loading && !error && (
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-navy-700">Extracted Text</span>
                  <button
                    className="text-sm text-gold-600 hover:text-gold-700"
                    onClick={() => setShowFullText(!showFullText)}
                  >
                    {showFullText ? 'Show less' : 'Show more'}
                  </button>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 max-h-60 overflow-y-auto">
                  <pre className="text-sm text-navy-700 whitespace-pre-wrap font-sans">
                    {showFullText ? extractedText : formatOCRText(extractedText, 300)}
                  </pre>
                </div>
                
                {/* Action Buttons */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      navigator.clipboard.writeText(extractedText);
                      toast.success('Text copied to clipboard');
                    }}
                  >
                    <i className="fas fa-copy" /> Copy
                  </button>
                  
                  <button
                    className="btn btn-success btn-sm"
                    onClick={handleApplyText}
                  >
                    <i className="fas fa-check" /> Apply
                  </button>
                  
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleSaveToSystem}
                    disabled={saving}
                  >
                    {saving ? (
                      <><i className="fas fa-spinner fa-spin" /> Saving...</>
                    ) : (
                      <><i className="fas fa-save" /> Save to System</>
                    )}
                  </button>
                  
                  <button
                    className="btn btn-info btn-sm"
                    onClick={handleViewHistory}
                  >
                    <i className="fas fa-history" /> History
                  </button>
                  
                  {/* Download Dropdown */}
                  <div className="relative">
                    <button
                      className="btn btn-info btn-sm"
                      onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                    >
                      <i className="fas fa-download" /> Download
                      <i className={`fas fa-chevron-${showDownloadMenu ? 'up' : 'down'} ml-1 text-xs`} />
                    </button>
                    
                    {showDownloadMenu && (
                      <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-slate-200 z-10">
                        <button
                          className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 rounded-t-lg"
                          onClick={() => handleDownload('txt')}
                        >
                          <i className="fas fa-file-alt mr-2" /> TXT
                        </button>
                        <button
                          className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50"
                          onClick={() => handleDownload('md')}
                        >
                          <i className="fas fa-file-markdown mr-2" /> Markdown
                        </button>
                        <button
                          className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 rounded-b-lg"
                          onClick={() => handleDownload('json')}
                        >
                          <i className="fas fa-file-code mr-2" /> JSON
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* No Text Found */}
            {!extractedText && !loading && !error && (
              <div className="text-center py-8 text-slate-500">
                <i className="fas fa-file-alt text-4xl text-slate-300 block mb-3" />
                <p>No text could be extracted from this image.</p>
                <p className="text-sm mt-1">Try uploading a clearer image with visible text.</p>
                <button
                  className="btn btn-primary btn-sm mt-4"
                  onClick={startOCR}
                >
                  <i className="fas fa-redo" /> Try Again
                </button>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
            {extractedText && !loading && !error && (
              <>
                <button
                  className="btn btn-success"
                  onClick={handleApplyText}
                >
                  <i className="fas fa-check" /> Apply Text
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleSaveToSystem}
                  disabled={saving}
                >
                  {saving ? (
                    <><i className="fas fa-spinner fa-spin" /> Saving...</>
                  ) : (
                    <><i className="fas fa-save" /> Save</>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* OCR History Modal */}
      {showHistory && (
        <OCRHistory
          documentId={documentId}
          documentType={window.location.pathname.includes('library') ? 'office' : 'student'}
          onClose={() => setShowHistory(false)}
        />
      )}
    </>
  );
};

export default OCRModal;