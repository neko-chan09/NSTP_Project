// resources/js/pages/admin/Students/Requests.tsx
import React, { useState } from "react";
import {
  useChangeRequests,
  useHandleChangeRequest,
} from "../../hooks/useChangeRequests";
import RefreshButton from "../../components/common/RefreshButton";
import toast from "react-hot-toast";
import type { ComponentChangeRequest } from "../../../types/api";

const StudentRequests: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState<string>("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] =
    useState<ComponentChangeRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const {
    data: requests = [],
    isLoading,
    error,
    refresh,
    isRefreshing,
  } = useChangeRequests(filterStatus);

  const handleMut = useHandleChangeRequest();

  // ============================================================
  // Handlers
  // ============================================================
  const handleApprove = async (id: number) => {
    if (!window.confirm("Approve this component change request?")) return;
    try {
      await handleMut.mutateAsync({ id, status: "approved" });
      toast.success("Request approved successfully");
      refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to approve request");
    }
  };

  const handleReject = async (id: number) => {
    const reason = prompt("Please provide a reason for rejection:");
    if (reason === null) return;
    if (reason.trim() === "") {
      toast.error("Please provide a reason for rejection");
      return;
    }
    try {
      await handleMut.mutateAsync({
        id,
        status: "rejected",
        admin_remarks: reason.trim(),
      });
      toast.success("Request rejected");
      refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to reject request");
    }
  };

  // ============================================================
  // Display helpers
  // ============================================================
  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-amber-100 text-amber-800 border-amber-200",
      approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
      rejected: "bg-red-100 text-red-800 border-red-200",
      cancelled: "bg-slate-100 text-slate-800 border-slate-200",
    };
    return colors[status] || "bg-slate-100 text-slate-800 border-slate-200";
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, string> = {
      pending: "fa-clock",
      approved: "fa-check-circle",
      rejected: "fa-times-circle",
      cancelled: "fa-ban",
    };
    return icons[status] || "fa-circle";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Pending",
      approved: "Approved",
      rejected: "Rejected",
      cancelled: "Cancelled",
    };
    return labels[status] || status;
  };

  const getComponentLabel = (component: string) => {
    const labels: Record<string, string> = {
      cwts: "CWTS",
      rotc: "ROTC",
      lts: "LTS",
    };
    return labels[component] || component.toUpperCase();
  };

  const getComponentColor = (component: string) => {
    const colors: Record<string, string> = {
      cwts: "bg-blue-100 text-blue-800",
      rotc: "bg-red-100 text-red-800",
      lts: "bg-emerald-100 text-emerald-800",
    };
    return colors[component] || "bg-slate-100 text-slate-800";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ============================================================
  // Filtering
  // ============================================================
  const filteredRequests = requests.filter(
    (req: ComponentChangeRequest) => {
      if (!searchTerm.trim()) return true;
      const search = searchTerm.toLowerCase().trim();
      const studentName =
        `${req.student?.user?.first_name || ""} ${req.student?.user?.last_name || ""}`.toLowerCase();
      const studentId = req.student?.student_id?.toLowerCase() || "";
      const email = req.student?.user?.email?.toLowerCase() || "";
      return (
        studentName.includes(search) ||
        studentId.includes(search) ||
        email.includes(search)
      );
    },
  );

  const pendingCount = requests.filter(
    (r: ComponentChangeRequest) => r.status === "pending",
  ).length;

  const openDetails = (req: ComponentChangeRequest) => {
    setSelectedRequest(req);
    setShowDetailsModal(true);
  };

  // ============================================================
  // Loading / error
  // ============================================================
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="spinner" />
        <span className="ml-3 text-slate-500">Loading requests...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        <i className="fas fa-exclamation-circle mr-2" />
        Failed to load requests: {(error as Error).message}
        <button className="btn btn-sm btn-primary ml-3" onClick={refresh}>
          <i className="fas fa-sync mr-1" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold text-navy-900">
            Component Change Requests
          </h2>
          <p className="text-sm text-slate-500">
            Manage student requests to change their NSTP component
          </p>
        </div>
        <div className="flex gap-2">
          <RefreshButton
            onRefresh={refresh}
            isLoading={isRefreshing}
            label=""
            className="btn-sm"
          />
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-lg border border-amber-200">
            <span className="text-sm font-medium text-amber-700">
              <i className="fas fa-clock mr-1" />
              {pendingCount} pending
            </span>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Pending",
            value: pendingCount,
            color: "border-amber-500",
            bg: "bg-amber-50",
          },
          {
            label: "Approved",
            value: requests.filter(
              (r: ComponentChangeRequest) => r.status === "approved",
            ).length,
            color: "border-emerald-500",
            bg: "bg-emerald-50",
          },
          {
            label: "Rejected",
            value: requests.filter(
              (r: ComponentChangeRequest) => r.status === "rejected",
            ).length,
            color: "border-red-500",
            bg: "bg-red-50",
          },
          {
            label: "Total",
            value: requests.length,
            color: "border-navy-600",
            bg: "bg-navy-50",
          },
        ].map((stat, index) => (
          <div
            key={index}
            className={`${stat.bg} p-3 rounded-xl border-l-4 ${stat.color}`}
          >
            <span className="block text-xs text-slate-500">{stat.label}</span>
            <span className="text-xl font-bold text-navy-900">
              {stat.value}
            </span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-wrap gap-3">
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
            className="px-4 py-2.5 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
            <option value="all">All Status</option>
          </select>
          <span className="text-sm text-slate-500 self-center">
            {filteredRequests.length} request
            {filteredRequests.length !== 1 ? "s" : ""} found
          </span>
        </div>
      </div>

      {/* Empty State */}
      {filteredRequests.length === 0 && (
        <div className="card text-center py-16">
          {filterStatus !== "all" ? (
            <>
              <i className="fas fa-inbox text-5xl text-slate-300 mb-4 block" />
              <p className="text-slate-500">
                No {filterStatus} change requests
              </p>
              <p className="text-sm text-slate-400 mt-1">All caught up!</p>
            </>
          ) : (
            <>
              <i className="fas fa-check-circle text-5xl text-gold-500 mb-4 block" />
              <p className="text-slate-500">No change requests found</p>
              <p className="text-sm text-slate-400 mt-1">
                Students can request component changes from the mobile app
              </p>
            </>
          )}
        </div>
      )}

      {/* Requests Table */}
      {filteredRequests.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>OCC ID</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Reason</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((req: ComponentChangeRequest) => (
                  <tr
                    key={req.id}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => openDetails(req)}
                  >
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-gold-100">
                          {req.student?.user?.profile_photo ? (
                            <img
                              src={req.student.user.profile_photo}
                              alt={`${req.student.user.first_name} ${req.student.user.last_name}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-xs text-white bg-navy-600">
                              {req.student?.user?.first_name?.charAt(0) || "?"}
                              {req.student?.user?.last_name?.charAt(0) || "?"}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-navy-900 group-hover:text-gold-600 transition-colors">
                            {req.student?.user?.first_name}{" "}
                            {req.student?.user?.last_name}
                          </div>
                          <div className="text-xs text-slate-400">
                            {req.student?.user?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="font-bold text-navy-900">
                      {req.student?.student_id}
                    </td>
                    <td>
                      <span
                        className={`badge ${getComponentColor(req.from_component)}`}
                      >
                        {getComponentLabel(req.from_component)}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${getComponentColor(req.to_component)}`}
                      >
                        {getComponentLabel(req.to_component)}
                        <i className="fas fa-arrow-right ml-1 text-xs opacity-60" />
                      </span>
                    </td>
                    <td className="max-w-[180px]">
                      <p
                        className="text-sm text-slate-600 truncate"
                        title={req.reason}
                      >
                        {req.reason}
                      </p>
                    </td>
                    <td className="text-sm text-slate-500">
                      {formatDate(req.created_at)}
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadge(req.status)}`}>
                        <i
                          className={`fas ${getStatusIcon(req.status)} mr-1 text-xs`}
                        />
                        {getStatusLabel(req.status)}
                      </span>
                      {req.admin_remarks && req.status === "rejected" && (
                        <div
                          className="text-xs text-red-500 mt-1 max-w-[150px] truncate"
                          title={req.admin_remarks}
                        >
                          {req.admin_remarks}
                        </div>
                      )}
                    </td>
                    <td>
                      <div
                        className="flex gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {req.status === "pending" ? (
                          <>
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleApprove(req.id)}
                              disabled={handleMut.isPending}
                              title="Approve"
                            >
                              {handleMut.isPending &&
                              handleMut.variables?.id === req.id ? (
                                <i className="fas fa-spinner fa-spin" />
                              ) : (
                                <i className="fas fa-check" />
                              )}
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleReject(req.id)}
                              disabled={handleMut.isPending}
                              title="Reject"
                            >
                              {handleMut.isPending &&
                              handleMut.variables?.id === req.id ? (
                                <i className="fas fa-spinner fa-spin" />
                              ) : (
                                <i className="fas fa-times" />
                              )}
                            </button>
                          </>
                        ) : (
                          <button
                            className="btn btn-info btn-sm"
                            onClick={() => openDetails(req)}
                            title="View Details"
                          >
                            <i className="fas fa-eye" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div
          className="modal-overlay"
          onClick={() => setShowDetailsModal(false)}
        >
          <div className="modal max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gold-100 flex items-center justify-center text-gold-600">
                  <i className="fas fa-exchange-alt" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-navy-900">
                    Request Details
                  </h3>
                  <p className="text-sm text-slate-500">
                    #{selectedRequest.id} •{" "}
                    {formatDate(selectedRequest.created_at)}
                  </p>
                </div>
              </div>
              <button
                className="modal-close"
                onClick={() => setShowDetailsModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body space-y-6">
              {/* Student Info */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  <i className="fas fa-user text-gold-500 mr-2" />
                  Student Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs text-slate-400">Name</span>
                    <p className="font-medium text-navy-900">
                      {selectedRequest.student?.user?.first_name}{" "}
                      {selectedRequest.student?.user?.last_name}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">OCC ID</span>
                    <p className="font-medium text-navy-900">
                      {selectedRequest.student?.student_id}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Email</span>
                    <p className="font-medium text-navy-900">
                      {selectedRequest.student?.user?.email}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Course</span>
                    <p className="font-medium text-navy-900">
                      {selectedRequest.student?.course || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Component Change */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  <i className="fas fa-exchange-alt text-gold-500 mr-2" />
                  Component Change Request
                </h4>
                <div className="flex items-center gap-4 justify-center py-2">
                  <div className="text-center">
                    <span className="text-xs text-slate-400">From</span>
                    <div
                      className={`badge ${getComponentColor(selectedRequest.from_component)} text-lg px-4 py-2`}
                    >
                      {getComponentLabel(selectedRequest.from_component)}
                    </div>
                  </div>
                  <div className="text-2xl text-gold-500">
                    <i className="fas fa-arrow-right" />
                  </div>
                  <div className="text-center">
                    <span className="text-xs text-slate-400">To</span>
                    <div
                      className={`badge ${getComponentColor(selectedRequest.to_component)} text-lg px-4 py-2`}
                    >
                      {getComponentLabel(selectedRequest.to_component)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  <i className="fas fa-comment text-gold-500 mr-2" />
                  Reason
                </h4>
                <p className="text-navy-700 bg-white p-3 rounded-lg border border-slate-200">
                  {selectedRequest.reason}
                </p>
              </div>

              {/* Status & Remarks */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  <i className="fas fa-info-circle text-gold-500 mr-2" />
                  Status Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs text-slate-400">Status</span>
                    <div>
                      <span
                        className={`badge ${getStatusBadge(selectedRequest.status)}`}
                      >
                        <i
                          className={`fas ${getStatusIcon(selectedRequest.status)} mr-1`}
                        />
                        {getStatusLabel(selectedRequest.status)}
                      </span>
                    </div>
                  </div>
                  {selectedRequest.approved_at && (
                    <div>
                      <span className="text-xs text-slate-400">
                        Processed At
                      </span>
                      <p className="font-medium text-navy-900">
                        {formatDate(selectedRequest.approved_at)}
                      </p>
                    </div>
                  )}
                  {selectedRequest.approver && (
                    <div className="md:col-span-2">
                      <span className="text-xs text-slate-400">
                        Processed By
                      </span>
                      <p className="font-medium text-navy-900">
                        {selectedRequest.approver.first_name}{" "}
                        {selectedRequest.approver.last_name}
                      </p>
                    </div>
                  )}
                  {selectedRequest.admin_remarks && (
                    <div className="md:col-span-2">
                      <span className="text-xs text-slate-400">
                        Admin Remarks
                      </span>
                      <p className="text-navy-700 bg-white p-2 rounded-lg border border-slate-200 text-sm">
                        {selectedRequest.admin_remarks}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              {selectedRequest.status === "pending" && (
                <div className="flex gap-3 pt-2 border-t border-slate-200">
                  <button
                    className="btn btn-success flex-1"
                    onClick={() => {
                      handleApprove(selectedRequest.id);
                      setShowDetailsModal(false);
                    }}
                    disabled={handleMut.isPending}
                  >
                    {handleMut.isPending &&
                    handleMut.variables?.id === selectedRequest.id ? (
                      <>
                        <i className="fas fa-spinner fa-spin" /> Processing...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-check" /> Approve
                      </>
                    )}
                  </button>
                  <button
                    className="btn btn-danger flex-1"
                    onClick={() => {
                      handleReject(selectedRequest.id);
                      setShowDetailsModal(false);
                    }}
                    disabled={handleMut.isPending}
                  >
                    {handleMut.isPending &&
                    handleMut.variables?.id === selectedRequest.id ? (
                      <>
                        <i className="fas fa-spinner fa-spin" /> Processing...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-times" /> Reject
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowDetailsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentRequests;