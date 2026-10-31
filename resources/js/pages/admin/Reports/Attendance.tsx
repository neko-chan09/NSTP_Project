// src/pages/admin/Reports/Attendance.tsx
import React, { useState } from "react";
import { useAttendanceReport } from "../../hooks/useReports";
import RefreshButton from "../../components/common/RefreshButton";

const AttendanceReport: React.FC = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [component, setComponent] = useState("");
  const [hasRun, setHasRun] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);

  const { data, isLoading, error, refresh, isRefreshing } = useAttendanceReport(
    {
      start_date: startDate,
      end_date: endDate,
      component: component || undefined,
    },
  );

  // Validate dates
  const validateDates = (start: string, end: string): boolean => {
    if (!start || !end) {
      setDateError("Please select both start and end dates");
      return false;
    }

    const startObj = new Date(start);
    const endObj = new Date(end);

    if (startObj > endObj) {
      setDateError("Start date cannot be later than end date");
      return false;
    }

    // Optional: Check if date range is too large (e.g., more than 1 year)
    const diffTime = Math.abs(endObj.getTime() - startObj.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 365) {
      setDateError("Date range cannot exceed 1 year");
      return false;
    }

    setDateError(null);
    return true;
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = e.target.value;
    setStartDate(newStart);
    if (endDate) {
      validateDates(newStart, endDate);
    } else {
      setDateError(null);
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEnd = e.target.value;
    setEndDate(newEnd);
    if (startDate) {
      validateDates(startDate, newEnd);
    } else {
      setDateError(null);
    }
  };

  const handleGenerate = () => {
    if (!startDate || !endDate) {
      setDateError("Please select both start and end dates");
      return;
    }

    if (!validateDates(startDate, endDate)) {
      return;
    }

    setHasRun(true);
    refresh();
  };

  const handleRefresh = () => {
    if (hasRun) {
      refresh();
    }
  };

  // Handle error messages
  const getErrorMessage = (error: any) => {
    if (typeof error === "string") return error;
    if (error?.message) return error.message;
    if (error?.errors) {
      const messages = Object.values(error.errors).flat();
      return messages.join(", ");
    }
    return "Failed to load report";
  };

  // Parse data
  const reportData = data?.data || data;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-2xl font-bold text-navy-900">Attendance Report</h2>
        <RefreshButton
          onRefresh={handleRefresh}
          isLoading={isRefreshing}
          label=""
          className="btn-sm"
          disabled={!hasRun}
        />
      </div>

      {/* Controls */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="form-group">
            <label className="label">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className={`input ${dateError && dateError.includes("Start") ? "border-red-500 focus:ring-red-500" : ""}`}
              value={startDate}
              onChange={handleStartDateChange}
              max={endDate || undefined}
            />
          </div>
          <div className="form-group">
            <label className="label">
              End Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className={`input ${dateError && dateError.includes("End") ? "border-red-500 focus:ring-red-500" : ""}`}
              value={endDate}
              onChange={handleEndDateChange}
              min={startDate || undefined}
            />
          </div>
          <div className="form-group">
            <label className="label">Component</label>
            <select
              className="input"
              value={component}
              onChange={(e) => setComponent(e.target.value)}
            >
              <option value="">All Components</option>
              <option value="cwts">CWTS</option>
              <option value="rotc">ROTC</option>
              <option value="lts">LTS</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              className="btn btn-primary w-full"
              onClick={handleGenerate}
              disabled={isLoading || !!dateError}
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin" /> Generating...
                </>
              ) : (
                "Generate Report"
              )}
            </button>
          </div>
        </div>

        {/* Date Error Message */}
        {dateError && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-2">
            <i className="fas fa-exclamation-circle mt-0.5" />
            <span>{dateError}</span>
          </div>
        )}
      </div>

      {error && (
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-circle mr-2" />
          Failed to load report: {getErrorMessage(error)}
          <button
            className="btn btn-primary btn-sm ml-3"
            onClick={handleRefresh}
          >
            <i className="fas fa-redo" /> Retry
          </button>
        </div>
      )}

      {reportData && hasRun && !error && (
        <div className="space-y-5">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: "Total Sessions",
                value: reportData.total_sessions || 0,
                color: "border-navy-600",
              },
              {
                label: "Total Check-ins",
                value: reportData.total_checkins || 0,
                color: "border-blue-500",
              },
              {
                label: "Present",
                value: reportData.present || 0,
                color: "border-emerald-500",
              },
              {
                label: "Late",
                value: reportData.late || 0,
                color: "border-amber-500",
              },
            ].map((stat, index) => (
              <div
                key={index}
                className={`bg-white p-4 rounded-xl shadow-sm border-l-4 ${stat.color}`}
              >
                <span className="block text-xs text-slate-500">
                  {stat.label}
                </span>
                <span className="text-2xl font-bold text-navy-900">
                  {stat.value}
                </span>
              </div>
            ))}
          </div>

          {/* Daily Breakdown */}
          {reportData.details && reportData.details.length > 0 && (
            <div className="card">
              <h4 className="text-lg font-semibold text-navy-900 mb-4">
                Daily Breakdown
              </h4>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Total</th>
                      <th>Present</th>
                      <th>Late</th>
                      <th>Absent</th>
                      <th>Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.details.map((day: any, index: number) => (
                      <tr key={index}>
                        <td>{new Date(day.date).toLocaleDateString()}</td>
                        <td>{day.total || 0}</td>
                        <td>{day.present || 0}</td>
                        <td>{day.late || 0}</td>
                        <td>{day.absent || 0}</td>
                        <td>
                          <span
                            className={`badge ${(day.rate || 0) >= 80 ? "badge-success" : (day.rate || 0) >= 50 ? "badge-warning" : "badge-danger"}`}
                          >
                            {day.rate || 0}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {reportData.details && reportData.details.length === 0 && (
            <div className="empty-state">
              <i className="fas fa-chart-line" />
              <p>No attendance data found for the selected date range</p>
            </div>
          )}
        </div>
      )}

      {!hasRun && !error && !dateError && (
        <div className="empty-state">
          <i className="fas fa-chart-line" />
          <p>Select a date range and click "Generate Report"</p>
        </div>
      )}
    </div>
  );
};

export default AttendanceReport;
