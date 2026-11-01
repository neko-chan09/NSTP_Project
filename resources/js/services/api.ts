// resources/js/services/api.ts

// const API_URL = "http://localhost:8000/api";
const API_URL = "https://orangered-oryx-492151.hostingersite.com/api";

import type {
  DashboardStats,
  Student,
  StudentResponse,
  Document,
  DocumentResponse,
  OfficeDocument,
  AttendanceSession,
  AttendanceLog,
  Certificate,
  BulletinPost,
  ComponentChangeRequest,
  SystemSettings,
  User,
  LoginResponse,
  AcademicYear,
  Activity,
  ClassGroup,
  CreateClassRequest,
  UpdateClassRequest,
} from "../types/api";

import { getToken, setToken, removeToken } from "../lib/token";
import {
  queueMutation,
  serializeFormData,
} from "../lib/offline/outbox";

export type {
  DashboardStats,
  Student,
  StudentResponse,
  Document,
  DocumentResponse,
  OfficeDocument,
  AttendanceSession,
  AttendanceLog,
  Certificate,
  BulletinPost,
  ComponentChangeRequest,
  SystemSettings,
  User,
  LoginResponse,
  AcademicYear,
  Activity,
  ClassGroup,
  CreateClassRequest,
  UpdateClassRequest,
};

// ============================================================
// HELPERS
// ============================================================
const headers = () => ({
  Accept: "application/json",
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    if (response.status === 401) {
      removeToken();
      window.location.href = "/login";
    }
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  return response.json();
};

// ============================================================
// OFFLINE-AWARE MUTATION HELPER
// ============================================================
async function mutateWithQueue(
  url: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  options: {
    body?: any;
    formData?: FormData;
    label?: string;
    tag?: string;
    headers?: Record<string, string>;
  } = {},
): Promise<any> {
  const token = getToken();
  const online = typeof navigator === "undefined" ? true : navigator.onLine;

  const doFetch = async () => {
    const h: Record<string, string> = {
      Accept: "application/json",
      ...(options.headers || {}),
    };
    if (token) h["Authorization"] = `Bearer ${token}`;

    let body: BodyInit | undefined;
    if (options.formData) {
      body = options.formData;
    } else if (options.body !== undefined) {
      h["Content-Type"] = "application/json";
      body = JSON.stringify(options.body);
    }
    return fetch(url, { method, headers: h, body });
  };

  if (online) {
    try {
      const res = await doFetch();
      if (res.status === 401) {
        removeToken();
        window.location.href = "/login";
        throw new Error("Unauthorized");
      }
      if (res.ok) return res.json().catch(() => ({}));
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || `HTTP ${res.status}`);
    } catch (err: any) {
      const isNetworkError =
        err instanceof TypeError || /network|fetch/i.test(err?.message || "");
      if (!isNetworkError) throw err;
    }
  }

  const id = await queueMutation({
    url,
    method,
    body: options.body,
    formData: options.formData ? serializeFormData(options.formData) : undefined,
    tag: options.tag || "generic",
    label: options.label,
  });

  return {
    success: true,
    queued: true,
    offline: !online,
    queue_id: id,
    message: online
      ? "Network error — change queued for retry."
      : "You're offline — change queued and will sync automatically.",
  };
}

// ============================================================
// PROFILE API — self-service profile management
// ============================================================
export const profileApi = {
  getProfile: async (): Promise<any> => {
    const response = await fetch(`${API_URL}/profile`, {
      headers: headers(),
    });
    const result = await handleResponse(response);
    return result.data ?? result;
  },

  updateProfile: async (data: {
    first_name?: string;
    last_name?: string;
    email?: string;
    contact_number?: string;
  }): Promise<any> => {
    const response = await fetch(`${API_URL}/profile`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(data),
    });
    const result = await handleResponse(response);
    return result.data ?? result;
  },

  uploadPhoto: async (formData: FormData): Promise<any> => {
    const token = getToken();
    const response = await fetch(`${API_URL}/profile/photo`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        // DO NOT set Content-Type — the browser sets the boundary
      },
      body: formData,
    });
    const result = await handleResponse(response);
    return result.data ?? result;
  },

  deletePhoto: async (): Promise<any> => {
    const response = await fetch(`${API_URL}/profile/photo`, {
      method: "DELETE",
      headers: headers(),
    });
    return handleResponse(response);
  },

  changePassword: async (
    currentPassword: string,
    newPassword: string,
    newPasswordConfirmation: string,
  ): Promise<any> => {
    const response = await fetch(`${API_URL}/profile/change-password`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: newPasswordConfirmation,
      }),
    });
    return handleResponse(response);
  },
};

// ============================================================
// AUTH API
// ============================================================
export const authApi = {
  sendOtp: async (email: string): Promise<any> => {
    const response = await fetch(`${API_URL}/password/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    return handleResponse(response);
  },

  verifyOtp: async (email: string, otp: string): Promise<any> => {
    const response = await fetch(`${API_URL}/password/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });
    return handleResponse(response);
  },

  resetPassword: async (
    email: string,
    resetToken: string,
    newPassword: string,
    newPasswordConfirmation: string,
  ): Promise<any> => {
    const response = await fetch(`${API_URL}/password/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        reset_token: resetToken,
        new_password: newPassword,
        new_password_confirmation: newPasswordConfirmation,
      }),
    });
    return handleResponse(response);
  },

  resendOtp: async (email: string): Promise<any> => {
    const response = await fetch(`${API_URL}/password/resend-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    return handleResponse(response);
  },

  changePassword: async (
    currentPassword: string,
    newPassword: string,
    newPasswordConfirmation: string,
  ): Promise<any> => {
    const response = await fetch(`${API_URL}/change-password`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: newPasswordConfirmation,
      }),
    });
    return handleResponse(response);
  },

  login: async (login: string, password: string): Promise<LoginResponse> => {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login, password }),
    });
    const data = await handleResponse(response);
    if (data.access_token) {
      setToken(data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
    }
    return data;
  },

  adminLogin: async (
    email: string,
    password: string,
  ): Promise<LoginResponse> => {
    const response = await fetch(`${API_URL}/admin/login`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Login failed");
    if (data.access_token || data.token) {
      const token = data.access_token || data.token;
      setToken(token);
      localStorage.setItem("user", JSON.stringify(data.user));
    }
    return data;
  },

  logout: () => {
    removeToken();
    window.location.href = "/login";
  },

  getCurrentUser: (): User | null => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },
};

