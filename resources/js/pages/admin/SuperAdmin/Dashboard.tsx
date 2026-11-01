// resources/js/pages/admin/SuperAdmin/Dashboard.tsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { superAdminApi } from "../../../services/api";
import RefreshButton from "../../components/common/RefreshButton";
import DashboardScheduleView from "../../components/common/DashboardScheduleView";
import toast from "react-hot-toast";

// ============================================================
// TYPES
// ============================================================
interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  profile_photo: string;
  initials: string;
  full_name: string;
  role: "super_admin" | "admin" | "faculty" | "student";
  is_active: boolean;
  created_at: string;
  nstp_component?: string | null;
  class_code?: string | null;
}

interface UserFormData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: "admin" | "faculty";
  profile_photo?: File | null;
  nstp_component?: string;
  class_code?: string;
}

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
  skipped_count: number;
  errors: string[];
  warnings: string[];
  errors_count: number;
  warnings_count: number;
  started_at: string | null;
  finished_at: string | null;
}

type Tab = "users" | "import";

const EMPTY_FORM: UserFormData = {
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  role: "admin",
  profile_photo: null,
  nstp_component: "",
  class_code: "",
};

const FACULTY_BATCH_KEY = "nstp_active_faculty_import";
const FACULTY_CHUNK_SIZE = 25;

