// src/pages/admin/Activities/ActivityParticipants.tsx
import React, { useState, useEffect } from "react";
import { adminApi } from "../../../services/api";
import RefreshButton from "../../components/common/RefreshButton";
import { useAuth } from "../../hooks/useAuth";
import toast from "react-hot-toast";

interface ActivityParticipantsProps {
  activity: any;
  onClose: () => void;
  onRefresh: () => void;
}

interface Participant {
  id: number;
  student_id: string;
  user: {
    first_name: string;
    last_name: string;
    email: string;
  };
  course: string;
  year_level: number;
  section: string;
  attendance_status: "registered" | "present" | "absent" | "excused";
  hours_earned: number;
  attended_at: string | null;
}

const ActivityParticipants: React.FC<ActivityParticipantsProps> = ({
  activity,
  onClose,
  onRefresh,
}) => {
  const { isAdmin, isSuperAdmin, isFaculty, user } = useAuth();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
  const [removingParticipant, setRemovingParticipant] = useState<number | null>(
    null,
  );

  // Check if user can edit this activity (Admin/Super Admin, or Faculty who created it)
  // ✅ Super Admin gets view-only access to participants
  const canEdit =
    (!isSuperAdmin && isAdmin) ||
    (isFaculty && activity.created_by === user?.id);

  const fetchParticipants = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getActivityParticipants(activity.id);
      setParticipants(data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load participants");
      console.error("Error fetching participants:", err);
      toast.error(err.message || "Failed to load participants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activity?.id) {
      fetchParticipants();
    }
  }, [activity?.id]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      registered: "bg-blue-500",
      present: "bg-emerald-500",
      absent: "bg-red-500",
      excused: "bg-amber-500",
    };
    return colors[status] || "bg-slate-500";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      registered: "Registered",
      present: "Present",
      absent: "Absent",
      excused: "Excused",
    };
    return labels[status] || status;
  };

  const filteredParticipants = participants.filter((p) => {
    const matchesSearch =
      p.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${p.user.first_name} ${p.user.last_name}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      p.user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || p.attendance_status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const exportCSV = () => {
    if (filteredParticipants.length === 0) {
      toast.error("No participants to export");
      return;
    }

    const headers = [
      "Student ID",
      "Name",
      "Email",
      "Course",
      "Year",
      "Section",
      "Status",
      "Hours Earned",
    ];
    const rows = filteredParticipants.map((p) => [
      p.student_id,
      `${p.user.first_name} ${p.user.last_name}`,
      p.user.email,
      p.course || "",
      p.year_level || "",
      p.section || "",
      getStatusLabel(p.attendance_status),
      p.hours_earned || 0,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `participants_${activity.title.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export started");
  };

  const updateStatus = async (participantId: number, status: string) => {
    if (!canEdit) {
      toast.error("You don't have permission to update participant status");
      return;
    }

    try {
      setUpdatingStatus(participantId);
      const result = await adminApi.updateParticipantStatus(
        activity.id,
        participantId,
        status,
      );

      if (result?.queued) {
        toast(result.message || "Change queued and will sync automatically");
        return;
      }

      toast.success("Status updated successfully");
      await fetchParticipants();
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to update participant status");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const removeParticipant = async (participantId: number) => {
    if (!canEdit) {
      toast.error("You don't have permission to remove participants");
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to remove this participant from the activity?",
      )
    )
      return;

    try {
      setRemovingParticipant(participantId);
      const result: { message: string; queued?: boolean } =
        await adminApi.removeParticipant(activity.id, participantId);

      if (result?.queued) {
        toast(result.message || "Change queued and will sync automatically");
        return;
      }

      toast.success("Participant removed successfully");
      await fetchParticipants();
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove participant");
    } finally {
      setRemovingParticipant(null);
    }
  };

  // Get user role display
  const getRoleDisplay = () => {
    if (isAdmin || isSuperAdmin) return "Admin";
    if (isFaculty) return "Faculty";
    return "User";
  };

  const getPermissionMessage = () => {
    if (isSuperAdmin) {
      return "You have view-only access. Admins and Faculty can manage participants.";
    }
    if (isFaculty && activity.created_by !== user?.id) {
      return "You are viewing this activity as read-only because you did not create it.";
    }
    if (isFaculty && activity.created_by === user?.id) {
      return "You created this activity and have edit permissions.";
    }
    if (isAdmin) {
      return "You have full admin access to manage this activity.";
    }
    return "";
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-xl" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>
              <i className="fas fa-users text-gold-500 mr-2" />
              Participants - {activity.title}
            </h3>
            <div className="flex flex-wrap gap-4 mt-1 text-sm text-slate-500">
              <span>
                <i className="fas fa-calendar mr-1" />{" "}
                {new Date(activity.start_datetime).toLocaleDateString()}
              </span>
              <span>
                <i className="fas fa-clock mr-1" />{" "}
                {new Date(activity.start_datetime).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              {activity.venue && (
                <span>
                  <i className="fas fa-map-marker-alt mr-1" /> {activity.venue}
                </span>
              )}
              <span>
                <i className="fas fa-users mr-1" /> {participants.length}{" "}
                participants
              </span>
              <span
                className={`badge ${canEdit ? "badge-success" : "badge-secondary"}`}
              >
                <i className={`fas ${canEdit ? "fa-edit" : "fa-eye"} mr-1`} />
                {canEdit ? "Edit Mode" : "View Only"}
              </span>
            </div>
            {getPermissionMessage() && (
              <div className="mt-1 text-xs text-slate-400">
                <i className="fas fa-info-circle mr-1" />
                {getPermissionMessage()}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <RefreshButton
              onRefresh={fetchParticipants}
              isLoading={loading}
              label=""
              className="btn-sm"
            />
            <button
              className="btn btn-secondary btn-sm"
              onClick={exportCSV}
              disabled={participants.length === 0}
            >
              <i className="fas fa-download" /> Export
            </button>
            <button className="modal-close" onClick={onClose}>
              ×
            </button>
          </div>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="spinner" />
              <span className="ml-3 text-slate-500">
                Loading participants...
              </span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-center">
              <i className="fas fa-exclamation-circle mr-2" />
              {error}
              <button
                className="ml-3 text-red-700 underline hover:text-red-900"
                onClick={fetchParticipants}
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              {/* Filters */}
              <div className="flex flex-wrap gap-3 mb-4">
                <div className="search-box flex-1 min-w-[200px]">
                  <i className="fas fa-search" />
                  <input
                    type="text"
                    placeholder="Search by name, ID, or email..."
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
                  className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="registered">Registered</option>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="excused">Excused</option>
                </select>
                <span className="text-sm text-slate-500 self-center">
                  {filteredParticipants.length} of {participants.length}{" "}
                  participants
                </span>
              </div>

              {filteredParticipants.length === 0 ? (
                <div className="empty-state">
                  <i className="fas fa-user-slash" />
                  <p>
                    {searchTerm || filterStatus !== "all"
                      ? "No matching participants found"
                      : "No participants registered yet"}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Student ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Course</th>
                        <th>Section</th>
                        <th>Status</th>
                        <th>Hours</th>
                        {canEdit && <th>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredParticipants.map((participant) => (
                        <tr key={participant.id}>
                          <td className="font-bold text-navy-900">
                            {participant.student_id}
                          </td>
                          <td>
                            {participant.user.first_name}{" "}
                            {participant.user.last_name}
                          </td>
                          <td>{participant.user.email}</td>
                          <td>{participant.course || "-"}</td>
                          <td>{participant.section || "-"}</td>
                          <td>
                            {canEdit ? (
                              <select
                                className={`px-2 py-1 rounded text-xs font-semibold border-0 ${getStatusColor(participant.attendance_status)} text-white`}
                                value={participant.attendance_status}
                                onChange={(e) =>
                                  updateStatus(participant.id, e.target.value)
                                }
                                disabled={updatingStatus === participant.id}
                              >
                                <option value="registered">Registered</option>
                                <option value="present">Present</option>
                                <option value="absent">Absent</option>
                                <option value="excused">Excused</option>
                              </select>
                            ) : (
                              <span
                                className={`badge ${getStatusColor(participant.attendance_status)} text-white`}
                              >
                                {getStatusLabel(participant.attendance_status)}
                              </span>
                            )}
                            {updatingStatus === participant.id && (
                              <span className="ml-1 text-xs text-slate-400">
                                <i className="fas fa-spinner fa-spin" />
                              </span>
                            )}
                          </td>
                          <td>{participant.hours_earned || 0}</td>
                          {canEdit && (
                            <td>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() =>
                                  removeParticipant(participant.id)
                                }
                                disabled={
                                  removingParticipant === participant.id
                                }
                              >
                                {removingParticipant === participant.id ? (
                                  <i className="fas fa-spinner fa-spin" />
                                ) : (
                                  <i className="fas fa-user-minus" />
                                )}
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          <div className="flex gap-4 text-sm text-slate-500 mr-auto">
            <span>Total: {participants.length}</span>
            <span>
              Registered:{" "}
              {
                participants.filter((p) => p.attendance_status === "registered")
                  .length
              }
            </span>
            <span>
              Present:{" "}
              {
                participants.filter((p) => p.attendance_status === "present")
                  .length
              }
            </span>
            <span>
              Absent:{" "}
              {
                participants.filter((p) => p.attendance_status === "absent")
                  .length
              }
            </span>
          </div>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivityParticipants;