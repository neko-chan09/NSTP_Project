// resources/js/pages/admin/Classes.tsx

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi, API_URL } from "../../services/api";
import type { ClassGroup } from "../../types/api";
import RefreshButton from "../components/common/RefreshButton";
import toast from "react-hot-toast";
import {
  useClasses,
  useClassSchoolYears,
  useCreateClass,
  useUpdateClass,
  useDeleteClass,
  useToggleArchiveClass,
} from "../hooks/useClasses";

interface Faculty {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  nstp_component?: string;
  role: string;
}

type ViewMode = "list" | "grid";

const Classes: React.FC = () => {
  const [filterComponent, setFilterComponent] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSchoolYear, setFilterSchoolYear] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassGroup | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    component_type: "all" as "cwts" | "rotc" | "lts" | "all",
    teacher_id: "",
    class_code: "",
    school_year: "",
  });

  const {
    data: classes = [],
    isLoading,
    refetch,
    isRefreshing,
  } = useClasses({
    component_type: filterComponent === "all" ? undefined : filterComponent,
    status: filterStatus === "all" ? undefined : filterStatus,
    school_year: filterSchoolYear === "all" ? undefined : filterSchoolYear,
  });

  const { data: schoolYears = [] } = useClassSchoolYears();

  const { data: facultyList = [], isLoading: facultyLoading } = useQuery<
    Faculty[]
  >({
    queryKey: ["faculty", "list"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${
          API_URL
        }/admin/users?role=faculty`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
      );
      if (!response.ok) return [];
      const result = await response.json();
      return result.data || [];
    },
    staleTime: 60000,
  });

  const createMutation = useCreateClass();
  const updateMutation = useUpdateClass();
  const deleteMutation = useDeleteClass();
  const toggleArchiveMutation = useToggleArchiveClass();

  const filteredFaculty = useMemo(() => {
    if (!facultyList.length) return [];
    if (formData.component_type === "all") return facultyList;
    return facultyList.filter(
      (f) => f.nstp_component === formData.component_type,
    );
  }, [facultyList, formData.component_type]);

  const filteredClasses = useMemo(() => {
    if (!searchTerm.trim()) return classes;
    const q = searchTerm.toLowerCase();
    return classes.filter(
      (cls) =>
        cls.name.toLowerCase().includes(q) ||
        (cls.description || "").toLowerCase().includes(q) ||
        (cls.class_code || "").toLowerCase().includes(q) ||
        (cls.teacher &&
          `${cls.teacher.first_name} ${cls.teacher.last_name}`
            .toLowerCase()
            .includes(q)),
    );
  }, [classes, searchTerm]);

  // ============================================================
  // Handlers
  // ============================================================
  const openCreate = () => {
    setEditingClass(null);
    setFormData({
      name: "",
      description: "",
      component_type: "all",
      teacher_id: "",
      class_code: "",
      school_year: "",
    });
    setShowCreateModal(true);
  };

  const openEdit = (cls: ClassGroup) => {
    setEditingClass(cls);
    setFormData({
      name: cls.name,
      description: cls.description || "",
      component_type: cls.component_type,
      teacher_id: cls.teacher_id?.toString() || "",
      class_code: cls.class_code || "",
      school_year: cls.school_year || "",
    });
    setShowCreateModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Class name is required");
      return;
    }
    if (!formData.teacher_id) {
      toast.error("Please select an instructor");
      return;
    }
    const payload = {
      ...formData,
      teacher_id: parseInt(formData.teacher_id),
      class_code: formData.class_code || undefined,
      school_year: formData.school_year || undefined,
    };

    if (editingClass) {
      updateMutation.mutate(
        { id: editingClass.id, data: payload },
        {
          onSuccess: () => {
            toast.success("Class updated!");
            setShowCreateModal(false);
            refetch();
          },
          onError: (err: any) => toast.error(err.message || "Failed"),
        },
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("Class created!");
          setShowCreateModal(false);
          refetch();
        },
        onError: (err: any) => toast.error(err.message || "Failed"),
      });
    }
  };

  const handleDelete = (cls: ClassGroup) => {
    if (
      !window.confirm(
        `Delete class "${cls.name}"?\n\nThis will remove all ${cls.students_count || 0} student enrollments.`,
      )
    )
      return;
    deleteMutation.mutate(cls.id, {
      onSuccess: () => {
        toast.success("Class deleted");
        refetch();
      },
      onError: (err: any) => toast.error(err.message || "Failed"),
    });
  };

  const handleToggleArchive = (cls: ClassGroup) => {
    toggleArchiveMutation.mutate(cls.id, {
      onSuccess: () => {
        toast.success(
          cls.status === "active" ? "Class archived" : "Class restored",
        );
        refetch();
      },
      onError: (err: any) => toast.error(err.message || "Failed"),
    });
  };

  const handleCopyCode = (code: string, label = "Code") => {
    navigator.clipboard.writeText(code);
    toast.success(`${label} "${code}" copied`);
  };

  // ============================================================
  // Export
  // ============================================================
  const handleExport = async () => {
    try {
      const blob = await adminApi.exportClasses({
        school_year: filterSchoolYear === "all" ? undefined : filterSchoolYear,
        component_type: filterComponent === "all" ? undefined : filterComponent,
        status: filterStatus === "all" ? undefined : filterStatus,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `classes_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Export started");
    } catch (err: any) {
      toast.error(err.message || "Export failed");
    }
  };

  // ============================================================
  // Badge helpers
  // ============================================================
  const getComponentLabel = (type: string) => {
    const labels: Record<string, string> = {
      cwts: "CWTS",
      rotc: "ROTC",
      lts: "LTS",
      all: "All Components",
    };
    return labels[type] || type;
  };

  const getComponentBadge = (type: string) => {
    const badges: Record<string, string> = {
      cwts: "bg-blue-100 text-blue-800",
      rotc: "bg-red-100 text-red-800",
      lts: "bg-emerald-100 text-emerald-800",
      all: "bg-purple-100 text-purple-800",
    };
    return badges[type] || "bg-slate-100 text-slate-800";
  };

  const getStatusBadge = (status: string) =>
    status === "active" ? "badge-success" : "badge-secondary";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="spinner" />
        <span className="ml-3 text-slate-500">Loading classes...</span>
      </div>
    );
  }

  const activeCount = classes.filter((c) => c.status === "active").length;
  const archivedCount = classes.filter((c) => c.status === "archived").length;

  return (
    <div className="space-y-5">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold text-navy-900">
            <i className="fas fa-chalkboard-teacher text-gold-500 mr-2" />
            Class Management
          </h2>
          <p className="text-sm text-slate-500">
            {classes.length} class{classes.length !== 1 ? "es" : ""} total •{" "}
            {activeCount} active • {archivedCount} archived
          </p>
          <p className="text-xs text-slate-400 mt-1">
            <i className="fas fa-info-circle mr-1" />
            Classes are created automatically when importing faculty
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <RefreshButton
            onRefresh={refetch}
            isLoading={isRefreshing}
            label=""
            className="btn-sm"
          />
          <button className="btn btn-secondary btn-sm" onClick={handleExport}>
            <i className="fas fa-download" /> Export CSV
          </button>
          <button className="btn btn-primary btn-sm" onClick={openCreate}>
            <i className="fas fa-plus" /> Create Class
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-wrap items-center gap-3">
          <div className="search-box flex-1 min-w-[220px]">
            <i className="fas fa-search" />
            <input
              type="text"
              placeholder="Search by class name, instructor, or class code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="text-slate-400 hover:text-slate-600 px-2"
                onClick={() => setSearchTerm("")}
              >
                <i className="fas fa-times" />
              </button>
            )}
          </div>

          <select
            className="px-4 py-2.5 border border-slate-200 rounded-lg bg-white text-sm"
            value={filterSchoolYear}
            onChange={(e) => setFilterSchoolYear(e.target.value)}
          >
            <option value="all">All School Years</option>
            {schoolYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <select
            className="px-4 py-2.5 border border-slate-200 rounded-lg bg-white text-sm"
            value={filterComponent}
            onChange={(e) => setFilterComponent(e.target.value)}
          >
            <option value="all">All Components</option>
            <option value="cwts">CWTS</option>
            <option value="rotc">ROTC</option>
            <option value="lts">LTS</option>
          </select>

          <select
            className="px-4 py-2.5 border border-slate-200 rounded-lg bg-white text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>

          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              className={`px-3 py-1.5 rounded text-sm font-medium ${
                viewMode === "list"
                  ? "bg-white text-navy-900 shadow-sm"
                  : "text-slate-500"
              }`}
              onClick={() => setViewMode("list")}
            >
              <i className="fas fa-list" /> List
            </button>
            <button
              className={`px-3 py-1.5 rounded text-sm font-medium ${
                viewMode === "grid"
                  ? "bg-white text-navy-900 shadow-sm"
                  : "text-slate-500"
              }`}
              onClick={() => setViewMode("grid")}
            >
              <i className="fas fa-th" /> Grid
            </button>
          </div>
        </div>
      </div>

      {/* TABLE / GRID */}
      {filteredClasses.length === 0 ? (
        <div className="empty-state bg-white rounded-xl border border-slate-200 py-12 text-center">
          <i className="fas fa-chalkboard-teacher text-4xl text-slate-300 block mb-3" />
          <p className="text-slate-500">
            {classes.length === 0
              ? "No classes created yet"
              : "No classes match your filters"}
          </p>
          {classes.length === 0 && (
            <p className="text-sm text-slate-400 mt-2">
              Import faculty to automatically create classes, or click "Create
              Class" above.
            </p>
          )}
        </div>
      ) : viewMode === "list" ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Class Code</th>
                  <th>Component</th>
                  <th>School Year</th>
                  <th>Instructor</th>
                  <th>Students</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClasses.map((cls) => {
                  const isDeleting =
                    deleteMutation.isPending &&
                    deleteMutation.variables === cls.id;
                  const isArchiving =
                    toggleArchiveMutation.isPending &&
                    toggleArchiveMutation.variables === cls.id;

                  return (
                    <tr
                      key={cls.id}
                      className={`group hover:bg-slate-50 transition-colors ${
                        isDeleting ? "opacity-50" : ""
                      }`}
                    >
                      {/* Class */}
                      <td>
                        <div className="flex items-start gap-3 min-w-[220px]">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              cls.status === "active"
                                ? "bg-gold-100 text-gold-600"
                                : "bg-slate-100 text-slate-400"
                            }`}
                          >
                            <i
                              className={`fas ${
                                cls.status === "active"
                                  ? "fa-chalkboard-teacher"
                                  : "fa-archive"
                              }`}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-navy-900 truncate">
                              {cls.name}
                            </div>
                            {cls.description ? (
                              <div className="text-xs text-slate-500 truncate max-w-[240px]">
                                {cls.description}
                              </div>
                            ) : (
                              <div className="text-xs text-slate-400 italic">
                                No description
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Class Code */}
                      <td>
                        {cls.class_code ? (
                          <button
                            className="font-mono text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded transition-colors"
                            onClick={() =>
                              handleCopyCode(cls.class_code!, "Class code")
                            }
                            title="Copy class code"
                          >
                            <i className="fas fa-copy text-slate-400 mr-1" />
                            {cls.class_code}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>

                      {/* Component */}
                      <td>
                        <span
                          className={`badge ${getComponentBadge(
                            cls.component_type,
                          )}`}
                        >
                          {getComponentLabel(cls.component_type)}
                        </span>
                      </td>

                      {/* School Year */}
                      <td className="text-sm">{cls.school_year || "—"}</td>

                      {/* Instructor */}
                      <td>
                        {cls.teacher ? (
                          <div className="text-sm">
                            {cls.teacher.first_name} {cls.teacher.last_name}
                          </div>
                        ) : (
                          <span className="text-xs text-amber-600">
                            <i className="fas fa-exclamation-triangle mr-1" />{" "}
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* Students */}
                      <td>
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-navy-900">
                          <i className="fas fa-users text-slate-400" />
                          {cls.students_count || 0}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`badge ${getStatusBadge(cls.status)}`}>
                          {cls.status.toUpperCase()}
                        </span>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          <button
                            className="btn btn-info btn-sm inline-flex items-center gap-1.5"
                            onClick={() => openEdit(cls)}
                            disabled={isDeleting}
                            title="Edit class details"
                          >
                            <i className="fas fa-edit" />
                            <span>Edit</span>
                          </button>

                          <button
                            className="btn btn-secondary btn-sm inline-flex items-center gap-1.5"
                            onClick={() => handleToggleArchive(cls)}
                            disabled={isArchiving || isDeleting}
                            title={
                              cls.status === "active"
                                ? "Archive this class"
                                : "Restore this class"
                            }
                          >
                            {isArchiving ? (
                              <i className="fas fa-spinner fa-spin" />
                            ) : (
                              <i
                                className={`fas ${
                                  cls.status === "active"
                                    ? "fa-archive"
                                    : "fa-undo"
                                }`}
                              />
                            )}
                            <span>
                              {cls.status === "active" ? "Archive" : "Restore"}
                            </span>
                          </button>

                          <button
                            className="btn btn-danger btn-sm inline-flex items-center gap-1.5"
                            onClick={() => handleDelete(cls)}
                            disabled={isDeleting}
                            title="Delete this class"
                          >
                            {isDeleting ? (
                              <i className="fas fa-spinner fa-spin" />
                            ) : (
                              <i className="fas fa-trash" />
                            )}
                            <span>Delete</span>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClasses.map((cls) => {
            const isDeleting =
              deleteMutation.isPending && deleteMutation.variables === cls.id;
            const isArchiving =
              toggleArchiveMutation.isPending &&
              toggleArchiveMutation.variables === cls.id;

            return (
              <div
                key={cls.id}
                className={`bg-white rounded-xl shadow-sm border border-slate-200 p-5 ${
                  isDeleting ? "opacity-50" : ""
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-navy-900">{cls.name}</h3>
                  <span className={`badge ${getStatusBadge(cls.status)}`}>
                    {cls.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mb-2 line-clamp-2">
                  {cls.description || "No description"}
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span
                    className={`badge ${getComponentBadge(cls.component_type)}`}
                  >
                    {getComponentLabel(cls.component_type)}
                  </span>
                  {cls.school_year && (
                    <span className="badge badge-secondary">
                      <i className="fas fa-calendar mr-1" />
                      {cls.school_year}
                    </span>
                  )}
                  <span className="badge badge-secondary">
                    <i className="fas fa-users mr-1" />
                    {cls.students_count || 0}
                  </span>
                </div>
                {cls.class_code && (
                  <div className="text-xs font-mono mb-3">
                    Code: {cls.class_code}
                  </div>
                )}
                <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
                  <button
                    className="btn btn-info btn-sm flex-1 inline-flex items-center justify-center gap-1.5"
                    onClick={() => openEdit(cls)}
                  >
                    <i className="fas fa-edit" />
                    <span>Edit</span>
                  </button>
                  <button
                    className="btn btn-secondary btn-sm inline-flex items-center gap-1.5"
                    onClick={() => handleToggleArchive(cls)}
                    disabled={isArchiving}
                    title={cls.status === "active" ? "Archive" : "Restore"}
                  >
                    <i
                      className={`fas ${
                        cls.status === "active" ? "fa-archive" : "fa-undo"
                      }`}
                    />
                  </button>
                  <button
                    className="btn btn-danger btn-sm inline-flex items-center gap-1.5"
                    onClick={() => handleDelete(cls)}
                    disabled={isDeleting}
                    title="Delete"
                  >
                    <i className="fas fa-trash" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE/EDIT MODAL */}
      {showCreateModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowCreateModal(false)}
        >
          <div className="modal max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingClass ? "Edit Class" : "Create New Class"}</h3>
              <button
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div className="form-group">
                  <label className="label">
                    Class Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g. Section A - 2025-2026"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="label">Description</label>
                  <textarea
                    className="input min-h-[80px]"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        description: e.target.value,
                      })
                    }
                    placeholder="Optional description"
                  />
                </div>

                <div className="form-group">
                  <label className="label">
                    Class Code{" "}
                    <span className="text-xs text-slate-400">
                      (optional — auto-generated if blank)
                    </span>
                  </label>
                  <input
                    type="text"
                    className="input font-mono uppercase"
                    value={formData.class_code || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        class_code: e.target.value
                          .toUpperCase()
                          .replace(/\s+/g, ""),
                      })
                    }
                    placeholder="e.g. CLS-000031"
                    maxLength={50}
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Students match this code to enroll in this class
                  </p>
                </div>

                <div className="form-group">
                  <label className="label">School Year</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.school_year || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        school_year: e.target.value,
                      })
                    }
                    placeholder="e.g. 2025-2026"
                  />
                </div>

                <div className="form-group">
                  <label className="label">
                    Component <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="input"
                    value={formData.component_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        component_type: e.target.value as any,
                        teacher_id: "",
                      })
                    }
                  >
                    <option value="all">All Components</option>
                    <option value="cwts">CWTS</option>
                    <option value="rotc">ROTC</option>
                    <option value="lts">LTS</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="label">
                    Instructor <span className="text-red-500">*</span>
                  </label>
                  {facultyLoading ? (
                    <div className="text-slate-500">
                      <i className="fas fa-spinner fa-spin" /> Loading...
                    </div>
                  ) : (
                    <select
                      className="input"
                      value={formData.teacher_id}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          teacher_id: e.target.value,
                        })
                      }
                      disabled={filteredFaculty.length === 0}
                    >
                      <option value="">Select Instructor</option>
                      {filteredFaculty.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.first_name} {f.last_name}{" "}
                          {f.nstp_component
                            ? `(${f.nstp_component.toUpperCase()})`
                            : ""}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : editingClass
                      ? "Update"
                      : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Classes;