// ============================================================
// COMPONENT
// ============================================================
const SuperAdminDashboard: React.FC = () => {
  const queryClient = useQueryClient();

  // ------- Tab -------
  const [tab, setTab] = useState<Tab>("users");
  const [showFaceReset, setShowFaceReset] = useState(false);

  // ============================================================
  // TAB 1: USERS
  // ============================================================
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<UserFormData>(EMPTY_FORM);
  const [filterRole, setFilterRole] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const {
    data: users = [],
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["superadmin", "users"],
    queryFn: () => superAdminApi.getUsers(),
    staleTime: 30000,
    retry: 1,
  });

  const { data: stats } = useQuery({
    queryKey: ["superadmin", "stats"],
    queryFn: () => superAdminApi.getStats(),
    staleTime: 60000,
  });

  const createMut = useMutation({
    mutationFn: (data: UserFormData) => {
      const fd = new FormData();
      fd.append("first_name", data.first_name);
      fd.append("last_name", data.last_name);
      fd.append("email", data.email);
      fd.append("password", data.password);
      fd.append("role", data.role);
      if (data.nstp_component) fd.append("nstp_component", data.nstp_component);
      if (data.class_code) fd.append("class_code", data.class_code);
      if (data.profile_photo) fd.append("profile_photo", data.profile_photo);
      return superAdminApi.createUser(fd);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["superadmin", "stats"] });
      setShowModal(false);
      setFormData(EMPTY_FORM);
      setPreviewImage(null);
      setEditingId(null);
      toast.success("User created successfully");
    },
    onError: (err: any) => toast.error(err.message || "Failed to create user"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<UserFormData> }) => {
      const fd = new FormData();
      if (data.first_name) fd.append("first_name", data.first_name);
      if (data.last_name) fd.append("last_name", data.last_name);
      if (data.email) fd.append("email", data.email);
      if (data.password) fd.append("password", data.password);
      if (data.role) fd.append("role", data.role);
      if (data.nstp_component !== undefined)
        fd.append("nstp_component", data.nstp_component || "");
      if (data.class_code !== undefined)
        fd.append("class_code", data.class_code || "");
      if (data.profile_photo) fd.append("profile_photo", data.profile_photo);
      return superAdminApi.updateUser(id, fd);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin", "users"] });
      setShowModal(false);
      setFormData(EMPTY_FORM);
      setPreviewImage(null);
      setEditingId(null);
      toast.success("User updated successfully");
    },
    onError: (err: any) => toast.error(err.message || "Failed to update user"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => superAdminApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["superadmin", "stats"] });
      toast.success("User deleted successfully");
    },
    onError: (err: any) => toast.error(err.message || "Failed to delete user"),
  });

  const toggleActiveMut = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      superAdminApi.toggleUserActive(id, is_active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["superadmin", "stats"] });
      toast.success("User status updated");
    },
    onError: (err: any) => toast.error(err.message || "Failed to toggle"),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateMut.mutateAsync({ id: editingId, data: formData });
      } else {
        await createMut.mutateAsync(formData);
      }
    } catch {
      /* handled */
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await deleteMut.mutateAsync(id);
    } catch {
      /* handled */
    }
  };

  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    try {
      await toggleActiveMut.mutateAsync({ id, is_active: !currentStatus });
    } catch {
      /* handled */
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setPreviewImage(null);
    setShowModal(true);
  };

  const openEdit = (user: User) => {
    setEditingId(user.id);
    setFormData({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      password: "",
      role: user.role as "admin" | "faculty",
      profile_photo: null,
      nstp_component: user.nstp_component || "",
      class_code: user.class_code || "",
    });
    setPreviewImage(user.profile_photo || null);
    setShowModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setFormData({ ...formData, profile_photo: file });
      const reader = new FileReader();
      reader.onload = (event) => setPreviewImage(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const filteredUsers = users.filter((user: User) => {
    if (user.role === "super_admin") return false;
    const matchesRole = filterRole === "all" || user.role === filterRole;
    const matchesSearch =
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.class_code || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      super_admin: "bg-purple-500",
      admin: "bg-blue-500",
      faculty: "bg-amber-500",
      student: "bg-emerald-500",
    };
    return colors[role] || "bg-slate-500";
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      super_admin: "Super Admin",
      admin: "Admin",
      faculty: "Faculty",
      student: "Student",
    };
    return labels[role] || role;
  };

  // ============================================================
  // TAB 2: IMPORT FACULTY — CHUNKED
  // ============================================================
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"create" | "update" | "upsert">("upsert");
  const [importSchoolYear, setImportSchoolYear] = useState<string>("");
  const [importing, setImporting] = useState(false);
  const [facultyBatch, setFacultyBatch] = useState<BatchProgress | null>(null);

  const facultyLoopRef = useRef(false);
  const facultyAbortRef = useRef(false);

  const facultyProgressColor = (() => {
    if (!facultyBatch) return "bg-blue-500";
    switch (facultyBatch.status) {
      case "completed": return "bg-emerald-500";
      case "failed": return "bg-red-500";
      case "cancelled": return "bg-amber-500";
      default: return "bg-blue-500";
    }
  })();

  const facultyStatusLabel = (s: string) => {
    switch (s) {
      case "pending": return "Queued";
      case "processing": return "Importing...";
      case "completed": return "Completed";
      case "failed": return "Failed";
      case "cancelled": return "Cancelled";
      default: return s;
    }
  };

  const runFacultyChunkLoop = useCallback(
    async (batchId: number) => {
      if (facultyLoopRef.current) return;
      facultyLoopRef.current = true;
      facultyAbortRef.current = false;

      let processedAnything = false;

      try {
        while (!facultyAbortRef.current) {
          const data: BatchProgress = await superAdminApi.processFacultyImportChunk(
            batchId,
            FACULTY_CHUNK_SIZE,
          );
          setFacultyBatch(data);
          if (data.processed_rows > 0) processedAnything = true;

          if (!data.is_running) {
            localStorage.removeItem(FACULTY_BATCH_KEY);
            break;
          }
          await new Promise((r) => setTimeout(r, 60));
        }
      } catch (err: any) {
        toast.error(err.message || "Faculty import failed");
      } finally {
        facultyLoopRef.current = false;
        if (processedAnything) {
          queryClient.invalidateQueries({ queryKey: ["superadmin", "users"] });
          queryClient.invalidateQueries({ queryKey: ["superadmin", "stats"] });
          queryClient.invalidateQueries({ queryKey: ["classes"] });
          queryClient.invalidateQueries({ queryKey: ["classes", "school-years"] });
        }
      }
    },
    [queryClient],
  );

  // Resume on mount
  useEffect(() => {
    const storedId = localStorage.getItem(FACULTY_BATCH_KEY);
    if (!storedId) return;

    const id = parseInt(storedId, 10);
    if (isNaN(id)) {
      localStorage.removeItem(FACULTY_BATCH_KEY);
      return;
    }

    superAdminApi
      .getFacultyImportStatus(id)
      .then((data: BatchProgress) => {
        if (data.is_running) {
          setFacultyBatch(data);
          runFacultyChunkLoop(id);
        } else {
          localStorage.removeItem(FACULTY_BATCH_KEY);
        }
      })
      .catch(() => localStorage.removeItem(FACULTY_BATCH_KEY));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
  };

  const handleRunImport = async () => {
    if (!file) {
      toast.error("Please select a CSV file");
      return;
    }

    setImporting(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("mode", mode);
      if (importSchoolYear) fd.append("school_year", importSchoolYear);

      const res = await superAdminApi.startFacultyImport(fd);
      if (!res.success) throw new Error(res.message || "Failed to start");

      toast.success(`Parsed ${res.total_rows} rows — starting import...`);

      localStorage.setItem(FACULTY_BATCH_KEY, String(res.batch_id));

      const data: BatchProgress = await superAdminApi.getFacultyImportStatus(res.batch_id);
      setFacultyBatch(data);
      runFacultyChunkLoop(res.batch_id);

      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      toast.error(err.message || "Failed to start import");
    } finally {
      setImporting(false);
    }
  };

  const handleCancelFacultyImport = async () => {
    if (!facultyBatch) return;
    if (!window.confirm("Cancel this import? Already-processed rows stay.")) return;

    facultyAbortRef.current = true;

    try {
      await superAdminApi.cancelFacultyImport(facultyBatch.id);
      toast.success("Cancelled");
      const data: BatchProgress = await superAdminApi.getFacultyImportStatus(facultyBatch.id);
      setFacultyBatch(data);
      localStorage.removeItem(FACULTY_BATCH_KEY);
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel");
    }
  };

  const handleDismissFacultyProgress = () => {
    setFacultyBatch(null);
    localStorage.removeItem(FACULTY_BATCH_KEY);
  };

  // ============================================================
  // RENDER
  // ============================================================
  if (isLoading) {
    return (
      <div className="space-y-5">
        <TabsHeader tab={tab} setTab={setTab} />
        <div className="flex items-center justify-center py-16">
          <div className="spinner" />
          <span className="ml-3 text-slate-500">Loading users...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-5">
        <TabsHeader tab={tab} setTab={setTab} />
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-circle mr-2" />
          Failed to load users: {(error as Error).message}
          <br />
          <button className="btn btn-sm btn-primary mt-3" onClick={() => refetch()}>
            <i className="fas fa-sync mr-1" /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold text-navy-900">User Management</h2>
          <p className="text-sm text-slate-500">
            {tab === "users"
              ? "Manage admin and faculty accounts"
              : "Bulk import faculty accounts and their classes via CSV"}
          </p>
        </div>
        {tab === "users" && (
          <div className="flex gap-2">
            <RefreshButton
              onRefresh={refetch}
              isLoading={isFetching}
              label=""
              className="btn-sm"
            />
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowFaceReset(true)}
            >
              <i className="fas fa-user-lock" /> Face Reset
            </button>
            <button className="btn btn-primary btn-sm" onClick={openCreate}>
              <i className="fas fa-plus" /> Add User
            </button>
          </div>
        )}
      </div>

      {/* TABS */}
      <TabsHeader tab={tab} setTab={setTab} />

      {/* ============================================================ */}
      {/* TAB CONTENT — USERS */}
      {/* ============================================================ */}
      {tab === "users" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Admins", value: stats?.total_admins || 0, color: "border-blue-500" },
              { label: "Total Faculty", value: stats?.total_faculty || 0, color: "border-amber-500" },
              { label: "Active Users", value: stats?.total_active || 0, color: "border-emerald-500" },
              { label: "Inactive Users", value: stats?.total_inactive || 0, color: "border-red-500" },
            ].map((stat, i) => (
              <div
                key={i}
                className={`bg-white p-4 rounded-xl shadow-sm border-l-4 ${stat.color}`}
              >
                <span className="block text-xs text-slate-500">{stat.label}</span>
                <span className="text-2xl font-bold text-navy-900">{stat.value}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="search-box flex-1 min-w-[200px]">
              <i className="fas fa-search" />
              <input
                type="text"
                placeholder="Search by name, email, or class code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-2.5 border border-slate-200 rounded-lg bg-white text-sm"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="faculty">Faculty</option>
            </select>
            <span className="text-sm text-slate-500 self-center">
              {filteredUsers.length} users found
            </span>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Component</th>
                    <th>Class Code</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-10 text-slate-500">
                        <i className="fas fa-users text-3xl text-slate-300 block mb-3" />
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user: User) => (
                      <tr key={user.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gold-100">
                              {user.profile_photo ? (
                                <img
                                  src={user.profile_photo}
                                  alt={user.full_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div
                                  className={`w-full h-full flex items-center justify-center font-bold text-sm text-white ${getRoleBadgeColor(
                                    user.role,
                                  )}`}
                                >
                                  {user.initials || user.first_name?.charAt(0) || "U"}
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-navy-900">
                                {user.full_name}
                              </div>
                              <div className="text-xs text-slate-400">{user.role}</div>
                            </div>
                          </div>
                        </td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`badge ${getRoleBadgeColor(user.role)} text-white`}>
                            {getRoleLabel(user.role)}
                          </span>
                        </td>
                        <td>
                          {user.nstp_component ? (
                            <span className="badge badge-info">
                              {user.nstp_component.toUpperCase()}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td>
                          {user.role === "faculty" && user.class_code ? (
                            <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">
                              {user.class_code}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${user.is_active ? "badge-success" : "badge-danger"}`}>
                            {user.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td>{new Date(user.created_at).toLocaleDateString()}</td>
                        <td>
                          <div className="flex gap-1.5">
                            <button
                              className="btn btn-info btn-sm"
                              onClick={() => openEdit(user)}
                              disabled={deleteMut.isPending}
                            >
                              <i className="fas fa-edit" />
                            </button>
                            <button
                              className={`btn btn-sm ${user.is_active ? "btn-warning" : "btn-success"}`}
                              onClick={() => handleToggleActive(user.id, user.is_active)}
                              disabled={toggleActiveMut.isPending}
                              title={user.is_active ? "Deactivate" : "Activate"}
                            >
                              <i className={`fas ${user.is_active ? "fa-pause" : "fa-play"}`} />
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDelete(user.id)}
                              disabled={deleteMut.isPending}
                            >
                              {deleteMut.isPending && deleteMut.variables === user.id ? (
                                <i className="fas fa-spinner fa-spin" />
                              ) : (
                                <i className="fas fa-trash" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <DashboardScheduleView scope="superadmin" showActivities showSessions />
        </>
      )}

      {/* ============================================================ */}
      {/* TAB CONTENT — IMPORT FACULTY */}
      {/* ============================================================ */}
      {tab === "import" && (
        <div className="space-y-4">
          {/* PROGRESS BAR */}
          {facultyBatch && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {facultyBatch.is_running ? (
                      <i className="fas fa-circle-notch fa-spin text-blue-500 text-lg" />
                    ) : facultyBatch.status === "completed" ? (
                      <i className="fas fa-check-circle text-emerald-500 text-lg" />
                    ) : facultyBatch.status === "failed" ? (
                      <i className="fas fa-times-circle text-red-500 text-lg" />
                    ) : (
                      <i className="fas fa-stop-circle text-amber-500 text-lg" />
                    )}
                    <div>
                      <div className="font-semibold text-navy-900 text-sm">
                        {facultyStatusLabel(facultyBatch.status)} —{" "}
                        {facultyBatch.processed_rows} / {facultyBatch.total_rows} rows
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        {facultyBatch.batch_code}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-navy-900">
                      {facultyBatch.progress_percent.toFixed(1)}%
                    </span>
                    {facultyBatch.is_running && (
                      <button
                        className="btn btn-warning btn-sm"
                        onClick={handleCancelFacultyImport}
                      >
                        <i className="fas fa-stop" /> Cancel
                      </button>
                    )}
                    {!facultyBatch.is_running && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={handleDismissFacultyProgress}
                      >
                        <i className="fas fa-times" /> Dismiss
                      </button>
                    )}
                  </div>
                </div>

                <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${facultyProgressColor}`}
                    style={{ width: `${facultyBatch.progress_percent}%` }}
                  />
                </div>

                <div className="flex flex-wrap gap-4 text-xs">
                  <span className="text-emerald-700">
                    <i className="fas fa-chalkboard-teacher mr-1" />
                    {facultyBatch.created_count} created
                  </span>
                  <span className="text-blue-700">
                    <i className="fas fa-pencil-alt mr-1" />
                    {facultyBatch.updated_count} updated
                  </span>
                  <span className="text-red-700">
                    <i className="fas fa-forward mr-1" />
                    {facultyBatch.skipped_count} skipped
                  </span>
                  {facultyBatch.errors_count > 0 && (
                    <span className="text-red-700">
                      <i className="fas fa-exclamation-triangle mr-1" />
                      {facultyBatch.errors_count} errors
                    </span>
                  )}
                </div>

                {!facultyBatch.is_running && facultyBatch.errors_count > 0 && (
                  <details className="mt-2">
                    <summary className="text-xs text-red-600 cursor-pointer">
                      Show first {Math.min(facultyBatch.errors.length, 10)} errors
                    </summary>
                    <ul className="mt-2 text-xs text-red-600 list-disc list-inside space-y-0.5 max-h-32 overflow-y-auto">
                      {facultyBatch.errors.slice(0, 10).map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            </div>
          )}

          {/* UPLOAD FORM */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 flex flex-wrap gap-2 items-center">
              <i className="fas fa-info-circle text-blue-600" />
              <span className="text-sm text-blue-700">
                Upload a CSV with columns:
              </span>
              <code className="text-xs bg-white px-2 py-0.5 rounded border border-blue-200 font-mono">
                class_code, component, section, last_name, first_name, email
              </code>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="font-semibold text-slate-700 mb-1">
                  <i className="fas fa-magic text-gold-500 mr-1" />
                  What happens on import
                </p>
                <ul className="text-slate-600 list-disc list-inside space-y-0.5">
                  <li>
                    Faculty are <strong>deduplicated by name</strong> — one account per person
                  </li>
                  <li>One class is created per CSV row</li>
                  <li>Each class's <code>class_code</code> becomes its <strong>join code</strong></li>
                  <li>Faculty are auto-assigned to their class</li>
                  <li>School year is auto-created if missing</li>
                </ul>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <p className="font-semibold text-emerald-700 mb-1">
                  <i className="fas fa-key text-emerald-500 mr-1" />
                  Default password
                </p>
                <p className="text-emerald-700">
                  New faculty accounts use{" "}
                  <code className="bg-white px-1 rounded">password123</code>.
                </p>
              </div>
            </div>

            <div className="form-group">
              <label className="label">
                CSV File <span className="text-red-500">*</span>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="input p-2"
                onChange={handleImportFileChange}
                disabled={importing || (facultyBatch?.is_running ?? false)}
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
                  onChange={(e) => setMode(e.target.value as "create" | "update" | "upsert")}
                  disabled={importing || (facultyBatch?.is_running ?? false)}
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
                  value={importSchoolYear}
                  onChange={(e) => setImportSchoolYear(e.target.value)}
                  disabled={importing || (facultyBatch?.is_running ?? false)}
                />
              </div>
            </div>

            <button
              className="btn btn-primary w-full"
              onClick={handleRunImport}
              disabled={!file || importing || (facultyBatch?.is_running ?? false)}
            >
              {importing ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-1" /> Uploading...
                </>
              ) : (
                <>
                  <i className="fas fa-upload mr-1" /> Start Faculty Import
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* CREATE/EDIT MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? "Edit User" : "Add New User"}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div className="form-row">
                  <div className="form-group">
                    <label className="label">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="input"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
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
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="label">
                    Password{" "}
                    {editingId ? (
                      <span className="text-sm text-slate-400">(leave blank to keep current)</span>
                    ) : (
                      <span className="text-red-500">*</span>
                    )}
                  </label>
                  <input
                    type="password"
                    className="input"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    {...(!editingId ? { required: true } : {})}
                    minLength={6}
                  />
                </div>

                <div className="form-group">
                  <label className="label">Profile Photo</label>
                  <div className="flex items-center gap-4">
                    {previewImage && (
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gold-500 flex-shrink-0">
                        <img
                          src={previewImage}
                          alt="Profile preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        className="input p-1.5"
                        onChange={handleFileChange}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="label">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="input"
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        role: e.target.value as "admin" | "faculty",
                        nstp_component: e.target.value === "faculty" ? formData.nstp_component : "",
                        class_code: e.target.value === "faculty" ? formData.class_code : "",
                      })
                    }
                    required
                  >
                    <option value="admin">Admin</option>
                    <option value="faculty">Faculty</option>
                  </select>
                </div>

                {formData.role === "faculty" && (
                  <>
                    <div className="form-group">
                      <label className="label">NSTP Component</label>
                      <select
                        className="input"
                        value={formData.nstp_component || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, nstp_component: e.target.value })
                        }
                      >
                        <option value="">-- Not assigned --</option>
                        <option value="cwts">CWTS</option>
                        <option value="rotc">ROTC</option>
                        <option value="lts">LTS</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="label">Class Code</label>
                      <input
                        type="text"
                        className="input font-mono uppercase"
                        value={formData.class_code || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            class_code: e.target.value.toUpperCase().replace(/\s+/g, ""),
                          })
                        }
                        placeholder="e.g. CWTS-A1"
                        maxLength={50}
                      />
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                  disabled={createMut.isPending || updateMut.isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={createMut.isPending || updateMut.isPending}
                >
                  {createMut.isPending || updateMut.isPending ? (
                    <>
                      <i className="fas fa-spinner fa-spin" /> Saving...
                    </>
                  ) : editingId ? (
                    "Update User"
                  ) : (
                    "Create User"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FACE RESET MODAL */}
      {showFaceReset && <FaceResetModal onClose={() => setShowFaceReset(false)} />}
    </div>
  );
};

// ============================================================
// FACE RESET MODAL
// ============================================================
const studentName = (s: any): string =>
  s?.full_name ||
  [s?.first_name, s?.last_name].filter(Boolean).join(" ") ||
  `Student #${s?.id}`;

const FaceResetModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [resetting, setResetting] = useState(false);
  const requestId = useRef(0);

  const close = () => {
    if (!resetting) onClose();
  };

  // Debounced search
  useEffect(() => {
    if (selected) return;
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const myId = ++requestId.current;
    const t = setTimeout(async () => {
      try {
        const data = await superAdminApi.searchStudentsForFaceReset(q);
        if (myId === requestId.current) setResults(data);
      } catch (err: any) {
        if (myId === requestId.current) {
          setResults([]);
          toast.error(err.message || "Failed to search students");
        }
      } finally {
        if (myId === requestId.current) setSearching(false);
      }
    }, 350);

    return () => clearTimeout(t);
  }, [query, selected]);

  const handleReset = async () => {
    if (!selected) return;
    setResetting(true);
    try {
      await superAdminApi.resetStudentFace(selected.id);
      toast.success(
        `Face reset for ${studentName(selected)}. They can register again.`,
      );
      setResetting(false);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to reset face");
      setResetting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={close}>
      <div className="modal max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{selected ? "Confirm Face Reset" : "Reset Student Face"}</h3>
          <button className="modal-close" onClick={close}>
            ×
          </button>
        </div>

        <div className="modal-body space-y-4">
          {!selected ? (
            <>
              <div className="form-group">
                <label className="label">Search student</label>
                <div className="relative">
                  <input
                    type="text"
                    className="input pr-10"
                    placeholder="Name or student ID (min. 2 characters)"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoFocus
                  />
                  {searching && (
                    <i className="fas fa-spinner fa-spin absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  )}
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-200 divide-y divide-slate-100">
                {query.trim().length < 2 ? (
                  <p className="p-4 text-sm text-slate-400">
                    Type to search for a student.
                  </p>
                ) : results.length === 0 && !searching ? (
                  <p className="p-4 text-sm text-slate-400">
                    No students found.
                  </p>
                ) : (
                  results.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50"
                      onClick={() => setSelected(s)}
                    >
                      <span>
                        <span className="block text-sm font-medium text-navy-900">
                          {studentName(s)}
                        </span>
                        <span className="block text-xs text-slate-500">
                          {s.student_id || "No ID"}
                          {s.course ? ` · ${s.course}` : ""}
                          {s.component
                            ? ` · ${String(s.component).toUpperCase()}`
                            : ""}
                        </span>
                      </span>
                      <span
                        className={`badge ${
                          s.has_face ? "badge-success" : "badge-info"
                        }`}
                      >
                        {s.has_face ? "Face registered" : "No face"}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </>
          ) : (
            <>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-medium text-navy-900">
                  {studentName(selected)}
                </p>
                <p className="text-xs text-slate-500">
                  {selected.student_id || "No ID"}
                  {selected.course ? ` · ${selected.course}` : ""}
                </p>
              </div>

              {selected.has_face ? (
                <div className="alert alert-danger">
                  <i className="fas fa-exclamation-triangle mr-2" />
                  This permanently deletes this student's registered face data.
                  They will need to register their face again before using face
                  attendance.
                </div>
              ) : (
                <div className="alert alert-info">
                  <i className="fas fa-info-circle mr-2" />
                  This student has no registered face, so there is nothing to
                  reset.
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          {selected ? (
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelected(null)}
                disabled={resetting}
              >
                Back
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleReset}
                disabled={resetting || !selected.has_face}
              >
                {resetting ? (
                  <>
                    <i className="fas fa-spinner fa-spin" /> Resetting...
                  </>
                ) : (
                  "Reset Face"
                )}
              </button>
            </>
          ) : (
            <button type="button" className="btn btn-secondary" onClick={close}>
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// TABS HEADER
// ============================================================
const TabsHeader: React.FC<{
  tab: "users" | "import";
  setTab: (t: "users" | "import") => void;
}> = ({ tab, setTab }) => {
  const tabs: { key: "users" | "import"; label: string; icon: string }[] = [
    { key: "users", label: "Users", icon: "fa-users" },
    { key: "import", label: "Import Faculty", icon: "fa-file-import" },
  ];

  return (
    <div className="flex gap-1 bg-white p-1 rounded-xl shadow-sm border border-slate-200">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => setTab(t.key)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            tab === t.key
              ? "bg-navy-600 text-white shadow-md"
              : "text-slate-500 hover:text-navy-700 hover:bg-slate-50"
          }`}
        >
          <i className={`fas ${t.icon}`} />
          {t.label}
        </button>
      ))}
    </div>
  );
};

export default SuperAdminDashboard;