// ============================================================
// SUPER ADMIN API
// ============================================================
export const superAdminApi = {
  // ---------------- FACE RESET (online only, not queued) ----------------
  searchStudentsForFaceReset: async (search: string): Promise<any[]> => {
    const response = await fetch(
      `${API_URL}/superadmin/students/search?search=${encodeURIComponent(search)}`,
      { headers: headers() },
    );
    const result = await handleResponse(response);
    return result.data ?? [];
  },

  resetStudentFace: async (
    studentId: number,
  ): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(
      `${API_URL}/superadmin/students/${studentId}/face-embeddings`,
      { method: "DELETE", headers: headers() },
    );
    return handleResponse(response);
  },

  // ---------------- BACKUPS ----------------
  getBackups: async (): Promise<any[]> => {
    const response = await fetch(`${API_URL}/superadmin/backups`, {
      headers: headers(),
    });
    const result = await handleResponse(response);
    return result.data ?? result;
  },

  getBackupStats: async (): Promise<any> => {
    const response = await fetch(`${API_URL}/superadmin/backups/stats`, {
      headers: headers(),
    });
    const result = await handleResponse(response);
    return result.data ?? result;
  },

  createBackup: async (notes?: string): Promise<any> => {
    return mutateWithQueue(`${API_URL}/superadmin/backups`, "POST", {
      body: { notes },
      label: "Create backup",
      tag: "backup-create",
    });
  },

  downloadBackup: async (id: number): Promise<Blob> => {
    const response = await fetch(
      `${API_URL}/superadmin/backups/${id}/download`,
      { headers: { Authorization: `Bearer ${getToken()}` } },
    );
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Download failed (${response.status})`);
    }
    return response.blob();
  },

  restoreBackup: async (id: number): Promise<{ message: string }> => {
    return mutateWithQueue(
      `${API_URL}/superadmin/backups/${id}/restore`,
      "POST",
      {
        label: `Restore backup ${id}`,
        tag: "backup-restore",
      },
    );
  },

  deleteBackup: async (id: number): Promise<{ message: string }> => {
    return mutateWithQueue(
      `${API_URL}/superadmin/backups/${id}`,
      "DELETE",
      {
        label: `Delete backup ${id}`,
        tag: "backup-delete",
      },
    );
  },

  // ---------------- BACKUP SCHEDULES ----------------
  getBackupSchedules: async (): Promise<any[]> => {
    const response = await fetch(`${API_URL}/superadmin/backups/schedules`, {
      headers: headers(),
    });
    const result = await handleResponse(response);
    return result.data ?? result;
  },

  createBackupSchedule: async (data: any): Promise<any> => {
    const response = await fetch(`${API_URL}/superadmin/backups/schedules`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(data),
    });
    const result = await handleResponse(response);
    return result.data ?? result;
  },

  updateBackupSchedule: async (id: number, data: any): Promise<any> => {
    const response = await fetch(
      `${API_URL}/superadmin/backups/schedules/${id}`,
      {
        method: "PUT",
        headers: headers(),
        body: JSON.stringify(data),
      },
    );
    const result = await handleResponse(response);
    return result.data ?? result;
  },

  toggleBackupSchedule: async (id: number): Promise<any> => {
    const response = await fetch(
      `${API_URL}/superadmin/backups/schedules/${id}/toggle`,
      {
        method: "PATCH",
        headers: headers(),
      },
    );
    const result = await handleResponse(response);
    return result.data ?? result;
  },

  runBackupScheduleNow: async (id: number): Promise<any> => {
    const response = await fetch(
      `${API_URL}/superadmin/backups/schedules/${id}/run-now`,
      {
        method: "POST",
        headers: headers(),
      },
    );
    const result = await handleResponse(response);
    return result.data ?? result;
  },

  deleteBackupSchedule: async (id: number): Promise<{ message: string }> => {
    const response = await fetch(
      `${API_URL}/superadmin/backups/schedules/${id}`,
      {
        method: "DELETE",
        headers: headers(),
      },
    );
    return handleResponse(response);
  },

  purgeOldBackupsNow: async (): Promise<any> => {
    const response = await fetch(
      `${API_URL}/superadmin/backups/purge-now`,
      {
        method: "POST",
        headers: headers(),
      },
    );
    return handleResponse(response);
  },

  // ---------------- USERS ----------------
  getUsers: async (): Promise<any> => {
    const response = await fetch(`${API_URL}/superadmin/users`, {
      headers: headers(),
    });
    const result = await handleResponse(response);
    return result.data ?? result;
  },

  getUser: async (id: number): Promise<any> => {
    const response = await fetch(`${API_URL}/superadmin/users/${id}`, {
      headers: headers(),
    });
    const result = await handleResponse(response);
    return result.data ?? result;
  },

  createUser: async (data: FormData): Promise<any> => {
    return mutateWithQueue(`${API_URL}/superadmin/users`, "POST", {
      formData: data,
      label: "Create user",
      tag: "user-create",
    });
  },

  updateUser: async (id: number, data: FormData): Promise<any> => {
    return mutateWithQueue(`${API_URL}/superadmin/users/${id}`, "POST", {
      formData: data,
      label: `Update user ${id}`,
      tag: "user-update",
    });
  },

  deleteUser: async (id: number): Promise<{ message: string }> => {
    return mutateWithQueue(`${API_URL}/superadmin/users/${id}`, "DELETE", {
      label: `Delete user ${id}`,
      tag: "user-delete",
    });
  },

  toggleUserActive: async (id: number, is_active: boolean): Promise<any> => {
    return mutateWithQueue(
      `${API_URL}/superadmin/users/${id}/toggle`,
      "PATCH",
      {
        body: { is_active },
        label: `Toggle user ${id}`,
        tag: "user-toggle",
      },
    );
  },

  getStats: async (): Promise<any> => {
    const response = await fetch(`${API_URL}/superadmin/stats`, {
      headers: headers(),
    });
    const result = await handleResponse(response);
    return result.data ?? result;
  },

  // ---------------- FACULTY CSV ----------------
  downloadFacultyTemplate: async (): Promise<Blob> => {
    const response = await fetch(`${API_URL}/superadmin/faculty/template`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Template failed (${response.status})`);
    }
    return response.blob();
  },

  exportFacultyCsv: async (): Promise<Blob> => {
    const response = await fetch(`${API_URL}/superadmin/faculty/export`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Export failed (${response.status})`);
    }
    return response.blob();
  },

  startFacultyImport: async (formData: FormData): Promise<any> => {
    const response = await fetch(`${API_URL}/superadmin/faculty/import/start`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
      body: formData,
    });
    return handleResponse(response);
  },

  processFacultyImportChunk: async (
    id: number,
    chunkSize: number = 25,
  ): Promise<any> => {
    const response = await fetch(
      `${API_URL}/superadmin/faculty/import/${id}/process-chunk`,
      {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ chunk_size: chunkSize }),
      },
    );
    const result = await handleResponse(response);
    return result.data ?? result;
  },

  getFacultyImportStatus: async (id: number): Promise<any> => {
    const response = await fetch(
      `${API_URL}/superadmin/faculty/import/${id}/status`,
      { headers: headers() },
    );
    const result = await handleResponse(response);
    return result.data ?? result;
  },

  cancelFacultyImport: async (id: number): Promise<any> => {
    const response = await fetch(
      `${API_URL}/superadmin/faculty/import/${id}/cancel`,
      { method: "POST", headers: headers() },
    );
    return handleResponse(response);
  },

  getFacultyImportHistory: async (): Promise<any[]> => {
    const response = await fetch(
      `${API_URL}/superadmin/faculty/import/history`,
      { headers: headers() },
    );
    const result = await handleResponse(response);
    return result.data ?? result;
  },

    // ---------------- FACULTY CSV (legacy single-shot import) ----------------
  importFacultyCsv: async (formData: FormData): Promise<any> => {
    const response = await fetch(`${API_URL}/superadmin/faculty/import`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
      body: formData,
    });
    return handleResponse(response);
  },
};

// ============================================================
// ADMIN API
// ============================================================
export const adminApi = {

    // ---------------- STUDENT IMPORT (legacy single-shot) ----------------
  importStudents: async (formData: FormData): Promise<any> => {
    const response = await fetch(`${API_URL}/admin/students/import`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
      body: formData,
    });
    return handleResponse(response);
  },
  // ---------------- DASHBOARD ----------------
  getStats: async (): Promise<DashboardStats> => {
    const response = await fetch(`${API_URL}/dashboard/stats`, {
      headers: headers(),
    });
    const result = await handleResponse(response);
    return result.data ?? result;
  },

  // ---------------- OPTIONS ----------------
  getCourses: async (): Promise<string[]> => {
    const response = await fetch(`${API_URL}/options/courses`, {
      headers: headers(),
    });
    const result = await handleResponse(response);
    return result.data ?? [];
  },

  getSections: async (): Promise<string[]> => {
    const response = await fetch(`${API_URL}/options/sections`, {
      headers: headers(),
    });
    const result = await handleResponse(response);
    return result.data ?? [];
  },

  getYearLevels: async (): Promise<number[]> => {
    const response = await fetch(`${API_URL}/options/year-levels`, {
      headers: headers(),
    });
    const result = await handleResponse(response);
    return result.data ?? [];
  },

  getComponents: async (): Promise<Array<{ value: string; label: string }>> => {
    const response = await fetch(`${API_URL}/options/components`, {
      headers: headers(),
    });
    const result = await handleResponse(response);
    return result.data ?? [];
  },

  // ---------------- STUDENTS ----------------
  getStudents: async (params?: {
    search?: string;
    component?: string;
    status?: string;
    eligible?: string;
    course?: string;
    section?: string;
    page?: number;
    per_page?: number;
  }): Promise<StudentResponse> => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          query.append(key, String(value));
        }
      });
    }
    const response = await fetch(
      `${API_URL}/admin/students?${query.toString()}`,
      { headers: headers() },
    );
    const result = await handleResponse(response);
    return {
      data: result.data || [],
      meta: result.meta || {
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0,
        from: 0,
        to: 0,
      },
    };
  },

  getStudent: async (id: number): Promise<Student> => {
    const response = await fetch(`${API_URL}/admin/students/${id}`, {
      headers: headers(),
    });
    const result = await handleResponse(response);
    return result.data ?? result;
  },

  createStudent: async (data: any): Promise<Student> => {
    const result = await mutateWithQueue(`${API_URL}/admin/students`, "POST", {
      body: data,
      label: `Create student ${data.student_id || ""}`,
      tag: "student-create",
    });
    return result.data ?? result;
  },

  updateStudent: async (id: number, data: any): Promise<Student> => {
    const result = await mutateWithQueue(
      `${API_URL}/admin/students/${id}`,
      "PUT",
      {
        body: data,
        label: `Update student ${id}`,
        tag: "student-update",
      },
    );
    return result.data ?? result;
  },

  deleteStudent: async (id: number): Promise<{ message: string }> => {
    return mutateWithQueue(`${API_URL}/admin/students/${id}`, "DELETE", {
      label: `Delete student ${id}`,
      tag: "student-delete",
    });
  },

  bulkDeleteStudents: async (
    ids: number[],
  ): Promise<{ message: string; deleted_count: number }> => {
    return mutateWithQueue(`${API_URL}/admin/students/bulk`, "DELETE", {
      body: { ids },
      label: `Bulk delete ${ids.length} students`,
      tag: "student-bulk-delete",
    });
  },

  exportStudents: async (params?: { component?: string }): Promise<Blob> => {
    const query = new URLSearchParams();
    if (params?.component) query.append("component", params.component);
    const response = await fetch(
      `${API_URL}/admin/students/export?${query.toString()}`,
      { headers: { Authorization: `Bearer ${getToken()}` } },
    );
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Export failed (${response.status})`);
    }
    return response.blob();
  },

  downloadStudentTemplate: async (): Promise<Blob> => {
    const response = await fetch(`${API_URL}/admin/students/template`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Template failed (${response.status})`);
    }
    return response.blob();
  },

  // ---------------- STUDENT IMPORT (chunked sync) ----------------
  startStudentImport: async (formData: FormData): Promise<any> => {
    const response = await fetch(`${API_URL}/admin/students/import/start`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
      body: formData,
    });
    return handleResponse(response);
  },

  processStudentImportChunk: async (
    id: number,
    chunkSize: number = 50,
  ): Promise<any> => {
    const response = await fetch(
      `${API_URL}/admin/students/import/${id}/process-chunk`,
      {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ chunk_size: chunkSize }),
      },
    );
    const result = await handleResponse(response);
    return result.data ?? result;
  },

  getStudentImportStatus: async (id: number): Promise<any> => {
    const response = await fetch(
      `${API_URL}/admin/students/import/${id}/status`,
      { headers: headers() },
    );
    const result = await handleResponse(response);
    return result.data ?? result;
  },

  cancelStudentImport: async (id: number): Promise<any> => {
    const response = await fetch(
      `${API_URL}/admin/students/import/${id}/cancel`,
      { method: "POST", headers: headers() },
    );
    return handleResponse(response);
  },

  getStudentImportHistory: async (): Promise<any[]> => {
    const response = await fetch(
      `${API_URL}/admin/students/import/history`,
      { headers: headers() },
    );
    const result = await handleResponse(response);
    return result.data ?? result;
  },

  getStudentStats: async (): Promise<any> => {
    const response = await fetch(`${API_URL}/admin/students/stats`, {
      headers: headers(),
    });
    const result = await handleResponse(response);
    return result.data ?? result;
  },

  // ---------------- COMPONENT CHANGE REQUESTS ----------------
  getChangeRequests: async (
    status?: string,
  ): Promise<ComponentChangeRequest[]> => {
    const query = status ? `?status=${status}` : "";
    const response = await fetch(
      `${API_URL}/admin/component-requests${query}`,
      { headers: headers() },
    );
    const result = await handleResponse(response);
    return result.data ?? result;
  },

  handleChangeRequest: async (
    id: number,
    status: "approved" | "rejected",
    admin_remarks?: string,
  ): Promise<ComponentChangeRequest> => {
    const result = await mutateWithQueue(
      `${API_URL}/admin/component-requests/${id}`,
      "PUT",
      {
        body: { status, admin_remarks },
        label: `Handle component request ${id}`,
        tag: "component-request",
      },
    );
    return result.data ?? result;
  },

  // ---------------- ACTIVITIES ----------------
  getActivities: async (): Promise<Activity[]> => {
    const response = await fetch(`${API_URL}/activities`, {
      headers: headers(),
    });
    const result = await handleResponse(response);
    return result.data ?? result;
  },

  createActivity: async (data: any): Promise<Activity> => {
    const result = await mutateWithQueue(`${API_URL}/activities`, "POST", {
      body: data,
      label: `Create activity: ${data.title || ""}`,
      tag: "activity-create",
    });
    return result.data ?? result;
  },

  updateActivity: async (id: number, data: any): Promise<Activity> => {
    const result = await mutateWithQueue(
      `${API_URL}/activities/${id}`,
      "PUT",
      {
        body: data,
        label: `Update activity ${id}`,
        tag: "activity-update",
      },
    );
    return result.data ?? result;
  },

  deleteActivity: async (id: number): Promise<{ message: string }> => {
    return mutateWithQueue(`${API_URL}/activities/${id}`, "DELETE", {
      label: `Delete activity ${id}`,
      tag: "activity-delete",
    });
  },

  getActivityParticipants: async (id: number): Promise<any[]> => {
    const response = await fetch(`${API_URL}/activities/${id}/participants`, {
      headers: headers(),
    });
    const result = await handleResponse(response);
    return result.data ?? result;
  },

  updateParticipantStatus: async (
    activityId: number,
    participantId: number,
    status: string,
  ): Promise<any> => {
    return mutateWithQueue(
      `${API_URL}/activities/${activityId}/participants/${participantId}`,
      "PUT",
      {
        body: { attendance_status: status },
        label: `Update participant ${participantId}`,
        tag: "activity-participant-update",
      },
    );
  },

  removeParticipant: async (
    activityId: number,
    participantId: number,
  ): Promise<{ message: string }> => {
    return mutateWithQueue(
      `${API_URL}/activities/${activityId}/participants/${participantId}`,
      "DELETE",
      {
        label: `Remove participant ${participantId}`,
        tag: "activity-participant-delete",
      },
    );
  },

  // ---------------- ACTIVITY MAP ----------------
  getActivitiesWithLocations: async (params?: {
    status?: string;
    component?: string;
    start_date?: string;
    end_date?: string;
  }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value && value !== "all") query.append(key, value);
      });
    }
    const response = await fetch(
      `${API_URL}/activities/map?${query.toString()}`,
      { headers: headers() },
    );
    const result = await handleResponse(response);
    return result;
  },

  getActivityLocation: async (id: number) => {
    const response = await fetch(`${API_URL}/activities/${id}/map`, {
      headers: headers(),
    });
    const result = await handleResponse(response);
    return result.data;
  },

  updateActivityLocation: async (
    id: number,
    data: { latitude: number; longitude: number; geofence_radius?: number },
  ) => {
    const result = await mutateWithQueue(
      `${API_URL}/activities/${id}/location`,
      "PUT",
      {
        body: data,
        label: `Update activity ${id} location`,
        tag: "activity-location",
      },
    );
    return result.data;
  },

  // ---------------- CLASSES ----------------
  getClasses: async (params?: {
    component_type?: string;
    status?: string;
    search?: string;
    school_year?: string;
    academic_year_id?: number | string;
  }): Promise<ClassGroup[]> => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (
          value !== undefined &&
          value !== null &&
          value !== "" &&
          value !== "all"
        ) {
          query.append(key, String(value));
        }
      });
    }
    const response = await fetch(
      `${API_URL}/admin/classes?${query.toString()}`,
      { headers: headers() },
    );
    const result = await handleResponse(response);
    return result.data ?? result;
  },

  getClassSchoolYears: async (): Promise<string[]> => {
    const response = await fetch(`${API_URL}/admin/classes/school-years`, {
      headers: headers(),
    });
    const result = await handleResponse(response);
    return result.data ?? [];
  },

  exportClasses: async (params?: {
    school_year?: string;
    component_type?: string;
    status?: string;
  }): Promise<Blob> => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v && v !== "all") query.append(k, v);
      });
    }
    const response = await fetch(
      `${API_URL}/admin/classes/export?${query.toString()}`,
      { headers: { Authorization: `Bearer ${getToken()}` } },
    );
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Export failed (${response.status})`);
    }
    return response.blob();
  },

  createClass: async (data: CreateClassRequest): Promise<ClassGroup> => {
    const result = await mutateWithQueue(`${API_URL}/admin/classes`, "POST", {
      body: data,
      label: `Create class: ${data.name || ""}`,
      tag: "class-create",
    });
    return result.data ?? result;
  },

  getClass: async (id: number): Promise<ClassGroup> => {
    const response = await fetch(`${API_URL}/admin/classes/${id}`, {
      headers: headers(),
    });
    const result = await handleResponse(response);
    return result.data ?? result;
  },

  updateClass: async (
    id: number,
    data: UpdateClassRequest,
  ): Promise<ClassGroup> => {
    const result = await mutateWithQueue(
      `${API_URL}/admin/classes/${id}`,
      "PUT",
      {
        body: data,
        label: `Update class ${id}`,
        tag: "class-update",
      },
    );
    return result.data ?? result;
  },

  deleteClass: async (id: number): Promise<{ message: string }> => {
    return mutateWithQueue(`${API_URL}/admin/classes/${id}`, "DELETE", {
      label: `Delete class ${id}`,
      tag: "class-delete",
    });
  },

  toggleArchiveClass: async (id: number): Promise<ClassGroup> => {
    const result = await mutateWithQueue(
      `${API_URL}/admin/classes/${id}/toggle-archive`,
      "PATCH",
      {
        label: `Toggle archive class ${id}`,
        tag: "class-toggle",
      },
    );
    return result.data ?? result;
  },

  getClassStudents: async (id: number): Promise<any[]> => {
    const response = await fetch(`${API_URL}/admin/classes/${id}/students`, {
      headers: headers(),
    });
    const result = await handleResponse(response);
    return result.data ?? result;
  },

  addStudentsToClass: async (
    id: number,
    studentIds: number[],
  ): Promise<any> => {
    const result = await mutateWithQueue(
      `${API_URL}/admin/classes/${id}/students`,
      "POST",
      {
        body: { student_ids: studentIds },
        label: `Add students to class ${id}`,
        tag: "class-add-students",
      },
    );
    return result.data ?? result;
  },

  removeStudentFromClass: async (
    classId: number,
    studentId: number,
  ): Promise<{ message: string }> => {
    return mutateWithQueue(
      `${API_URL}/admin/classes/${classId}/students/${studentId}`,
      "DELETE",
      {
        label: `Remove student from class ${classId}`,
        tag: "class-remove-student",
      },
    );
  },

  // ---------------- DOCUMENTS ----------------
  getDocuments: async (params?: {
    status?: string;
    student_id?: number;
    search?: string;
  }): Promise<DocumentResponse> => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          query.append(key, String(value));
        }
      });
    }
    const response = await fetch(
      `${API_URL}/admin/documents?${query.toString()}`,
      { headers: headers() },
    );
    const result = await handleResponse(response);
    return {
      data: result.data || [],
      meta: result.meta || {
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0,
        from: 0,
        to: 0,
      },
    };
  },

  verifyDocument: async (
    id: number,
    status: "approved" | "rejected",
    rejection_reason?: string,
  ): Promise<Document> => {
    const result = await mutateWithQueue(
      `${API_URL}/admin/documents/${id}/verify`,
      "PUT",
      {
        body: { status, rejection_reason },
        label: `Verify document ${id}`,
        tag: "document-verify",
      },
    );
    return result.data ?? result;
  },

  // ---------------- OFFICE DOCUMENTS ----------------
  getOfficeDocuments: async (params?: {
    category?: string;
  }): Promise<{ data: OfficeDocument[] }> => {
    const query = new URLSearchParams();
    if (params?.category) query.append("category", params.category);
    const response = await fetch(
      `${API_URL}/office-documents?${query.toString()}`,
      { headers: headers() },
    );
    const result = await handleResponse(response);
    return { data: result.data || [] };
  },

  uploadOfficeDocument: async (
    formData: FormData,
  ): Promise<OfficeDocument & { ocr_text?: string }> => {
    return mutateWithQueue(`${API_URL}/office-documents`, "POST", {
      formData,
      label: "Upload office document",
      tag: "office-doc-upload",
    });
  },

  deleteOfficeDocument: async (id: number): Promise<{ message: string }> => {
    return mutateWithQueue(`${API_URL}/office-documents/${id}`, "DELETE", {
      label: `Delete office document ${id}`,
      tag: "office-doc-delete",
    });
  },

  // ---------------- ATTENDANCE ----------------
  getAttendanceSessions: async (params?: {
    class_id?: number;
  }): Promise<AttendanceSession[]> => {
    const query = new URLSearchParams();
    if (params?.class_id) query.append("class_id", String(params.class_id));
    const response = await fetch(
      `${API_URL}/attendance/sessions?${query.toString()}`,
      { headers: headers() },
    );
    const result = await handleResponse(response);
    return result.data ?? result;
  },

  createAttendanceSession: async (data: any): Promise<AttendanceSession> => {
    const result = await mutateWithQueue(
      `${API_URL}/attendance/session`,
      "POST",
      {
        body: data,
        label: `Create attendance session`,
        tag: "attendance-session-create",
      },
    );
    return result.data ?? result;
  },

  closeAttendanceSession: async (id: number): Promise<{ message: string }> => {
    return mutateWithQueue(
      `${API_URL}/attendance/session/${id}/close`,
      "PATCH",
      {
        label: `Close session ${id}`,
        tag: "attendance-session-close",
      },
    );
  },

  getSessionLogs: async (sessionId: number): Promise<AttendanceLog[]> => {
    const response = await fetch(
      `${API_URL}/attendance/session/${sessionId}/logs`,
      { headers: headers() },
    );
    const result = await handleResponse(response);
    return result.data ?? result;
  },

  // ---------------- CERTIFICATES ----------------
  getCertificates: async (): Promise<Certificate[]> => {
    const response = await fetch(`${API_URL}/admin/certificates`, {
      headers: headers(),
    });
    const result = await handleResponse(response);
    return result.data ?? result;
  },

  getEligibleStudents: async (search?: string): Promise<any[]> => {
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    const response = await fetch(
      `${API_URL}/admin/certificates/eligible-students${query}`,
      { headers: headers() },
    );
    const result = await handleResponse(response);
    return result.data ?? result;
  },

  generateCertificate: async (data: {
    student_id: number;
    certificate_type: string;
    description?: string;
  }): Promise<Certificate> => {
    const result = await mutateWithQueue(
      `${API_URL}/admin/certificates/generate`,
      "POST",
      {
        body: data,
        label: `Generate certificate for student ${data.student_id}`,
        tag: "certificate-generate",
      },
    );
    return result.data ?? result;
  },

  batchGenerateCertificates: async (data: {
    student_ids: number[];
    certificate_type: string;
  }): Promise<Certificate[]> => {
    const result = await mutateWithQueue(
      `${API_URL}/admin/certificates/batch`,
      "POST",
      {
        body: data,
        label: `Batch generate ${data.student_ids.length} certificates`,
        tag: "certificate-batch",
      },
    );
    return result.data ?? result;
  },

  // ---------------- REPORTS ----------------
  getEnrollmentReport: async (): Promise<any> => {
    const response = await fetch(`${API_URL}/admin/reports/compliance`, {
      headers: headers(),
    });
    const result = await handleResponse(response);
    return result.data ?? result;
  },

  getDeficiencyReport: async (): Promise<any> => {
    const response = await fetch(`${API_URL}/admin/reports/deficiency`, {
      headers: headers(),
    });
    const result = await handleResponse(response);
    return result.data ?? result;
  },

  getAttendanceReport: async (params: {
    start_date: string;
    end_date: string;
    component?: string;
  }): Promise<any> => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) query.append(key, String(value));
    });
    const response = await fetch(
      `${API_URL}/admin/reports/attendance?${query.toString()}`,
      { headers: headers() },
    );
    const result = await handleResponse(response);
    return result.data ?? result;
  },

  getAccomplishmentReport: async (params?: {
    component?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
    search?: string;
  }): Promise<any> => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          query.append(key, String(value));
        }
      });
    }
    const response = await fetch(
      `${API_URL}/admin/reports/accomplishment?${query.toString()}`,
      { headers: headers() },
    );
    const result = await handleResponse(response);
    return result.data ?? result;
  },

  downloadAccomplishmentPDF: async (params?: {
    component?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<Blob> => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          query.append(key, String(value));
        }
      });
    }
    const response = await fetch(
      `${API_URL}/admin/reports/accomplishment/pdf?${query.toString()}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
      },
    );
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.message || `PDF generation failed (${response.status})`,
      );
    }
    return response.blob();
  },

  exportAccomplishmentCSV: async (params?: {
    component?: string;
    status?: string;
  }): Promise<Blob> => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          query.append(key, String(value));
        }
      });
    }
    const response = await fetch(
      `${API_URL}/admin/reports/accomplishment/export?${query.toString()}`,
      { headers: { Authorization: `Bearer ${getToken()}` } },
    );
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Export failed (${response.status})`);
    }
    return response.blob();
  },

  // ---------------- ACADEMIC YEARS ----------------
  getAcademicYears: async (): Promise<AcademicYear[]> => {
    const response = await fetch(`${API_URL}/admin/academic-years`, {
      headers: headers(),
    });
    const result = await handleResponse(response);
    return result.data ?? result;
  },

  createAcademicYear: async (data: any): Promise<AcademicYear> => {
    const result = await mutateWithQueue(
      `${API_URL}/admin/academic-years`,
      "POST",
      {
        body: data,
        label: `Create academic year`,
        tag: "academic-year-create",
      },
    );
    return result.data ?? result;
  },

  updateAcademicYear: async (id: number, data: any): Promise<AcademicYear> => {
    const result = await mutateWithQueue(
      `${API_URL}/admin/academic-years/${id}`,
      "PUT",
      {
        body: data,
        label: `Update academic year ${id}`,
        tag: "academic-year-update",
      },
    );
    return result.data ?? result;
  },

  deleteAcademicYear: async (id: number): Promise<{ message: string }> => {
    return mutateWithQueue(
      `${API_URL}/admin/academic-years/${id}`,
      "DELETE",
      {
        label: `Delete academic year ${id}`,
        tag: "academic-year-delete",
      },
    );
  },

  getCurrentAcademicYear: async (): Promise<AcademicYear> => {
    const response = await fetch(`${API_URL}/admin/academic-years/current`, {
      headers: headers(),
    });
    const result = await handleResponse(response);
    return result.data ?? result;
  },

  // ---------------- BULLETIN ----------------
  getBulletin: async (): Promise<BulletinPost[]> => {
    const response = await fetch(`${API_URL}/bulletin`, {
      headers: headers(),
    });
    const result = await handleResponse(response);
    return result.data ?? result;
  },

  createBulletin: async (data: any): Promise<BulletinPost> => {
    const result = await mutateWithQueue(`${API_URL}/bulletin`, "POST", {
      body: data,
      label: `Create bulletin: ${data.title || ""}`,
      tag: "bulletin-create",
    });
    return result.data ?? result;
  },

  updateBulletin: async (id: number, data: any): Promise<BulletinPost> => {
    const result = await mutateWithQueue(`${API_URL}/bulletin/${id}`, "PUT", {
      body: data,
      label: `Update bulletin ${id}`,
      tag: "bulletin-update",
    });
    return result.data ?? result;
  },

  deleteBulletin: async (id: number): Promise<{ message: string }> => {
    return mutateWithQueue(`${API_URL}/bulletin/${id}`, "DELETE", {
      label: `Delete bulletin ${id}`,
      tag: "bulletin-delete",
    });
  },

  // ---------------- SETTINGS ----------------
  getSettings: async (): Promise<SystemSettings> => {
    const response = await fetch(`${API_URL}/settings`, {
      headers: headers(),
    });
    return handleResponse(response);
  },

  updateSettings: async (
    data: Partial<SystemSettings>,
  ): Promise<{ message: string }> => {
    return mutateWithQueue(`${API_URL}/settings`, "PUT", {
      body: data,
      label: "Update settings",
      tag: "settings-update",
    });
  },

  // ---------------- GRADES ----------------
  getGrades: async (params?: {
    component?: string;
    grade_status?: "passing" | "failing" | "ungraded";
    grade_level?: "excellent" | "good" | "satisfactory" | "deficient";
    search?: string;
  }): Promise<any> => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          query.append(key, String(value));
        }
      });
    }
    const response = await fetch(`${API_URL}/admin/grades?${query.toString()}`, {
      headers: headers(),
    });
    const result = await handleResponse(response);
    return result.data ?? result;
  },

  getGradeScale: async (): Promise<any> => {
    const response = await fetch(`${API_URL}/admin/grades/scale`, {
      headers: headers(),
    });
    const result = await handleResponse(response);
    return result.data ?? result;
  },

  getGradeStats: async (): Promise<any> => {
    const response = await fetch(`${API_URL}/admin/grades/stats`, {
      headers: headers(),
    });
    const result = await handleResponse(response);
    return result.data ?? result;
  },

  getStudentGrade: async (id: number): Promise<any> => {
    const response = await fetch(`${API_URL}/admin/grades/${id}`, {
      headers: headers(),
    });
    const result = await handleResponse(response);
    return result.data ?? result;
  },

  updateGrade: async (
    id: number,
    data: {
      grade?: number;
      percentage?: number;
      remarks?: string;
    },
  ): Promise<any> => {
    const result = await mutateWithQueue(
      `${API_URL}/admin/grades/${id}`,
      "PUT",
      {
        body: data,
        label: `Update grade for student ${id}`,
        tag: "grade-update",
      },
    );
    return result.data ?? result;
  },

  batchUpdateGrades: async (data: {
    student_ids: number[];
    percentage: number;
    remarks?: string;
  }): Promise<any> => {
    const result = await mutateWithQueue(
      `${API_URL}/admin/grades/batch`,
      "POST",
      {
        body: data,
        label: `Batch update ${data.student_ids.length} grades`,
        tag: "grade-batch",
      },
    );
    return result.data ?? result;
  },

  recalculateGrades: async (params?: { component?: string }): Promise<any> => {
    const query = new URLSearchParams();
    if (params?.component) query.append("component", params.component);
    const result = await mutateWithQueue(
      `${API_URL}/admin/grades/recalculate?${query.toString()}`,
      "POST",
      {
        label: "Recalculate all grades",
        tag: "grade-recalculate",
      },
    );
    return result.data ?? result;
  },

  exportGrades: async (params?: { component?: string }): Promise<Blob> => {
    const query = new URLSearchParams();
    if (params?.component) query.append("component", params.component);
    const response = await fetch(
      `${API_URL}/admin/grades/export?${query.toString()}`,
      { headers: { Authorization: `Bearer ${getToken()}` } },
    );
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Export failed (${response.status})`);
    }
    return response.blob();
  },
};

// ============================================================
// OCR API
// ============================================================
export const ocrApi = {
  saveOCR: async (data: {
    document_id: number;
    extracted_text: string;
    confidence?: number;
    file_name?: string;
    document_type?: "student" | "office";
  }): Promise<any> => {
    const result = await mutateWithQueue(`${API_URL}/documents/save-ocr`, "POST", {
      body: data,
      label: `Save OCR for document ${data.document_id}`,
      tag: "ocr-save",
    });
    return result.data ?? result;
  },

  getOCRHistory: async (documentId: number): Promise<any[]> => {
    const response = await fetch(
      `${API_URL}/documents/${documentId}/ocr-history`,
      { headers: headers() },
    );
    const result = await handleResponse(response);
    return result.data ?? result;
  },

  downloadOCR: async (id: number): Promise<Blob> => {
    const response = await fetch(`${API_URL}/ocr-texts/${id}/download`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Download failed (${response.status})`);
    }
    return response.blob();
  },

  deleteOCR: async (id: number): Promise<{ message: string }> => {
    return mutateWithQueue(`${API_URL}/ocr-texts/${id}`, "DELETE", {
      label: `Delete OCR ${id}`,
      tag: "ocr-delete",
    });
  },

  getOCRStats: async (): Promise<any> => {
    const response = await fetch(`${API_URL}/ocr-stats`, {
      headers: headers(),
    });
    const result = await handleResponse(response);
    return result.data ?? result;
  },
};

