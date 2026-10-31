// src/pages/admin/Activities/Schedules.tsx

import React, { useState, useMemo } from "react";
import { useActivities, useUpdateActivity } from "../../hooks/useActivities";
import { useAuth } from "../../hooks/useAuth";
import RefreshButton from "../../components/common/RefreshButton";
import toast from "react-hot-toast";

type ViewMode = "month" | "week";
type FilterStatus = "all" | "upcoming" | "ongoing" | "completed" | "cancelled";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const pad = (n: number) => String(n).padStart(2, "0");
const toDateKey = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
const startOfWeek = (d: Date) => {
  const day = new Date(d);
  day.setDate(day.getDate() - day.getDay());
  day.setHours(0, 0, 0, 0);
  return day;
};

const buildMonthGrid = (month: Date): Date[] => {
  const first = startOfMonth(month);
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - first.getDay());
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push(d);
  }
  return days;
};

const Schedules: React.FC = () => {
  const { isAdmin, isSuperAdmin, isFaculty, user } = useAuth();
  const {
    data: activities = [],
    isLoading,
    error,
    refresh,
    isRefreshing,
  } = useActivities();
  const updateMut = useUpdateActivity();

  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [anchorDate, setAnchorDate] = useState<Date>(new Date());
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  // Filters
  const [filterComponent, setFilterComponent] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // ============================================================
  // Permission
  // ============================================================
  const canEditActivity = (activity: any) => {
    if (isSuperAdmin) return false;
    if (isAdmin) return true;
    if (isFaculty) return activity.created_by === user?.id;
    return false;
  };

  // ============================================================
  // Filtered activities
  // ============================================================
  const filteredActivities = useMemo(() => {
    let list = activities;

    if (filterComponent !== "all") {
      list = list.filter(
        (a) => a.component_type === filterComponent || a.component_type === "all",
      );
    }

    if (filterStatus !== "all") {
      list = list.filter((a) => a.status === filterStatus);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          (a.description || "").toLowerCase().includes(q) ||
          (a.venue || "").toLowerCase().includes(q),
      );
    }

    return list;
  }, [activities, filterComponent, filterStatus, searchTerm]);

  // ============================================================
  // Group by day
  // ============================================================
  const activitiesByDay = useMemo(() => {
    const map: Record<string, any[]> = {};
    filteredActivities.forEach((activity: any) => {
      const start = new Date(activity.start_datetime);
      const end = new Date(activity.end_datetime);
      const cursor = new Date(start);
      cursor.setHours(0, 0, 0, 0);
      const endDay = new Date(end);
      endDay.setHours(23, 59, 59, 999);
      while (cursor <= endDay) {
        const key = toDateKey(cursor);
        if (!map[key]) map[key] = [];
        map[key].push(activity);
        cursor.setDate(cursor.getDate() + 1);
      }
    });
    Object.values(map).forEach((list) =>
      list.sort(
        (a, b) =>
          new Date(a.start_datetime).getTime() -
          new Date(b.start_datetime).getTime(),
      ),
    );
    return map;
  }, [filteredActivities]);

  // ============================================================
  // Calendar data
  // ============================================================
  const monthDays = useMemo(() => buildMonthGrid(anchorDate), [anchorDate]);

  const weekDays = useMemo(() => {
    const ws = startOfWeek(anchorDate);
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(ws);
      d.setDate(ws.getDate() + i);
      days.push(d);
    }
    return days;
  }, [anchorDate]);

  const monthStats = useMemo(() => {
    const first = startOfMonth(anchorDate);
    const last = endOfMonth(anchorDate);
    const inMonth = filteredActivities.filter((a: any) => {
      const s = new Date(a.start_datetime);
      return s >= first && s <= last;
    });
    return {
      total: inMonth.length,
      upcoming: inMonth.filter((a: any) => a.status === "upcoming").length,
      ongoing: inMonth.filter((a: any) => a.status === "ongoing").length,
      completed: inMonth.filter((a: any) => a.status === "completed").length,
    };
  }, [filteredActivities, anchorDate]);

  // ============================================================
  // Navigation
  // ============================================================
  const goPrev = () => {
    if (viewMode === "month") {
      setAnchorDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    } else {
      setAnchorDate((d) => {
        const nd = new Date(d);
        nd.setDate(nd.getDate() - 7);
        return nd;
      });
    }
    setSelectedDay(null);
  };

  const goNext = () => {
    if (viewMode === "month") {
      setAnchorDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
    } else {
      setAnchorDate((d) => {
        const nd = new Date(d);
        nd.setDate(nd.getDate() + 7);
        return nd;
      });
    }
    setSelectedDay(null);
  };

  const goToday = () => {
    setAnchorDate(new Date());
    setSelectedDay(null);
  };

  const headerLabel = useMemo(() => {
    if (viewMode === "month") {
      return `${MONTH_NAMES[anchorDate.getMonth()]} ${anchorDate.getFullYear()}`;
    }
    const ws = startOfWeek(anchorDate);
    const we = new Date(ws);
    we.setDate(we.getDate() + 6);
    const sameMonth = ws.getMonth() === we.getMonth();
    const left = `${MONTH_NAMES[ws.getMonth()].slice(0, 3)} ${ws.getDate()}`;
    const right = sameMonth
      ? `${we.getDate()}`
      : `${MONTH_NAMES[we.getMonth()].slice(0, 3)} ${we.getDate()}`;
    return `${left} – ${right}, ${we.getFullYear()}`;
  }, [viewMode, anchorDate]);

  // ============================================================
  // Display helpers
  // ============================================================
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      upcoming: "bg-blue-500",
      ongoing: "bg-amber-500",
      completed: "bg-emerald-500",
      cancelled: "bg-red-500",
    };
    return colors[status] || "bg-slate-500";
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      upcoming: "badge-info",
      ongoing: "badge-warning",
      completed: "badge-success",
      cancelled: "badge-danger",
    };
    return badges[status] || "badge-secondary";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      upcoming: "Upcoming",
      ongoing: "Ongoing",
      completed: "Completed",
      cancelled: "Cancelled",
    };
    return labels[status] || status;
  };

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

  // ============================================================
  // Handlers
  // ============================================================
  const handleScheduleActivity = (activity: any) => {
    setSelectedActivity(activity);
    setShowScheduleModal(true);
  };

  const handleUpdateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivity) return;

    if (!canEditActivity(selectedActivity)) {
      toast.error("You can only edit schedules for activities you created");
      return;
    }

    try {
      await updateMut.mutateAsync({
        id: selectedActivity.id,
        data: {
          ...selectedActivity,
          start_datetime: selectedActivity.start_datetime,
          end_datetime: selectedActivity.end_datetime,
        },
      });
      toast.success("Schedule updated successfully!");
      refresh();
      setShowScheduleModal(false);
      setSelectedActivity(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to update schedule");
    }
  };

  // ============================================================
  // Loading / error
  // ============================================================
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="spinner" />
        <span className="ml-3 text-slate-500">Loading schedules...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        Failed to load schedules: {(error as Error).message}
      </div>
    );
  }

  const selectedDayItems = selectedDay
    ? activitiesByDay[toDateKey(selectedDay)] || []
    : [];

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="space-y-5">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold text-navy-900">
            <i className="fas fa-calendar-alt text-gold-500 mr-2" />
            Schedule Management
          </h2>
          <p className="text-sm text-slate-500">
            {filteredActivities.length} activit
            {filteredActivities.length !== 1 ? "ies" : "y"} scheduled
          </p>
          {isFaculty && (
            <p className="text-xs text-slate-400 mt-1">
              <i className="fas fa-info-circle text-gold-500 mr-1" />
              You can view all schedules but can only edit activities you
              created
            </p>
          )}
          {isSuperAdmin && (
            <p className="text-xs text-amber-600 mt-1">
              <i className="fas fa-eye mr-1" />
              View-only access. Admins and Faculty can manage activities.
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RefreshButton
            onRefresh={refresh}
            isLoading={isRefreshing}
            label=""
            className="btn-sm"
          />
        </div>
      </div>

      {/* FILTERS + VIEW TOGGLE */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-wrap items-center gap-3">
          <div className="search-box flex-1 min-w-[220px]">
            <i className="fas fa-search" />
            <input
              type="text"
              placeholder="Search activities..."
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
            value={filterComponent}
            onChange={(e) => setFilterComponent(e.target.value)}
          >
            <option value="all">All Components</option>
            <option value="cwts">CWTS</option>
            <option value="rotc">ROTC</option>
            <option value="lts">LTS</option>
          </select>

          <select
            className="px-4 py-2.5 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
          >
            <option value="all">All Status</option>
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* View toggle */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              type="button"
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1.5 ${viewMode === "month"
                ? "bg-white text-navy-900 shadow-sm"
                : "text-slate-500 hover:text-navy-700"
                }`}
              onClick={() => setViewMode("month")}
            >
              <i className="fas fa-calendar" /> Month
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1.5 ${viewMode === "week"
                ? "bg-white text-navy-900 shadow-sm"
                : "text-slate-500 hover:text-navy-700"
                }`}
              onClick={() => setViewMode("week")}
            >
              <i className="fas fa-calendar-week" /> Week
            </button>
          </div>
        </div>

        {(searchTerm ||
          filterComponent !== "all" ||
          filterStatus !== "all") && (
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Showing <strong>{filteredActivities.length}</strong> of{" "}
                {activities.length} activities
              </span>
              <button
                className="text-gold-600 hover:text-gold-700"
                onClick={() => {
                  setSearchTerm("");
                  setFilterComponent("all");
                  setFilterStatus("all");
                }}
              >
                <i className="fas fa-times mr-1" /> Clear all filters
              </button>
            </div>
          )}
      </div>

      {/* CALENDAR VIEW */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Navigation */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <button
              className="w-9 h-9 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 transition-colors flex items-center justify-center"
              onClick={goPrev}
              title="Previous"
            >
              <i className="fas fa-chevron-left text-slate-600" />
            </button>
            <div className="text-center min-w-[180px]">
              <h3 className="text-lg font-bold text-navy-900">{headerLabel}</h3>
            </div>
            <button
              className="w-9 h-9 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 transition-colors flex items-center justify-center"
              onClick={goNext}
              title="Next"
            >
              <i className="fas fa-chevron-right text-slate-600" />
            </button>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={goToday}>
            <i className="fas fa-calendar-day mr-1" /> Today
          </button>
        </div>

        {/* Stat strip (month view) */}
        {viewMode === "month" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-white border-b border-slate-200">
            {[
              {
                label: "Upcoming",
                value: monthStats.upcoming,
                color: "border-blue-500 text-blue-600",
              },
              {
                label: "Ongoing",
                value: monthStats.ongoing,
                color: "border-amber-500 text-amber-600",
              },
              {
                label: "Completed",
                value: monthStats.completed,
                color: "border-emerald-500 text-emerald-600",
              },
              {
                label: "Total",
                value: monthStats.total,
                color: "border-navy-600 text-navy-700",
              },
            ].map((stat, i) => (
              <div
                key={i}
                className={`bg-white rounded-lg border-l-4 ${stat.color.split(" ")[0]} px-3 py-2`}
              >
                <span className="block text-[10px] uppercase tracking-wider text-slate-500">
                  {stat.label}
                </span>
                <span className={`text-lg font-bold ${stat.color.split(" ")[1]}`}>
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* MONTH GRID */}
        {viewMode === "month" ? (
          <>
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
              {WEEK_DAYS.map((d) => (
                <div
                  key={d}
                  className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider py-2"
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 p-3">
              {monthDays.map((day, idx) => {
                const key = toDateKey(day);
                const dayItems = activitiesByDay[key] || [];
                const inMonth = day.getMonth() === anchorDate.getMonth();
                const today = isSameDay(day, new Date());
                const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));

                return (
                  <button
                    key={idx}
                    type="button"
                    className={`min-h-[110px] rounded-lg border p-1.5 flex flex-col text-left transition-colors ${!inMonth
                      ? "bg-slate-50/30 border-transparent"
                      : today
                        ? "bg-gold-50 border-gold-400 shadow-sm"
                        : isPast
                          ? "bg-slate-50/50 border-slate-100"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    onClick={() =>
                      setSelectedDay(
                        selectedDay && isSameDay(selectedDay, day) ? null : day,
                      )
                    }
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-sm font-semibold ${!inMonth
                          ? "text-slate-300"
                          : today
                            ? "text-gold-700"
                            : isPast
                              ? "text-slate-400"
                              : "text-navy-900"
                          }`}
                      >
                        {day.getDate()}
                      </span>
                      {dayItems.length > 0 && (
                        <span className="text-[10px] font-medium text-slate-400">
                          {dayItems.length}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 space-y-0.5 overflow-hidden">
                      {dayItems.slice(0, 2).map((item: any) => (
                        <div
                          key={item.id}
                          className={`w-full text-left px-1.5 py-0.5 rounded text-[10px] leading-tight text-white truncate ${getStatusColor(
                            item.status,
                          )}`}
                          title={`${item.title} — ${getComponentLabel(
                            item.component_type,
                          )}`}
                        >
                          <span className="font-semibold block truncate">
                            {new Date(item.start_datetime).toLocaleTimeString(
                              [],
                              { hour: "2-digit", minute: "2-digit" },
                            )}
                          </span>
                          <span className="block truncate">{item.title}</span>
                        </div>
                      ))}
                      {dayItems.length > 2 && (
                        <span className="text-[10px] text-slate-500 font-medium px-1">
                          +{dayItems.length - 2} more
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-end gap-4 px-4 py-3 border-t border-slate-100 text-xs">
              <span className="text-slate-500 font-medium">Legend:</span>
              {[
                { label: "Upcoming", color: "bg-blue-500" },
                { label: "Ongoing", color: "bg-amber-500" },
                { label: "Completed", color: "bg-emerald-500" },
                { label: "Cancelled", color: "bg-red-500" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-1.5 text-slate-600"
                >
                  <span className={`w-3 h-3 rounded ${item.color}`} />
                  {item.label}
                </div>
              ))}
            </div>

            {/* Selected day detail */}
            {selectedDay && (
              <div className="border-t border-slate-200 p-4 bg-slate-50">
                <div className="flex justify-between items-center mb-3">
                  <h5 className="text-sm font-semibold text-navy-900">
                    {selectedDay.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </h5>
                  <button
                    className="text-xs text-slate-400 hover:text-slate-600"
                    onClick={() => setSelectedDay(null)}
                  >
                    <i className="fas fa-times" /> Close
                  </button>
                </div>
                {selectedDayItems.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    No activities on this day
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedDayItems.map((activity: any) => {
                      const canEdit = canEditActivity(activity);
                      return (
                        <div
                          key={activity.id}
                          className="flex items-start gap-3 p-3 bg-white rounded-lg border border-slate-200"
                        >
                          <div
                            className={`w-1 self-stretch rounded ${getStatusColor(
                              activity.status,
                            )}`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                              <span className="text-sm font-semibold text-navy-900 truncate">
                                {activity.title}
                              </span>
                              <span
                                className={`badge ${getStatusBadge(
                                  activity.status,
                                )} text-[10px]`}
                              >
                                {getStatusLabel(activity.status)}
                              </span>
                              <span
                                className={`badge ${getComponentBadge(
                                  activity.component_type,
                                )} text-[10px]`}
                              >
                                {getComponentLabel(activity.component_type)}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 flex flex-wrap gap-x-3 gap-y-0.5">
                              <span>
                                <i className="fas fa-clock mr-1" />
                                {new Date(
                                  activity.start_datetime,
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}{" "}
                                –{" "}
                                {new Date(
                                  activity.end_datetime,
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              {activity.venue && (
                                <span>
                                  <i className="fas fa-map-marker-alt mr-1" />
                                  {activity.venue}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            className={`btn ${canEdit ? "btn-info" : "btn-secondary"} btn-sm`}
                            onClick={() => handleScheduleActivity(activity)}
                            disabled={!canEdit}
                            title={
                              canEdit
                                ? "Edit schedule"
                                : "View-only — you did not create this"
                            }
                          >
                            <i className={`fas ${canEdit ? "fa-edit" : "fa-eye"}`} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          /* WEEK VIEW */
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
              {weekDays.map((day, idx) => {
                const key = toDateKey(day);
                const dayItems = activitiesByDay[key] || [];
                const today = isSameDay(day, new Date());

                return (
                  <div
                    key={idx}
                    className={`rounded-lg border p-3 min-h-[180px] ${today
                      ? "bg-gold-50 border-gold-400 shadow-sm"
                      : "bg-slate-50 border-slate-200"
                      }`}
                  >
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-200">
                      <div>
                        <div className="text-[10px] font-semibold text-slate-500 uppercase">
                          {WEEK_DAYS[day.getDay()]}
                        </div>
                        <div
                          className={`text-lg font-bold ${today ? "text-gold-700" : "text-navy-900"
                            }`}
                        >
                          {day.getDate()}
                        </div>
                      </div>
                      {dayItems.length > 0 && (
                        <span className="badge badge-secondary text-[10px]">
                          {dayItems.length}
                        </span>
                      )}
                    </div>

                    {dayItems.length === 0 ? (
                      <p className="text-[10px] text-slate-400 italic text-center py-4">
                        No activities
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {dayItems.map((item: any) => {
                          const canEdit = canEditActivity(item);
                          return (
                            <button
                              key={item.id}
                              type="button"
                              className={`w-full text-left text-[11px] p-2 rounded-lg text-white ${getStatusColor(
                                item.status,
                              )} relative`}
                              onClick={() => handleScheduleActivity(item)}
                              title={item.title}
                            >
                              <div className="font-semibold truncate">
                                {item.title}
                              </div>
                              <div className="text-[10px] opacity-90">
                                {new Date(
                                  item.start_datetime,
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                                {item.venue && ` · ${item.venue}`}
                              </div>
                              {/* Lock/edit badge */}
                              <span className="absolute top-0.5 right-0.5 text-[9px] bg-black/25 px-1 rounded">
                                <i
                                  className={`fas ${canEdit ? "fa-pen" : "fa-lock"
                                    }`}
                                />
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-end gap-4 mt-4 pt-3 border-t border-slate-100 text-xs">
              <span className="text-slate-500 font-medium">Legend:</span>
              {[
                { label: "Upcoming", color: "bg-blue-500" },
                { label: "Ongoing", color: "bg-amber-500" },
                { label: "Completed", color: "bg-emerald-500" },
                { label: "Cancelled", color: "bg-red-500" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-1.5 text-slate-600"
                >
                  <span className={`w-3 h-3 rounded ${item.color}`} />
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SCHEDULE EDIT / VIEW MODAL */}
      {showScheduleModal && selectedActivity && (
        <div
          className="modal-overlay"
          onClick={() => setShowScheduleModal(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>
                  {canEditActivity(selectedActivity)
                    ? "Edit Schedule"
                    : "View Schedule"}{" "}
                  - {selectedActivity.title}
                </h3>
                {!canEditActivity(selectedActivity) && (
                  <p className="text-xs text-slate-400 mt-1">
                    <i className="fas fa-lock mr-1" />
                    Read-only. Only the creator can edit.
                  </p>
                )}
              </div>
              <button
                className="modal-close"
                onClick={() => setShowScheduleModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleUpdateSchedule}>
              <div className="modal-body space-y-4">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-xs text-slate-400">Title</span>
                      <p className="font-medium text-navy-900">
                        {selectedActivity.title}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400">Component</span>
                      <p className="font-medium text-navy-900">
                        {getComponentLabel(selectedActivity.component_type)}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400">Venue</span>
                      <p className="font-medium text-navy-900">
                        {selectedActivity.venue || "N/A"}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400">Status</span>
                      <p className="font-medium text-navy-900">
                        {getStatusLabel(selectedActivity.status)}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400">
                        Training Hours
                      </span>
                      <p className="font-medium text-navy-900">
                        {selectedActivity.training_hours} hours
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400">Created By</span>
                      <p className="font-medium text-navy-900">
                        {selectedActivity.creator?.first_name || "Unknown"}{" "}
                        {selectedActivity.creator?.last_name || ""}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="label">
                    Start Date & Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    className={`input ${!canEditActivity(selectedActivity)
                      ? "bg-slate-100 cursor-not-allowed"
                      : ""
                      }`}
                    value={selectedActivity.start_datetime?.slice(0, 16) || ""}
                    onChange={(e) =>
                      setSelectedActivity({
                        ...selectedActivity,
                        start_datetime: e.target.value,
                      })
                    }
                    required
                    disabled={!canEditActivity(selectedActivity)}
                  />
                </div>

                <div className="form-group">
                  <label className="label">
                    End Date & Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    className={`input ${!canEditActivity(selectedActivity)
                      ? "bg-slate-100 cursor-not-allowed"
                      : ""
                      }`}
                    value={selectedActivity.end_datetime?.slice(0, 16) || ""}
                    onChange={(e) =>
                      setSelectedActivity({
                        ...selectedActivity,
                        end_datetime: e.target.value,
                      })
                    }
                    required
                    disabled={!canEditActivity(selectedActivity)}
                  />
                </div>

                <div className="form-group">
                  <label className="label">Venue</label>
                  <input
                    type="text"
                    className={`input ${!canEditActivity(selectedActivity)
                      ? "bg-slate-100 cursor-not-allowed"
                      : ""
                      }`}
                    value={selectedActivity.venue || ""}
                    onChange={(e) =>
                      setSelectedActivity({
                        ...selectedActivity,
                        venue: e.target.value,
                      })
                    }
                    placeholder="Activity venue"
                    disabled={!canEditActivity(selectedActivity)}
                  />
                </div>

                <div className="form-group">
                  <label className="label">Status</label>
                  <select
                    className={`input ${!canEditActivity(selectedActivity)
                      ? "bg-slate-100 cursor-not-allowed"
                      : ""
                      }`}
                    value={selectedActivity.status || "upcoming"}
                    onChange={(e) =>
                      setSelectedActivity({
                        ...selectedActivity,
                        status: e.target.value,
                      })
                    }
                    disabled={!canEditActivity(selectedActivity)}
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-500">
                  <i className="fas fa-info-circle mr-1" />
                  Created by:{" "}
                  {selectedActivity.creator?.first_name || "Unknown"}{" "}
                  {selectedActivity.creator?.last_name || ""}
                  {selectedActivity.created_by === user?.id && (
                    <span className="ml-2 text-emerald-600 font-medium">
                      <i className="fas fa-check-circle mr-1" /> (You)
                    </span>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowScheduleModal(false)}
                  disabled={updateMut.isPending}
                >
                  {canEditActivity(selectedActivity) ? "Cancel" : "Close"}
                </button>
                {canEditActivity(selectedActivity) && (
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={updateMut.isPending}
                  >
                    {updateMut.isPending ? (
                      <>
                        <i className="fas fa-spinner fa-spin" /> Updating...
                      </>
                    ) : (
                      "Update Schedule"
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedules;