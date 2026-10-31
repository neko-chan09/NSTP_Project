// src/pages/faculty/Materials.tsx

import React, { useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { facultyApi } from "../../services/api";
import {
  useClassMaterials,
  useDeleteMaterial,
  useUpdateMaterial,
  useUploadMaterial,
  getFileVisual,
  formatFileSize,
  formatTimeAgo,
  type LearningMaterial,
} from "../hooks/useMaterials";
import RefreshButton from "../components/common/RefreshButton";
import toast from "react-hot-toast";

const Materials: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const classId = id ? parseInt(id, 10) : undefined;
  const navigate = useNavigate();

  // ---------- Data ----------
  const {
    data: materials = [],
    isLoading,
    error,
    refetch,
    isRefreshing,
  } = useClassMaterials(classId);

  const { data: classData } = useQuery({
    queryKey: ["faculty", "class", classId],
    queryFn: () => facultyApi.getClass(classId!),
    enabled: !!classId,
    staleTime: 60000,
  });

  const uploadMut = useUploadMaterial(classId);
  const updateMut = useUpdateMaterial(classId);
  const deleteMut = useDeleteMaterial(classId);

  // ---------- UI state ----------
  const [searchQuery, setSearchQuery] = useState("");
  const [topicFilter, setTopicFilter] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<LearningMaterial | null>(null);

  // ---------- Derived ----------
  const topics = useMemo(() => {
    const set = new Set<string>();
    materials.forEach((m) => m.topic && set.add(m.topic));
    return Array.from(set).sort();
  }, [materials]);

  const filtered = useMemo(() => {
    let list = materials;
    if (topicFilter) list = list.filter((m) => m.topic === topicFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          (m.description || "").toLowerCase().includes(q) ||
          (m.topic || "").toLowerCase().includes(q) ||
          m.file_name.toLowerCase().includes(q),
      );
    }
    return list;
  }, [materials, searchQuery, topicFilter]);

  const stats = useMemo(() => {
    const withTopic = materials.filter((m) => m.topic).length;
    const totalSize = materials.reduce((sum, m) => sum + (m.file_size || 0), 0);
    return {
      total: materials.length,
      withTopic,
      totalSize,
      showing: filtered.length,
    };
  }, [materials, filtered]);

  const isFiltering = !!searchQuery.trim() || !!topicFilter;

  // ---------- Handlers ----------
  const handleDelete = (material: LearningMaterial) => {
    if (!window.confirm(`Delete "${material.title}"? This cannot be undone.`)) return;
    deleteMut.mutate(material.id, {
      onSuccess: () => toast.success("Material deleted"),
      onError: (err: any) => toast.error(err.message || "Failed to delete"),
    });
  };

  const handleDownload = (material: LearningMaterial) => {
    // Server endpoint expects auth header; use a blob download trick
    const token = localStorage.getItem("token") || localStorage.getItem("nstp_token");
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

    fetch(`${API_URL}/faculty/materials/${material.id}/download`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Download failed (${res.status})`);
        return res.blob();
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = material.file_name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        toast.success("Download started");
      })
      .catch((err) => toast.error(err.message || "Download failed"));
  };

  const handleCopyLink = (material: LearningMaterial) => {
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
    const url = `${API_URL}/faculty/materials/${material.id}/download`;
    navigator.clipboard.writeText(url);
    toast.success("Download link copied");
  };

  // ---------- Render ----------
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="spinner" />
        <span className="ml-3 text-slate-500">Loading materials…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        <i className="fas fa-exclamation-circle mr-2" />
        Failed to load materials: {(error as Error).message}
        <button className="btn btn-primary btn-sm ml-3" onClick={() => refetch()}>
          <i className="fas fa-redo" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ============================================================ */}
      {/* HEADER */}
      {/* ============================================================ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate(`/faculty/classes/${classId}`)}
          >
            <i className="fas fa-arrow-left" /> Back
          </button>
          <div>
            <h2 className="text-2xl font-bold text-navy-900">
              <i className="fas fa-folder-open text-gold-500 mr-2" />
              Learning Materials
            </h2>
            <p className="text-sm text-slate-500">
              {classData?.name || "Class"}
              {classData?.component_type && (
                <span className="ml-2 badge bg-blue-100 text-blue-800">
                  {classData.component_type.toUpperCase()}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <RefreshButton
            onRefresh={refetch}
            isLoading={isRefreshing}
            label=""
            className="btn-sm"
          />
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowUploadModal(true)}
          >
            <i className="fas fa-cloud-upload-alt mr-1" /> Upload Single
          </button>
          <button
            className="btn btn-success btn-sm"
            onClick={() => navigate(`/faculty/classes/${classId}/materials/upload`)}
          >
            <i className="fas fa-layer-group mr-1" /> Bulk Upload
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SEARCH + FILTERS */}
      {/* ============================================================ */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-wrap items-center gap-3">
          <div className="search-box flex-1 min-w-[240px]">
            <i className="fas fa-search" />
            <input
              type="text"
              placeholder="Search by title, topic, file name…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="text-slate-400 hover:text-slate-600 px-2"
                onClick={() => setSearchQuery("")}
              >
                <i className="fas fa-times" />
              </button>
            )}
          </div>

          {topics.length > 0 && (
            <select
              className="px-4 py-2.5 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
              value={topicFilter || ""}
              onChange={(e) => setTopicFilter(e.target.value || null)}
            >
              <option value="">All Topics</option>
              {topics.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          )}
        </div>

        {isFiltering && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Showing <strong>{stats.showing}</strong> of {stats.total} materials
            </span>
            <button
              className="text-gold-600 hover:text-gold-700"
              onClick={() => {
                setSearchQuery("");
                setTopicFilter(null);
              }}
            >
              <i className="fas fa-times mr-1" /> Clear filters
            </button>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* STATS */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-navy-600">
          <span className="block text-xs text-slate-500">Total materials</span>
          <span className="text-2xl font-bold text-navy-900">
            {stats.total}
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-gold-500">
          <span className="block text-xs text-slate-500">With topics</span>
          <span className="text-2xl font-bold text-navy-900">
            {stats.withTopic}
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-emerald-500">
          <span className="block text-xs text-slate-500">Total size</span>
          <span className="text-2xl font-bold text-navy-900">
            {formatFileSize(stats.totalSize)}
          </span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* LIST */}
      {/* ============================================================ */}
      {filtered.length === 0 ? (
        <div className="empty-state bg-white rounded-xl border border-slate-200 py-16 text-center">
          <i
            className={`fas ${
              isFiltering ? "fa-search" : "fa-folder-open"
            } text-4xl text-slate-300 block mb-3`}
          />
          <p className="text-slate-500">
            {isFiltering
              ? "No materials match your filters"
              : "No materials uploaded yet"}
          </p>
          {isFiltering ? (
            <button
              className="btn btn-secondary mt-4"
              onClick={() => {
                setSearchQuery("");
                setTopicFilter(null);
              }}
            >
              <i className="fas fa-times mr-1" /> Clear filters
            </button>
          ) : (
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              <button
                className="btn btn-primary"
                onClick={() => setShowUploadModal(true)}
              >
                <i className="fas fa-cloud-upload-alt mr-1" /> Upload a file
              </button>
              <button
                className="btn btn-success"
                onClick={() =>
                  navigate(`/faculty/classes/${classId}/materials/upload`)
                }
              >
                <i className="fas fa-layer-group mr-1" /> Bulk upload
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filtered.map((material) => {
            const visual = getFileVisual(material.file_name);
            const isDeleting =
              deleteMut.isPending && deleteMut.variables === material.id;

            return (
              <div
                key={material.id}
                className={`bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow ${
                  isDeleting ? "opacity-50" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* File icon */}
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${visual.bg}`}
                  >
                    <i className={`fas ${visual.icon} text-lg ${visual.fg}`} />
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-navy-900 truncate max-w-full">
                        {material.title}
                      </h3>
                      {material.topic && (
                        <span className="badge bg-blue-100 text-blue-700 text-xs">
                          <i className="fas fa-tag mr-1 text-[9px]" />
                          {material.topic}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                      <span>
                        <i className="fas fa-file mr-1" />
                        {material.file_name}
                      </span>
                      <span>
                        <i className="fas fa-hdd mr-1" />
                        {formatFileSize(material.file_size)}
                      </span>
                      <span>
                        <i className="fas fa-clock mr-1" />
                        {formatTimeAgo(material.created_at)}
                      </span>
                      {material.creator && (
                        <span>
                          <i className="fas fa-user mr-1" />
                          {material.creator.first_name} {material.creator.last_name}
                        </span>
                      )}
                    </div>

                    {material.description && (
                      <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                        {material.description}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      className="btn btn-info btn-sm"
                      onClick={() => handleDownload(material)}
                      title="Download"
                    >
                      <i className="fas fa-download" />
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleCopyLink(material)}
                      title="Copy download link"
                    >
                      <i className="fas fa-link" />
                    </button>
                    <button
                      className="btn btn-warning btn-sm"
                      onClick={() => setEditingMaterial(material)}
                      title="Edit details"
                    >
                      <i className="fas fa-edit" />
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(material)}
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
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================ */}
      {/* UPLOAD MODAL */}
      {/* ============================================================ */}
      {showUploadModal && (
        <UploadMaterialModal
          classId={classId!}
          uploadMut={uploadMut}
          onClose={() => setShowUploadModal(false)}
        />
      )}

      {/* ============================================================ */}
      {/* EDIT MODAL */}
      {/* ============================================================ */}
      {editingMaterial && (
        <EditMaterialModal
          material={editingMaterial}
          updateMut={updateMut}
          onClose={() => setEditingMaterial(null)}
        />
      )}
    </div>
  );
};

// ==================================================================
// UPLOAD MODAL
// ==================================================================
interface UploadModalProps {
  classId: number;
  uploadMut: ReturnType<typeof useUploadMaterial>;
  onClose: () => void;
}

const UploadMaterialModal: React.FC<UploadModalProps> = ({
  classId,
  uploadMut,
  onClose,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    if (f && !title) {
      // Auto-fill title from file name (without extension)
      const base = f.name.replace(/\.[^/.]+$/, "");
      setTitle(base);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return toast.error("Please select a file");
    if (!title.trim()) return toast.error("Please enter a title");

    const fd = new FormData();
    fd.append("title", title.trim());
    fd.append("description", description.trim());
    fd.append("topic", topic.trim());
    fd.append("file", file);

    // Simulated progress — axios's onUploadProgress isn't used here
    // because facultyApi.uploadMaterial goes through mutateWithQueue
    // which doesn't expose progress. We fake it.
    setProgress(10);
    const timer = setInterval(() => {
      setProgress((p) => (p < 90 ? p + 10 : p));
    }, 200);

    uploadMut.mutate(fd, {
      onSuccess: () => {
        clearInterval(timer);
        setProgress(100);
        toast.success("Material uploaded");
        onClose();
      },
      onError: (err: any) => {
        clearInterval(timer);
        setProgress(0);
        toast.error(err.message || "Upload failed");
      },
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <i className="fas fa-cloud-upload-alt text-gold-500 mr-2" />
            Upload Material
          </h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            <div className="form-group">
              <label className="label">
                File <span className="text-red-500">*</span>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                className="input p-2"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar,.jpg,.jpeg,.png,.gif,.webp,.txt,.mp4,.mp3"
                required
              />
              {file && (
                <p className="text-xs text-emerald-600 mt-1">
                  <i className="fas fa-check-circle mr-1" />
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            <div className="form-group">
              <label className="label">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Module 1 — Introduction"
                maxLength={255}
                required
              />
            </div>

            <div className="form-group">
              <label className="label">
                Topic{" "}
                <span className="text-xs text-slate-400">(optional)</span>
              </label>
              <input
                type="text"
                className="input"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Chapter 1, Orientation"
                maxLength={100}
              />
            </div>

            <div className="form-group">
              <label className="label">
                Description{" "}
                <span className="text-xs text-slate-400">(optional)</span>
              </label>
              <textarea
                className="input min-h-[80px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description for your students"
              />
            </div>

            {progress > 0 && (
              <div>
                <div className="flex items-center justify-between text-xs mb-1 text-slate-600">
                  <span>Uploading…</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gold-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={uploadMut.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={uploadMut.isPending || !file || !title.trim()}
            >
              {uploadMut.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-1" /> Uploading…
                </>
              ) : (
                <>
                  <i className="fas fa-upload mr-1" /> Upload
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==================================================================
// EDIT MODAL
// ==================================================================
interface EditModalProps {
  material: LearningMaterial;
  updateMut: ReturnType<typeof useUpdateMaterial>;
  onClose: () => void;
}

const EditMaterialModal: React.FC<EditModalProps> = ({
  material,
  updateMut,
  onClose,
}) => {
  const [title, setTitle] = useState(material.title);
  const [topic, setTopic] = useState(material.topic || "");
  const [description, setDescription] = useState(material.description || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Please enter a title");

    updateMut.mutate(
      {
        id: material.id,
        data: {
          title: title.trim(),
          topic: topic.trim(),
          description: description.trim(),
        },
      },
      {
        onSuccess: () => {
          toast.success("Material updated");
          onClose();
        },
        onError: (err: any) =>
          toast.error(err.message || "Failed to update material"),
      },
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <i className="fas fa-edit text-gold-500 mr-2" />
            Edit Material
          </h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-600 border border-slate-200">
              <i className="fas fa-file mr-2" />
              {material.file_name} · {formatFileSize(material.file_size)}
            </div>

            <div className="form-group">
              <label className="label">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={255}
                required
              />
            </div>

            <div className="form-group">
              <label className="label">Topic</label>
              <input
                type="text"
                className="input"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                maxLength={100}
              />
            </div>

            <div className="form-group">
              <label className="label">Description</label>
              <textarea
                className="input min-h-[100px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={updateMut.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={updateMut.isPending}
            >
              {updateMut.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-1" /> Saving…
                </>
              ) : (
                <>
                  <i className="fas fa-save mr-1" /> Save changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Materials;