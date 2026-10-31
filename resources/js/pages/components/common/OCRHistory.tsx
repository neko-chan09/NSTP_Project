// src/components/common/OCRHistory.tsx
import React, { useState, useEffect } from 'react';
import { ocrApi } from '../../../services/api';
import toast from 'react-hot-toast';

interface OCRHistoryItem {
  id: number;
  document_id: number;
  extracted_text: string;
  confidence: number;
  file_name: string;
  file_path: string;
  processed_at: string;
  created_at: string;
  download_url: string;
}

interface OCRHistoryProps {
  documentId: number;
  documentType?: 'student' | 'office';
  onClose: () => void;
}

const OCRHistory: React.FC<OCRHistoryProps> = ({
  documentId,
  documentType = 'student',
  onClose,
}) => {
  const [history, setHistory] = useState<OCRHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedItem, setExpandedItem] = useState<number | null>(null);

  useEffect(() => {
    fetchHistory();
  }, [documentId]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await ocrApi.getOCRHistory(documentId);
      setHistory(data || []);
    } catch (error) {
      console.error('Failed to fetch OCR history:', error);
      toast.error('Failed to load OCR history');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (id: number, fileName: string) => {
    try {
      const blob = await ocrApi.downloadOCR(id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ocr_${fileName}_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Download started');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download OCR file');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this OCR record?')) return;
    try {
      await ocrApi.deleteOCR(id);
      toast.success('OCR record deleted');
      fetchHistory();
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete OCR record');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 90) {
      return <span className="badge badge-success">High ({Math.round(confidence)}%)</span>;
    } else if (confidence >= 70) {
      return <span className="badge badge-warning">Medium ({Math.round(confidence)}%)</span>;
    } else {
      return <span className="badge badge-danger">Low ({Math.round(confidence)}%)</span>;
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
          <div className="flex items-center justify-center py-16">
            <div className="spinner" />
            <span className="ml-3 text-slate-500">Loading OCR history...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-lg font-semibold text-navy-900">
              <i className="fas fa-history text-gold-500 mr-2" />
              OCR History
            </h3>
            <p className="text-sm text-slate-500">
              Document #{documentId} • {history.length} records
            </p>
          </div>
          <div className="flex gap-2">
            <button
              className="btn btn-secondary btn-sm"
              onClick={fetchHistory}
              title="Refresh"
            >
              <i className="fas fa-sync" />
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={onClose}
            >
              <i className="fas fa-times" /> Close
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {history.length === 0 ? (
            <div className="text-center py-12">
              <i className="fas fa-file-alt text-5xl text-slate-300 block mb-4" />
              <p className="text-slate-500">No OCR records found for this document</p>
              <p className="text-sm text-slate-400 mt-1">
                Extract text from an image to save it here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-all overflow-hidden"
                >
                  {/* Header Row */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200">
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="text-sm font-medium text-navy-900">
                        <i className="fas fa-file mr-2" />
                        {item.file_name || `OCR #${item.id}`}
                      </span>
                      {getConfidenceBadge(item.confidence)}
                      <span className="text-xs text-slate-500">
                        <i className="fas fa-clock mr-1" />
                        {formatDate(item.created_at)}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="btn btn-info btn-sm"
                        onClick={() => handleDownload(item.id, item.file_name || 'ocr')}
                        title="Download"
                      >
                        <i className="fas fa-download" />
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(item.id)}
                        title="Delete"
                      >
                        <i className="fas fa-trash" />
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                      >
                        <i className={`fas fa-chevron-${expandedItem === item.id ? 'up' : 'down'}`} />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="text-sm text-slate-600 max-h-20 overflow-y-auto">
                      {item.extracted_text.substring(0, 300)}
                      {item.extracted_text.length > 300 && '...'}
                    </div>

                    {/* Expanded Content */}
                    {expandedItem === item.id && (
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-medium text-slate-500">Full Text</span>
                          <button
                            className="text-xs text-gold-600 hover:text-gold-700"
                            onClick={() => {
                              navigator.clipboard.writeText(item.extracted_text);
                              toast.success('Copied to clipboard');
                            }}
                          >
                            <i className="fas fa-copy mr-1" /> Copy
                          </button>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 max-h-60 overflow-y-auto">
                          <pre className="text-sm text-navy-700 whitespace-pre-wrap font-sans">
                            {item.extracted_text}
                          </pre>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleDownload(item.id, item.file_name || 'ocr')}
                          >
                            <i className="fas fa-download" /> Download
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              navigator.clipboard.writeText(item.extracted_text);
                              toast.success('Copied to clipboard');
                            }}
                          >
                            <i className="fas fa-copy" /> Copy
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
          <span className="text-sm text-slate-500">
            Total: {history.length} OCR record{history.length !== 1 ? 's' : ''}
          </span>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default OCRHistory;