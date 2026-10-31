// src/components/common/DashboardScheduleView.tsx
import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../../../services/api";
import ErrorBoundary from "./ErrorBoundary";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
interface ScheduleItem {
  id: number;
  kind: "activity" | "session";
  title: string;
  subtitle?: string;
  start: Date;
  end: Date;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  component?: string;
  venue?: string;
  class_name?: string;
}

interface DashboardScheduleViewProps {
  scope?: "admin" | "faculty" | "superadmin";
  maxHeight?: string;
  showSessions?: boolean;
  showActivities?: boolean;
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Normalizes API responses that may be either an array or
 * `{ data: [...] }` / `{ data: { data: [...] } }`.
 */
const normalizeArray = (res: any): any[] => {
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.data)) return res.data;
  if (res && res.data && Array.isArray(res.data.data)) return res.data.data;
  return [];
};

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
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

const getStatusColor = (status: string) => {
  switch (status) {
    case "upcoming":
      return "bg-blue-500";
    case "ongoing":
      return "bg-amber-500";
    case "completed":
      return "bg-emerald-500";
    case "cancelled":
      return "bg-red-500";
    default:
      return "bg-slate-500";
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "upcoming":
      return "badge-info";
    case "ongoing":
      return "badge-warning";
    case "completed":
      return "badge-success";
    case "cancelled":
      return "badge-danger";
    default:
      return "badge-secondary";
  }
};

const getComponentLabel = (type?: string) => {
  if (!type) return "—";
  const labels: Record<string, string> = {
    cwts: "CWTS",
    rotc: "ROTC",
    lts: "LTS",
    all: "All",
  };
  return labels[type] || type.toUpperCase();
};

