// src/pages/admin/Grades/index.tsx
import React, { useState } from "react";
import {
  useGrades,
  useGradeStats,
  useUpdateGrade,
  useBatchUpdateGrades,
  useRecalculateGrades,
  downloadGradeCSV,
} from "../../hooks/useGrades";
import GradeBadge from "../../components/common/GradeBadge";
import RefreshButton from "../../components/common/RefreshButton";
import toast from "react-hot-toast";

interface GradeFilters {
  component?: string;
  grade_status?: "passing" | "failing" | "ungraded";
  grade_level?: "excellent" | "good" | "satisfactory" | "deficient";
  search?: string;
}

const GradesManagement: React.FC = () => {
  const [filters, setFilters] = useState<GradeFilters>({});
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchPercentage, setBatchPercentage] = useState(60);
  const [batchRemarks, setBatchRemarks] = useState("");
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [editPercentage, setEditPercentage] = useState(0);
  const [editRemarks, setEditRemarks] = useState("");

  const {
    data: grades = [],
    isLoading,
    error,
    refresh,
    isRefreshing,
  } = useGrades(filters);
  const { data: stats, refresh: refreshStats } = useGradeStats();
  const updateGradeMut = useUpdateGrade();
  const batchUpdateMut = useBatchUpdateGrades();
  const recalculateMut = useRecalculateGrades();

  const handleFilterChange = (key: keyof GradeFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === grades.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(grades.map((g: any) => g.id));
    }
  };

  const handleSelectStudent = (id: number) => {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const handleEditGrade = (student: any) => {
    setEditingStudent(student);
    setEditPercentage(student.percentage || 0);
    setEditRemarks(student.grade_remarks || "");
    setShowGradeModal(true);
  };

  const handleUpdateGrade = async () => {
    if (!editingStudent) return;
    try {
      await updateGradeMut.mutateAsync({
        id: editingStudent.id,
        data: { percentage: editPercentage, remarks: editRemarks },
      });
      toast.success("Grade updated successfully");
      setShowGradeModal(false);
      setEditingStudent(null);
      refresh();
      refreshStats();
    } catch (err: any) {
      toast.error(err.message || "Failed to update grade");
    }
  };

  const handleBatchUpdate = async () => {
    if (selectedStudents.length === 0) {
      toast.error("Please select at least one student");
      return;
    }
    try {
      await batchUpdateMut.mutateAsync({
        student_ids: selectedStudents,
        percentage: batchPercentage,
        remarks:
          batchRemarks || `Batch update - ${new Date().toLocaleDateString()}`,
      });
      toast.success(`${selectedStudents.length} students updated successfully`);
      setSelectedStudents([]);
      setShowBatchModal(false);
      refresh();
      refreshStats();
    } catch (err: any) {
      toast.error(err.message || "Failed to update grades");
    }
  };

  const handleRecalculate = async () => {
    if (
      !window.confirm(
        "This will recalculate all grades based on completed hours. Continue?",
      )
    )
      return;
    try {
      await recalculateMut.mutateAsync();
      toast.success("All grades recalculated successfully");
      refresh();
      refreshStats();
    } catch (err: any) {
      toast.error(err.message || "Failed to recalculate grades");
    }
  };

  const handleExport = async () => {
    try {
      await downloadGradeCSV(filters.component);
      toast.success("Export started");
    } catch (err: any) {
      toast.error(err.message || "Failed to export grades");
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      completed: "bg-emerald-500",
      in_progress: "bg-blue-500",
      deficient: "bg-red-500",
      pending: "bg-amber-500",
    };
    return colors[status] || "bg-slate-500";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="spinner" />
        <span className="ml-3 text-slate-500">Loading grades...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        Failed to load grades: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold text-navy-900">Grade Management</h2>
          <p className="text-sm text-slate-500">
            {grades.length} students • {stats?.passing_rate || 0}% passing rate
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-secondary btn-sm" onClick={handleExport}>
            <i className="fas fa-download" /> Export CSV
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleRecalculate}
            disabled={recalculateMut.isPending}
          >
            {recalculateMut.isPending ? (
              <>
                <i className="fas fa-spinner fa-spin" /> Recalculating...
              </>
            ) : (
              <>
                <i className="fas fa-sync" /> Recalculate
              </>
            )}
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowBatchModal(true)}
            disabled={selectedStudents.length === 0}
          >
            <i className="fas fa-edit" /> Batch Update (
            {selectedStudents.length})
          </button>
          <RefreshButton
            onRefresh={refresh}
            isLoading={isRefreshing}
            label=""
            className="btn-sm"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          {
            label: "Total",
            value: stats?.total || 0,
            color: "border-navy-600",
          },
          {
            label: "Excellent (90%+)",
            value: stats?.excellent || 0,
            color: "border-emerald-500",
          },
          {
            label: "Good (75-89%)",
            value: stats?.good || 0,
            color: "border-blue-500",
          },
          {
            label: "Satisfactory (60-74%)",
            value: stats?.satisfactory || 0,
            color: "border-amber-500",
          },
          {
            label: "Deficient (<60%)",
            value: stats?.deficient || 0,
            color: "border-red-500",
          },
          {
            label: "Ungraded",
            value: stats?.ungraded || 0,
            color: "border-slate-400",
          },
        ].map((stat, index) => (
          <div
            key={index}
            className={`bg-white p-3 rounded-xl shadow-sm border-l-4 ${stat.color}`}
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
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="search-box">
            <i className="fas fa-search" />
            <input
              type="text"
              placeholder="Search students..."
              value={filters.search || ""}
              onChange={(e) => handleFilterChange("search", e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2.5 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
            value={filters.component || ""}
            onChange={(e) => handleFilterChange("component", e.target.value)}
          >
            <option value="">All Components</option>
            <option value="cwts">CWTS</option>
            <option value="rotc">ROTC</option>
            <option value="lts">LTS</option>
          </select>
          <select
            className="px-4 py-2.5 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
            value={filters.grade_status || ""}
            onChange={(e) => handleFilterChange("grade_status", e.target.value)}
          >
            <option value="">All Status</option>
            <option value="passing">Passing</option>
            <option value="failing">Failing</option>
            <option value="ungraded">Ungraded</option>
          </select>
          <select
            className="px-4 py-2.5 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
            value={filters.grade_level || ""}
            onChange={(e) => handleFilterChange("grade_level", e.target.value)}
          >
            <option value="">All Grades</option>
            <option value="excellent">Excellent (90%+)</option>
            <option value="good">Good (75-89%)</option>
            <option value="satisfactory">Satisfactory (60-74%)</option>
            <option value="deficient">Deficient (&lt;60%)</option>
          </select>
        </div>
      </div>

      {/* Grades Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-10">
                  <input
                    type="checkbox"
                    checked={
                      selectedStudents.length === grades.length &&
                      grades.length > 0
                    }
                    onChange={handleSelectAll}
                    className="w-4 h-4 accent-gold-500"
                    disabled={grades.length === 0}
                  />
                </th>
                <th>Student</th>
                <th>OCC ID</th>
                <th>Component</th>
                <th>Hours</th>
                <th>Grade</th>
                <th>Status</th>
                <th>Updated</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {grades.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-500">
                    <i className="fas fa-graduation-cap text-3xl text-slate-300 block mb-3" />
                    No students found
                  </td>
                </tr>
              ) : (
                grades.map((student: any) => (
                  <tr
                    key={student.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => handleSelectStudent(student.id)}
                        className="w-4 h-4 accent-gold-500"
                      />
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="font-medium text-navy-900">
                          {student.name}
                        </div>
                      </div>
                    </td>
                    <td className="font-bold text-navy-900">
                      {student.student_id}
                    </td>
                    <td>
                      {student.component ? (
                        <span className="badge badge-info">
                          {student.component.toUpperCase()}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">N/A</span>
                      )}
                    </td>
                    <td>
                      <span className="font-medium">
                        {student.completed_hours}
                      </span>
                      <span className="text-xs text-slate-400">
                        {" "}
                        / {student.total_hours}
                      </span>
                    </td>
                    <td>
                      <GradeBadge
                        percentage={student.percentage}
                        showLabel={true}
                        showPercentage={true}
                        size="md"
                      />
                    </td>
                    <td>
                      <span
                        className={`badge ${getStatusColor(student.status)} text-white`}
                      >
                        {student.status?.replace("_", " ") || "Pending"}
                      </span>
                    </td>
                    <td className="text-sm text-slate-500">
                      {student.grade_updated_at
                        ? new Date(
                            student.grade_updated_at,
                          ).toLocaleDateString()
                        : "Never"}
                    </td>
                    <td>
                      <button
                        className="btn btn-info btn-sm"
                        onClick={() => handleEditGrade(student)}
                      >
                        <i className="fas fa-edit" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Grade Modal */}
      {showGradeModal && editingStudent && (
        <div className="modal-overlay" onClick={() => setShowGradeModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Grade - {editingStudent.name}</h3>
              <button
                className="modal-close"
                onClick={() => setShowGradeModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body space-y-4">
              <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg">
                <div>
                  <span className="text-xs text-slate-400">Student ID</span>
                  <p className="font-medium">{editingStudent.student_id}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Component</span>
                  <p className="font-medium">
                    {editingStudent.component?.toUpperCase() || "N/A"}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">
                    Completed Hours
                  </span>
                  <p className="font-medium">
                    {editingStudent.completed_hours} /{" "}
                    {editingStudent.total_hours}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Current Grade</span>
                  <p>
                    <GradeBadge
                      percentage={editingStudent.percentage}
                      showLabel={true}
                      showPercentage={true}
                      size="md"
                    />
                  </p>
                </div>
              </div>

              <div className="form-group">
                <label className="label">
                  Percentage <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  className="input"
                  min="0"
                  max="100"
                  value={editPercentage}
                  onChange={(e) => setEditPercentage(Number(e.target.value))}
                  placeholder="Enter percentage (0-100)"
                />
                <p className="text-xs text-slate-400 mt-1">Min 60% to pass</p>
              </div>

              <div className="form-group">
                <label className="label">Remarks</label>
                <textarea
                  className="input min-h-[80px]"
                  rows={3}
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                  placeholder="Enter remarks (optional)"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm text-amber-700">
                  <i className="fas fa-info-circle mr-2" />
                  Setting percentage below 60% will mark the student as
                  "Deficient". Setting above 90% will mark as "Completed".
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowGradeModal(false)}
                disabled={updateGradeMut.isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleUpdateGrade}
                disabled={updateGradeMut.isPending}
              >
                {updateGradeMut.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin" /> Saving...
                  </>
                ) : (
                  "Update Grade"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Update Modal */}
      {showBatchModal && (
        <div className="modal-overlay" onClick={() => setShowBatchModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Batch Update Grades</h3>
              <button
                className="modal-close"
                onClick={() => setShowBatchModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body space-y-4">
              <p className="text-sm text-slate-600">
                Update grades for{" "}
                <span className="font-bold text-navy-900">
                  {selectedStudents.length}
                </span>{" "}
                selected students.
              </p>

              <div className="form-group">
                <label className="label">
                  Percentage <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  className="input"
                  min="0"
                  max="100"
                  value={batchPercentage}
                  onChange={(e) => setBatchPercentage(Number(e.target.value))}
                  placeholder="Enter percentage (0-100)"
                />
                <p className="text-xs text-slate-400 mt-1">
                  This will apply to all selected students
                </p>
              </div>

              <div className="form-group">
                <label className="label">Remarks</label>
                <textarea
                  className="input min-h-[80px]"
                  rows={3}
                  value={batchRemarks}
                  onChange={(e) => setBatchRemarks(e.target.value)}
                  placeholder="Enter remarks (optional)"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm text-amber-700">
                  <i className="fas fa-exclamation-triangle mr-2" />
                  This action will overwrite grades for{" "}
                  <strong>{selectedStudents.length}</strong> students. This
                  cannot be undone.
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowBatchModal(false)}
                disabled={batchUpdateMut.isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleBatchUpdate}
                disabled={batchUpdateMut.isPending}
              >
                {batchUpdateMut.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin" /> Updating...
                  </>
                ) : (
                  `Update ${selectedStudents.length} Students`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GradesManagement;
