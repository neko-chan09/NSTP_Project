// src/pages/admin/Reports/Accomplishment.tsx

import React, { useState, useRef } from "react";
import {
  useAccomplishmentReport,
  downloadAccomplishmentPDF,
  exportAccomplishmentCSV,
} from "../../hooks/useReports";
import RefreshButton from "../../components/common/RefreshButton";
import { API_URL } from "../../../services/api";
import toast from "react-hot-toast";

interface StudentAccomplishment {
  id: number;
  student_id: string;
  no: number;
  serial_no: string;
  surname: string;
  first_name: string;
  middle_name: string;
  course_program: string;
  gender: string;
  birthdate: string;
  address: string;
  telephone_mobile: string;
  email_address: string;
  component: string;
  component_code: string;
  completed_hours: number;
  total_hours: number;
  status: string;
  is_eligible: boolean;
  completed_at: string;
  created_at: string;
}

const AccomplishmentReport: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterComponent, setFilterComponent] = useState("");
  const [filterStatus, setFilterStatus] = useState("completed");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [hasRun, setHasRun] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    data: reportData,
    isLoading,
    error,
    refresh,
    isRefreshing,
  } = useAccomplishmentReport({
    search: searchTerm || undefined,
    component: filterComponent || undefined,
    status: filterStatus,
    start_date: startDate || undefined,
    end_date: endDate || undefined,
  });

  const students: StudentAccomplishment[] = reportData?.students || [];
  const summary = reportData?.summary || {};

  const handleGenerate = () => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start > end) {
        setDateError("Start date cannot be later than end date");
        return;
      }
    }
    setDateError(null);
    setHasRun(true);
    refresh();
  };

  const handleDownloadPDF = async () => {
    try {
      toast.loading("Generating PDF...");
      await downloadAccomplishmentPDF({
        component: filterComponent || undefined,
        status: filterStatus,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
      toast.dismiss();
      toast.success("PDF downloaded successfully");
    } catch (err: any) {
      toast.dismiss();
      toast.error(err.message || "Failed to download PDF");
    }
  };

  const handleExportCSV = async () => {
    try {
      toast.loading("Exporting CSV...");
      await exportAccomplishmentCSV({
        component: filterComponent || undefined,
        status: filterStatus,
      });
      toast.dismiss();
      toast.success("CSV exported successfully");
    } catch (err: any) {
      toast.dismiss();
      toast.error(err.message || "Failed to export CSV");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/admin/reports/accomplishment/template`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to download template");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "accomplishment_template.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Template downloaded");
    } catch (err: any) {
      toast.error(err.message || "Failed to download template");
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error("Please select a file");
      return;
    }

    setImporting(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/admin/reports/accomplishment/import`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        let errorMessage = result.message || "Import failed";
        
        if (result.errors) {
          const errorDetails = Object.values(result.errors).flat().join(", ");
          errorMessage = `${errorMessage}: ${errorDetails}`;
        }
        
        if (result.data?.errors && result.data.errors.length > 0) {
          const firstErrors = result.data.errors.slice(0, 5);
          errorMessage = `${errorMessage}\n\nErrors:\n${firstErrors.join("\n")}`;
          if (result.data.errors.length > 5) {
            errorMessage += `\n... and ${result.data.errors.length - 5} more errors`;
          }
        }
        
        toast.error(errorMessage);
        return;
      }

      // Success
      let successMessage = `Import successful!`;
      if (result.data?.updated > 0) {
        successMessage += ` Updated ${result.data.updated} students with Serial Numbers.`;
      }
      if (result.data?.errors && result.data.errors.length > 0) {
        successMessage += ` (${result.data.errors.length} warnings)`;
      }
      toast.success(successMessage);

      if (result.data?.errors && result.data.errors.length > 0) {
        console.warn("Import warnings:", result.data.errors);
        const firstErrors = result.data.errors.slice(0, 3);
        toast(`⚠️ Warnings: ${firstErrors.join(", ")}${result.data.errors.length > 3 ? `... and ${result.data.errors.length - 3} more` : ""}`,{ icon: "⚠️" });
      }

      setShowImportModal(false);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to import CSV. Please check the file format.");
    } finally {
      setImporting(false);
    }
  };

  const getSafeGender = (gender: string): string => {
    if (!gender) return "N/A";
    return gender;
  };

  const getGenderBadge = (gender: string): string => {
    const safeGender = getSafeGender(gender);
    const lowerGender = safeGender.toLowerCase();
    if (lowerGender === "male") {
      return "bg-blue-100 text-blue-800";
    } else if (lowerGender === "female") {
      return "bg-pink-100 text-pink-800";
    }
    return "bg-slate-100 text-slate-800";
  };

  const getGenderDisplay = (gender: string): string => {
    if (!gender) return "N/A";
    return gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      completed: "bg-emerald-100 text-emerald-800",
      in_progress: "bg-blue-100 text-blue-800",
      deficient: "bg-red-100 text-red-800",
      pending: "bg-amber-100 text-amber-800",
    };
    return colors[status] || "bg-slate-100 text-slate-800";
  };

  const getComponentColor = (component: string) => {
    const colors: Record<string, string> = {
      CWTS: "bg-blue-100 text-blue-800",
      ROTC: "bg-red-100 text-red-800",
      LTS: "bg-emerald-100 text-emerald-800",
    };
    return colors[component] || "bg-slate-100 text-slate-800";
  };

  const getSafeValue = (value: any, fallback: string = "N/A"): string => {
    if (value === null || value === undefined || value === "") {
      return fallback;
    }
    return String(value);
  };

  if (isLoading && !hasRun) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="spinner" />
        <span className="ml-3 text-slate-500">
          Loading accomplishment report...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        Failed to load report: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold text-navy-900">
            <i className="fas fa-trophy text-gold-500 mr-2" />
            Accomplishment Report
          </h2>
          <p className="text-sm text-slate-500">
            List of graduates with their personal information
            {hasRun && (
              <span className="ml-2 font-semibold text-gold-600">
                ({students.length} graduates)
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {hasRun && students.length > 0 && (
            <>
              <button
                className="btn btn-info btn-sm"
                onClick={handleDownloadPDF}
                disabled={isRefreshing}
              >
                <i className="fas fa-file-pdf" /> PDF
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleExportCSV}
                disabled={isRefreshing}
              >
                <i className="fas fa-file-csv" /> Export
              </button>
            </>
          )}
          <button
            className="btn btn-success btn-sm"
            onClick={() => setShowImportModal(true)}
          >
            <i className="fas fa-upload" /> Import
          </button>
          <RefreshButton
            onRefresh={handleGenerate}
            isLoading={isRefreshing}
            label="Refresh"
            className="btn-sm"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="form-group">
            <label className="label">Component</label>
            <select
              className="input"
              value={filterComponent}
              onChange={(e) => setFilterComponent(e.target.value)}
            >
              <option value="">All Components</option>
              <option value="cwts">CWTS</option>
              <option value="rotc">ROTC</option>
              <option value="lts">LTS</option>
            </select>
          </div>

          <div className="form-group">
            <label className="label">Status</label>
            <select
              className="input"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="completed">Completed</option>
              <option value="all">All Statuses</option>
              <option value="in_progress">In Progress</option>
              <option value="deficient">Deficient</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div className="form-group">
            <label className="label">Start Date</label>
            <input
              type="date"
              className={`input ${dateError ? "border-red-500 focus:ring-red-500" : ""}`}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="label">End Date</label>
            <input
              type="date"
              className={`input ${dateError ? "border-red-500 focus:ring-red-500" : ""}`}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="flex items-end">
            <button
              className="btn btn-primary w-full"
              onClick={handleGenerate}
              disabled={isLoading || !!dateError}
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin" /> Loading...
                </>
              ) : (
                "Generate Report"
              )}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="search-box">
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
        </div>

        {dateError && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-2">
            <i className="fas fa-exclamation-circle mt-0.5" />
            <span>{dateError}</span>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      {hasRun && students.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Total Graduates",
              value: summary.total || 0,
              color: "border-navy-600",
            },
            {
              label: "Male",
              value: summary.gender_breakdown?.male || 0,
              color: "border-blue-500",
            },
            {
              label: "Female",
              value: summary.gender_breakdown?.female || 0,
              color: "border-pink-500",
            },
            {
              label: "Components",
              value: `${summary.component_breakdown?.cwts || 0} CWTS, ${summary.component_breakdown?.rotc || 0} ROTC, ${summary.component_breakdown?.lts || 0} LTS`,
              color: "border-gold-500",
            },
          ].map((stat, index) => (
            <div
              key={index}
              className={`bg-white p-4 rounded-xl shadow-sm border-l-4 ${stat.color}`}
            >
              <span className="block text-xs text-slate-500">{stat.label}</span>
              <span className="text-xl font-bold text-navy-900">
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Students Table */}
      {hasRun && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {students.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <i className="fas fa-users-slash text-4xl text-slate-300 block mb-3" />
              <p>No graduates found matching the filters</p>
              <p className="text-sm mt-1">Try adjusting your search criteria</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>NO.</th>
                    <th>Serial No.</th>
                    <th>Surname</th>
                    <th>First Name</th>
                    <th>Middle Name</th>
                    <th>Course/Program</th>
                    <th>Gender</th>
                    <th>Birthdate</th>
                    <th>Address</th>
                    <th>Telephone/Mobile</th>
                    <th>Email Address</th>
                    <th>Component</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr
                      key={student.id || student.no}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="text-center font-medium text-navy-900">
                        {student.no}
                      </td>
                      <td className="font-bold text-navy-900">
                        {getSafeValue(student.serial_no)}
                      </td>
                      <td>{getSafeValue(student.surname)}</td>
                      <td>{getSafeValue(student.first_name)}</td>
                      <td>{getSafeValue(student.middle_name, "-")}</td>
                      <td>
                        <span className="badge badge-info">
                          {getSafeValue(student.course_program, "BEEd")}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getGenderBadge(student.gender)}`}>
                          {getGenderDisplay(student.gender)}
                        </span>
                      </td>
                      <td className="text-sm text-slate-600">
                        {getSafeValue(student.birthdate)}
                      </td>
                      <td className="text-sm text-slate-600 max-w-[150px] truncate">
                        {getSafeValue(student.address)}
                      </td>
                      <td className="text-sm text-slate-600">
                        {getSafeValue(student.telephone_mobile)}
                      </td>
                      <td className="text-sm text-slate-600">
                        {getSafeValue(student.email_address)}
                      </td>
                      <td>
                        <span className={`badge ${getComponentColor(getSafeValue(student.component))}`}>
                          {getSafeValue(student.component)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
          <div className="modal max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>
                  <i className="fas fa-upload text-gold-500 mr-2" />
                  Import Serial Numbers
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Upload a CSV file to update Serial Numbers for students
                </p>
              </div>
              <button
                className="modal-close"
                onClick={() => setShowImportModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body space-y-4">
              {/* Template Download */}
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700 font-medium">
                  <i className="fas fa-info-circle mr-2" />
                  Need a template?
                </p>
                <button
                  className="btn btn-info btn-sm mt-2"
                  onClick={handleDownloadTemplate}
                >
                  <i className="fas fa-download" /> Download Template
                </button>
                <p className="text-xs text-blue-600 mt-2">
                  The template includes all columns with sample data
                </p>
              </div>

              {/* File Upload */}
              <div className="form-group">
                <label className="label">
                  CSV File <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv"
                  className="input p-2"
                  onChange={handleFileSelect}
                />
                {selectedFile && (
                  <p className="text-sm text-emerald-600 mt-1">
                    <i className="fas fa-check-circle mr-1" />
                    {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
                <p className="text-xs text-slate-400 mt-1">
                  Accepted format: CSV with headers: Student ID, Serial No.
                </p>
              </div>

              {/* Info Box */}
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-700">
                  <i className="fas fa-info-circle mr-2" />
                  <strong>What will be updated:</strong>
                </p>
                <ul className="text-sm text-green-600 mt-1 list-disc list-inside">
                  <li>Serial Number for each student</li>
                  <li>Other columns are for reference only and will not be updated</li>
                </ul>
              </div>

              {/* Warning */}
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm text-amber-700">
                  <i className="fas fa-exclamation-triangle mr-2" />
                  <strong>Note:</strong> Only Serial Numbers will be updated. 
                  Please ensure Student IDs are correct.
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowImportModal(false)}
                disabled={importing}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-success"
                onClick={handleImport}
                disabled={!selectedFile || importing}
              >
                {importing ? (
                  <>
                    <i className="fas fa-spinner fa-spin" /> Importing...
                  </>
                ) : (
                  <>
                    <i className="fas fa-upload" /> Import Serial Numbers
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Stats */}
      {hasRun && students.length > 0 && (
        <div className="flex justify-between items-center text-sm text-slate-500 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex flex-wrap gap-6">
            <span>
              Total Graduates:{" "}
              <span className="font-semibold text-navy-900">
                {students.length}
              </span>
            </span>
            <span>
              Male:{" "}
              <span className="font-semibold text-blue-600">
                {students.filter((s) => getSafeGender(s.gender).toLowerCase() === "male").length}
              </span>
            </span>
            <span>
              Female:{" "}
              <span className="font-semibold text-pink-600">
                {students.filter((s) => getSafeGender(s.gender).toLowerCase() === "female").length}
              </span>
            </span>
            <span>
              Components:{" "}
              <span className="font-semibold text-navy-900">
                {students.filter((s) => s.component === "CWTS").length} CWTS,{" "}
                {students.filter((s) => s.component === "ROTC").length} ROTC,{" "}
                {students.filter((s) => s.component === "LTS").length} LTS
              </span>
            </span>
          </div>
          <div className="text-xs text-slate-400">
            Generated: {new Date().toLocaleString()}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!hasRun && (
        <div className="empty-state">
          <i className="fas fa-trophy text-5xl text-slate-300 block mb-4" />
          <p className="text-slate-600 font-medium">Accomplishment Report</p>
          <p className="text-sm text-slate-400">
            Select filters and click "Generate Report" to view the list of
            graduates with their personal information
          </p>
        </div>
      )}
    </div>
  );
};

export default AccomplishmentReport;