// resources/js/pages/admin/SuperAdmin/FacultyImport.tsx
import React, { useRef, useState } from "react";
import { superAdminApi } from "../../../services/api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

type Mode = "create" | "update" | "upsert";

const FacultyImport: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<Mode>("upsert");
  const [dryRun, setDryRun] = useState(true);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setResult(null);
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await superAdminApi.downloadFacultyTemplate();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "faculty_template.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Template downloaded");
    } catch (err: any) {
      toast.error(err.message || "Failed to download template");
    }
  };

  const handleExport = async () => {
    try {
      const blob = await superAdminApi.exportFacultyCsv();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `faculty_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Export started");
    } catch (err: any) {
      toast.error(err.message || "Export failed");
    }
  };

  const handleRun = async () => {
    if (!file) {
      toast.error("Please select a CSV file");
      return;
    }
    setImporting(true);
    setResult(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("mode", mode);
      fd.append("dry_run", dryRun ? "1" : "0");

      const res = await superAdminApi.importFacultyCsv(fd);
      setResult(res);
      toast.success(res.message || "Done");
    } catch (err: any) {
      toast.error(err.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold text-navy-900">
            <i className="fas fa-chalkboard-teacher text-gold-500 mr-2" />
            Faculty Import / Export
          </h2>
          <p className="text-sm text-slate-500">
            Bulk manage faculty accounts via CSV
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleExport}
          >
            <i className="fas fa-download" /> Export Faculty
          </button>
          <button
            className="btn btn-info btn-sm"
            onClick={() => navigate("/admin/superadmin")}
          >
            <i className="fas fa-arrow-left" /> Back
          </button>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
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
            disabled={importing}
          />
          {file && (
            <p className="text-xs text-emerald-600 mt-1">
              <i className="fas fa-check-circle mr-1" />
              {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>

        {/* Mode */}
        <div className="form-group">
          <label className="label">Import Mode</label>
          <select
            className="input"
            value={mode}
            onChange={(e) => setMode(e.target.value as Mode)}
            disabled={importing}
          >
            <option value="upsert">Upsert — create new + update existing</option>
            <option value="create">Create only — skip existing</option>
            <option value="update">Update only — skip unknown</option>
          </select>
        </div>

        {/* Dry run */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={dryRun}
            onChange={(e) => setDryRun(e.target.checked)}
            disabled={importing}
            className="w-4 h-4 accent-gold-500"
          />
          <span className="text-sm font-medium">
            Dry-run (preview only — no changes saved)
          </span>
        </label>

        {/* Run */}
        <button
          className="btn btn-primary w-full"
          onClick={handleRun}
          disabled={!file || importing}
        >
          {importing ? (
            <>
              <i className="fas fa-spinner fa-spin mr-1" /> Processing...
            </>
          ) : dryRun ? (
            <>
              <i className="fas fa-eye mr-1" /> Preview
            </>
          ) : (
            <>
              <i className="fas fa-upload mr-1" /> Import
            </>
          )}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-emerald-50 rounded p-3">
              <div className="text-xs text-emerald-700">Created</div>
              <div className="font-bold">{result.data?.created ?? 0}</div>
            </div>
            <div className="bg-blue-50 rounded p-3">
              <div className="text-xs text-blue-700">Updated</div>
              <div className="font-bold">{result.data?.updated ?? 0}</div>
            </div>
            <div className="bg-red-50 rounded p-3">
              <div className="text-xs text-red-700">Skipped</div>
              <div className="font-bold">{result.data?.skipped ?? 0}</div>
            </div>
          </div>

          {result.data?.errors?.length > 0 && (
            <div className="p-3 bg-red-50 rounded border border-red-200 max-h-40 overflow-y-auto">
              <div className="text-xs font-semibold text-red-700 mb-1">
                Errors ({result.data.errors.length})
              </div>
              <ul className="text-xs text-red-600 list-disc list-inside space-y-0.5">
                {result.data.errors.map((e: string, i: number) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          {result.data?.warnings?.length > 0 && (
            <div className="p-3 bg-amber-50 rounded border border-amber-200 max-h-40 overflow-y-auto">
              <div className="text-xs font-semibold text-amber-700 mb-1">
                Warnings ({result.data.warnings.length})
              </div>
              <ul className="text-xs text-amber-600 list-disc list-inside space-y-0.5">
                {result.data.warnings.map((w: string, i: number) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {result.data?.rows?.length > 0 && (
            <div className="p-3 bg-slate-50 rounded border border-slate-200 max-h-60 overflow-y-auto">
              <div className="text-xs font-semibold text-slate-700 mb-1">
                Preview ({result.data.rows.length} rows)
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-200">
                    <th className="text-left py-1">Line</th>
                    <th className="text-left py-1">Name</th>
                    <th className="text-left py-1">Email</th>
                    <th className="text-left py-1">Component</th>
                    <th className="text-left py-1">Class Code</th>
                    <th className="text-left py-1">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {result.data.rows.slice(0, 50).map((r: any, i: number) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="py-1">{r.line}</td>
                      <td className="py-1">{r.name}</td>
                      <td className="py-1 truncate max-w-[160px]">{r.email}</td>
                      <td className="py-1">{r.component || "—"}</td>
                      <td className="py-1 font-mono">{r.class_code || "—"}</td>
                      <td className="py-1">
                        <span className={`badge ${r.action.startsWith("create") ? "badge-success" : "badge-info"}`}>
                          {r.action}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FacultyImport;