// src/pages/admin/Dashboard.tsx
import React from "react";
import { Link } from "react-router-dom";
import { useDashboard } from "../hooks/useDashboard";
import { useBulletin } from "../hooks/useBulletin";
import { useEnrollmentReport } from "../hooks/useReports";
import { useGradeStats } from "../hooks/useGrades";
import RefreshButton from "../components/common/RefreshButton";
import DashboardScheduleView from "../components/common/DashboardScheduleView";

const Dashboard: React.FC = () => {
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refresh: refreshStats,
    isRefreshing: statsRefreshing,
  } = useDashboard();

  const {
    data: bulletins = [],
    isLoading: bulletinsLoading,
    refresh: refreshBulletins,
    isRefreshing: bulletinsRefreshing,
  } = useBulletin();

  const {
    data: enrollmentData,
    isLoading: enrollLoading,
    refresh: refreshEnrollment,
    isRefreshing: enrollRefreshing,
  } = useEnrollmentReport();

  const {
    data: gradeStats,
    isLoading: gradeLoading,
    refresh: refreshGradeStats,
    isRefreshing: gradeRefreshing,
  } = useGradeStats();

  const loading =
    statsLoading || bulletinsLoading || enrollLoading || gradeLoading;
  const isRefreshing =
    statsRefreshing ||
    bulletinsRefreshing ||
    enrollRefreshing ||
    gradeRefreshing;

  const handleRefresh = () => {
    refreshStats();
    refreshBulletins();
    refreshEnrollment();
    refreshGradeStats();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="spinner" />
        <span className="ml-3 text-slate-500">Loading dashboard...</span>
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-center">
        <i className="fas fa-exclamation-circle mr-2" />
        Error: {(statsError as Error).message}
      </div>
    );
  }

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const e = enrollmentData;

  const completionPercentage = stats?.completion_rate || 0;
 const documentApprovalRate =
  (stats?.total_documents ?? 0) > 0
    ? Math.round(
        ((stats?.approved_documents ?? 0) / (stats?.total_documents ?? 1)) * 100,
      )
    : 0;

  const getBarHeight = (count: number) => {
    const maxCount = Math.max(
      e?.cwts_male || 0,
      e?.cwts_female || 0,
      e?.rotc_male || 0,
      e?.rotc_female || 0,
      e?.lts_male || 0,
      e?.lts_female || 0,
      1,
    );
    return `${Math.max((count / maxCount) * 160, 15)}px`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-semibold text-navy-900">
            Welcome, {user?.name || "Admin User"}!
          </h3>
          <p className="text-sm text-slate-500">
            {user?.email || "admin@nstp.com"} • Role: {user?.role || "admin"}
          </p>
        </div>
        <RefreshButton
          onRefresh={handleRefresh}
          isLoading={isRefreshing}
          label="Refresh All"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            to: "/admin/attendance/take",
            label: "ATTENDANCE LOGS",
            icon: "fa-camera",
            color: "bg-navy-600",
          },
          {
            to: "/admin/students",
            label: "VIEW STUDENTS",
            icon: "fa-users",
            color: "bg-slate-600",
          },
          {
            to: "/admin/certificates/generate",
            label: "CERTIFICATES",
            icon: "fa-award",
            color: "bg-gold-600",
          },
          {
            to: "/admin/reports/enrollment",
            label: "REPORTS",
            icon: "fa-chart-bar",
            color: "bg-navy-600",
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
            label: "Total Students",
            value: stats?.total_students || 0,
            color: "border-navy-600",
          },
          {
            label: "Eligible",
            value: stats?.eligible || 0,
            color: "border-gold-500",
          },
          {
            label: "Not Eligible",
            value: stats?.not_eligible || 0,
            color: "border-red-500",
          },
          {
            label: "Completion Rate",
            value: `${stats?.completion_rate || 0}%`,
            color: "border-emerald-500",
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

      {/* Component & Document Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Component Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h4 className="font-semibold text-navy-900 mb-4">
            Component Breakdown
          </h4>
          <div className="space-y-3">
            {[
              { label: "CWTS", value: stats?.cwts || 0, color: "bg-blue-500" },
              { label: "ROTC", value: stats?.rotc || 0, color: "bg-red-500" },
              { label: "LTS", value: stats?.lts || 0, color: "bg-emerald-500" },
              {
                label: "Unassigned",
                value: stats?.unassigned || 0,
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
                      width: `${(stats?.total_students ?? 0) > 0
  ? (item.value / (stats?.total_students ?? 1)) * 100
  : 0
}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Document Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h4 className="font-semibold text-navy-900 mb-4">Document Status</h4>
          <div className="space-y-3">
            {[
              {
                label: "Approved",
                value: stats?.approved_documents || 0,
                color: "bg-emerald-500",
              },
              {
                label: "Pending",
                value: stats?.pending_documents || 0,
                color: "bg-amber-500",
              },
              {
                label: "Rejected",
                value: stats?.rejected_documents || 0,
                color: "bg-red-500",
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
                      width: `${(stats?.total_documents ?? 0) > 0
  ? (item.value / (stats?.total_documents ?? 1)) * 100
  : 0
}%`,
                    }}
                  />
                </div>
              </div>
            ))}
            <div className="mt-2 text-xs text-slate-500">
              Approval Rate: {documentApprovalRate}% (
              {stats?.approved_documents || 0}/{stats?.total_documents || 0})
            </div>
          </div>
        </div>
      </div>

      {/* Grade Stats Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-semibold text-navy-900">
            <i className="fas fa-graduation-cap text-gold-500 mr-2" />
            Grade Distribution
          </h4>
          <div className="flex items-center gap-2">
            <RefreshButton
              onRefresh={refreshGradeStats}
              isLoading={gradeRefreshing}
              label=""
              className="btn-sm"
            />
            <Link
              to="/admin/grades"
              className="text-sm text-slate-500 hover:text-navy-600 transition-colors"
            >
              Manage Grades <i className="fas fa-arrow-right ml-1" />
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            {
              label: "Excellent (90%+)",
              value: gradeStats?.excellent || 0,
              color: "text-emerald-600",
              bg: "bg-emerald-50",
            },
            {
              label: "Good (75-89%)",
              value: gradeStats?.good || 0,
              color: "text-blue-600",
              bg: "bg-blue-50",
            },
            {
              label: "Satisfactory (60-74%)",
              value: gradeStats?.satisfactory || 0,
              color: "text-amber-600",
              bg: "bg-amber-50",
            },
            {
              label: "Deficient (<60%)",
              value: gradeStats?.deficient || 0,
              color: "text-red-600",
              bg: "bg-red-50",
            },
            {
              label: "Ungraded",
              value: gradeStats?.ungraded || 0,
              color: "text-slate-400",
              bg: "bg-slate-50",
            },
          ].map((item, index) => (
            <div
              key={index}
              className={`text-center p-3 ${item.bg} rounded-lg`}
            >
              <span className={`block text-xl font-bold ${item.color}`}>
                {item.value}
              </span>
              <span className="text-xs text-slate-500">{item.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap justify-between text-sm text-slate-500 gap-2">
          <span>
            Passing Rate:{" "}
            <span className="font-semibold text-navy-900">
              {gradeStats?.passing_rate || 0}%
            </span>
          </span>
          <span>
            Average Grade:{" "}
            <span className="font-semibold text-navy-900">
              {gradeStats?.average_grade || 0}%
            </span>
          </span>
          <span>
            Total Students:{" "}
            <span className="font-semibold text-navy-900">
              {gradeStats?.total || 0}
            </span>
          </span>
        </div>
      </div>

      {/* Bulletins */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-semibold text-navy-900">
            <i className="fas fa-bullhorn text-gold-500 mr-2" />
            Latest Bulletins
          </h4>
          <div className="flex items-center gap-2">
            <RefreshButton
              onRefresh={refreshBulletins}
              isLoading={bulletinsRefreshing}
              label=""
              className="btn-sm"
            />
            <Link
              to="/admin/bulletin"
              className="text-sm text-slate-500 hover:text-navy-600 transition-colors"
            >
              View all <i className="fas fa-arrow-right ml-1" />
            </Link>
          </div>
        </div>

        {bulletins.length === 0 ? (
          <p className="text-center py-5 text-slate-500 text-sm">
            No bulletins published yet
          </p>
        ) : (
          <div className="space-y-2.5">
            {bulletins.slice(0, 3).map((b: any) => (
              <div
                key={b.id}
                className={`p-3 rounded-lg border-l-4 ${b.is_featured
                    ? "bg-amber-50 border-amber-400"
                    : "bg-slate-50 border-slate-300"
                  }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <strong className="text-sm text-navy-900">
                    {b.title}
                    {b.is_featured && (
                      <span className="ml-2 bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded text-[10px] font-bold">
                        FEATURED
                      </span>
                    )}
                  </strong>
                  <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-[10px] font-semibold">
                    {b.category?.toUpperCase() || "GENERAL"}
                  </span>
                </div>
                <p className="text-sm text-slate-600 line-clamp-2">
                  {b.content}
                </p>
              </div>
            ))}
            {bulletins.length > 3 && (
              <Link
                to="/admin/bulletin"
                className="block text-center text-sm text-slate-500 hover:text-navy-600 transition-colors"
              >
                +{bulletins.length - 3} more
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Schedule Management */}
      <div className="mt-4">
        <Link
          to="/admin/activities/schedules"
          className="btn btn-info"
        >
          <i className="fas fa-calendar-week mr-2" /> Schedule Management
        </Link>
      </div>

      {/* Charts & Attendance */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Gender Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold text-navy-900">
              By Component & Gender
            </h4>
            <div className="flex items-center gap-2">
              <RefreshButton
                onRefresh={refreshEnrollment}
                isLoading={enrollRefreshing}
                label=""
                className="btn-sm"
              />
              <Link
                to="/admin/reports/enrollment"
                className="text-sm text-slate-500 hover:text-navy-600 transition-colors"
              >
                Details <i className="fas fa-arrow-right ml-1" />
              </Link>
            </div>
          </div>

          <div className="flex justify-center items-end gap-8 h-[220px] pt-4">
            {["CWTS", "ROTC", "LTS"].map((label, idx) => {
              const maleKey = `${label.toLowerCase()}_male`;
              const femaleKey = `${label.toLowerCase()}_female`;
              const male = e?.[maleKey] || 0;
              const female = e?.[femaleKey] || 0;
              return (
                <div key={label} className="text-center">
                  <div className="flex gap-1 items-end justify-center">
                    <div
                      className="w-7 bg-blue-500 rounded-t transition-all duration-500"
                      style={{ height: getBarHeight(male) }}
                    >
                      <span className="text-[10px] text-white flex items-center justify-center h-full">
                        {male}
                      </span>
                    </div>
                    <div
                      className="w-7 bg-pink-500 rounded-t transition-all duration-500"
                      style={{ height: getBarHeight(female) }}
                    >
                      <span className="text-[10px] text-white flex items-center justify-center h-full">
                        {female}
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 font-semibold text-sm">{label}</p>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center gap-6 mt-3">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <div className="w-3 h-3 bg-blue-500 rounded" />
              Male
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <div className="w-3 h-3 bg-pink-500 rounded" />
              Female
            </div>
          </div>
        </div>

        {/* Today's Attendance */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold text-navy-900">Today's Attendance</h4>
            <div className="flex items-center gap-2">
              <RefreshButton
                onRefresh={refreshStats}
                isLoading={statsRefreshing}
                label=""
                className="btn-sm"
              />
              <span className="text-sm text-slate-500">
                {stats?.today_checkins || 0} check-ins
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
           {(stats?.today_attendance?.length ?? 0) > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase">
                      Student
                    </th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase">
                      OCC ID
                    </th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase">
                      Time
                    </th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.today_attendance?.map((item, index) => (
                    <tr
                      key={index}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                    >
                      <td className="py-2 px-3 text-navy-700">
                        {item.student}
                      </td>
                      <td className="py-2 px-3 text-navy-700">
                        {item.student_id}
                      </td>
                      <td className="py-2 px-3 text-slate-500">{item.time}</td>
                      <td className="py-2 px-3">
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
                <p>No attendance records for today</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Schedule Overview */}
      <DashboardScheduleView
        scope="admin"
        showActivities
        showSessions
      />
    </div>
  );
};

export default Dashboard;