// src/pages/shared/Profile.tsx
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  useProfile,
  useUpdateProfile,
  useUploadProfilePhoto,
  useDeleteProfilePhoto,
  useChangeOwnPassword,
} from "../hooks/useProfile";
import RefreshButton from "../components/common/RefreshButton";
import toast from "react-hot-toast";

type Tab = "info" | "security";

const Profile: React.FC = () => {
  const { user: authUser } = useAuth();
  const [tab, setTab] = useState<Tab>("info");

  const {
    data: profile,
    isLoading,
    error,
    refetch,
    isRefreshing,
  } = useProfile();

  const updateMut = useUpdateProfile();
  const uploadPhotoMut = useUploadProfilePhoto();
  const deletePhotoMut = useDeleteProfilePhoto();
  const passwordMut = useChangeOwnPassword();

  // ------------------------------------------------------------
  // Local form state
  // ------------------------------------------------------------
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    contact_number: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        email: profile.email || "",
        contact_number: profile.contact_number || "",
      });
    }
  }, [profile]);

  const photoInputRef = useRef<HTMLInputElement>(null);

  // ------------------------------------------------------------
  // Handlers
  // ------------------------------------------------------------
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const isDirty =
    profile &&
    (form.first_name !== (profile.first_name || "") ||
      form.last_name !== (profile.last_name || "") ||
      form.email !== (profile.email || "") ||
      form.contact_number !== (profile.contact_number || ""));

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.first_name.trim() || !form.last_name.trim()) {
      toast.error("First and last name are required");
      return;
    }
    if (!form.email.trim()) {
      toast.error("Email is required");
      return;
    }
    if (!isDirty) {
      toast("No changes to save", { icon: "ℹ️" });
      return;
    }

    try {
      await updateMut.mutateAsync({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim().toLowerCase(),
        contact_number: form.contact_number.trim(),
      });
      toast.success("Profile updated");
    } catch (err: any) {
      const apiErrors = err?.errors
        ? Object.values(err.errors).flat().join(" ")
        : err?.message;
      toast.error(apiErrors || "Failed to update profile");
    }
  };

  const handleReset = () => {
    if (!profile) return;
    setForm({
      first_name: profile.first_name || "",
      last_name: profile.last_name || "",
      email: profile.email || "",
      contact_number: profile.contact_number || "",
    });
  };

  const handlePickPhoto = () => photoInputRef.current?.click();

  const handlePhotoSelected = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Photo must be under 5 MB");
      return;
    }

    const fd = new FormData();
    fd.append("photo", file);

    try {
      await uploadPhotoMut.mutateAsync(fd);
      toast.success("Photo updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload photo");
    } finally {
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  const handleRemovePhoto = async () => {
    if (!window.confirm("Remove your profile photo?")) return;
    try {
      await deletePhotoMut.mutateAsync();
      toast.success("Photo removed");
    } catch (err: any) {
      toast.error(err.message || "Failed to remove photo");
    }
  };

  // ------------------------------------------------------------
  // Loading / error
  // ------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="spinner" />
        <span className="ml-3 text-slate-500">Loading profile…</span>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="alert alert-danger">
        <i className="fas fa-exclamation-circle mr-2" />
        Failed to load profile: {(error as Error)?.message || "Unknown error"}
        <button
          className="btn btn-primary btn-sm ml-3"
          onClick={() => refetch()}
        >
          <i className="fas fa-redo" /> Retry
        </button>
      </div>
    );
  }

  // ------------------------------------------------------------
  // Derived values
  // ------------------------------------------------------------
  const initials =
    profile.initials ||
    `${profile.first_name?.[0] || ""}${profile.last_name?.[0] || ""}`.toUpperCase() ||
    "?";

  const roleLabel =
    {
      super_admin: "Super Admin",
      admin: "Admin",
      faculty: "Faculty",
      student: "Student",
    }[profile.role] || profile.role;

  const roleColor =
    {
      super_admin: "bg-purple-100 text-purple-800 border-purple-200",
      admin: "bg-blue-100 text-blue-800 border-blue-200",
      faculty: "bg-amber-100 text-amber-800 border-amber-200",
      student: "bg-emerald-100 text-emerald-800 border-emerald-200",
    }[profile.role] || "bg-slate-100 text-slate-700 border-slate-200";

  const componentLabel = profile.nstp_component
    ? profile.nstp_component.toUpperCase()
    : null;

  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* ============================================================ */}
      {/* PAGE HEADER */}
      {/* ============================================================ */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between pb-6 border-b border-slate-200">
        <div>
          <nav className="flex items-center gap-2 text-xs text-slate-500 mb-2">
            <Link to="/" className="hover:text-navy-700 transition-colors">
              <i className="fas fa-home text-[10px]" /> Home
            </Link>
            <i className="fas fa-chevron-right text-[8px] text-slate-300" />
            <span className="text-slate-700 font-medium">My Profile</span>
          </nav>
          <h1 className="text-3xl font-bold text-navy-900 tracking-tight">
            My Profile
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your personal information, photo, and account security
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton
            onRefresh={refetch}
            isLoading={isRefreshing}
            label="Refresh"
            className="btn-sm"
          />
        </div>
      </div>

      {/* ============================================================ */}
      {/* BODY — 2-COLUMN LAYOUT */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        {/* ============================================================ */}
        {/* LEFT — IDENTITY CARD */}
        {/* ============================================================ */}
        <aside className="space-y-4">
          {/* Identity card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Top color strip */}
            <div className="h-20 bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 relative">
              <div className="absolute inset-0 opacity-[0.15] bg-[radial-gradient(circle_at_top_right,_rgba(212,175,55,0.8),_transparent_60%)]" />
            </div>

            <div className="px-5 pb-5 -mt-12">
              {/* Avatar */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg bg-navy-600 flex items-center justify-center">
                    {profile.profile_photo_url ? (
                      <img
                        src={profile.profile_photo_url}
                        alt={profile.full_name || "Profile"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <span className="text-3xl font-bold text-white tracking-wide">
                        {initials}
                      </span>
                    )}
                  </div>

                  {/* Small photo action */}
                  <button
                    type="button"
                    onClick={handlePickPhoto}
                    disabled={uploadPhotoMut.isPending}
                    className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-gold-500 text-white flex items-center justify-center shadow-md hover:bg-gold-600 transition-colors disabled:opacity-50 border-2 border-white"
                    title="Change photo"
                  >
                    {uploadPhotoMut.isPending ? (
                      <i className="fas fa-spinner fa-spin text-[10px]" />
                    ) : (
                      <i className="fas fa-camera text-[11px]" />
                    )}
                  </button>

                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    className="hidden"
                    onChange={handlePhotoSelected}
                  />
                </div>
              </div>

              {/* Name */}
              <div className="text-center mt-3">
                <h2 className="text-lg font-bold text-navy-900 truncate">
                  {profile.full_name ||
                    `${profile.first_name} ${profile.last_name}`}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  {profile.email}
                </p>
              </div>

              {/* Role badge */}
              <div className="flex justify-center mt-3">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wider ${roleColor}`}
                >
                  <i
                    className={`fas ${
                      profile.role === "faculty"
                        ? "fa-chalkboard-teacher"
                        : profile.role === "admin"
                          ? "fa-user-cog"
                          : profile.role === "super_admin"
                            ? "fa-user-shield"
                            : "fa-user-graduate"
                    }`}
                  />
                  {roleLabel}
                </span>
              </div>

              {/* Photo actions */}
              {profile.profile_photo_url && (
                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    disabled={deletePhotoMut.isPending}
                    className="text-xs text-red-500 hover:text-red-600 hover:underline disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    {deletePhotoMut.isPending ? (
                      <i className="fas fa-spinner fa-spin" />
                    ) : (
                      <i className="fas fa-trash" />
                    )}
                    Remove photo
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Account details */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Account details
              </h3>
            </div>
            <dl className="px-5 py-3 divide-y divide-slate-100">
              <InfoRow
                icon="fa-user"
                label="Full name"
                value={
                  profile.full_name ||
                  `${profile.first_name} ${profile.last_name}`
                }
              />
              <InfoRow icon="fa-envelope" label="Email" value={profile.email} />
              <InfoRow
                icon="fa-phone"
                label="Contact"
                value={profile.contact_number || "Not set"}
                muted={!profile.contact_number}
              />
              {profile.role === "faculty" && (
                <>
                  <InfoRow
                    icon="fa-flag"
                    label="Component"
                    value={componentLabel || "Not assigned"}
                    muted={!componentLabel}
                  />
                  <InfoRow
                    icon="fa-key"
                    label="Class code"
                    value={profile.class_code || "—"}
                    mono
                    muted={!profile.class_code}
                  />
                </>
              )}
              {profile.course && (
                <InfoRow
                  icon="fa-graduation-cap"
                  label="Course"
                  value={profile.course}
                />
              )}
              {memberSince && (
                <InfoRow
                  icon="fa-calendar"
                  label="Member since"
                  value={memberSince}
                />
              )}
            </dl>
          </div>

          {/* Status card */}
          <div
            className={`rounded-2xl border p-4 flex items-start gap-3 ${
              profile.is_active
                ? "bg-emerald-50 border-emerald-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                profile.is_active
                  ? "bg-emerald-100 text-emerald-600"
                  : "bg-red-100 text-red-600"
              }`}
            >
              <i
                className={`fas ${
                  profile.is_active ? "fa-check-circle" : "fa-times-circle"
                }`}
              />
            </div>
            <div className="min-w-0">
              <p
                className={`text-sm font-semibold ${
                  profile.is_active ? "text-emerald-800" : "text-red-800"
                }`}
              >
                {profile.is_active ? "Account active" : "Account inactive"}
              </p>
              <p
                className={`text-xs mt-0.5 ${
                  profile.is_active ? "text-emerald-700/80" : "text-red-700/80"
                }`}
              >
                {profile.is_active
                  ? "Your account is in good standing."
                  : "Contact an administrator to restore access."}
              </p>
            </div>
          </div>
        </aside>

        {/* ============================================================ */}
        {/* RIGHT — TABS + FORMS */}
        {/* ============================================================ */}
        <section className="min-w-0">
          {/* Tabs (underline style, more page-like) */}
          <div className="border-b border-slate-200 mb-6">
            <div className="flex gap-6">
              {(
                [
                  { key: "info", label: "Profile info", icon: "fa-user" },
                  { key: "security", label: "Security", icon: "fa-lock" },
                ] as { key: Tab; label: string; icon: string }[]
              ).map((t) => {
                const active = tab === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`relative pb-3 pt-1 text-sm font-medium transition-colors inline-flex items-center gap-2 ${
                      active
                        ? "text-navy-900"
                        : "text-slate-500 hover:text-navy-700"
                    }`}
                  >
                    <i className={`fas ${t.icon} text-xs`} />
                    {t.label}
                    {active && (
                      <span className="absolute -bottom-px left-0 right-0 h-0.5 bg-gold-500 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* INFO TAB */}
          {tab === "info" && (
            <div className="space-y-6">
              {/* Personal information section */}
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                <header className="px-6 py-4 border-b border-slate-100">
                  <h2 className="text-base font-semibold text-navy-900">
                    Personal information
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    These details appear on your account and are used across
                    the system
                  </p>
                </header>

                <form onSubmit={handleSaveInfo} className="p-6 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Field
                      label="First name"
                      name="first_name"
                      value={form.first_name}
                      onChange={handleFormChange}
                      placeholder="Enter your first name"
                      required
                    />
                    <Field
                      label="Last name"
                      name="last_name"
                      value={form.last_name}
                      onChange={handleFormChange}
                      placeholder="Enter your last name"
                      required
                    />
                    <div className="md:col-span-2">
                      <Field
                        label="Email address"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleFormChange}
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                    <Field
                      label="Contact number"
                      name="contact_number"
                      value={form.contact_number}
                      onChange={handleFormChange}
                      placeholder="09171234567"
                      hint="Optional — used for SMS notifications"
                    />
                    <Field
                      label="Role"
                      name="role"
                      value={roleLabel}
                      disabled
                      hint="Contact an administrator to change your role"
                    />
                  </div>

                  {/* Faculty-only read-only block */}
                  {profile.role === "faculty" && (
                    <div className="pt-5 border-t border-slate-100">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                        Faculty information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Field
                          label="NSTP component"
                          name="nstp_component"
                          value={componentLabel || "Not assigned"}
                          disabled
                        />
                        <Field
                          label="Class code"
                          name="class_code"
                          value={profile.class_code || "—"}
                          disabled
                          mono
                        />
                      </div>
                    </div>
                  )}

                  {/* Footer actions */}
                  <div className="pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-slate-400">
                      {isDirty ? (
                        <span className="text-amber-600">
                          <i className="fas fa-circle text-[6px] align-middle mr-1.5" />
                          You have unsaved changes
                        </span>
                      ) : (
                        <span>
                          <i className="fas fa-check-circle text-emerald-400 mr-1" />
                          All changes saved
                        </span>
                      )}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleReset}
                        disabled={!isDirty || updateMut.isPending}
                      >
                        Reset
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={!isDirty || updateMut.isPending}
                      >
                        {updateMut.isPending ? (
                          <>
                            <i className="fas fa-spinner fa-spin mr-1" />
                            Saving…
                          </>
                        ) : (
                          <>
                            <i className="fas fa-save mr-1" />
                            Save changes
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </section>
            </div>
          )}

          {/* SECURITY TAB */}
          {tab === "security" && <ChangePasswordCard passwordMut={passwordMut} />}
        </section>
      </div>
    </div>
  );
};

// ==================================================================
// REUSABLE FIELD
// ==================================================================
interface FieldProps {
  label: string;
  name: string;
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: "text" | "email" | "password";
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  mono?: boolean;
  hint?: string;
}

const Field: React.FC<FieldProps> = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  disabled,
  mono,
  hint,
}) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1.5">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      className={`w-full px-3.5 py-2.5 text-sm rounded-lg border transition-colors
        ${
          disabled
            ? "bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed"
            : "bg-white border-slate-300 text-navy-900 hover:border-slate-400 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-200"
        }
        ${mono ? "font-mono" : ""}
      `}
    />
    {hint && <p className="text-xs text-slate-400 mt-1.5">{hint}</p>}
  </div>
);

// ==================================================================
// INFO ROW (for left sidebar)
// ==================================================================
interface InfoRowProps {
  icon: string;
  label: string;
  value: string;
  mono?: boolean;
  muted?: boolean;
}

const InfoRow: React.FC<InfoRowProps> = ({
  icon,
  label,
  value,
  mono,
  muted,
}) => (
  <div className="flex items-start gap-3 py-2.5">
    <i className={`fas ${icon} text-slate-400 text-xs mt-1 w-3.5 text-center shrink-0`} />
    <div className="flex-1 min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p
        className={`text-sm mt-0.5 break-words ${
          muted ? "text-slate-400 italic" : "text-navy-900 font-medium"
        } ${mono ? "font-mono" : ""}`}
      >
        {value}
      </p>
    </div>
  </div>
);

// ==================================================================
// CHANGE PASSWORD CARD
// ==================================================================
const ChangePasswordCard: React.FC<{
  passwordMut: ReturnType<typeof useChangeOwnPassword>;
}> = ({ passwordMut }) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const mismatch =
    confirmPassword.length > 0 && newPassword !== confirmPassword;
  const tooShort = newPassword.length > 0 && newPassword.length < 6;

  const canSubmit =
    currentPassword.length > 0 &&
    newPassword.length >= 6 &&
    newPassword === confirmPassword &&
    !passwordMut.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    passwordMut.mutate(
      { currentPassword, newPassword, confirmPassword },
      {
        onSuccess: () => {
          toast.success("Password changed successfully");
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        },
        onError: (err: any) => {
          toast.error(err.message || "Failed to change password");
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      {/* Change password section */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <header className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-navy-900">
            Change password
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Update the password you use to sign in
          </p>
        </header>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-w-lg">
          <PasswordField
            label="Current password"
            value={currentPassword}
            onChange={setCurrentPassword}
            visible={showCurrent}
            onToggle={() => setShowCurrent((s) => !s)}
            autoComplete="current-password"
            required
          />

          <PasswordField
            label="New password"
            value={newPassword}
            onChange={setNewPassword}
            visible={showNew}
            onToggle={() => setShowNew((s) => !s)}
            autoComplete="new-password"
            required
            error={
              tooShort
                ? "Must be at least 6 characters"
                : undefined
            }
            hint={
              !tooShort
                ? "Minimum 6 characters. Mix letters, numbers & symbols."
                : undefined
            }
          />

          <PasswordField
            label="Confirm new password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            visible={showConfirm}
            onToggle={() => setShowConfirm((s) => !s)}
            autoComplete="new-password"
            required
            error={mismatch ? "Passwords don't match" : undefined}
          />

          <div className="pt-5 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!canSubmit}
            >
              {passwordMut.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-1" />
                  Saving…
                </>
              ) : (
                <>
                  <i className="fas fa-check mr-1" />
                  Update password
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* Security tips */}
      <section className="bg-gradient-to-br from-gold-50 to-amber-50 border border-gold-200 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-gold-600 shrink-0 shadow-sm">
            <i className="fas fa-shield-alt" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-amber-900">
              Password tips
            </h3>
            <ul className="text-xs text-amber-800/90 mt-2 space-y-1.5 leading-relaxed">
              <li className="flex gap-2">
                <i className="fas fa-check-circle text-gold-500 mt-0.5" />
                Use at least 6 characters
              </li>
              <li className="flex gap-2">
                <i className="fas fa-check-circle text-gold-500 mt-0.5" />
                Mix letters, numbers & symbols
              </li>
              <li className="flex gap-2">
                <i className="fas fa-check-circle text-gold-500 mt-0.5" />
                Avoid using your name or birthday
              </li>
              <li className="flex gap-2">
                <i className="fas fa-check-circle text-gold-500 mt-0.5" />
                Don't reuse passwords from other apps
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

// ==================================================================
// PASSWORD FIELD
// ==================================================================
interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  visible: boolean;
  onToggle: () => void;
  autoComplete?: string;
  required?: boolean;
  error?: string;
  hint?: string;
}

const PasswordField: React.FC<PasswordFieldProps> = ({
  label,
  value,
  onChange,
  visible,
  onToggle,
  autoComplete,
  required,
  error,
  hint,
}) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1.5">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required={required}
        className={`w-full px-3.5 py-2.5 pr-11 text-sm rounded-lg border bg-white transition-colors
          ${
            error
              ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200"
              : "border-slate-300 hover:border-slate-400 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-200"
          }
        `}
      />
      <button
        type="button"
        onClick={onToggle}
        tabIndex={-1}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy-600 transition-colors"
      >
        <i className={`fas ${visible ? "fa-eye-slash" : "fa-eye"} text-sm`} />
      </button>
    </div>
    {error ? (
      <p className="text-xs text-red-500 mt-1.5">
        <i className="fas fa-exclamation-circle mr-1" />
        {error}
      </p>
    ) : hint ? (
      <p className="text-xs text-slate-400 mt-1.5">{hint}</p>
    ) : null}
  </div>
);

export default Profile;