// ============================================================
// STUDENT API
// ============================================================
export const studentApi = {
  getProfile: async (): Promise<Student> => {
    const response = await fetch(`${API_URL}/student/profile`, {
      headers: headers(),
    });
    const result = await handleResponse(response);
    return result.data ?? result;
  },

  getComplianceStatus: async (): Promise<any> => {
    const response = await fetch(`${API_URL}/student/compliance-status`, {
      headers: headers(),
    });
    const result = await handleResponse(response);
    return result.data ?? result;
  },

  getDocuments: async (): Promise<Document[]> => {
    const response = await fetch(`${API_URL}/student/documents`, {
      headers: headers(),
    });
    const result = await handleResponse(response);
    return result.data ?? result;
  },

  uploadDocument: async (formData: FormData): Promise<Document> => {
    const result = await mutateWithQueue(`${API_URL}/student/documents`, "POST", {
      formData,
      label: "Upload student document",
      tag: "student-doc-upload",
    });
    return result.data ?? result;
  },

  deleteDocument: async (id: number): Promise<{ message: string }> => {
    return mutateWithQueue(`${API_URL}/student/documents/${id}`, "DELETE", {
      label: `Delete document ${id}`,
      tag: "student-doc-delete",
    });
  },

  getCertificates: async (): Promise<Certificate[]> => {
    const response = await fetch(`${API_URL}/student/certificates`, {
      headers: headers(),
    });
    const result = await handleResponse(response);
    return result.data ?? result;
  },

  downloadCertificate: async (id: number): Promise<Blob> => {
    const response = await fetch(
      `${API_URL}/student/certificates/${id}/download`,
      { headers: { Authorization: `Bearer ${getToken()}` } },
    );
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Download failed (${response.status})`);
    }
    return response.blob();
  },

  getActivities: async (): Promise<Activity[]> => {
    const response = await fetch(`${API_URL}/student/activities`, {
      headers: headers(),
    });
    const result = await handleResponse(response);
    return result.data ?? result;
  },

  registerActivity: async (
    activityId: number,
  ): Promise<{ message: string }> => {
    return mutateWithQueue(
      `${API_URL}/student/activities/${activityId}/register`,
      "POST",
      {
        label: `Register for activity ${activityId}`,
        tag: "student-activity-register",
      },
    );
  },

  getAnnouncements: async (): Promise<BulletinPost[]> => {
    const response = await fetch(`${API_URL}/student/announcements`, {
      headers: headers(),
    });
    const result = await handleResponse(response);
    return result.data ?? result;
  },

  getNotifications: async (
    page: number = 1,
  ): Promise<{ data: any[]; meta: any }> => {
    const response = await fetch(
      `${API_URL}/student/notifications?page=${page}`,
      { headers: headers() },
    );
    const result = await handleResponse(response);
    return result;
  },

  markNotificationRead: async (id: number): Promise<{ message: string }> => {
    return mutateWithQueue(
      `${API_URL}/student/notifications/${id}/read`,
      "POST",
      {
        label: `Mark notification ${id} read`,
        tag: "student-notif-read",
      },
    );
  },

  markAllNotificationsRead: async (): Promise<{ message: string }> => {
    return mutateWithQueue(
      `${API_URL}/student/notifications/read-all`,
      "POST",
      {
        label: "Mark all notifications read",
        tag: "student-notif-read-all",
      },
    );
  },

  getUnreadNotificationCount: async (): Promise<{ unread_count: number }> => {
    const response = await fetch(
      `${API_URL}/student/notifications/unread-count`,
      { headers: headers() },
    );
    const result = await handleResponse(response);
    return result;
  },

  registerFace: async (
    faceDescriptor: number[],
  ): Promise<{ message: string }> => {
    return mutateWithQueue(`${API_URL}/student/register-face`, "POST", {
      body: { face_descriptor: faceDescriptor },
      label: "Register face",
      tag: "student-face",
    });
  },

  checkInAttendance: async (data: {
    class_id: number;
    embedding: number[];
    latitude?: number;
    longitude?: number;
    accuracy?: number;
  }): Promise<AttendanceLog> => {
    const result = await mutateWithQueue(
      `${API_URL}/attendance/checkin`,
      "POST",
      {
        body: {
          class_id: data.class_id,
          embedding: data.embedding,
          ...(data.latitude !== undefined && data.longitude !== undefined
            ? {
                latitude: data.latitude,
                longitude: data.longitude,
                accuracy: data.accuracy,
              }
            : {}),
        },
        label: "Attendance check-in",
        tag: "attendance-checkin",
      },
    );
    return result.data ?? result;
  },

  getAttendanceHistory: async (): Promise<AttendanceLog[]> => {
    const response = await fetch(`${API_URL}/attendance/my-history`, {
      headers: headers(),
    });
    const result = await handleResponse(response);
    return result.data ?? result;
  },

  selectComponent: async (
    component: "cwts" | "rotc" | "lts",
  ): Promise<{ message: string; component: string }> => {
    return mutateWithQueue(`${API_URL}/select-component`, "POST", {
      body: { component },
      label: `Select component ${component}`,
      tag: "student-component",
    });
  },

  requestComponentChange: async (
    to_component: "cwts" | "rotc" | "lts",
    reason: string,
  ): Promise<ComponentChangeRequest> => {
    const result = await mutateWithQueue(
      `${API_URL}/request-component-change`,
      "POST",
      {
        body: { to_component, reason },
        label: `Request component change to ${to_component}`,
        tag: "student-component-change",
      },
    );
    return result.data ?? result;
  },

  // NOTE: joinClass REMOVED — students are auto-enrolled via class_code on import

  getMyClasses: async (): Promise<any[]> => {
    const response = await fetch(`${API_URL}/student/classes`, {
      headers: headers(),
    });
    const result = await handleResponse(response);
    return result.data ?? result;
  },

  getClassMaterials: async (classId: number): Promise<any[]> => {
    const response = await fetch(
      `${API_URL}/student/classes/${classId}/materials`,
      { headers: headers() },
    );
    const result = await handleResponse(response);
    return result.data ?? result;
  },

  downloadMaterial: async (materialId: number): Promise<Blob> => {
    const response = await fetch(
      `${API_URL}/student/materials/${materialId}/download`,
      { headers: { Authorization: `Bearer ${getToken()}` } },
    );
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Download failed (${response.status})`);
    }
    return response.blob();
  },

  updateProfile: async (data: any): Promise<{ message: string }> => {
    return mutateWithQueue(`${API_URL}/student/profile`, "PUT", {
      body: data,
      label: "Update student profile",
      tag: "student-profile-update",
    });
  },

  requestOtp: async (): Promise<{ message: string; otp?: string }> => {
    return mutateWithQueue(`${API_URL}/student/request-otp`, "POST", {
      label: "Request password OTP",
      tag: "student-otp",
    });
  },

  changePassword: async (data: {
    otp: string;
    new_password: string;
    new_password_confirmation: string;
  }): Promise<{ message: string }> => {
    return mutateWithQueue(`${API_URL}/student/change-password`, "POST", {
      body: data,
      label: "Change student password",
      tag: "student-password-change",
    });
  },
};

