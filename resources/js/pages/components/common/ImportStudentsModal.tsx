// resources/js/components/common/ImportStudentsModal.tsx
import React, { useRef, useState } from "react";
import { adminApi } from "../../../services/api";
import toast from "react-hot-toast";

interface ImportStudentsModalProps {
  onClose: () => void;
  /**
   * Called after a batch is successfully created.
   * The parent will start polling + showing the progress bar.
   */
  onBatchStarted: (batchId: number) => void;
}

type Mode = "create" | "update" | "upsert";

const ImportStudentsModal: React.FC<ImportStudentsModalProps> = ({
  onClose,
  onBatchStarted,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<Mode>("upsert");
  const [schoolYear, setSchoolYear] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await adminApi.downloadStudentTemplate();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "students_template.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Template downloaded");
    } catch (err: any) {
      toast.error(err.message || "Failed to download template");
    }
  };

  const handleStart = async () => {
    if (!file) {
      toast.error("Please select a CSV file");
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("mode", mode);
      if (schoolYear) fd.append("school_year", schoolYear);

      const res = await adminApi.startStudentImport(fd);

      if (!res.success) throw new Error(res.message || "Failed to start");

      toast.success(`Uploading... ${res.total_rows} rows queued`);

      // Hand control to the parent — it will show the progress bar
      onBatchStarted(res.batch_id);

      // Close immediately
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to start import");
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => !uploading && onClose()}>
      <div className="modal max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>
              <i className="fas fa-file-import text-gold-500 mr-2" />
              Import Students
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              The import runs in the background. Progress is shown on the
              Students page.
            </p>
          </div>
          <button
            className="modal-close"
            onClick={onClose}
            disabled={uploading}
          >
            ×
          </button>
        </div>

        <div className="modal-body space-y-4">
          {/* Info banner */}
          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs">
            <div className="flex items-start gap-2">
              <i className="fas fa-info-circle text-emerald-600 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-800">
                  Supported columns
                </p>
                <p className="text-emerald-700 mt-0.5">
                  student_id, class_code, component, section, last_name,
                  first_name, email, course, year_level, password, gender,
                  birth_date, address, contact_number,
                  emergency_contact_name, emergency_contact_number,
                  serial_no, school_year
                </p>
                <p className="text-emerald-600 mt-1 italic">
                  Extra columns are ignored. Default password:{" "}
                  <code className="bg-white px-1 rounded">password123</code>.
                </p>
              </div>
            </div>
          </div>

          {/* Template */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 flex flex-wrap gap-2 items-center">
            <i className="fas fa-info-circle text-blue-600" />
            <span className="text-sm text-blue-700">Need a template?</span>
            <button
              className="btn btn-info btn-sm"
              onClick={handleDownloadTemplate}
            >
              <i className="fas fa-download" /> Download Template
            </button>
          </div>

          {/* File */}
          <div className="form-group">
            <label className="label">
              CSV File <span className="text-red-500">*</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="input p-2"
              onChange={handleFileChange}
              disabled={uploading}
            />
            {file && (
              <p className="text-xs text-emerald-600 mt-1">
                <i className="fas fa-check-circle mr-1" />
                {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Import Mode</label>
              <select
                className="input"
                value={mode}
                onChange={(e) => setMode(e.target.value as Mode)}
                disabled={uploading}
              >
                <option value="upsert">Upsert — create + update</option>
                <option value="create">Create only</option>
                <option value="update">Update only</option>
              </select>
            </div>

            <div className="form-group">
              <label className="label">
                School Year{" "}
                <span className="text-xs text-slate-400">(optional)</span>
              </label>
              <input
                type="text"
                className="input"
                placeholder="2025-2026"
                value={schoolYear}
                onChange={(e) => setSchoolYear(e.target.value)}
                disabled={uploading}
              />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            onClick={onClose}
            disabled={uploading}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleStart}
            disabled={!file || uploading}
          >
            {uploading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-1" /> Uploading...
              </>
            ) : (
              <>
                <i className="fas fa-upload mr-1" /> Start Import
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportStudentsModal;