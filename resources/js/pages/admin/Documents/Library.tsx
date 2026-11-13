// src/pages/admin/Documents/Library.tsx

import React, { useState, useMemo } from "react";
import {
  useOfficeDocuments,
  useUploadOfficeDocument,
  useDeleteOfficeDocument,
} from "../../hooks/useDocuments";
import RefreshButton from "../../components/common/RefreshButton";
import ScannerModal from "../../components/common/ScannerModal";
import { isImageFile } from "../../../utils/ocr";
import { API_URL } from "../../../services/api";
import toast from "react-hot-toast";

type ViewMode = "list" | "grid";

const DocumentLibrary: React.FC = () => {
  const api_url = API_URL;

  const {
    data: docResponse,
    isLoading,
    refresh,
    isRefreshing,
  } = useOfficeDocuments();

  const documents = docResponse?.data || [];

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [showUpload, setShowUpload] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });
  const [file, setFile] = useState<File | null>(null);

  // Scanner modal state
  const [scannerModal, setScannerModal] = useState<{
    open: boolean;
    file: File | Blob | null;
    fileName: string;
    documentId: number;
  } | null>(null);

  const uploadMut = useUploadOfficeDocument();
  const deleteMut = useDeleteOfficeDocument();

  // ============================================================
  // Categories list (from data)
  // ============================================================
  const categories = useMemo(() => {
    const set = new Set<string>();
    documents.forEach((doc) => {
      if (doc.category) set.add(doc.category);
    });
    return Array.from(set).sort();
  }, [documents]);

  // ============================================================
  // Filtered documents
  // ============================================================
  const filtered = useMemo(() => {
    let list = documents;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (doc) =>
          doc.title.toLowerCase().includes(q) ||
          (doc.description || "").toLowerCase().includes(q) ||
          (doc.file_name || "").toLowerCase().includes(q)
      );
    }

    if (filterCategory !== "all") {
      list = list.filter((doc) => doc.category === filterCategory);
    }

    return list;
  }, [documents, search, filterCategory]);

  // ============================================================
  // Handlers
  // ============================================================
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    const uploadData = new FormData();
    uploadData.append("title", formData.title);
    uploadData.append("description", formData.description);
    uploadData.append("file", file);

    try {
      await uploadMut.mutateAsync(uploadData);
      toast.success("Document uploaded successfully");
      refresh();
      setShowUpload(false);
      setFormData({ title: "", description: "" });
      setFile(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to upload document");
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Delete this document?")) {
      try {
        await deleteMut.mutateAsync(id);
        toast.success("Document deleted successfully");
        refresh();
      } catch (err: any) {
        toast.error(err.message || "Failed to delete document");
      }
    }
  };

  const handleOCR = async (doc: any) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${api_url}/office-documents/${doc.id}/download`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) {
        if (response.status === 404) {
          toast.error("File not found on server");
        } else if (response.status === 401) {
          toast.error("Please login again");
        } else {
          toast.error(`Server error: ${response.status}`);
        }
        return;
      }

      const blob = await response.blob();
      setScannerModal({
        open: true,
        file: blob,
        fileName: doc.file_name,
        documentId: doc.id,
      });
    } catch (error) {
      toast.error("Failed to access file");
      console.error(error);
    }
  };

  const closeScannerModal = () => setScannerModal(null);

  // ============================================================
  // Display helpers
  // ============================================================
  const getVisibilityLabel = (doc: any) => {
    const audience = doc.target_audience || "all";
    if (audience === "all") return "Public";
    if (audience === "faculty") return "Faculty Only";
    if (audience === "admin") return "Admin Only";
    if (audience === "students") return "Students Only";
    return "All";
  };

  const getFileIcon = (type: string) => {
    if (type?.includes("pdf")) return "fa-file-pdf text-red-500";
    if (type?.includes("image")) return "fa-file-image text-purple-500";
    if (type?.includes("word") || type?.includes("doc"))
      return "fa-file-word text-blue-500";
    if (type?.includes("excel") || type?.includes("sheet"))
      return "fa-file-excel text-emerald-500";
    if (type?.includes("powerpoint") || type?.includes("presentation"))
      return "fa-file-powerpoint text-orange-500";
    if (type?.includes("zip") || type?.includes("compressed"))
      return "fa-file-archive text-slate-500";
    return "fa-file text-slate-500";
  };

  const getFileIconBg = (type: string) => {
    if (type?.includes("pdf")) return "bg-red-50 text-red-500";
    if (type?.includes("image")) return "bg-purple-50 text-purple-500";
    if (type?.includes("word") || type?.includes("doc"))
      return "bg-blue-50 text-blue-500";
    if (type?.includes("excel") || type?.includes("sheet"))
      return "bg-emerald-50 text-emerald-500";
    if (type?.includes("powerpoint") || type?.includes("presentation"))
      return "bg-orange-50 text-orange-500";
    return "bg-slate-100 text-slate-500";
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const isScannable = (doc: any) => {
    return (
      doc.file_type?.includes("image") || doc.file_type === "application/pdf" ||
      doc.file_name?.match(/\.(jpg|jpeg|png|gif|webp|bmp|tif|tiff|pdf)$/i)
    );
  };

  // ============================================================
  // Loading
  // ============================================================
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="spinner" />
        <span className="ml-3 text-slate-500">Loading documents...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ============================================================
          HEADER
         ============================================================ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold text-navy-900">
            <i className="fas fa-folder-open text-gold-500 mr-2" />
            Office Document Library
          </h2>
          <p className="text-sm text-slate-500">
            <i className="fas fa-file-scan text-gold-500 mr-1" />
            Upload and scan documents to extract text and create searchable files
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <RefreshButton
            onRefresh={refresh}
            isLoading={isRefreshing}
            label=""
            className="btn-sm"
          />
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowUpload(true)}
          >
            <i className="fas fa-upload" /> Upload Document
          </button>
        </div>
      </div>

      {/* ============================================================
          FILTERS + VIEW TOGGLE
         ============================================================ */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="search-box flex-1 min-w-[220px]">
            <i className="fas fa-search" />
            <input
              type="text"
              placeholder="Search by title, description, or file name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                className="text-slate-400 hover:text-slate-600 px-2"
                onClick={() => setSearch("")}
              >
                <i className="fas fa-times" />
              </button>
            )}
          </div>

          {/* Category filter */}
          <select
            className="px-4 py-2.5 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* View toggle */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1.5 ${
                viewMode === "list"
                  ? "bg-white text-navy-900 shadow-sm"
                  : "text-slate-500 hover:text-navy-700"
              }`}
              onClick={() => setViewMode("list")}
              title="List view"
            >
              <i className="fas fa-list" /> List
            </button>
            <button
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1.5 ${
                viewMode === "grid"
                  ? "bg-white text-navy-900 shadow-sm"
                  : "text-slate-500 hover:text-navy-700"
              }`}
              onClick={() => setViewMode("grid")}
              title="Grid view"
            >
              <i className="fas fa-th" /> Grid
            </button>
          </div>
        </div>

        {filtered.length !== documents.length && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Showing <strong>{filtered.length}</strong> of{" "}
              {documents.length} documents
            </span>
            {(search || filterCategory !== "all") && (
              <button
                className="text-gold-600 hover:text-gold-700"
                onClick={() => {
                  setSearch("");
                  setFilterCategory("all");
                }}
              >
                <i className="fas fa-times mr-1" /> Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* ============================================================
          EMPTY STATE
         ============================================================ */}
      {filtered.length === 0 ? (
        <div className="empty-state bg-white rounded-xl border border-slate-200">
          <i className="fas fa-search text-4xl text-slate-300 block mb-3" />
          <p className="text-slate-500">
            {search || filterCategory !== "all"
              ? "No documents match your filters"
              : "No documents uploaded yet"}
          </p>
          {documents.length === 0 ? (
            <button
              className="btn btn-primary mt-4"
              onClick={() => setShowUpload(true)}
            >
              <i className="fas fa-upload" /> Upload Your First Document
            </button>
          ) : (
            <button
              className="btn btn-secondary mt-4"
              onClick={() => {
                setSearch("");
                setFilterCategory("all");
              }}
            >
              <i className="fas fa-times mr-1" /> Clear all filters
            </button>
          )}
        </div>
      ) : viewMode === "list" ? (
        /* ============================================================
           LIST VIEW
           ============================================================ */
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Category</th>
                  <th>Visibility</th>
                  <th>Size</th>
                  <th>Uploaded</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((doc) => {
                  const isDeleting =
                    deleteMut.isPending &&
                    deleteMut.variables === doc.id;

                  return (
                    <tr
                      key={doc.id}
                      className={`group hover:bg-slate-50 transition-colors ${
                        isDeleting ? "opacity-50" : ""
                      }`}
                    >
                      {/* Document */}
                      <td>
                        <div className="flex items-start gap-3 min-w-[260px]">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getFileIconBg(
                              doc.file_type
                            )}`}
                          >
                            <i
                              className={`fas ${getFileIcon(doc.file_type)}`}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-navy-900 truncate max-w-[280px]">
                              {doc.title}
                            </div>
                            <div className="text-xs text-slate-500 truncate max-w-[280px]">
                              {doc.file_name}
                            </div>
                            {doc.description && (
                              <div className="text-xs text-slate-400 truncate max-w-[280px] mt-0.5">
                                {doc.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td>
                        <span className="badge badge-secondary">
                          {doc.category || "General"}
                        </span>
                      </td>

                      {/* Visibility */}
                      <td>
                        <span className="badge badge-info">
                          <i className="fas fa-eye mr-1" />
                          {getVisibilityLabel(doc)}
                        </span>
                      </td>

                      {/* Size */}
                      <td>
                        <span className="text-sm text-slate-600">
                          {formatFileSize(doc.file_size)}
                        </span>
                      </td>

                      {/* Uploaded */}
                      <td>
                        <span className="text-sm text-slate-600">
                          {formatDate(doc.created_at)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={`${api_url}/office-documents/${doc.id}/download`}
                            target="_blank"
                            rel="noopener"
                            className="btn btn-info btn-sm"
                            title="Download"
                          >
                            <i className="fas fa-download" />
                          </a>

                          {isScannable(doc) && (
                            <button
                              className="btn btn-warning btn-sm"
                              onClick={() => handleOCR(doc)}
                              title="Scan and select document text"
                            >
                              <i className="fas fa-file-scan" /> Scan
                            </button>
                          )}

                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(doc.id)}
                            disabled={isDeleting}
                            title="Delete"
                          >
                            {isDeleting ? (
                              <i className="fas fa-spinner fa-spin" />
                            ) : (
                              <i className="fas fa-trash" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ============================================================
           GRID VIEW
           ============================================================ */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((doc) => {
            const isDeleting =
              deleteMut.isPending && deleteMut.variables === doc.id;

            return (
              <div
                key={doc.id}
                className={`bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow ${
                  isDeleting ? "opacity-50" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${getFileIconBg(
                      doc.file_type
                    )}`}
                  >
                    <i className={`fas ${getFileIcon(doc.file_type)}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-navy-900 truncate">
                      {doc.title}
                    </h4>
                    <p className="text-sm text-slate-500 line-clamp-2">
                      {doc.description || "No description"}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      <span className="badge badge-secondary">
                        {doc.category || "General"}
                      </span>
                      <span className="badge badge-info">
                        {getVisibilityLabel(doc)}
                      </span>
                      <span className="badge badge-secondary">
                        {doc.file_size
                          ? Math.round(doc.file_size / 1024)
                          : 0}{" "}
                        KB
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                  <a
                    href={`${api_url}/office-documents/${doc.id}/download`}
                    target="_blank"
                    rel="noopener"
                    className="btn btn-info btn-sm flex-1"
                  >
                    <i className="fas fa-download" /> Download
                  </a>
                  {isScannable(doc) && (
                    <button
                      className="btn btn-warning btn-sm"
                      onClick={() => handleOCR(doc)}
                      title="Scan and select document text"
                    >
                      <i className="fas fa-file-scan" /> Scan
                    </button>
                  )}
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(doc.id)}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <i className="fas fa-spinner fa-spin" />
                    ) : (
                      <i className="fas fa-trash" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================
          UPLOAD MODAL
         ============================================================ */}
      {showUpload && (
        <div className="modal-overlay" onClick={() => setShowUpload(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Upload Office Document</h3>
              <button
                className="modal-close"
                onClick={() => setShowUpload(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleUpload}>
              <div className="modal-body space-y-4">
                <div className="form-group">
                  <label className="label">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="input"
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="label">Description</label>
                  <textarea
                    className="input min-h-[80px]"
                    rows={3}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="label">
                    File <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    className="input p-1.5"
                    required
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  {file && isImageFile(file) && (
                    <p className="text-xs text-gold-600 mt-1">
                      <i className="fas fa-file-scan mr-1" />
                      After upload, you can scan this image to extract text and create a PDF or Word file
                    </p>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowUpload(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={uploadMut.isPending}
                >
                  {uploadMut.isPending ? (
                    <>
                      <i className="fas fa-spinner fa-spin" /> Uploading...
                    </>
                  ) : (
                    "Upload"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          SCANNER MODAL
         ============================================================ */}
      {scannerModal && (
        <ScannerModal
          isOpen={scannerModal.open}
          onClose={closeScannerModal}
          file={scannerModal.file}
          fileName={scannerModal.fileName}
          documentId={scannerModal.documentId}
          documentType="office"
          onTextExtracted={(text) => {
            toast.success("Selected text ready");
          }}
        />
      )}
    </div>
  );
};

export default DocumentLibrary;
