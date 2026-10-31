// resources/js/components/common/ScannerModal.tsx
import React, { useState, useEffect } from 'react';
import { scanDocument, downloadBlob, type ScanResult } from '../../../utils/scribeScanner';
import toast from 'react-hot-toast';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: File | Blob | null;
  fileName: string;
  documentId?: number;
  onTextExtracted: (text: string) => void;
}

const ScannerModal: React.FC<ScannerModalProps> = ({
  isOpen,
  onClose,
  file,
  fileName,
  documentId,
  onTextExtracted,
}) => {
  const [step, setStep] = useState<'idle' | 'scanning' | 'done' | 'error'>('idle');
  const [progressMsg, setProgressMsg] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reset when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setStep('idle');
      setResult(null);
      setError(null);
      setProgressMsg('');
    }
  }, [isOpen]);

  const handleScan = async () => {
    if (!file) return;
    setStep('scanning');
    setError(null);
    setResult(null);

    try {
      const scanResult = await scanDocument(file, (msg) => {
        setProgressMsg(msg);
      });

      setResult(scanResult);
      onTextExtracted(scanResult.text);
      setStep('done');
      toast.success('Document scanned successfully!');
    } catch (err: any) {
      console.error('Scan error:', err);
      setError(err.message || 'Failed to scan document');
      setStep('error');
    }
  };

  const handleDownloadPDF = () => {
    if (result?.pdfBlob) {
      downloadBlob(result.pdfBlob, `${fileName.replace(/\.[^/.]+$/, '')}_scan.pdf`);
      toast.success('PDF downloaded');
    }
  };

  const handleDownloadDOCX = () => {
    if (result?.docxBlob) {
      downloadBlob(result.docxBlob, `${fileName.replace(/\.[^/.]+$/, '')}_scan.docx`);
      toast.success('Word document downloaded');
    }
  };

  const handleCopyText = () => {
    if (result?.text) {
      navigator.clipboard.writeText(result.text);
      toast.success('Text copied to clipboard');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="text-lg font-semibold text-navy-900">
              <i className="fas fa-file-scan text-gold-500 mr-2" />
              Document Scanner
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">{fileName}</p>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body space-y-4">
          {/* Idle - start button */}
          {step === 'idle' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-gold-100 flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-file-scan text-2xl text-gold-600" />
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Scan this document to extract text and generate a document file.
              </p>
              <button className="btn btn-primary" onClick={handleScan}>
                <i className="fas fa-play mr-1" /> Start Scanning
              </button>
            </div>
          )}

          {/* Scanning progress */}
          {step === 'scanning' && (
            <div className="text-center py-8">
              <div className="spinner mb-3" />
              <p className="text-sm text-slate-500">{progressMsg || 'Scanning...'}</p>
            </div>
          )}

          {/* Error */}
          {step === 'error' && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">
                <i className="fas fa-exclamation-triangle mr-2" />
                {error}
              </p>
              <button className="btn btn-primary btn-sm mt-3" onClick={handleScan}>
                <i className="fas fa-redo mr-1" /> Try Again
              </button>
            </div>
          )}

          {/* Done - show results and download options */}
          {step === 'done' && result && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <p className="text-sm text-emerald-700">
                  <i className="fas fa-check-circle mr-1" />
                  Scan complete! Text extracted and document files ready.
                </p>
              </div>

              {/* Text preview */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-navy-700">Extracted Text</span>
                  <button
                    className="text-xs text-gold-600 hover:text-gold-700"
                    onClick={handleCopyText}
                  >
                    <i className="fas fa-copy mr-1" /> Copy
                  </button>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 max-h-48 overflow-y-auto">
                  <pre className="text-sm text-navy-800 whitespace-pre-wrap font-sans">
                    {result.text || '(No text found)'}
                  </pre>
                </div>
              </div>

              {/* Download buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  className="btn btn-info"
                  onClick={handleDownloadPDF}
                  disabled={!result.pdfBlob}
                >
                  <i className="fas fa-file-pdf mr-1" /> Download PDF
                </button>
                <button
                  className="btn btn-info"
                  onClick={handleDownloadDOCX}
                  disabled={!result.docxBlob}
                >
                  <i className="fas fa-file-word mr-1" /> Download Word
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handleCopyText}
                >
                  <i className="fas fa-copy mr-1" /> Copy Text
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScannerModal;