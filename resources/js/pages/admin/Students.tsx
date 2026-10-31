// resources/js/pages/admin/Students.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  useStudents,
  useCreateStudent,
  useUpdateStudent,
  useDeleteStudent,
  downloadStudentCsv,
  type StudentFilters,
} from "../hooks/useStudents";
import RefreshButton from "../components/common/RefreshButton";
import StudentDetailsModal from "../components/common/StudentDetailsModal";
import ImportStudentsModal from "../components/common/ImportStudentsModal";
import { adminApi } from "../../services/api";
import toast from "react-hot-toast";
import type { Student } from "../../types/api";

type NstpComponent = "cwts" | "rotc" | "lts" | "";

interface StudentFormData {
  first_name: string;
  last_name: string;
  email: string;
  student_id: string;
  password: string;
  course: string;
  year_level: number;
  section: string;
  nstp_component_selected: NstpComponent;
}

const EMPTY_FORM: StudentFormData = {
  first_name: "",
  last_name: "",
  email: "",
  student_id: "",
  password: "",
  course: "",
  year_level: 1,
  section: "",
  nstp_component_selected: "",
};

const BATCH_STORAGE_KEY = "nstp_active_student_import";
const CHUNK_SIZE = 50;

interface BatchProgress {
  id: number;
  batch_code: string;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  is_running: boolean;
  progress_percent: number;
  total_rows: number;
  processed_rows: number;
  created_count: number;
  updated_count: number;
  enrolled_count: number;
  skipped_count: number;
  errors: string[];
  warnings: string[];
  errors_count: number;
  warnings_count: number;
  started_at: string | null;
  finished_at: string | null;
}

