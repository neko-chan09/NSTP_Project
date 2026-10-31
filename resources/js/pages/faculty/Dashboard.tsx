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

  const { data: sessions = [] } = useQuery({
    queryKey: ["faculty", "sessions"],
    queryFn: () => facultyApi.getAttendanceSessions(),
    staleTime: 30000,
  });

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
      </div>
    );
  }

  const user = JSON.parse(localStorage.getItem("user") || "{}");

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
                {stats.component.toUpperCase()}
              </span>
            )}
            {/* ✅ Class Code badge */}
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
          {
            label: "My Students",
            value: stats?.my_students || 0,
            color: "border-blue-500",
          },
          {
            label: "Active Sessions",
            value: stats?.active_sessions || 0,
            color: "border-emerald-500",
          },
          {
            label: "Today's Check-ins",
            value: stats?.today_checkins || 0,
            color: "border-gold-500",
          },
          {
            label: "Pending Documents",
            value: stats?.pending_documents || 0,
            color: "border-red-500",
          },
        ].map((stat, index) => (
          <div
            key={index}
            className={`bg-white p-4 rounded-xl shadow-sm border-l-4 ${stat.color}`}
          >
            <span className="block text-xs text-slate-500">{stat.label}</span>
            <span className="text-2xl font-bold text-navy-900">
              {stat.value}
            </span>
          </div>
        ))}
      </div>

      {/* Student Status Breakdown */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h4 className="font-semibold text-navy-900 mb-4">Student Status</h4>
          <div className="space-y-3">
            {[
              {
                label: "Completed",
                value: stats?.completed_students || 0,
                color: "bg-emerald-500",
              },
              {
                label: "In Progress",
                value: stats?.in_progress_students || 0,
                color: "bg-blue-500",
              },
              {
                label: "Deficient",
                value: stats?.deficient_students || 0,
                color: "bg-red-500",
              },
              {
                label: "Pending",
                value: stats?.pending_students || 0,
                color: "bg-amber-500",
              },
            ].map((item, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">{item.label}</span>
                  <span className="font-medium text-navy-900">
                    {item.value}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.color}`}
                    style={{
                      width: `${stats?.my_students > 0
                        ? (item.value / stats.my_students) * 100
                        : 0
                        }%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-sm text-slate-500">
            Eligible:{" "}
            <span className="font-medium text-emerald-600">
              {stats?.eligible_students || 0}
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
              {
                label: "CWTS",
                value: stats?.component_distribution?.cwts || 0,
                color: "bg-blue-500",
              },
              {
                label: "ROTC",
                value: stats?.component_distribution?.rotc || 0,
                color: "bg-red-500",
              },
              {
                label: "LTS",
                value: stats?.component_distribution?.lts || 0,
                color: "bg-emerald-500",
              },
              {
                label: "Unassigned",
                value: stats?.component_distribution?.unassigned || 0,
                color: "bg-slate-400",
              },
            ].map((item, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">{item.label}</span>
                  <span className="font-medium text-navy-900">
                    {item.value}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.color}`}
                    style={{
                      width: `${stats?.my_students > 0
                        ? (item.value / stats.my_students) * 100
                        : 0
                        }%`,
                    }}
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
        <div className="flex items-end justify-between h-40 gap-2">
          {stats?.weekly_attendance?.map((day: any, index: number) => {
            const maxCount = Math.max(
              ...(stats?.weekly_attendance?.map((d: any) => d.count) || [1]),
            );
            const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full flex justify-center">
                  <div
                    className="w-full max-w-[40px] bg-gold-500 rounded-t transition-all duration-500 hover:bg-gold-600"
                    style={{ height: `${Math.max(height * 1.5, 4)}px` }}
                  >
                    <span className="text-[10px] text-white flex items-center justify-center h-full">
                      {day.count > 0 ? day.count : ""}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-slate-500 mt-2">{day.date}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Today's Attendance & Recent Sessions */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold text-navy-900">Today's Attendance</h4>
            <span className="text-sm text-slate-500">
              {stats?.today_checkins || 0} check-ins
            </span>
          </div>
          <div className="overflow-x-auto max-h-60 overflow-y-auto">
            {stats?.today_attendance?.length > 0 ? (
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
                  {stats.today_attendance.map((item: any, index: number) => (
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
                          {item.status.charAt(0).toUpperCase() +
                            item.status.slice(1)}
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
            {stats?.recent_sessions?.length > 0 ? (
              stats.recent_sessions.map((session: any) => (
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
                      {new Date(session.start_time).toLocaleDateString()} at{" "}
                      {new Date(session.start_time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">
                      {session.logs_count || 0} students
                    </span>
                    <span
                      className={`badge ${session.status === "active"
                        ? "badge-success"
                        : "badge-secondary"
                        }`}
                    >
                      {session.status.toUpperCase()}
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
      <DashboardScheduleView
        scope="faculty"
        showActivities
        showSessions
      />
    </div>
  );
};

export default FacultyDashboard;