// ============================================================
// FACULTY API
// ============================================================
export const facultyApi = {
  getClass: async (id: number): Promise<any> => {
    const response = await fetch(`${API_URL}/faculty/class/${id}`, {
      headers: headers(),
    });
    const result = await handleResponse(response);
    return result.data ?? result;
  },

  getClasses: async (): Promise<any[]> => {
    const response = await fetch(`${API_URL}/faculty/classes`, {
      headers: headers(),
    });
    const result = await handleResponse(response);
    return result.data ?? result;
  },

  getClassStudents: async (id: number): Promise<any[]> => {
    const response = await fetch(`${API_URL}/faculty/classes/${id}/students`, {
      headers: headers(),
    });
    const result = await handleResponse(response);
    return result.data ?? result;
  },

  getDashboard: async (): Promise<any> => {
    const response = await fetch(`${API_URL}/faculty/dashboard`, {
      headers: headers(),
    });
    const result = await handleResponse(response);
    return result.data ?? result;
  },

  getStudents: async (search?: string): Promise<Student[]> => {
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    const response = await fetch(`${API_URL}/faculty/students${query}`, {
      headers: headers(),
    });
    const result = await handleResponse(response);
    return result.data ?? result;
  },

  createClass: async (data: any): Promise<any> => {
    const result = await mutateWithQueue(`${API_URL}/faculty/classes`, "POST", {
      body: data,
      label: `Create class: ${data.name || ""}`,
      tag: "faculty-class-create",
    });
    return result.data ?? result;
  },

  updateClass: async (id: number, data: any): Promise<any> => {
    const result = await mutateWithQueue(
      `${API_URL}/faculty/classes/${id}`,
      "PUT",
      {
        body: data,
        label: `Update class ${id}`,
        tag: "faculty-class-update",
      },
    );
    return result.data ?? result;
  },

  deleteClass: async (id: number): Promise<{ message: string }> => {
    return mutateWithQueue(`${API_URL}/faculty/classes/${id}`, "DELETE", {
      label: `Delete class ${id}`,
      tag: "faculty-class-delete",
    });
  },

  archiveClass: async (id: number): Promise<any> => {
    const result = await mutateWithQueue(
      `${API_URL}/faculty/classes/${id}/archive`,
      "PATCH",
      {
        label: `Archive class ${id}`,
        tag: "faculty-class-archive",
      },
    );
    return result.data ?? result;
  },

  // NOTE: regenerateClassCode REMOVED — join_code concept deleted

  getClassMaterials: async (classId: number): Promise<any[]> => {
    const response = await fetch(
      `${API_URL}/faculty/classes/${classId}/materials`,
      { headers: headers() },
    );
    const result = await handleResponse(response);
    return result.data ?? result;
  },

  uploadMaterial: async (classId: number, formData: FormData): Promise<any> => {
    return mutateWithQueue(
      `${API_URL}/faculty/classes/${classId}/materials`,
      "POST",
      {
        formData,
        label: `Upload material to class ${classId}`,
        tag: "faculty-material-upload",
      },
    );
  },

  updateMaterial: async (id: number, data: any): Promise<any> => {
    const result = await mutateWithQueue(
      `${API_URL}/faculty/materials/${id}`,
      "PUT",
      {
        body: data,
        label: `Update material ${id}`,
        tag: "faculty-material-update",
      },
    );
    return result.data ?? result;
  },

  deleteMaterial: async (id: number): Promise<{ message: string }> => {
    return mutateWithQueue(`${API_URL}/faculty/materials/${id}`, "DELETE", {
      label: `Delete material ${id}`,
      tag: "faculty-material-delete",
    });
  },

  getAnnouncements: async (): Promise<BulletinPost[]> => {
    const response = await fetch(`${API_URL}/faculty/announcements`, {
      headers: headers(),
    });
    const result = await handleResponse(response);
    return result.data ?? result;
  },

  createAnnouncement: async (data: any): Promise<BulletinPost> => {
    const result = await mutateWithQueue(
      `${API_URL}/faculty/announcements`,
      "POST",
      {
        body: data,
        label: `Create announcement: ${data.title || ""}`,
        tag: "faculty-announcement-create",
      },
    );
    return result.data ?? result;
  },

  updateAnnouncement: async (id: number, data: any): Promise<BulletinPost> => {
    const result = await mutateWithQueue(
      `${API_URL}/faculty/announcements/${id}`,
      "PUT",
      {
        body: data,
        label: `Update announcement ${id}`,
        tag: "faculty-announcement-update",
      },
    );
    return result.data ?? result;
  },

  deleteAnnouncement: async (id: number): Promise<{ message: string }> => {
    return mutateWithQueue(
      `${API_URL}/faculty/announcements/${id}`,
      "DELETE",
      {
        label: `Delete announcement ${id}`,
        tag: "faculty-announcement-delete",
      },
    );
  },

  getAttendanceSessions: async (): Promise<AttendanceSession[]> => {
    const response = await fetch(`${API_URL}/attendance/sessions`, {
      headers: headers(),
    });
    const result = await handleResponse(response);
    return result.data ?? result;
  },

  createAttendanceSession: async (data: any): Promise<AttendanceSession> => {
    const result = await mutateWithQueue(
      `${API_URL}/attendance/session`,
      "POST",
      {
        body: data,
        label: "Create attendance session",
        tag: "faculty-attendance-create",
      },
    );
    return result.data ?? result;
  },

  closeAttendanceSession: async (id: number): Promise<{ message: string }> => {
    return mutateWithQueue(
      `${API_URL}/attendance/session/${id}/close`,
      "PATCH",
      {
        label: `Close session ${id}`,
        tag: "faculty-attendance-close",
      },
    );
  },

  getSessionLogs: async (sessionId: number): Promise<AttendanceLog[]> => {
    const response = await fetch(
      `${API_URL}/attendance/session/${sessionId}/logs`,
      { headers: headers() },
    );
    const result = await handleResponse(response);
    return result.data ?? result;
  },
};

// ============================================================
// DEFAULT EXPORT
// ============================================================
export default {
  authApi,
  superAdminApi,
  profileApi,
  adminApi,
  studentApi,
  facultyApi,
  ocrApi,
};