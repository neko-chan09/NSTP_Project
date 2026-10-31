// src/components/common/StudentDetailsModal.tsx
import React from "react";
import type { Student } from "../../../types/api";
import { useAuth } from "../../hooks/useAuth";
import toast from "react-hot-toast";

interface StudentDetailsModalProps {
  student: Student;
  onClose: () => void;
}

const StudentDetailsModal: React.FC<StudentDetailsModalProps> = ({
  student,
  onClose,
}) => {
  const { user, isAdmin, isSuperAdmin, isFaculty } = useAuth();

  // Check if user has edit permissions (Admin or Super Admin only)
  const canEdit = isAdmin || isSuperAdmin;

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-amber-100 text-amber-800",
      in_progress: "bg-blue-100 text-blue-800",
      completed: "bg-emerald-100 text-emerald-800",
      deficient: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-slate-100 text-slate-800";
  };

  // Get component badge color
  const getComponentColor = (comp?: string) => {
    const colors: Record<string, string> = {
      cwts: "bg-blue-100 text-blue-800",
      rotc: "bg-red-100 text-red-800",
      lts: "bg-emerald-100 text-emerald-800",
    };
    return colors[comp || ""] || "bg-slate-100 text-slate-800";
  };

  // Get eligibility badge
  const getEligibilityBadge = () => {
    if (student.is_eligible_for_completion) {
      return <span className="badge badge-success">✅ Eligible</span>;
    }
    return <span className="badge badge-danger">❌ Not Eligible</span>;
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  // Calculate completion percentage
  const completionPercentage =
    student.total_training_hours > 0
      ? Math.round(
          (student.completed_training_hours / student.total_training_hours) *
            100,
        )
      : 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal max-w-3xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-gold-100 flex-shrink-0">
              {student.user?.profile_photo_url ? (
                <img
                  src={student.user.profile_photo_url}
                  alt={`${student.user.first_name} ${student.user.last_name}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    const parent = target.parentElement;
                    if (parent) {
                      const fallback = document.createElement("div");
                      fallback.className =
                        "w-full h-full flex items-center justify-center font-bold text-xl text-white bg-navy-600";
                      fallback.textContent = `${
                        student.user.first_name?.charAt(0) || ""
                      }${student.user.last_name?.charAt(0) || ""}`;
                      parent.appendChild(fallback);
                    }
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-xl text-white bg-navy-600">
                  {student.user?.first_name?.charAt(0) || ""}
                  {student.user?.last_name?.charAt(0) || ""}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-navy-900">
                {student.user?.first_name} {student.user?.last_name}
              </h3>
              <p className="text-sm text-slate-500">{student.user?.email}</p>
            
            </div>
          </div>
          <div className="flex gap-2">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => copyToClipboard(student.student_id)}
              title="Copy Student ID"
            >
              <i className="fas fa-copy" />
            </button>
            <button className="modal-close" onClick={onClose}>
              ×
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="modal-body max-h-[70vh] overflow-y-auto">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="p-3 bg-slate-50 rounded-lg text-center">
              <span className="block text-xs text-slate-400">Student ID</span>
              <span className="font-bold text-navy-900 text-sm">
                {student.student_id}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg text-center">
              <span className="block text-xs text-slate-400">Component</span>
              <span
                className={`badge ${getComponentColor(student.nstp_component_selected ?? undefined)}`}
              >
                {student.nstp_component_selected?.toUpperCase() ||
                  "Not assigned"}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg text-center">
              <span className="block text-xs text-slate-400">Hours</span>
              <span className="font-bold text-navy-900 text-sm">
                {student.completed_training_hours || 0} /{" "}
                {student.total_training_hours || 90}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg text-center">
              <span className="block text-xs text-slate-400">Status</span>
              <span
                className={`badge ${getStatusColor(student.completion_status)}`}
              >
                {student.completion_status?.replace("_", " ") || "Pending"}
              </span>
            </div>
          </div>

          {/* Personal Information */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <i className="fas fa-user text-gold-500" />
              Personal Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-xs text-slate-400">First Name</span>
                <p className="font-medium text-navy-900">
                  {student.user?.first_name}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-xs text-slate-400">Last Name</span>
                <p className="font-medium text-navy-900">
                  {student.user?.last_name}
                </p>
              </div>
              {student.user?.middle_name && (
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-xs text-slate-400">Middle Name</span>
                  <p className="font-medium text-navy-900">
                    {student.user.middle_name}
                  </p>
                </div>
              )}
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-xs text-slate-400">Email</span>
                <p className="font-medium text-navy-900">
                  {student.user?.email}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-xs text-slate-400">Contact Number</span>
                <p className="font-medium text-navy-900">
                  {student.user?.contact_number || "N/A"}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-xs text-slate-400">Gender</span>
                <p className="font-medium text-navy-900">
                  {student.gender
                    ? student.gender.charAt(0).toUpperCase() +
                      student.gender.slice(1)
                    : "N/A"}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-xs text-slate-400">Birth Date</span>
                <p className="font-medium text-navy-900">
                  {formatDate(student.birth_date)}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-xs text-slate-400">Address</span>
                <p className="font-medium text-navy-900">
                  {student.address || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <i className="fas fa-graduation-cap text-gold-500" />
              Academic Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-xs text-slate-400">Course</span>
                <p className="font-medium text-navy-900">
                  {student.course || "N/A"}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-xs text-slate-400">Year Level</span>
                <p className="font-medium text-navy-900">
                  {student.year_level || "N/A"}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-xs text-slate-400">Section</span>
                <p className="font-medium text-navy-900">
                  {student.section || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* NSTP Information */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <i className="fas fa-shield-alt text-gold-500" />
              NSTP Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-xs text-slate-400">Component</span>
                <p className="font-medium text-navy-900">
                  {student.nstp_component_selected?.toUpperCase() ||
                    "Not assigned"}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-xs text-slate-400">Completed Hours</span>
                <p className="font-medium text-navy-900">
                  {student.completed_training_hours || 0}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-xs text-slate-400">
                  Total Required Hours
                </span>
                <p className="font-medium text-navy-900">
                  {student.total_training_hours || 90}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-xs text-slate-400">Completion</span>
                <p className="font-medium text-navy-900">
                  {completionPercentage}%
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-xs text-slate-400">Status</span>
                <p>
                  <span
                    className={`badge ${getStatusColor(
                      student.completion_status,
                    )}`}
                  >
                    {student.completion_status?.replace("_", " ") || "Pending"}
                  </span>
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-xs text-slate-400">Completed At</span>
                <p className="font-medium text-navy-900">
                  {formatDate(student.completed_at)}
                </p>
              </div>
            </div>
          </div>

          {/* Eligibility */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <i className="fas fa-check-circle text-gold-500" />
              Eligibility
            </h4>
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg flex-wrap">
              {getEligibilityBadge()}
              <span className="text-sm text-slate-600">
                {student.is_eligible_for_completion
                  ? "This student has completed all requirements and is eligible for completion."
                  : "This student has not yet completed all requirements."}
              </span>
            </div>
          </div>

          {/* Emergency Contact */}
          {(student.emergency_contact_name ||
            student.emergency_contact_number) && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <i className="fas fa-phone-alt text-gold-500" />
                Emergency Contact
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-xs text-slate-400">Contact Name</span>
                  <p className="font-medium text-navy-900">
                    {student.emergency_contact_name || "N/A"}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-xs text-slate-400">Contact Number</span>
                  <p className="font-medium text-navy-900">
                    {student.emergency_contact_number || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions - HIDDEN FOR FACULTY */}
          {canEdit && (
            <div>
              <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <i className="fas fa-bolt text-gold-500" />
                Quick Actions
              </h4>
              <div className="flex flex-wrap gap-2">
                <button
                  className="btn btn-info btn-sm"
                  onClick={() => {
                    onClose();
                    // Navigate to edit - you can implement this
                  }}
                >
                  <i className="fas fa-edit" /> Edit Student
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    copyToClipboard(student.student_id);
                  }}
                >
                  <i className="fas fa-copy" /> Copy ID
                </button>
                <button
                  className="btn btn-success btn-sm"
                  onClick={() => {
                    // Generate certificate - you can implement this
                  }}
                >
                  <i className="fas fa-certificate" /> Generate Certificate
                </button>
              </div>
            </div>
          )}

          
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <div className="flex items-center gap-3 mr-auto text-xs text-slate-400">
            <span>Created: {formatDate(student.created_at)}</span>
            <span>•</span>
            <span>Updated: {formatDate(student.updated_at)}</span>
          </div>
          <button className="btn btn-secondary" onClick={onClose}>
            {isFaculty ? "Close" : "Close"}
          </button>
          {canEdit && (
            <button
              className="btn btn-primary"
              onClick={() => {
                onClose();
                // Navigate to edit - you can implement this
              }}
            >
              <i className="fas fa-edit" /> Edit Student
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDetailsModal;
