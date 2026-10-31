// resources/js/pages/faculty/Classes.tsx

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { facultyApi } from "../../services/api";
import RefreshButton from "../components/common/RefreshButton";
import { Link, useNavigate } from "react-router-dom";

interface ClassGroup {
  id: number;
  name: string;
  description: string;
  component_type: "cwts" | "rotc" | "lts" | "all";
  class_code?: string | null;
  school_year?: string | null;
  status: "active" | "archived";
  students_count: number;
  teacher_id: number;
  teacher?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
}

type ViewMode = "list" | "grid";

const FacultyClasses: React.FC = () => {
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterComponent, setFilterComponent] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const {
    data: classes = [],
    isLoading,
    refetch,
    isFetching: isRefreshing,
  } = useQuery<ClassGroup[]>({
    queryKey: ["faculty", "classes", filterStatus, filterComponent],
    queryFn: () => facultyApi.getClasses(),
    staleTime: 30000,
  });

  const filteredClasses = useMemo(() => {
    let list = classes;
    if (filterStatus !== "all") {
      list = list.filter((cls) => cls.status === filterStatus);
    }
    if (filterComponent !== "all") {
      list = list.filter((cls) => cls.component_type === filterComponent);
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (cls) =>
          cls.name.toLowerCase().includes(q) ||
          (cls.description || "").toLowerCase().includes(q) ||
          (cls.class_code || "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [classes, filterStatus, filterComponent, searchTerm]);

  // ============================================================
  // Helpers
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

  const getStatusLabel = (status: string) =>
    status === "active" ? "Active" : "Archived";

  const handleSetAttendance = (e: React.MouseEvent, cls: ClassGroup) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/faculty/attendance/create?class_id=${cls.id}`);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    alert(`Class code "${code}" copied`);
  };

  // ============================================================
  // Loading
  // ============================================================
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="spinner" />
        <span className="ml-3 text-slate-500">Loading your classes...</span>
      </div>
    );
  }

  const activeCount = classes.filter((c) => c.status === "active").length;
  const archivedCount = classes.filter((c) => c.status === "archived").length;

  return (
    <div className="space-y-5">
      {/* ============================================================ */}
      {/* HEADER */}
      {/* ============================================================ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold text-navy-900">
            <i className="fas fa-chalkboard-teacher text-gold-500 mr-2" />
            My Classes
          </h2>
          <p className="text-sm text-slate-500">
            Classes you are assigned to teach
          </p>
        </div>
        <RefreshButton
          onRefresh={refetch}
          isLoading={isRefreshing}
          label=""
          className="btn-sm"
        />
      </div>

      {/* ============================================================ */}
      {/* STATS */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-navy-600">
          <span className="block text-xs text-slate-500">Total Classes</span>
          <span className="text-2xl font-bold text-navy-900">
            {classes.length}
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-emerald-500">
          <span className="block text-xs text-slate-500">Active</span>
          <span className="text-2xl font-bold text-navy-900">{activeCount}</span>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-slate-400">
          <span className="block text-xs text-slate-500">Archived</span>
          <span className="text-2xl font-bold text-navy-900">
            {archivedCount}
          </span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* FILTERS */}
      {/* ============================================================ */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-wrap items-center gap-3">
          <div className="search-box flex-1 min-w-[220px]">
            <i className="fas fa-search" />
            <input
              type="text"
              placeholder="Search by class name or class code..."
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
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
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

          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              type="button"
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1.5 ${
                viewMode === "list"
                  ? "bg-white text-navy-900 shadow-sm"
                  : "text-slate-500 hover:text-navy-700"
              }`}
              onClick={() => setViewMode("list")}
            >
              <i className="fas fa-list" /> List
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1.5 ${
                viewMode === "grid"
                  ? "bg-white text-navy-900 shadow-sm"
                  : "text-slate-500 hover:text-navy-700"
              }`}
              onClick={() => setViewMode("grid")}
            >
              <i className="fas fa-th" /> Grid
            </button>
          </div>
        </div>

        {filteredClasses.length !== classes.length && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Showing <strong>{filteredClasses.length}</strong> of{" "}
              {classes.length} classes
            </span>
            {(searchTerm ||
              filterStatus !== "all" ||
              filterComponent !== "all") && (
              <button
                className="text-gold-600 hover:text-gold-700"
                onClick={() => {
                  setSearchTerm("");
                  setFilterStatus("all");
                  setFilterComponent("all");
                }}
              >
                <i className="fas fa-times mr-1" /> Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* EMPTY STATE */}
      {/* ============================================================ */}
      {filteredClasses.length === 0 ? (
        <div className="empty-state bg-white rounded-xl border border-slate-200">
          <i className="fas fa-chalkboard-teacher text-4xl text-slate-300 block mb-3" />
          <p className="text-slate-500">
            {classes.length === 0
              ? "You don't have any classes assigned yet"
              : "No classes match your filters"}
          </p>
          {classes.length === 0 ? (
            <p className="text-sm text-slate-400 mt-1">
              Classes will appear here once you are assigned as an instructor
            </p>
          ) : (
            <button
              className="btn btn-secondary mt-4"
              onClick={() => {
                setSearchTerm("");
                setFilterStatus("all");
                setFilterComponent("all");
              }}
            >
              <i className="fas fa-times mr-1" /> Clear all filters
            </button>
          )}
        </div>
      ) : viewMode === "list" ? (
        /* ============================================================ */
        /* LIST VIEW */
        /* ============================================================ */
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Component</th>
                  <th>Class Code</th>
                  <th>School Year</th>
                  <th>Students</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClasses.map((cls) => (
                  <tr key={cls.id} className="hover:bg-slate-50 transition-colors">
                    {/* Class */}
                    <td>
                      <div className="flex items-start gap-3 min-w-[260px]">
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
                          <Link
                            to={`/faculty/classes/${cls.id}`}
                            className="font-semibold text-navy-900 hover:text-gold-600 transition-colors truncate block max-w-[300px]"
                          >
                            {cls.name}
                          </Link>
                          {cls.description ? (
                            <div className="text-xs text-slate-500 truncate max-w-[300px]">
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

                    {/* Component */}
                    <td>
                      <span
                        className={`badge ${getComponentBadge(cls.component_type)}`}
                      >
                        {getComponentLabel(cls.component_type)}
                      </span>
                    </td>

                    {/* Class Code (replaces old Join Code) */}
                    <td>
                      {cls.class_code ? (
                        <button
                          type="button"
                          className="group/code inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyCode(cls.class_code!);
                          }}
                          title="Click to copy class code"
                        >
                          <i className="fas fa-key text-gold-500 text-xs" />
                          <span className="font-mono font-bold text-sm text-navy-900">
                            {cls.class_code}
                          </span>
                          <i className="fas fa-copy text-slate-400 text-xs opacity-0 group-hover/code:opacity-100 transition-opacity" />
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>

                    {/* School Year */}
                    <td className="text-sm">{cls.school_year || "—"}</td>

                    {/* Students */}
                    <td>
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-navy-900">
                        <i className="fas fa-users text-slate-400" />
                        {cls.students_count || 0}
                      </span>
                    </td>

                    {/* Status */}
                    <td>
                      <span className={`badge ${getStatusBadge(cls.status)}`}>
                        {getStatusLabel(cls.status)}
                      </span>
                    </td>

                    {/* Created */}
                    <td>
                      <span className="text-sm text-slate-600">
                        {new Date(cls.created_at).toLocaleDateString()}
                      </span>
                    </td>

                    {/* Actions — with text labels */}
                    <td>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          className="btn btn-primary btn-sm inline-flex items-center gap-1.5"
                          onClick={(e) => handleSetAttendance(e, cls)}
                          title="Schedule an attendance session"
                        >
                          <i className="fas fa-calendar-plus" />
                          <span>Set Attendance</span>
                        </button>
                        <Link
                          to={`/faculty/classes/${cls.id}`}
                          className="btn btn-info btn-sm inline-flex items-center gap-1.5"
                          title="View details"
                        >
                          <i className="fas fa-eye" />
                          <span>View</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ============================================================ */
        /* GRID VIEW */
        /* ============================================================ */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClasses.map((cls) => (
            <div
              key={cls.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md hover:border-gold-300 transition-all group flex flex-col"
            >
              <Link to={`/faculty/classes/${cls.id}`} className="flex-1 block">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-navy-900 group-hover:text-gold-600 transition-colors">
                    {cls.name}
                  </h3>
                  <span className={`badge ${getStatusBadge(cls.status)}`}>
                    {getStatusLabel(cls.status)}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mb-3 line-clamp-2">
                  {cls.description || "No description"}
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span
                    className={`badge ${getComponentBadge(cls.component_type)}`}
                  >
                    {getComponentLabel(cls.component_type)}
                  </span>
                  <span className="badge badge-secondary">
                    <i className="fas fa-users mr-1" />
                    {cls.students_count || 0} students
                  </span>
                  {cls.class_code && (
                    <span className="badge badge-secondary">
                      <i className="fas fa-key mr-1" />
                      {cls.class_code}
                    </span>
                  )}
                </div>
              </Link>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
                <span className="text-xs text-slate-400">
                  <i className="fas fa-calendar mr-1" />
                  {new Date(cls.created_at).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm inline-flex items-center gap-1.5"
                    onClick={(e) => handleSetAttendance(e, cls)}
                  >
                    <i className="fas fa-calendar-plus" />
                    <span>Set Attendance</span>
                  </button>
                  <Link
                    to={`/faculty/classes/${cls.id}`}
                    className="text-xs text-gold-500 hover:underline flex items-center gap-1"
                  >
                    Details <i className="fas fa-arrow-right text-xs" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FacultyClasses;