const safeDate = (value: any): Date | null => {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

// ─────────────────────────────────────────────────────────────
// Component (outer — wraps in an error boundary)
// ─────────────────────────────────────────────────────────────
const DashboardScheduleView: React.FC<DashboardScheduleViewProps> = (
  props,
) => (
  <ErrorBoundary
    fallback={
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center text-slate-500">
        <i className="fas fa-calendar-times text-3xl text-slate-300 block mb-2" />
        <p className="text-sm">Schedule overview couldn't be loaded.</p>
      </div>
    }
  >
    <DashboardScheduleViewInner {...props} />
  </ErrorBoundary>
);

// ─────────────────────────────────────────────────────────────
// Inner component
// ─────────────────────────────────────────────────────────────
const DashboardScheduleViewInner: React.FC<DashboardScheduleViewProps> = ({
  scope = "admin",
  maxHeight = "auto",
  showSessions = true,
  showActivities = true,
}) => {
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [anchorDate, setAnchorDate] = useState<Date>(new Date());
  const [filterComponent, setFilterComponent] = useState("all");
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  // ── Fetch activities ─────────────────────────────────────
  const { data: activitiesData, isLoading: activitiesLoading } = useQuery({
    queryKey: ["dashboard-schedule", "activities"],
    queryFn: () => adminApi.getActivities(),
    staleTime: 60000,
    enabled: showActivities,
  });

  // ── Fetch attendance sessions ────────────────────────────
  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ["dashboard-schedule", "sessions"],
    queryFn: () => adminApi.getAttendanceSessions(),
    staleTime: 30000,
    enabled: showSessions,
  });

  const isLoading = activitiesLoading || sessionsLoading;

  // ── Normalize raw responses once ─────────────────────────
  const rawActivities = useMemo(
    () => normalizeArray(activitiesData),
    [activitiesData],
  );
  const rawSessions = useMemo(
    () => normalizeArray(sessionsData),
    [sessionsData],
  );

  // ── Build normalized ScheduleItem[] ──────────────────────
  const items: ScheduleItem[] = useMemo(() => {
    const out: ScheduleItem[] = [];

    if (showActivities) {
      rawActivities.forEach((a: any) => {
        if (!a) return;

        // Faculty only sees their own activities
        if (scope === "faculty" && a.created_by !== user?.id) return;

        // Component filter for faculty — only their component or "all"
        if (
          scope === "faculty" &&
          user?.nstp_component &&
          a.component_type &&
          a.component_type !== "all" &&
          a.component_type !== user.nstp_component
        ) {
          return;
        }

        const start = safeDate(a.start_datetime);
        const end = safeDate(a.end_datetime) || start;
        if (!start) return;

        out.push({
          id: a.id,
          kind: "activity",
          title: a.title || "Untitled activity",
          subtitle: a.description,
          start,
          end: end || start,
          status: a.status || "upcoming",
          component: a.component_type,
          venue: a.venue,
        });
      });
    }

    if (showSessions) {
      rawSessions.forEach((s: any) => {
        if (!s) return;

        if (scope === "faculty" && s.faculty_id !== user?.id) return;

        const start = safeDate(s.scheduled_start || s.start_time);
        const end =
          safeDate(s.scheduled_end || s.end_time) || start;
        if (!start) return;

        const status =
          s.status === "active"
            ? "ongoing"
            : s.status === "closed"
              ? "completed"
              : "upcoming";

        out.push({
          id: s.id,
          kind: "session",
          title: s.class_name
            ? `Session · ${s.class_name}`
            : `Session #${s.id}`,
          subtitle: s.description || "Attendance session",
          start,
          end: end || start,
          status: status as ScheduleItem["status"],
          component: s.component,
          class_name: s.class_name,
        });
      });
    }

    if (filterComponent !== "all") {
      return out.filter(
        (i) => i.component === filterComponent || i.component === "all",
      );
    }

    return out;
  }, [
    rawActivities,
    rawSessions,
    scope,
    user?.id,
    user?.nstp_component,
    filterComponent,
    showActivities,
    showSessions,
  ]);

  // ── Group items by day ───────────────────────────────────
  const itemsByDay = useMemo(() => {
    const map: Record<string, ScheduleItem[]> = {};
    items.forEach((item) => {
      const cursor = new Date(item.start);
      cursor.setHours(0, 0, 0, 0);
      const endDay = new Date(item.end);
      endDay.setHours(23, 59, 59, 999);

      while (cursor <= endDay) {
        const key = toDateKey(cursor);
        if (!map[key]) map[key] = [];
        map[key].push(item);
        cursor.setDate(cursor.getDate() + 1);
      }
    });
    Object.values(map).forEach((list) =>
      list.sort((a, b) => a.start.getTime() - b.start.getTime()),
    );
    return map;
  }, [items]);

  // ── Navigation ───────────────────────────────────────────
  const goToday = () => {
    setAnchorDate(new Date());
    setSelectedDay(null);
  };

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

  // ── Header label ─────────────────────────────────────────
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

  // ── Month data ───────────────────────────────────────────
  const monthDays = useMemo(() => buildMonthGrid(anchorDate), [anchorDate]);

  const monthStats = useMemo(() => {
    const first = startOfMonth(anchorDate);
    const last = endOfMonth(anchorDate);
    const inMonth = items.filter((i) => i.start >= first && i.start <= last);
    return {
      total: inMonth.length,
      upcoming: inMonth.filter((i) => i.status === "upcoming").length,
      ongoing: inMonth.filter((i) => i.status === "ongoing").length,
      completed: inMonth.filter((i) => i.status === "completed").length,
    };
  }, [items, anchorDate]);

  // ── Week data ────────────────────────────────────────────
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

  // ── Selected-day items ───────────────────────────────────
  const selectedDayItems = selectedDay
    ? itemsByDay[toDateKey(selectedDay)] || []
    : [];

  // ─────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gold-100 flex items-center justify-center text-gold-600">
            <i className="fas fa-calendar-alt" />
          </div>
          <div>
            <h4 className="font-semibold text-navy-900">Schedule Overview</h4>
            <p className="text-xs text-slate-500">
              {items.length} item{items.length !== 1 ? "s" : ""} total
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-xs focus:outline-none focus:ring-2 focus:ring-gold-500"
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
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
                viewMode === "month"
                  ? "bg-white text-navy-900 shadow-sm"
                  : "text-slate-500 hover:text-navy-700"
              }`}
              onClick={() => setViewMode("month")}
            >
              <i className="fas fa-calendar" /> Month
            </button>
            <button
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
                viewMode === "week"
                  ? "bg-white text-navy-900 shadow-sm"
                  : "text-slate-500 hover:text-navy-700"
              }`}
              onClick={() => setViewMode("week")}
            >
              <i className="fas fa-calendar-week" /> Week
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <button
            className="w-8 h-8 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition-colors flex items-center justify-center"
            onClick={goPrev}
            title="Previous"
          >
            <i className="fas fa-chevron-left text-slate-600 text-sm" />
          </button>
          <div className="text-center min-w-[180px]">
            <h5 className="text-sm font-bold text-navy-900">{headerLabel}</h5>
          </div>
          <button
            className="w-8 h-8 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition-colors flex items-center justify-center"
            onClick={goNext}
            title="Next"
          >
            <i className="fas fa-chevron-right text-slate-600 text-sm" />
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
              className={`bg-white rounded-lg border-l-4 ${
                stat.color.split(" ")[0]
              } px-3 py-2`}
            >
              <span className="block text-[10px] uppercase tracking-wider text-slate-500">
                {stat.label}
              </span>
              <span
                className={`text-lg font-bold ${stat.color.split(" ")[1]}`}
              >
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Body */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="spinner" />
          <span className="ml-3 text-slate-500">Loading schedule…</span>
        </div>
      ) : viewMode === "month" ? (
        <div style={{ maxHeight }}>
          {/* Weekday header */}
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

          {/* Month grid */}
          <div className="grid grid-cols-7 gap-1 p-3">
            {monthDays.map((day, idx) => {
              const key = toDateKey(day);
              const dayItems = itemsByDay[key] || [];
              const inMonth = day.getMonth() === anchorDate.getMonth();
              const today = isSameDay(day, new Date());
              const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));

              return (
                <button
                  key={idx}
                  type="button"
                  className={`min-h-[110px] rounded-lg border p-1.5 flex flex-col text-left transition-colors ${
                    !inMonth
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
                      className={`text-sm font-semibold ${
                        !inMonth
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
                    {dayItems.slice(0, 2).map((item) => (
                      <div
                        key={`${item.kind}-${item.id}`}
                        className={`w-full text-left px-1.5 py-0.5 rounded text-[10px] leading-tight text-white truncate ${getStatusColor(
                          item.status,
                        )}`}
                        title={`${item.title} — ${getComponentLabel(
                          item.component,
                        )}`}
                      >
                        <span className="font-semibold block truncate">
                          {item.start.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
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
                  No items on this day
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedDayItems.map((item) => (
                    <div
                      key={`${item.kind}-${item.id}`}
                      className="flex items-start gap-3 p-3 bg-white rounded-lg border border-slate-200"
                    >
                      <div
                        className={`w-1 self-stretch rounded ${getStatusColor(
                          item.status,
                        )}`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-semibold text-navy-900 truncate">
                            {item.title}
                          </span>
                          <span
                            className={`badge ${getStatusBadge(
                              item.status,
                            )} text-[10px]`}
                          >
                            {item.status}
                          </span>
                          {item.component && (
                            <span className="badge badge-secondary text-[10px]">
                              {getComponentLabel(item.component)}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                            {item.kind}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 flex flex-wrap gap-x-3 gap-y-0.5">
                          <span>
                            <i className="fas fa-clock mr-1" />
                            {item.start.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            –{" "}
                            {item.end.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {item.venue && (
                            <span>
                              <i className="fas fa-map-marker-alt mr-1" />
                              {item.venue}
                            </span>
                          )}
                          {item.class_name && (
                            <span>
                              <i className="fas fa-chalkboard-teacher mr-1" />
                              {item.class_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Week view */
        <div style={{ maxHeight }} className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
            {weekDays.map((day, idx) => {
              const key = toDateKey(day);
              const dayItems = itemsByDay[key] || [];
              const today = isSameDay(day, new Date());

              return (
                <div
                  key={idx}
                  className={`rounded-lg border p-3 min-h-[160px] ${
                    today
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
                        className={`text-lg font-bold ${
                          today ? "text-gold-700" : "text-navy-900"
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
                      No items
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {dayItems.map((item) => (
                        <div
                          key={`${item.kind}-${item.id}`}
                          className={`text-[11px] p-2 rounded-lg text-white ${getStatusColor(
                            item.status,
                          )}`}
                          title={item.title}
                        >
                          <div className="font-semibold truncate">
                            {item.title}
                          </div>
                          <div className="text-[10px] opacity-90">
                            {item.start.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {item.venue && ` · ${item.venue}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Week legend */}
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

      {/* Empty state */}
      {!isLoading && items.length === 0 && (
        <div className="text-center py-8 border-t border-slate-100">
          <i className="fas fa-calendar-times text-3xl text-slate-300 block mb-2" />
          <p className="text-sm text-slate-500">No scheduled items</p>
          <p className="text-xs text-slate-400 mt-1">
            Activities and sessions will appear here
          </p>
        </div>
      )}
    </div>
  );
};

export default DashboardScheduleView;