// resources/js/pages/faculty/Students.tsx
import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { facultyApi } from "../../services/api";
import RefreshButton from "../components/common/RefreshButton";
import StudentDetailsModal from "../components/common/StudentDetailsModal";
import type { Student } from "../../types/api";

const FacultyStudents: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchTerm);
      setPage(1); // reset to page 1 on search
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset to page 1 when perPage changes
  useEffect(() => {
    setPage(1);
  }, [perPage]);

  // Fetch students from faculty API
  const {
    data: students = [],
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["faculty", "students", search],
    queryFn: () => facultyApi.getStudents(search),
    staleTime: 30000,
  });

  // ============================================================
  // Client-side pagination
  // ============================================================
  const pagination = useMemo(() => {
    const total = students.length;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const safePage = Math.min(page, lastPage);
    const start = (safePage - 1) * perPage;
    const end = start + perPage;
    const slice = students.slice(start, end);

    return {
      total,
      lastPage,
      currentPage: safePage,
      perPage,
      from: total === 0 ? 0 : start + 1,
      to: total === 0 ? 0 : Math.min(end, total),
      data: slice,
    };
  }, [students, page, perPage]);

  // Sync internal page if it drifted past lastPage (e.g. after search filter)
  useEffect(() => {
    if (pagination.currentPage !== page) {
      setPage(pagination.currentPage);
    }
  }, [pagination.currentPage, page]);

  // ============================================================
  // Handlers
  // ============================================================
  const openDetails = (student: Student) => {
    setSelectedStudent(student);
    setShowDetailsModal(true);
  };

  const goToPage = (p: number) => {
    if (p >= 1 && p <= pagination.lastPage) {
      setPage(p);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "badge-warning",
      in_progress: "badge-info",
      completed: "badge-success",
      deficient: "badge-danger",
    };
    return colors[status] || "badge-secondary";
  };

  const getComponentColor = (comp?: string) => {
    const colors: Record<string, string> = {
      cwts: "bg-blue-100 text-blue-800",
      rotc: "bg-red-100 text-red-800",
      lts: "bg-emerald-100 text-emerald-800",
    };
    return colors[comp || ""] || "bg-slate-100 text-slate-800";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="spinner" />
        <span className="ml-3 text-slate-500">Loading students...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        <i className="fas fa-exclamation-circle mr-2" />
        Failed to load students: {(error as Error).message}
        <button className="btn btn-primary btn-sm ml-3" onClick={() => refetch()}>
          <i className="fas fa-redo" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ============================================================ */}
      {/* HEADER */}
      {/* ============================================================ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold text-navy-900">My Students</h2>
          <p className="text-sm text-slate-500">
            Students under your NSTP component
            <span className="ml-2 font-semibold text-gold-600">
              ({students.length} students)
            </span>
          </p>
        </div>
        <RefreshButton onRefresh={refetch} isLoading={isFetching} label="Refresh" />
      </div>

      {/* ============================================================ */}
      {/* SEARCH + PER PAGE */}
      {/* ============================================================ */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-wrap gap-3">
          <div className="search-box flex-1 min-w-[220px]">
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
            value={perPage}
            onChange={(e) => setPerPage(Number(e.target.value))}
          >
            <option value={10}>10 per page</option>
            <option value={15}>15 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>

          <span className="text-sm text-slate-500 self-center">
            Showing {pagination.from}–{pagination.to} of {pagination.total}
          </span>
          {isFetching && (
            <span className="flex items-center text-sm text-slate-500">
              <i className="fas fa-spinner fa-spin mr-2" /> Updating...
            </span>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* TABLE */}
      {/* ============================================================ */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
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
                <th>Hours</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pagination.data.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-500">
                    <i className="fas fa-users text-3xl text-slate-300 block mb-3" />
                    {searchTerm
                      ? "No students match your search"
                      : "No students found for your component"}
                  </td>
                </tr>
              ) : (
                pagination.data.map((student: any) => (
                  <tr
                    key={student.id}
                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                    onClick={() => openDetails(student)}
                  >
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gold-100">
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
                                    "w-full h-full flex items-center justify-center font-bold text-sm text-white bg-navy-600";
                                  fallback.textContent = `${student.user.first_name?.charAt(0) || ""}${student.user.last_name?.charAt(0) || ""}`;
                                  parent.appendChild(fallback);
                                }
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-sm text-white bg-navy-600">
                              {student.user?.first_name?.charAt(0) || ""}
                              {student.user?.last_name?.charAt(0) || ""}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-navy-900 group-hover:text-gold-600 transition-colors">
                            {student.user?.first_name} {student.user?.last_name}
                          </div>
                          <div className="text-xs text-slate-400">
                            {student.user?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="font-bold text-navy-900">
                      {student.student_id}
                    </td>
                    <td>{student.course || "-"}</td>
                    <td>{student.year_level || "-"}</td>
                    <td>{student.section || "-"}</td>
                    <td>
                      {student.nstp_component_selected ? (
                        <span
                          className={`badge ${getComponentColor(
                            student.nstp_component_selected,
                          )}`}
                        >
                          {student.nstp_component_selected.toUpperCase()}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">Not assigned</span>
                      )}
                    </td>
                    <td>
                      <span className="font-medium text-navy-900">
                        {student.completed_training_hours || 0}
                      </span>
                      <span className="text-xs text-slate-400"> / 100</span>
                    </td>
                    <td>
                      <span
                        className={`badge ${getStatusBadge(
                          student.completion_status,
                        )}`}
                      >
                        {student.completion_status?.replace("_", " ") || "N/A"}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-info btn-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDetails(student);
                        }}
                        title="View Details"
                      >
                        <i className="fas fa-eye" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================ */}
      {/* PAGINATION */}
      {/* ============================================================ */}
      {pagination.total > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2 border-t border-slate-200">
          <span className="text-sm text-slate-500">
            Showing {pagination.from} – {pagination.to} of {pagination.total}{" "}
            students
          </span>

          <div className="flex items-center gap-2">
            <button
              className="btn btn-secondary btn-sm inline-flex items-center gap-1.5"
              onClick={() => goToPage(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1 || isFetching}
            >
              <i className="fas fa-chevron-left" />
              <span>Previous</span>
            </button>

            <span className="text-sm font-medium text-navy-900 px-3">
              Page {pagination.currentPage} of {pagination.lastPage}
            </span>

            <button
              className="btn btn-secondary btn-sm inline-flex items-center gap-1.5"
              onClick={() => goToPage(pagination.currentPage + 1)}
              disabled={
                pagination.currentPage >= pagination.lastPage || isFetching
              }
            >
              <span>Next</span>
              <i className="fas fa-chevron-right" />
            </button>
          </div>
        </div>
      )}


      {/* ============================================================ */}
      {/* DETAILS MODAL */}
      {/* ============================================================ */}
      {showDetailsModal && selectedStudent && (
        <StudentDetailsModal
          student={selectedStudent}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedStudent(null);
          }}
        />
      )}
    </div>
  );
};

export default FacultyStudents;