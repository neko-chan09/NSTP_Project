// src/pages/faculty/MaterialUpload.tsx

import React, { useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { facultyApi } from "../../services/api";
import { useClassMaterials, getFileVisual, formatFileSize } from "../hooks/useMaterials";
import toast from "react-hot-toast";

interface SelectedFile {
  id: string;
  file: File;
  title: string;
  description: string;
  status: "pending" | "uploading" | "success" | "error";
  errorMessage?: string;
  progress: number;
}

const MaterialUpload: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const classId = id ? parseInt(id, 10) : undefined;
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  // ---------- Class info ----------
  const { data: classData } = useQuery({
    queryKey: ["faculty", "class", classId],
    queryFn: () => facultyApi.getClass(classId!),
    enabled: !!classId,
    staleTime: 60000,
  });

  // ---------- Files ----------
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [commonTopic, setCommonTopic] = useState("");
  const [commonDescription, setCommonDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // ---------- Aggregate progress ----------
  const overallProgress = useMemo(() => {
    if (files.length === 0) return 0;
    return (
      files.reduce((sum, f) => sum + f.progress, 0) / files.length
    );
  }, [files]);

  const successCount = files.filter((f) => f.status === "success").length;
  const errorCount = files.filter((f) => f.status === "error").length;
  const pendingCount = files.filter((f) => f.status === "pending").length;

  // ---------- File picker ----------
  const handlePickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);
    if (picked.length === 0) return;

    const newEntries: SelectedFile[] = picked.map((f) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file: f,
      title: f.name.replace(/\.[^/.]+$/, ""),
      description: "",
      status: "pending",
      progress: 0,
    }));

    setFiles((prev) => [...prev, ...newEntries]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const updateFile = (id: string, patch: Partial<SelectedFile>) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    );
  };

  // ---------- Upload ----------
  const handleUploadAll = async () => {
    if (!classId) return;
    if (files.length === 0) return toast.error("Please pick at least one file");

    const invalid = files.filter((f) => !f.title.trim() && f.status === "pending");
    if (invalid.length > 0) {
      return toast.error(
        `${invalid.length} file(s) missing a title — please fill them in.`,
      );
    }

    setIsUploading(true);

    // Upload sequentially — simpler error handling, avoids hammering the API
    for (const entry of files) {
      if (entry.status === "success") continue;

      updateFile(entry.id, { status: "uploading", progress: 10 });
      const timer = setInterval(() => {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === entry.id && f.status === "uploading" && f.progress < 90
              ? { ...f, progress: f.progress + 10 }
              : f,
          ),
        );
      }, 200);

      const fd = new FormData();
      fd.append("title", entry.title.trim());
      fd.append("description", entry.description.trim());
      fd.append(
        "topic",
        (commonTopic || "").trim(),
      );
      // If per-file description is empty, use common description
      if (!entry.description.trim() && commonDescription.trim()) {
        fd.set("description", commonDescription.trim());
      }
      fd.append("file", entry.file);

      try {
        await facultyApi.uploadMaterial(classId, fd);
        clearInterval(timer);
        updateFile(entry.id, { status: "success", progress: 100 });
      } catch (err: any) {
        clearInterval(timer);
        updateFile(entry.id, {
          status: "error",
          progress: 0,
          errorMessage: err?.message || "Upload failed",
        });
      }
    }

    setIsUploading(false);

    const finalSuccess = files.filter((f) => f.status === "success").length;
    // (state may lag one tick — recompute after next render is fine, but we
    // can also check fresh values below)
    setTimeout(() => {
      setFiles((prev) => {
        const s = prev.filter((f) => f.status === "success").length;
        const e = prev.filter((f) => f.status === "error").length;
        if (s > 0 && e === 0) {
          toast.success(`Uploaded ${s} file${s !== 1 ? "s" : ""} successfully`);
        } else if (s > 0 && e > 0) {
          toast(`Uploaded ${s}, failed ${e}`, { icon: "⚠️" });
        } else if (e > 0) {
          toast.error(`All ${e} upload(s) failed`);
        }
        return prev;
      });
    }, 100);
  };

  const handleFinish = () => {
    navigate(`/faculty/classes/${classId}/materials`);
  };

  // ---------- Render ----------
  if (!classId) {
    return (
      <div className="text-center py-12 text-slate-500">
        <i className="fas fa-exclamation-circle text-4xl text-red-400 block mb-3" />
        Invalid class ID
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* ============================================================ */}
      {/* HEADER */}
      {/* ============================================================ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() =>
              navigate(`/faculty/classes/${classId}/materials`)
            }
            disabled={isUploading}
          >
            <i className="fas fa-arrow-left" /> Back
          </button>
          <div>
            <h2 className="text-2xl font-bold text-navy-900">
              <i className="fas fa-layer-group text-gold-500 mr-2" />
              Bulk Upload Materials
            </h2>
            <p className="text-sm text-slate-500">
              {classData?.name || "Class"} — upload multiple files at once
            </p>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* INFO */}
      {/* ============================================================ */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <i className="fas fa-info-circle text-blue-500 mt-0.5" />
        <div className="text-sm text-blue-700">
          <p className="font-medium">How bulk upload works</p>
          <ul className="list-disc list-inside mt-1 space-y-0.5 text-xs">
            <li>Pick multiple files (PDF, DOC, PPT, XLS, images, ZIP, etc.)</li>
            <li>Give each file a title — descriptions are optional</li>
            <li>Set a shared topic that applies to all files (optional)</li>
            <li>Uploads run one at a time so partial failures are recoverable</li>
          </ul>
        </div>
      </div>

      {/* ============================================================ */}
      {/* COMMON FIELDS */}
      {/* ============================================================ */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
        <div>
          <label className="label">
            Common topic{" "}
            <span className="text-xs text-slate-400">
              (applies to all files)
            </span>
          </label>
          <input
            type="text"
            className="input"
            placeholder="e.g. Chapter 1, Orientation, Week 3"
            value={commonTopic}
            onChange={(e) => setCommonTopic(e.target.value)}
            disabled={isUploading}
            maxLength={100}
          />
        </div>

        <div>
          <label className="label">
            Common description{" "}
            <span className="text-xs text-slate-400">
              (used when a file has no description)
            </span>
          </label>
          <textarea
            className="input min-h-[80px]"
            placeholder="Description shown to students for every file in this batch"
            value={commonDescription}
            onChange={(e) => setCommonDescription(e.target.value)}
            disabled={isUploading}
          />
        </div>

        {/* Dropzone */}
        <div>
          <label className="label">Files</label>
          <div
            className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-gold-400 hover:bg-gold-50/30 transition-colors"
            onClick={() => !isUploading && inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handlePickFiles}
              disabled={isUploading}
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar,.jpg,.jpeg,.png,.gif,.webp,.txt,.mp4,.mp3"
            />
            <div className="w-14 h-14 rounded-full bg-gold-100 flex items-center justify-center mx-auto mb-3">
              <i className="fas fa-cloud-upload-alt text-xl text-gold-600" />
            </div>
            <p className="text-sm font-medium text-navy-900">
              Click to choose files
            </p>
            <p className="text-xs text-slate-500 mt-1">
              You can pick multiple files at once
            </p>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* PROGRESS */}
      {/* ============================================================ */}
      {files.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4 text-xs">
              <span className="text-slate-600">
                <i className="fas fa-file mr-1" /> {files.length} file
                {files.length !== 1 ? "s" : ""}
              </span>
              {successCount > 0 && (
                <span className="text-emerald-600">
                  <i className="fas fa-check-circle mr-1" /> {successCount}{" "}
                  uploaded
                </span>
              )}
              {errorCount > 0 && (
                <span className="text-red-600">
                  <i className="fas fa-times-circle mr-1" /> {errorCount} failed
                </span>
              )}
              {pendingCount > 0 && (
                <span className="text-slate-400">
                  <i className="fas fa-clock mr-1" /> {pendingCount} pending
                </span>
              )}
            </div>
            {isUploading && (
              <span className="text-sm font-medium text-navy-900">
                {Math.round(overallProgress)}%
              </span>
            )}
          </div>

          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gold-500 transition-all duration-300"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* FILE LIST */}
      {/* ============================================================ */}
      {files.length > 0 && (
        <div className="space-y-3">
          {files.map((entry) => {
            const visual = getFileVisual(entry.file.name);
            const isDisabled =
              isUploading ||
              entry.status === "success" ||
              entry.status === "uploading";

            return (
              <div
                key={entry.id}
                className={`bg-white rounded-xl shadow-sm border p-4 ${
                  entry.status === "success"
                    ? "border-emerald-300 bg-emerald-50/30"
                    : entry.status === "error"
                      ? "border-red-300 bg-red-50/30"
                      : "border-slate-200"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${visual.bg}`}
                  >
                    <i className={`fas ${visual.icon} text-lg ${visual.fg}`} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-navy-900 truncate">
                        {entry.file.name}
                      </p>
                      <span className="text-xs text-slate-500 flex-shrink-0">
                        {formatFileSize(entry.file.size)}
                      </span>
                    </div>

                    {/* Status pill */}
                    <div className="mt-1">
                      {entry.status === "success" && (
                        <span className="text-xs text-emerald-600">
                          <i className="fas fa-check-circle mr-1" /> Uploaded
                        </span>
                      )}
                      {entry.status === "error" && (
                        <span className="text-xs text-red-600">
                          <i className="fas fa-times-circle mr-1" />{" "}
                          {entry.errorMessage || "Failed"}
                        </span>
                      )}
                      {entry.status === "uploading" && (
                        <span className="text-xs text-blue-600">
                          <i className="fas fa-spinner fa-spin mr-1" />{" "}
                          Uploading… {entry.progress}%
                        </span>
                      )}
                      {entry.status === "pending" && (
                        <span className="text-xs text-slate-400">
                          <i className="fas fa-clock mr-1" /> Ready
                        </span>
                      )}
                    </div>

                    {/* Fields */}
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                      <input
                        type="text"
                        className="input text-sm"
                        placeholder="Title (required)"
                        value={entry.title}
                        onChange={(e) =>
                          updateFile(entry.id, { title: e.target.value })
                        }
                        disabled={isDisabled}
                        maxLength={255}
                      />
                      <input
                        type="text"
                        className="input text-sm"
                        placeholder="Description (optional)"
                        value={entry.description}
                        onChange={(e) =>
                          updateFile(entry.id, { description: e.target.value })
                        }
                        disabled={isDisabled}
                      />
                    </div>
                  </div>

                  {/* Remove */}
                  <button
                    className="btn btn-danger btn-sm flex-shrink-0"
                    onClick={() => removeFile(entry.id)}
                    disabled={isUploading || entry.status === "uploading"}
                    title="Remove"
                  >
                    <i className="fas fa-times" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================ */}
      {/* ACTIONS */}
      {/* ============================================================ */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col sm:flex-row gap-2 justify-end">
        <button
          className="btn btn-secondary"
          onClick={handleFinish}
          disabled={isUploading}
        >
          <i className="fas fa-arrow-left mr-1" />
          Back to materials
        </button>
        {successCount === files.length && files.length > 0 ? (
          <button className="btn btn-primary" onClick={handleFinish}>
            <i className="fas fa-check mr-1" /> Done
          </button>
        ) : (
          <button
            className="btn btn-primary"
            onClick={handleUploadAll}
            disabled={
              isUploading ||
              files.length === 0 ||
              pendingCount === 0
            }
          >
            {isUploading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-1" />
                Uploading… {Math.round(overallProgress)}%
              </>
            ) : (
              <>
                <i className="fas fa-cloud-upload-alt mr-1" />
                Upload {pendingCount} file{pendingCount !== 1 ? "s" : ""}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default MaterialUpload;