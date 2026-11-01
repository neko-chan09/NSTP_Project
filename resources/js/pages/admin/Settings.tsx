// src/pages/admin/Settings.tsx

import React, { useEffect, useRef, useState } from "react";
import { authApi, adminApi } from "../../services/api";
import toast from "react-hot-toast";

/* ============================================================
 * CHANGE PASSWORD (unchanged)
 * ============================================================ */
export const ChangePassword: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      await authApi.changePassword(
        currentPassword,
        newPassword,
        confirmPassword,
      );
      toast.success("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h4 className="text-lg font-semibold text-navy-900 mb-4">
        <i className="fas fa-lock text-gold-500 mr-2" />
        Change Password
      </h4>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div className="form-group">
          <label className="label">Current Password</label>
          <div className="relative">
            <input
              type={showCurrent ? "text" : "password"}
              className="input pr-12"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy-600"
              onClick={() => setShowCurrent(!showCurrent)}
            >
              <i className={`fas ${showCurrent ? "fa-eye-slash" : "fa-eye"}`} />
            </button>
          </div>
        </div>

        <div className="form-group">
          <label className="label">New Password</label>
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              className="input pr-12"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy-600"
              onClick={() => setShowNew(!showNew)}
            >
              <i className={`fas ${showNew ? "fa-eye-slash" : "fa-eye"}`} />
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-1">Minimum 6 characters</p>
        </div>

        <div className="form-group">
          <label className="label">Confirm Password</label>
          <input
            type={showNew ? "text" : "password"}
            className="input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? (
            <>
              <i className="fas fa-spinner fa-spin" /> Changing...
            </>
          ) : (
            "Change Password"
          )}
        </button>
      </form>
    </div>
  );
};

/* ============================================================
 * FACE RESET
 * ============================================================ */
const studentDisplayName = (s: any): string => {
  const full =
    s?.name ||
    s?.full_name ||
    [s?.first_name, s?.middle_name, s?.last_name].filter(Boolean).join(" ") ||
    s?.user?.name;
  return full || `Student #${s?.id}`;
};

export const FaceResetSection: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [resetting, setResetting] = useState(false);
  const requestId = useRef(0);

  const closeModal = () => {
    if (resetting) return;
    setOpen(false);
    setQuery("");
    setResults([]);
    setSelected(null);
  };

  // Debounced student search
  useEffect(() => {
    if (!open || selected) return;

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
        const res = await adminApi.getStudents({ search: q, per_page: 8 });
        if (myId === requestId.current) setResults(res.data || []);
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
  }, [query, open, selected]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, resetting]);

  const handleReset = async () => {
    if (!selected) return;
    setResetting(true);
    try {
      await adminApi.resetStudentFace(selected.id);
      toast.success(
        `Face reset for ${studentDisplayName(selected)}. They can register again.`,
      );
      setResetting(false);
      setOpen(false);
      setQuery("");
      setResults([]);
      setSelected(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to reset face");
      setResetting(false);
    }
  };

  return (
    <>
      <div className="card">
        <h4 className="text-lg font-semibold text-navy-900 mb-2">
          <i className="fas fa-user-lock text-gold-500 mr-2" />
          Face Registration
        </h4>
        <p className="text-sm text-slate-500 mb-4 max-w-xl">
          Students can register their face only once. Reset a student&apos;s face
          data here so they can register again from the mobile app.
        </p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setOpen(true)}
        >
          <i className="fas fa-rotate-left mr-2" />
          Face Reset
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h5 className="text-lg font-semibold text-navy-900">
                {selected ? "Confirm Face Reset" : "Reset Student Face"}
              </h5>
              <button
                type="button"
                className="text-slate-400 hover:text-navy-600"
                onClick={closeModal}
                aria-label="Close"
              >
                <i className="fas fa-times" />
              </button>
            </div>

            <div className="px-5 py-4">
              {!selected ? (
                <>
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

                  <div className="mt-3 max-h-72 overflow-y-auto rounded-lg border border-slate-200 divide-y divide-slate-100">
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
                              {studentDisplayName(s)}
                            </span>
                            <span className="block text-xs text-slate-500">
                              {s.student_id || "No ID"}
                              {s.course ? ` · ${s.course}` : ""}
                              {s.component
                                ? ` · ${String(s.component).toUpperCase()}`
                                : ""}
                            </span>
                          </span>
                          <i className="fas fa-chevron-right text-slate-300" />
                        </button>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-medium text-navy-900">
                      {studentDisplayName(selected)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {selected.student_id || "No ID"}
                      {selected.course ? ` · ${selected.course}` : ""}
                    </p>
                  </div>
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <i className="fas fa-triangle-exclamation mr-2" />
                    This permanently deletes this student&apos;s registered face
                    data. They will have to register their face again before
                    using face attendance.
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">
              {selected ? (
                <>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setSelected(null)}
                    disabled={resetting}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                    onClick={handleReset}
                    disabled={resetting}
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
                <button type="button" className="btn" onClick={closeModal}>
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/* ============================================================
 * PAGE EXPORT
 * ============================================================ */
const Settings: React.FC = () => (
  <div className="space-y-6">
    <ChangePassword />
    <FaceResetSection />
  </div>
);

export default Settings;