const Students: React.FC = () => {
  // ----- Filters / search (unchanged) -----
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [component, setComponent] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [exporting, setExporting] = useState(false);

  // ----- CRUD modals (unchanged) -----
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [formData, setFormData] = useState<StudentFormData>(EMPTY_FORM);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // ----- Import modal + batch progress -----
  const [showImportModal, setShowImportModal] = useState(false);
  const [batch, setBatch] = useState<BatchProgress | null>(null);

  // Loop control refs
  const loopActiveRef = useRef(false);
  const abortRef = useRef(false);

  // ---------- Data fetching ----------
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const filters: StudentFilters = {
    search,
    component,
    status,
    page,
    per_page: perPage,
  };
  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refresh,
    isRefreshing,
  } = useStudents(filters);

  const students: Student[] = data?.data ?? [];
  const meta = data?.meta;

  const createMut = useCreateStudent();
  const updateMut = useUpdateStudent();
  const deleteMut = useDeleteStudent();

  // ============================================================
  // IMPORT: chunk loop
  // ============================================================
  const runChunkLoop = useCallback(
    async (batchId: number) => {
      if (loopActiveRef.current) return;
      loopActiveRef.current = true;
      abortRef.current = false;

      try {
        while (!abortRef.current) {
          const data: BatchProgress = await adminApi.processStudentImportChunk(
            batchId,
            CHUNK_SIZE,
          );
          setBatch(data);

          if (!data.is_running) {
            localStorage.removeItem(BATCH_STORAGE_KEY);
            break;
          }

          await new Promise((r) => setTimeout(r, 60));
        }
      } catch (err: any) {
        toast.error(err.message || "Import failed");
      } finally {
        loopActiveRef.current = false;
        refresh();
      }
    },
    [refresh],
  );

  // ============================================================
  // IMPORT: on mount — check for an active batch in storage
  // ============================================================
  useEffect(() => {
    const storedId = localStorage.getItem(BATCH_STORAGE_KEY);
    if (!storedId) return;

    const id = parseInt(storedId, 10);
    if (isNaN(id)) {
      localStorage.removeItem(BATCH_STORAGE_KEY);
      return;
    }

    adminApi
      .getStudentImportStatus(id)
      .then((data: BatchProgress) => {
        setBatch(data);

        if (data.is_running) {
          runChunkLoop(id);
        } else {
          localStorage.removeItem(BATCH_STORAGE_KEY);
        }
      })
      .catch(() => {
        localStorage.removeItem(BATCH_STORAGE_KEY);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================================
  // IMPORT: called by the modal after the file is uploaded
  // ============================================================
  const handleBatchStarted = (batchId: number) => {
    localStorage.setItem(BATCH_STORAGE_KEY, String(batchId));

    adminApi
      .getStudentImportStatus(batchId)
      .then((data: BatchProgress) => {
        setBatch(data);
        runChunkLoop(batchId);
      })
      .catch(() => {
        toast.error("Failed to fetch import status");
      });
  };

  // ============================================================
  // IMPORT: cancel
  // ============================================================
  const handleCancelImport = async () => {
    if (!batch) return;
    if (!window.confirm("Cancel this import? Already-processed rows stay.")) return;

    abortRef.current = true;

    try {
      await adminApi.cancelStudentImport(batch.id);
      toast.success("Cancelled");
      const data: BatchProgress = await adminApi.getStudentImportStatus(batch.id);
      setBatch(data);
      localStorage.removeItem(BATCH_STORAGE_KEY);
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel");
    }
  };

  // ============================================================
  // IMPORT: dismiss progress bar (after completion)
  // ============================================================
  const handleDismissProgress = () => {
    setBatch(null);
    localStorage.removeItem(BATCH_STORAGE_KEY);
  };

  // ============================================================
  // CRUD handlers
  // ============================================================
  const openCreate = () => {
    setEditing(null);
    setFormData(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (s: Student) => {
    setEditing(s);
    setFormData({
      first_name: s.user.first_name,
      last_name: s.user.last_name,
      email: s.user.email,
      student_id: s.student_id,
      password: "",
      course: s.course || "",
      year_level: s.year_level || 1,
      section: s.section || "",
      nstp_component_selected:
        (s.nstp_component_selected as NstpComponent) || "",
    });
    setShowModal(true);
  };

  const openDetails = (student: Student) => {
    setSelectedStudent(student);
    setShowDetailsModal(true);
  };

  const updateField = (field: keyof StudentFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Build the payload with the proper NSTP component type
    const payload = {
      ...formData,
      nstp_component_selected:
        formData.nstp_component_selected === ""
          ? null
          : formData.nstp_component_selected,
    };

    try {
      if (editing) {
        await updateMut.mutateAsync({ id: editing.id, payload });
        toast.success("Student updated successfully");
      } else {
        await createMut.mutateAsync(payload);
        toast.success("Student created successfully");
      }
      setShowModal(false);
      setFormData(EMPTY_FORM);
      setEditing(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to save student");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this student?")) return;
    try {
      await deleteMut.mutateAsync(id);
      toast.success("Student deleted successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete student");
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await downloadStudentCsv(component || undefined);
      toast.success("Export started");
    } finally {
      setExporting(false);
    }
  };

  const goToPage = (p: number) => {
    if (meta && p >= 1 && p <= meta.last_page) setPage(p);
  };

  const getStatusBadge = (s: string) =>
    ({
      pending: "badge-warning",
      in_progress: "badge-info",
      completed: "badge-success",
      deficient: "badge-danger",
    })[s] || "badge-secondary";

  const getComponentColor = (comp: string) => {
    const colors: Record<string, string> = {
      cwts: "bg-blue-100 text-blue-800",
      rotc: "bg-red-100 text-red-800",
      lts: "bg-emerald-100 text-emerald-800",
    };
    return colors[comp] || "bg-slate-100 text-slate-800";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="spinner" />
        <span className="ml-3 text-slate-500">Loading students...</span>
      </div>
    );
  }

  const isSaving = createMut.isPending || updateMut.isPending;

  const progressColor = (() => {
    if (!batch) return "bg-blue-500";
    switch (batch.status) {
      case "completed":
        return "bg-emerald-500";
      case "failed":
        return "bg-red-500";
      case "cancelled":
        return "bg-amber-500";
      default:
        return "bg-blue-500";
    }
  })();

  const statusLabel = (s: string) => {
    switch (s) {
      case "pending":
        return "Queued";
      case "processing":
        return "Importing...";
      case "completed":
        return "Completed";
      case "failed":
        return "Failed";
      case "cancelled":
        return "Cancelled";
      default:
        return s;
    }
  };

  return (
    <div className="space-y-5">
      {/* PROGRESS BAR */}
      {batch && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {batch.is_running && (
                  <i className="fas fa-circle-notch fa-spin text-blue-500 text-lg" />
                )}
                {batch.status === "completed" && (
                  <i className="fas fa-check-circle text-emerald-500 text-lg" />
                )}
                {batch.status === "failed" && (
                  <i className="fas fa-times-circle text-red-500 text-lg" />
                )}
                {batch.status === "cancelled" && (
                  <i className="fas fa-stop-circle text-amber-500 text-lg" />
                )}
                <div>
                  <div className="font-semibold text-navy-900 text-sm">
                    {statusLabel(batch.status)} —{" "}
                    {batch.processed_rows} / {batch.total_rows} rows
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    {batch.batch_code}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-navy-900">
                  {batch.progress_percent.toFixed(1)}%
                </span>
                {batch.is_running && (
                  <button
                    className="btn btn-warning btn-sm"
                    onClick={handleCancelImport}
                  >
                    <i className="fas fa-stop" /> Cancel
                  </button>
                )}
                {!batch.is_running && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={handleDismissProgress}
                  >
                    <i className="fas fa-times" /> Dismiss
                  </button>
                )}
              </div>
            </div>

            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${progressColor}`}
                style={{ width: `${batch.progress_percent}%` }}
              />
            </div>

            <div className="flex flex-wrap gap-4 text-xs">
              <span className="text-emerald-700">
                <i className="fas fa-check-circle mr-1" />
                {batch.created_count} created
              </span>
              <span className="text-blue-700">
                <i className="fas fa-pencil-alt mr-1" />
                {batch.updated_count} updated
              </span>
              <span className="text-amber-700">
                <i className="fas fa-user-plus mr-1" />
                {batch.enrolled_count} enrolled
              </span>
              <span className="text-red-700">
                <i className="fas fa-forward mr-1" />
                {batch.skipped_count} skipped
              </span>
              {batch.errors_count > 0 && (
                <span className="text-red-700">
                  <i className="fas fa-exclamation-triangle mr-1" />
                  {batch.errors_count} errors
                </span>
              )}
            </div>

            {!batch.is_running && batch.errors_count > 0 && (
              <details className="mt-2">
                <summary className="text-xs text-red-600 cursor-pointer hover:text-red-700">
                  Show first {Math.min(batch.errors.length, 10)} errors
                </summary>
                <ul className="mt-2 text-xs text-red-600 list-disc list-inside space-y-0.5 max-h-32 overflow-y-auto">
                  {batch.errors.slice(0, 10).map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-2xl font-bold text-navy-900">
          Students Management
        </h2>
        <div className="flex flex-wrap gap-2">
          <RefreshButton
            onRefresh={refresh}
            isLoading={isRefreshing}
            label=""
            className="btn-sm"
          />
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? (
              <>
                <i className="fas fa-spinner fa-spin" /> Exporting...
              </>
            ) : (
              <>
                <i className="fas fa-download" /> Export CSV
              </>
            )}
          </button>
          <button
            className="btn btn-info btn-sm"
            onClick={() => setShowImportModal(true)}
            disabled={!!batch && batch.is_running}
          >
            <i className="fas fa-file-import" /> Import CSV
          </button>
          <button className="btn btn-primary btn-sm" onClick={openCreate}>
            <i className="fas fa-plus" /> Add Student
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex flex-wrap gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="search-box flex-1 min-w-[200px]">
          <i className="fas fa-search" />
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <select
          className="px-4 py-2.5 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
          value={component}
          onChange={(e) => {
            setComponent(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Components</option>
          <option value="cwts">CWTS</option>
          <option value="rotc">ROTC</option>
          <option value="lts">LTS</option>
        </select>
        <select
          className="px-4 py-2.5 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="deficient">Deficient</option>
        </select>
        <select
          className="px-4 py-2.5 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
          value={perPage}
          onChange={(e) => {
            setPerPage(Number(e.target.value));
            setPage(1);
          }}
        >
          <option value={10}>10 per page</option>
          <option value={15}>15 per page</option>
          <option value={25}>25 per page</option>
          <option value={50}>50 per page</option>
        </select>
        {isFetching && (
          <span className="flex items-center text-sm text-slate-500">
            <i className="fas fa-spinner fa-spin mr-2" /> Updating...
          </span>
        )}
      </div>

      {isError && (
        <div className="alert alert-danger">
          Failed to load students: {(error as Error).message}
        </div>
      )}

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
        {isFetching && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
            <div className="flex items-center gap-2 text-slate-600">
              <i className="fas fa-spinner fa-spin text-lg" />
              <span>Refreshing data...</span>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>OCC ID</th>
                <th>Course</th>
                <th>Year</th>
                <th>Section</th>
                <th>Component</th>
                <th>Status</th>
                <th>Eligible</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-500">
                    No students found
                  </td>
                </tr>
              ) : (
                students.map((s) => {
                  const isDeleting =
                    deleteMut.isPending && deleteMut.variables === s.id;
                  return (
                    <tr
                      key={s.id}
                      className={`${isDeleting ? "opacity-50" : ""} cursor-pointer hover:bg-slate-50 transition-colors group`}
                      onClick={() => openDetails(s)}
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gold-100">
                            {s.user.profile_photo_url ? (
                              <img
                                src={s.user.profile_photo_url}
                                alt={`${s.user.first_name} ${s.user.last_name}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-bold text-sm text-white bg-navy-600">
                                {s.user.first_name?.charAt(0)}
                                {s.user.last_name?.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-navy-900 group-hover:text-gold-600 transition-colors">
                              {s.user.first_name} {s.user.last_name}
                            </div>
                            <div className="text-xs text-slate-400">
                              {s.user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="font-bold text-navy-900">{s.student_id}</td>
                      <td>{s.course || "-"}</td>
                      <td>{s.year_level || "-"}</td>
                      <td>{s.section || "-"}</td>
                      <td>
                        {s.nstp_component_selected ? (
                          <span
                            className={`badge ${getComponentColor(s.nstp_component_selected)}`}
                          >
                            {s.nstp_component_selected.toUpperCase()}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400">
                            Not assigned
                          </span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge ${getStatusBadge(s.completion_status)}`}
                        >
                          {s.completion_status?.replace("_", " ") || "N/A"}
                        </span>
                      </td>
                      <td>
                        {s.is_eligible_for_completion ? (
                          <span className="badge badge-success">
                            ✓ Eligible
                          </span>
                        ) : (
                          <span className="badge badge-danger">
                            ✗ Not Eligible
                          </span>
                        )}
                      </td>
                      <td>
                        <div
                          className="flex gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            className="btn btn-info btn-sm"
                            onClick={() => openEdit(s)}
                            disabled={isDeleting}
                          >
                            <i className="fas fa-edit" />
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(s.id)}
                            disabled={deleteMut.isPending}
                          >
                            {isDeleting ? (
                              <i className="fas fa-spinner fa-spin" />
                            ) : (
                              <i className="fas fa-trash" />
                            )}
                          </button>
                          <button
                            className="btn btn-secondary btn-sm opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => openDetails(s)}
                            title="View Details"
                          >
                            <i className="fas fa-eye" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {meta && meta.total > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2 border-t border-slate-200">
          <span className="text-sm text-slate-500">
            Showing {meta.from} – {meta.to} of {meta.total} students
          </span>
          <div className="flex items-center gap-2">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => goToPage(meta.current_page - 1)}
              disabled={meta.current_page <= 1 || isFetching}
            >
              Previous
            </button>
            <span className="text-sm font-medium text-navy-900 px-3">
              Page {meta.current_page} of {meta.last_page}
            </span>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => goToPage(meta.current_page + 1)}
              disabled={meta.current_page >= meta.last_page || isFetching}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* CREATE/EDIT MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? "Edit Student" : "Add New Student"}</h3>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div className="form-group">
                  <label className="label">
                    Student ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={formData.student_id}
                    onChange={(e) => updateField("student_id", e.target.value)}
                    placeholder="e.g. 2025-00001"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="label">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="input"
                      value={formData.first_name}
                      onChange={(e) =>
                        updateField("first_name", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="label">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="input"
                      value={formData.last_name}
                      onChange={(e) => updateField("last_name", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="label">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    className="input"
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="student@example.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="label">
                    Password{" "}
                    {editing ? (
                      <span className="text-sm text-slate-400">
                        (leave blank to keep current)
                      </span>
                    ) : (
                      <span className="text-red-500">*</span>
                    )}
                  </label>
                  <input
                    type="password"
                    className="input"
                    value={formData.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    placeholder={editing ? "••••••••" : "Enter password"}
                    {...(!editing ? { required: true } : {})}
                  />
                </div>

                <div className="form-group">
                  <label className="label">
                    Course <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={formData.course}
                    onChange={(e) => updateField("course", e.target.value)}
                    placeholder="e.g. BSIT"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="label">Year Level</label>
                    <select
                      className="input"
                      value={formData.year_level}
                      onChange={(e) =>
                        updateField("year_level", Number(e.target.value))
                      }
                    >
                      <option value={1}>1st Year</option>
                      <option value={2}>2nd Year</option>
                      <option value={3}>3rd Year</option>
                      <option value={4}>4th Year</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="label">Section</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.section}
                      onChange={(e) => updateField("section", e.target.value)}
                      placeholder="e.g. 1A"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="label">NSTP Component</label>
                  <select
                    className="input"
                    value={formData.nstp_component_selected}
                    onChange={(e) =>
                      updateField(
                        "nstp_component_selected",
                        e.target.value as NstpComponent,
                      )
                    }
                  >
                    <option value="">-- Not Assigned --</option>
                    <option value="cwts">CWTS</option>
                    <option value="rotc">ROTC</option>
                    <option value="lts">LTS</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <i className="fas fa-spinner fa-spin" /> Saving...
                    </>
                  ) : (
                    "Save"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Details Modal */}
      {showDetailsModal && selectedStudent && (
        <StudentDetailsModal
          student={selectedStudent}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedStudent(null);
          }}
        />
      )}

      {/* IMPORT MODAL */}
      {showImportModal && (
        <ImportStudentsModal
          onClose={() => setShowImportModal(false)}
          onBatchStarted={handleBatchStarted}
        />
      )}
    </div>
  );
};

export default Students;