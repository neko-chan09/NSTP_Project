// src/pages/faculty/Dashboard.tsx
import React from "react";
import { Link } from "react-router-dom";
import { facultyApi } from "../../services/api";
import { useQuery } from "@tanstack/react-query";
import RefreshButton from "../components/common/RefreshButton";
import DashboardScheduleView from "../components/common/DashboardScheduleView";

const FacultyDashboard: React.FC = () => {
  const {
    data: stats,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["faculty", "dashboard"],
    queryFn: () => facultyApi.getDashboard(),
    staleTime: 60000,
  });

  // ← removed the unused `sessions` query; it was never rendered
  //   and its shape `{data:[]}` vs `[]` was unreliable.

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="spinner" />
        <span className="ml-3 text-slate-500">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        <i className="fas fa-exclamation-circle mr-2" />
        Failed to load dashboard: {(error as Error).message}
        <button className="btn btn-primary btn-sm ml-3" onClick={() => refetch()}>
          <i className="fas fa-redo" /> Retry
        </button>
      </div>
    );
  }

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();

  // ---- Safe numeric helpers ----
  const num = (v: any): number =>
    typeof v === "number" && !Number.isNaN(v) ? v : Number(v) || 0;

  const myStudents = num(stats?.my_students);
  const activeSessions = num(stats?.active_sessions);
  const todayCheckins = num(stats?.today_checkins);
  const pendingDocuments = num(stats?.pending_documents);
  const completedStudents = num(stats?.completed_students);
  const inProgressStudents = num(stats?.in_progress_students);
  const deficientStudents = num(stats?.deficient_students);
  const pendingStudents = num(stats?.pending_students);
  const eligibleStudents = num(stats?.eligible_students);

  const componentDist = stats?.component_distribution ?? {};
  const weeklyAttendance: Array<{ date: string; count: number }> =
    Array.isArray(stats?.weekly_attendance) ? stats.weekly_attendance : [];
  const todayAttendance: Array<{
    student: string;
    student_id: string;
    time: string;
    status: string;
  }> = Array.isArray(stats?.today_attendance) ? stats.today_attendance : [];
  const recentSessions: Array<{
    id: number;
    class_name?: string;
    component?: string;
    start_time: string;
    status: string;
    logs_count?: number;
  }> = Array.isArray(stats?.recent_sessions) ? stats.recent_sessions : [];

  const pct = (part: number, whole: number) =>
    whole > 0 ? Math.min(100, (part / whole) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-semibold text-navy-900">
            Welcome, {user?.name || "Faculty"}!
          </h3>
          <p className="text-sm text-slate-500">
            {user?.email || "faculty@nstp.com"} • Role: Faculty
            {stats?.component && (
              <span className="ml-2 inline-block bg-gold-100 text-gold-800 px-2 py-0.5 rounded text-xs font-semibold">
                {String(stats.component).toUpperCase()}
              </span>
            )}
            {user?.class_code && (
              <span className="ml-2 inline-block bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-semibold font-mono">
                Code: {user.class_code}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton
            onRefresh={refetch}
            isLoading={isFetching}
            label=""
            className="btn-sm"
          />
          <Link
            to="/faculty/activities/schedules"
            className="btn btn-info btn-sm"
          >
            <i className="fas fa-calendar-week mr-2" /> Schedule
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            to: "/faculty/attendance/create",
            label: "ADD ATTENDANCE",
            icon: "fa-camera",
            color: "bg-navy-600",
          },
          {
            to: "/faculty/activities",
            label: "ACTIVITIES",
            icon: "fa-tasks",
            color: "bg-slate-600",
          },
          {
            to: "/faculty/activities/map",
            label: "LOCATION MONITOR",
            icon: "fa-map-marked-alt",
            color: "bg-emerald-600",
          },
          {
            to: "/faculty/bulletin",
            label: "BULLETIN BOARD",
            icon: "fa-bullhorn",
            color: "bg-gold-600",
          },
        ].map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className={`${action.color} text-white p-4 rounded-xl flex flex-col items-center justify-center gap-2 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200`}
          >
            <i className={`fas ${action.icon} text-2xl`} />
            <span className="text-xs font-bold tracking-wide">
              {action.label}
            </span>
          </Link>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "My Students", value: myStudents, color: "border-blue-500" },
          { label: "Active Sessions", value: activeSessions, color: "border-emerald-500" },
          { label: "Today's Check-ins", value: todayCheckins, color: "border-gold-500" },
          { label: "Pending Documents", value: pendingDocuments, color: "border-red-500" },
        ].map((stat, index) => (
          <div
            key={index}
            className={`bg-white p-4 rounded-xl shadow-sm border-l-4 ${stat.color}`}
          >
            <span className="block text-xs text-slate-500">{stat.label}</span>
            <span className="text-2xl font-bold text-navy-900">{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Student Status Breakdown + Component Distribution */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h4 className="font-semibold text-navy-900 mb-4">Student Status</h4>
          <div className="space-y-3">
            {[
              { label: "Completed", value: completedStudents, color: "bg-emerald-500" },
              { label: "In Progress", value: inProgressStudents, color: "bg-blue-500" },
              { label: "Deficient", value: deficientStudents, color: "bg-red-500" },
              { label: "Pending", value: pendingStudents, color: "bg-amber-500" },
            ].map((item, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">{item.label}</span>
                  <span className="font-medium text-navy-900">{item.value}</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.color}`}
                    style={{ width: `${pct(item.value, myStudents)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-sm text-slate-500">
            Eligible:{" "}
            <span className="font-medium text-emerald-600">
              {eligibleStudents}
            </span>{" "}
            students
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h4 className="font-semibold text-navy-900 mb-4">
            Component Distribution
          </h4>
          <div className="space-y-3">
            {[
              { label: "CWTS", value: num(componentDist.cwts), color: "bg-blue-500" },
              { label: "ROTC", value: num(componentDist.rotc), color: "bg-red-500" },
              { label: "LTS", value: num(componentDist.lts), color: "bg-emerald-500" },
              { label: "Unassigned", value: num(componentDist.unassigned), color: "bg-slate-400" },
            ].map((item, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">{item.label}</span>
                  <span className="font-medium text-navy-900">{item.value}</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.color}`}
                    style={{ width: `${pct(item.value, myStudents)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly Attendance Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h4 className="font-semibold text-navy-900 mb-4">Weekly Attendance</h4>
        {weeklyAttendance.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <i className="fas fa-chart-bar text-3xl text-slate-300 block mb-2" />
            <p className="text-sm">No attendance data for this week</p>
          </div>
        ) : (
          <div className="flex items-end justify-between h-40 gap-2">
            {(() => {
              const maxCount = Math.max(
                1,
                ...weeklyAttendance.map((d) => num(d.count)),
              );
              return weeklyAttendance.map((day, index) => {
                const c = num(day.count);
                const height = (c / maxCount) * 100;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex justify-center">
                      <div
                        className="w-full max-w-[40px] bg-gold-500 rounded-t transition-all duration-500 hover:bg-gold-600"
                        style={{ height: `${Math.max(height * 1.5, 4)}px` }}
                      >
                        <span className="text-[10px] text-white flex items-center justify-center h-full">
                          {c > 0 ? c : ""}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 mt-2">{day.date}</span>
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>

      {/* Today's Attendance & Recent Sessions */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold text-navy-900">Today's Attendance</h4>
            <span className="text-sm text-slate-500">
              {todayCheckins} check-ins
            </span>
          </div>
          <div className="overflow-x-auto max-h-60 overflow-y-auto">
            {todayAttendance.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 px-2 text-xs font-semibold text-slate-500 uppercase">
                      Student
                    </th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-slate-500 uppercase">
                      ID
                    </th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-slate-500 uppercase">
                      Time
                    </th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-slate-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {todayAttendance.map((item, index) => (
                    <tr
                      key={index}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                    >
                      <td className="py-2 px-2 text-navy-700 truncate max-w-[80px]">
                        {item.student}
                      </td>
                      <td className="py-2 px-2 text-navy-700 text-xs">
                        {item.student_id}
                      </td>
                      <td className="py-2 px-2 text-slate-500 text-xs">
                        {item.time}
                      </td>
                      <td className="py-2 px-2">
                        <span className={`status ${item.status}`}>
                          {item.status
                            ? item.status.charAt(0).toUpperCase() +
                              item.status.slice(1)
                            : "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <i className="fas fa-user-check text-3xl text-slate-300 block mb-2" />
                <p>No check-ins today</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h4 className="font-semibold text-navy-900 mb-4">Recent Sessions</h4>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {recentSessions.length > 0 ? (
              recentSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div>
                    <span className="font-medium text-navy-900">
                      {session.class_name || `Session #${session.id}`}
                    </span>
                    <span className="text-xs text-slate-500 ml-2">
                      {session.component?.toUpperCase() || "All"}
                    </span>
                    <div className="text-xs text-slate-400">
                      {session.start_time
                        ? `${new Date(session.start_time).toLocaleDateString()} at ${new Date(
                            session.start_time,
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}`
                        : "—"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">
                      {session.logs_count || 0} students
                    </span>
                    <span
                      className={`badge ${
                        session.status === "active"
                          ? "badge-success"
                          : "badge-secondary"
                      }`}
                    >
                      {(session.status || "unknown").toUpperCase()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                <i className="fas fa-calendar-times text-3xl text-slate-300 block mb-2" />
                <p>No sessions yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Schedule Overview */}
      <DashboardScheduleView scope="faculty" showActivities showSessions />
    </div>
  );
};

export default FacultyDashboard;