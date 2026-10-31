// src/pages/admin/Settings.tsx - Add Change Password Section

import React, { useState } from "react";
import { authApi } from "../../services/api";
import toast from "react-hot-toast";

const ChangePassword: React.FC = () => {
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

export default ChangePassword;
