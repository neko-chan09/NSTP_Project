// src/pages/admin/Activities/Activities.tsx

import React, { useState, useMemo } from "react";
import {
  useActivities,
  useCreateActivity,
  useUpdateActivity,
  useDeleteActivity,
} from "../../hooks/useActivities";
import { useAuth } from "../../hooks/useAuth";
import RefreshButton from "../../components/common/RefreshButton";
import ActivityParticipants from "./ActivityParticipants";
import LocationPicker from "../../components/common/LocationPicker";
import toast from "react-hot-toast";

interface ActivityFormData {
  title: string;
  description: string;
  component_type: "cwts" | "rotc" | "lts";
  start_datetime: string;
  end_datetime: string;
  venue: string;
  latitude: number | null;
  longitude: number | null;
  geofence_radius: number;
  training_hours: number;
  max_participants: number;
}

const buildEmptyForm = (
  defaultComponent: "cwts" | "rotc" | "lts" = "cwts"
): ActivityFormData => ({
  title: "",
  description: "",
  component_type: defaultComponent,
  start_datetime: "",
  end_datetime: "",
  venue: "",
  latitude: null,
  longitude: null,
  geofence_radius: 100,
  training_hours: 1,
  max_participants: 0,
});

// ============================================================
// Date helpers
// ============================================================
const toLocalDatetime = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const quickStart = (daysFromNow: number, hour: number) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, 0, 0, 0);
  return toLocalDatetime(d);
};

const quickEnd = (daysFromNow: number, hour: number) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, 0, 0, 0);
  return toLocalDatetime(d);
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const startOfMonth = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), 1);

const endOfMonth = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth() + 1, 0);

const buildMonthGrid = (month: Date): Date[] => {
  const first = startOfMonth(month);
  const startOffset = first.getDay();
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - startOffset);

  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push(d);
  }
  return days;
};

const Activities: React.FC = () => {
  const { isAdmin, isSuperAdmin, isFaculty, user } = useAuth();

  // Super Admin cannot create/edit/delete activities.
  const canManage = !isSuperAdmin && (isAdmin || isFaculty);

  const facultyComponent = isFaculty ? user?.nstp_component : undefined;

  // ✅ No "all" fallback — default to faculty's own component or CWTS.
  const defaultComponent: "cwts" | "rotc" | "lts" =
    (facultyComponent as "cwts" | "rotc" | "lts") || "cwts";

  const {
    data: activities = [],
    isLoading,
    error,
    refresh,
    isRefreshing,
  } = useActivities();
  const createMut = useCreateActivity();
  const updateMut = useUpdateActivity();
  const deleteMut = useDeleteActivity();

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ActivityFormData>(
    buildEmptyForm(defaultComponent)
  );
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [filterComponent, setFilterComponent] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [showLocationSection, setShowLocationSection] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

  const canEditActivity = (activity: any) => {
    if (isSuperAdmin) return false;
    if (isAdmin) return true;
    if (isFaculty) return activity.created_by === user?.id;
    return false;
  };

  // ============================================================
  // Validation
  // ============================================================
  const validation = useMemo(() => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = "Title is required";
    } else if (formData.title.trim().length < 3) {
      errors.title = "Title must be at least 3 characters";
    }

    if (!formData.description.trim()) {
      errors.description = "Description is required";
    } else if (formData.description.trim().length < 10) {
      errors.description = "Description must be at least 10 characters";
    }

    if (!formData.component_type) {
      errors.component_type = "Component is required";
    }

    if (!formData.start_datetime) {
      errors.start_datetime = "Start date & time is required";
    }

    if (!formData.end_datetime) {
      errors.end_datetime = "End date & time is required";
    }

    if (formData.start_datetime && formData.end_datetime) {
      const start = new Date(formData.start_datetime);
      const end = new Date(formData.end_datetime);
      if (end <= start) {
        errors.end_datetime = "End must be after start";
      }
    }

    if (formData.training_hours < 1) {
      errors.training_hours = "Training hours must be at least 1";
    }

    if (formData.geofence_radius < 10 || formData.geofence_radius > 1000) {
      errors.geofence_radius = "Radius must be between 10 and 1000 meters";
    }

    return errors;
  }, [formData]);

  const isValid = Object.keys(validation).length === 0;

  // ============================================================
  // Modal open/close
  // ============================================================
  const openCreate = () => {
    if (!canManage) {
      toast.error("Super Admin can view activities but cannot create them");
      return;
    }
    setEditingId(null);
    setFormData({
      ...buildEmptyForm(defaultComponent),
      start_datetime: quickStart(1, 9),
      end_datetime: quickEnd(1, 17),
    });
    setShowLocationSection(false);
    setTouched({});
    setShowModal(true);
  };

  const openEdit = (activity: any) => {
    if (!canEditActivity(activity)) {
      toast.error("You don't have permission to edit this activity");
      return;
    }

    // If legacy row has component_type = "all", coerce to a real component
    const safeComponent: "cwts" | "rotc" | "lts" =
      activity.component_type === "all" ||
        activity.component_type == null
        ? ((facultyComponent as "cwts" | "rotc" | "lts") || "cwts")
        : activity.component_type;

    setEditingId(activity.id);
    setFormData({
      title: activity.title,
      description: activity.description,
      component_type:
        isFaculty && facultyComponent
          ? (facultyComponent as "cwts" | "rotc" | "lts")
          : safeComponent,
      start_datetime: activity.start_datetime?.slice(0, 16) || "",
      end_datetime: activity.end_datetime?.slice(0, 16) || "",
      venue: activity.venue || "",
      latitude: activity.latitude || null,
      longitude: activity.longitude || null,
      geofence_radius: activity.geofence_radius || 100,
      training_hours: activity.training_hours || 1,
      max_participants: activity.max_participants || 0,
    });
    setShowLocationSection(!!(activity.latitude && activity.longitude));
    setTouched({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData(buildEmptyForm(defaultComponent));
    setEditingId(null);
    setShowLocationSection(false);
    setTouched({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canManage) {
      toast.error("Super Admin cannot save activities");
      return;
    }

    setTouched({
      title: true,
      description: true,
      component_type: true,
      start_datetime: true,
      end_datetime: true,
      training_hours: true,
      geofence_radius: true,
    });

    if (!isValid) {
      toast.error("Please fix the errors in the form");
      return;
    }

    // ✅ Component is now required — no "all"
    const resolvedComponent: "cwts" | "rotc" | "lts" =
      isFaculty && facultyComponent
        ? (facultyComponent as "cwts" | "rotc" | "lts")
        : (formData.component_type as "cwts" | "rotc" | "lts");

    if (!resolvedComponent) {
      toast.error("Please select a component (CWTS, ROTC, or LTS)");
      return;
    }

    const payload: any = {
      ...formData,
      component_type: resolvedComponent,
      latitude:
        formData.latitude !== null && formData.latitude !== undefined
          ? formData.latitude
          : null,
      longitude:
        formData.longitude !== null && formData.longitude !== undefined
          ? formData.longitude
          : null,
    };

    try {
      if (editingId) {
        await updateMut.mutateAsync({ id: editingId, data: payload });
        toast.success("Activity updated successfully");
      } else {
        await createMut.mutateAsync(payload);
        toast.success("Activity created successfully");
      }
      closeModal();
      refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to save activity");
    }
  };

  const handleDelete = async (id: number) => {
    const activity = activities.find((a) => a.id === id);
    if (!activity) return;
    if (!canEditActivity(activity)) {
      toast.error("You don't have permission to delete this activity");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this activity?"))
      return;
    try {
      await deleteMut.mutateAsync(id);
      toast.success("Activity deleted successfully");
      refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete activity");
    }
  };

  // ============================================================
  // Helpers — no "all" branch
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
      upcoming: "bg-blue-100 text-blue-800",
      ongoing: "bg-amber-100 text-amber-800",
      completed: "bg-emerald-100 text-emerald-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return badges[status] || "bg-slate-100 text-slate-800";
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
    };
    return labels[type] || type?.toUpperCase() || "—";
  };

  const getComponentBadge = (type: string) => {
    const badges: Record<string, string> = {
      cwts: "bg-blue-100 text-blue-800",
      rotc: "bg-red-100 text-red-800",
      lts: "bg-emerald-100 text-emerald-800",
    };
    return badges[type] || "bg-slate-100 text-slate-800";
  };

  // ============================================================
  // Filtering
  // ============================================================
  const filteredActivities = useMemo(() => {
    let list = activities;

    if (filterComponent !== "all") {
      list = list.filter((a) => a.component_type === filterComponent);
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
          (a.venue || "").toLowerCase().includes(q)
      );
    }

    return list;
  }, [activities, filterComponent, filterStatus, searchTerm]);

  const handleActivityClick = (activity: any) => {
    setSelectedActivity(activity);
    setShowParticipantsModal(true);
  };

  const updateField = (field: keyof ActivityFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const durationPreview = useMemo(() => {
    if (!formData.start_datetime || !formData.end_datetime) return null;
    const start = new Date(formData.start_datetime);
    const end = new Date(formData.end_datetime);
    if (end <= start) return null;
    const diffHours = (end.getTime() - start.getTime()) / 3600000;
    const h = Math.floor(diffHours);
    const m = Math.round((diffHours - h) * 60);
    return `${h}h${m > 0 ? ` ${m}m` : ""}`;
  }, [formData.start_datetime, formData.end_datetime]);

  // ============================================================
  // Calendar data
  // ============================================================
  const calendarDays = useMemo(
    () => buildMonthGrid(calendarMonth),
    [calendarMonth]
  );

  const activitiesByDay = useMemo(() => {
    const map: Record<string, any[]> = {};
    filteredActivities.forEach((a) => {
      const start = new Date(a.start_datetime);
      const end = new Date(a.end_datetime);
      const cursor = new Date(start);
      cursor.setHours(0, 0, 0, 0);
      const endDay = new Date(end);
      endDay.setHours(23, 59, 59, 999);
      while (cursor <= endDay) {
        const key = cursor.toISOString().slice(0, 10);
        if (!map[key]) map[key] = [];
        map[key].push(a);
        cursor.setDate(cursor.getDate() + 1);
      }
    });
    return map;
  }, [filteredActivities]);

  const changeMonth = (delta: number) => {
    setCalendarMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1)
    );
  };

  const goToToday = () => {
    setCalendarMonth(new Date());
  };

  const weekDayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const monthStats = useMemo(() => {
    const first = startOfMonth(calendarMonth);
    const last = endOfMonth(calendarMonth);
    const inMonth = filteredActivities.filter((a) => {
      const s = new Date(a.start_datetime);
      return s >= first && s <= last;
    });
    return {
      total: inMonth.length,
      upcoming: inMonth.filter((a) => a.status === "upcoming").length,
      ongoing: inMonth.filter((a) => a.status === "ongoing").length,
      completed: inMonth.filter((a) => a.status === "completed").length,
    };
  }, [filteredActivities, calendarMonth]);

  // ============================================================
  // Render guards
  // ============================================================
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="spinner" />
        <span className="ml-3 text-slate-500">Loading activities...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        Failed to load activities: {(error as Error).message}
      </div>
    );
  }

  const totalCount = activities.length;
  const upcomingCount = activities.filter((a) => a.status === "upcoming").length;
  const ongoingCount = activities.filter((a) => a.status === "ongoing").length;
  const completedCount = activities.filter((a) => a.status === "completed").length;

  return (
    <div className="space-y-5">
      {/* ============================================================
          HEADER
         ============================================================ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold text-navy-900">
            <i className="fas fa-calendar-plus text-gold-500 mr-2" />
            Activities Management
          </h2>
          <p className="text-sm text-slate-500">
            {totalCount} activit{totalCount !== 1 ? "ies" : "y"} total •{" "}
            {upcomingCount} upcoming • {ongoingCount} ongoing •{" "}
            {completedCount} completed
          </p>
          {isSuperAdmin && (
            <p className="text-xs text-amber-600 mt-1">
              <i className="fas fa-eye mr-1" />
              You have <strong>view-only</strong> access to activities. Only
              Admins and Faculty can create, edit, or delete them.
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <RefreshButton
            onRefresh={refresh}
            isLoading={isRefreshing}
            label=""
            className="btn-sm"
          />
          {canManage && (
            <button className="btn btn-primary btn-sm" onClick={openCreate}>
              <i className="fas fa-plus" /> New Activity
            </button>
          )}
        </div>
      </div>

      {/* ============================================================
          FILTERS + VIEW TOGGLE
         ============================================================ */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-wrap items-center gap-3">
          <div className="search-box flex-1 min-w-[220px]">
            <i className="fas fa-search" />
            <input
              type="text"
              placeholder="Search by title, description, or venue..."
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
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1.5 ${viewMode === "list"
                ? "bg-white text-navy-900 shadow-sm"
                : "text-slate-500 hover:text-navy-700"
                }`}
              onClick={() => setViewMode("list")}
              title="List view"
            >
              <i className="fas fa-list" /> List
            </button>
            <button
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1.5 ${viewMode === "calendar"
                ? "bg-white text-navy-900 shadow-sm"
                : "text-slate-500 hover:text-navy-700"
                }`}
              onClick={() => setViewMode("calendar")}
              title="Calendar view"
            >
              <i className="fas fa-calendar-alt" /> Calendar
            </button>
          </div>
        </div>

        {filteredActivities.length !== activities.length && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Showing <strong>{filteredActivities.length}</strong> of{" "}
              {activities.length} activities
            </span>
            {(searchTerm ||
              filterComponent !== "all" ||
              filterStatus !== "all") && (
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
              )}
          </div>
        )}
      </div>

      {/* ============================================================
          EMPTY STATE
         ============================================================ */}
      {filteredActivities.length === 0 ? (
        <div className="empty-state bg-white rounded-xl border border-slate-200">
          <i className="fas fa-calendar-plus text-4xl text-slate-300 block mb-3" />
          <p className="text-slate-500">
            {activities.length === 0
              ? "No activities created yet"
              : "No activities match your filters"}
          </p>
          {activities.length === 0 ? (
            canManage ? (
              <button className="btn btn-primary mt-4" onClick={openCreate}>
                <i className="fas fa-plus" /> Create Your First Activity
              </button>
            ) : (
              <p className="text-xs text-slate-400 mt-4 italic">
                Admins and Faculty will create activities here.
              </p>
            )
          ) : (
            <button
              className="btn btn-secondary mt-4"
              onClick={() => {
                setSearchTerm("");
                setFilterComponent("all");
                setFilterStatus("all");
              }}
            >
              <i className="fas fa-times mr-1" /> Clear all filters
            </button>
          )}
        </div>
      ) : viewMode === "list" ? (
        /* ============================================================
           LIST VIEW
           ============================================================ */
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>Activity</th>
                  <th>Component</th>
                  <th>Schedule</th>
                  <th>Venue</th>
                  <th>Participants</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredActivities.map((activity) => {
                  const canEdit = canEditActivity(activity);
                  const isDeleting =
                    deleteMut.isPending &&
                    deleteMut.variables === activity.id;

                  const startDate = new Date(activity.start_datetime);
                  const endDate = new Date(activity.end_datetime);
                  const isSameDayEvent = isSameDay(startDate, endDate);

                  return (
                    <tr
                      key={activity.id}
                      className={`group hover:bg-slate-50 transition-colors ${isDeleting ? "opacity-50" : ""
                        }`}
                    >
                      <td>
                        <div className="flex items-start gap-3 min-w-[240px]">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getStatusColor(
                              activity.status
                            )} text-white`}
                          >
                            <i className="fas fa-calendar-check" />
                          </div>
                          <div className="min-w-0">
                            <button
                              className="font-semibold text-navy-900 hover:text-gold-600 transition-colors text-left truncate max-w-[280px]"
                              onClick={() => handleActivityClick(activity)}
                            >
                              {activity.title}
                            </button>
                            {activity.description ? (
                              <div className="text-xs text-slate-500 truncate max-w-[280px]">
                                {activity.description}
                              </div>
                            ) : (
                              <div className="text-xs text-slate-400 italic">
                                No description
                              </div>
                            )}
                            {activity.latitude && activity.longitude && (
                              <span className="inline-flex items-center text-[10px] text-emerald-600 mt-0.5">
                                <i className="fas fa-map-pin mr-1" />
                                Location set • {activity.geofence_radius || 100}m
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`badge ${getComponentBadge(
                            activity.component_type
                          )}`}
                        >
                          {getComponentLabel(activity.component_type)}
                        </span>
                      </td>

                      <td>
                        <div className="text-sm text-navy-900 font-medium">
                          {startDate.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                        <div className="text-xs text-slate-500">
                          {startDate.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {isSameDayEvent
                            ? ` – ${endDate.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}`
                            : ` → ${endDate.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}`}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          <i className="fas fa-clock mr-1" />
                          {activity.training_hours} hr
                          {activity.training_hours !== 1 ? "s" : ""}
                        </div>
                      </td>

                      <td>
                        {activity.venue ? (
                          <div className="flex items-start gap-1.5 text-sm text-slate-700">
                            <i className="fas fa-map-marker-alt text-gold-500 mt-0.5" />
                            <span className="truncate max-w-[180px]">
                              {activity.venue}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            No venue
                          </span>
                        )}
                      </td>

                      <td>
                        <button
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
                          onClick={() => handleActivityClick(activity)}
                          title="View participants"
                        >
                          <i className="fas fa-users text-slate-400 text-xs" />
                          <span className="font-semibold text-sm text-navy-900">
                            {activity.participants_count || 0}
                          </span>
                          {(activity.max_participants ?? 0) > 0 && (
                            <span className="text-xs text-slate-400">
                              / {activity.max_participants}
                            </span>
                          )}
                        </button>
                      </td>

                      <td>
                        <span
                          className={`badge ${getStatusBadge(
                            activity.status
                          )}`}
                        >
                          {getStatusLabel(activity.status)}
                        </span>
                        {isFaculty && (
                          <div className="mt-1">
                            <span
                              className={`badge ${activity.created_by === user?.id
                                ? "badge-success"
                                : "badge-secondary"
                                } text-[10px]`}
                            >
                              <i
                                className={`fas ${activity.created_by === user?.id
                                  ? "fa-check-circle"
                                  : "fa-eye"
                                  } mr-1`}
                              />
                              {activity.created_by === user?.id
                                ? "Yours"
                                : "View Only"}
                            </span>
                          </div>
                        )}
                        {isSuperAdmin && (
                          <div className="mt-1">
                            <span className="badge badge-secondary text-[10px]">
                              <i className="fas fa-eye mr-1" />
                              View Only
                            </span>
                          </div>
                        )}
                      </td>

                      <td>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleActivityClick(activity)}
                            title="View participants"
                          >
                            <i className="fas fa-users" />
                          </button>
                          {canEdit ? (
                            <>
                              <button
                                className="btn btn-info btn-sm"
                                onClick={() => openEdit(activity)}
                                disabled={isDeleting}
                                title="Edit activity"
                              >
                                <i className="fas fa-edit" />
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleDelete(activity.id)}
                                disabled={isDeleting}
                                title="Delete activity"
                              >
                                {isDeleting ? (
                                  <i className="fas fa-spinner fa-spin" />
                                ) : (
                                  <i className="fas fa-trash" />
                                )}
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-slate-400 flex items-center px-2">
                              <i className="fas fa-lock mr-1" />
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ============================================================
           CALENDAR VIEW
           ============================================================ */
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-3">
              <button
                className="w-9 h-9 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 transition-colors flex items-center justify-center"
                onClick={() => changeMonth(-1)}
                title="Previous month"
              >
                <i className="fas fa-chevron-left text-slate-600" />
              </button>
              <div className="text-center min-w-[180px]">
                <h3 className="text-lg font-bold text-navy-900">
                  {calendarMonth.toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </h3>
                <p className="text-xs text-slate-500">
                  {monthStats.total} activit
                  {monthStats.total !== 1 ? "ies" : "y"} this month
                </p>
              </div>
              <button
                className="w-9 h-9 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 transition-colors flex items-center justify-center"
                onClick={() => changeMonth(1)}
                title="Next month"
              >
                <i className="fas fa-chevron-right text-slate-600" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button className="btn btn-secondary btn-sm" onClick={goToToday}>
                <i className="fas fa-calendar-day mr-1" /> Today
              </button>
              {canManage && (
                <button className="btn btn-primary btn-sm" onClick={openCreate}>
                  <i className="fas fa-plus mr-1" /> Add
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-4 bg-white border-b border-slate-200">
            {[
              {
                label: "Upcoming",
                value: monthStats.upcoming,
                color: "border-blue-500",
                text: "text-blue-600",
              },
              {
                label: "Ongoing",
                value: monthStats.ongoing,
                color: "border-amber-500",
                text: "text-amber-600",
              },
              {
                label: "Completed",
                value: monthStats.completed,
                color: "border-emerald-500",
                text: "text-emerald-600",
              },
              {
                label: "Total",
                value: monthStats.total,
                color: "border-navy-600",
                text: "text-navy-700",
              },
            ].map((stat, i) => (
              <div
                key={i}
                className={`bg-white rounded-lg border-l-4 ${stat.color} px-3 py-2`}
              >
                <span className="block text-[10px] uppercase tracking-wider text-slate-500">
                  {stat.label}
                </span>
                <span className={`text-lg font-bold ${stat.text}`}>
                  {stat.value}
                </span>
              </div>
            ))}
          </div>

          <div className="p-4">
            <div className="grid grid-cols-7 mb-2">
              {weekDayLabels.map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                const key = day.toISOString().slice(0, 10);
                const dayActivities = activitiesByDay[key] || [];
                const inCurrentMonth =
                  day.getMonth() === calendarMonth.getMonth();
                const isToday = isSameDay(day, new Date());
                const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));

                return (
                  <div
                    key={index}
                    className={`min-h-[110px] rounded-lg border p-1.5 flex flex-col transition-colors ${inCurrentMonth
                      ? isToday
                        ? "bg-gold-50 border-gold-400 shadow-sm"
                        : isPast
                          ? "bg-slate-50/50 border-slate-100"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      : "bg-slate-50/30 border-transparent"
                      }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-sm font-semibold ${!inCurrentMonth
                          ? "text-slate-300"
                          : isToday
                            ? "text-gold-700"
                            : isPast
                              ? "text-slate-400"
                              : "text-navy-900"
                          }`}
                      >
                        {day.getDate()}
                      </span>
                      {isToday && (
                        <span className="text-[9px] font-bold text-gold-600 bg-gold-100 px-1.5 py-0.5 rounded">
                          TODAY
                        </span>
                      )}
                      {dayActivities.length > 0 && (
                        <span className="text-[10px] font-medium text-slate-400">
                          {dayActivities.length}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 space-y-0.5 overflow-hidden">
                      {dayActivities.slice(0, 3).map((act: any) => (
                        <button
                          key={act.id}
                          className={`w-full text-left px-1.5 py-1 rounded text-[10px] leading-tight text-white hover:opacity-90 transition-opacity truncate ${getStatusColor(
                            act.status
                          )}`}
                          title={`${act.title} — ${getComponentLabel(
                            act.component_type
                          )}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleActivityClick(act);
                          }}
                        >
                          <span className="font-semibold block truncate">
                            {new Date(act.start_datetime).toLocaleTimeString(
                              [],
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                          </span>
                          <span className="block truncate">{act.title}</span>
                        </button>
                      ))}
                      {dayActivities.length > 3 && (
                        <button
                          className="w-full text-left text-[10px] text-slate-500 hover:text-slate-700 font-medium px-1.5 py-0.5"
                          onClick={(e) => {
                            e.stopPropagation();
                            toast(
                              `${dayActivities.length - 3} more activities on this day`,
                              { icon: "ℹ️" }
                            );
                          }}
                        >
                          +{dayActivities.length - 3} more
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

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

          {monthStats.total === 0 && (
            <div className="text-center py-10 text-slate-500 border-t border-slate-100">
              <i className="fas fa-calendar-times text-3xl text-slate-300 block mb-2" />
              <p className="text-sm">No activities scheduled this month</p>
              {canManage && (
                <button
                  className="btn btn-primary btn-sm mt-3"
                  onClick={openCreate}
                >
                  <i className="fas fa-plus mr-1" /> Schedule an activity
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================
          PARTICIPANTS MODAL
         ============================================================ */}
      {showParticipantsModal && selectedActivity && (
        <ActivityParticipants
          activity={selectedActivity}
          onClose={() => setShowParticipantsModal(false)}
          onRefresh={refresh}
        />
      )}

      {/* ============================================================
          CREATE / EDIT MODAL — never reachable for Super Admin
         ============================================================ */}
      {showModal && canManage && (
        <div
          className="modal-overlay"
          onClick={() =>
            !createMut.isPending && !updateMut.isPending && closeModal()
          }
        >
          <div
            className="modal modal-lg flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header border-b border-slate-200 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gold-100 flex items-center justify-center text-gold-600">
                  <i
                    className={`fas ${editingId ? "fa-edit" : "fa-calendar-plus"
                      }`}
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-navy-900">
                    {editingId ? "Edit Activity" : "Create New Activity"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingId
                      ? "Update the details of this activity"
                      : "Fill in the details below to schedule a new activity"}
                  </p>
                </div>
              </div>
              <button
                className="modal-close"
                onClick={closeModal}
                disabled={createMut.isPending || updateMut.isPending}
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex-1 overflow-hidden flex flex-col"
            >
              <div className="overflow-y-auto px-6 py-5 space-y-6 flex-1">
                {/* Basic Info */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <i className="fas fa-info-circle text-gold-500" />
                    <h4 className="text-sm font-semibold text-navy-800 uppercase tracking-wider">
                      Basic Information
                    </h4>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="label flex justify-between">
                        <span>
                          Title <span className="text-red-500">*</span>
                        </span>
                        <span
                          className={`text-xs ${formData.title.length > 100
                            ? "text-red-500"
                            : "text-slate-400"
                            }`}
                        >
                          {formData.title.length}/120
                        </span>
                      </label>
                      <input
                        type="text"
                        className={`input ${touched.title && validation.title
                          ? "border-red-500 focus:ring-red-500"
                          : ""
                          }`}
                        value={formData.title}
                        onChange={(e) =>
                          updateField("title", e.target.value.slice(0, 120))
                        }
                        onBlur={() =>
                          setTouched((t) => ({ ...t, title: true }))
                        }
                        placeholder="e.g. Community Cleanup Drive"
                        maxLength={120}
                      />
                      {touched.title && validation.title && (
                        <p className="text-xs text-red-500 mt-1">
                          <i className="fas fa-exclamation-circle mr-1" />
                          {validation.title}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="label flex justify-between">
                        <span>
                          Description <span className="text-red-500">*</span>
                        </span>
                        <span
                          className={`text-xs ${formData.description.length > 900
                            ? "text-red-500"
                            : "text-slate-400"
                            }`}
                        >
                          {formData.description.length}/1000
                        </span>
                      </label>
                      <textarea
                        className={`input min-h-[100px] ${touched.description && validation.description
                          ? "border-red-500 focus:ring-red-500"
                          : ""
                          }`}
                        rows={4}
                        value={formData.description}
                        onChange={(e) =>
                          updateField(
                            "description",
                            e.target.value.slice(0, 1000)
                          )
                        }
                        onBlur={() =>
                          setTouched((t) => ({ ...t, description: true }))
                        }
                        placeholder="Describe what will happen, who should attend, and any requirements."
                        maxLength={1000}
                      />
                      {touched.description && validation.description && (
                        <p className="text-xs text-red-500 mt-1">
                          <i className="fas fa-exclamation-circle mr-1" />
                          {validation.description}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="label">
                          Component <span className="text-red-500">*</span>
                        </label>

                        {isFaculty && facultyComponent ? (
                          <>
                            <div className="input bg-slate-50 cursor-not-allowed flex items-center gap-2">
                              <span
                                className={`badge ${getComponentBadge(
                                  facultyComponent
                                )}`}
                              >
                                {facultyComponent.toUpperCase()}
                              </span>
                              <span className="text-xs text-slate-400 ml-auto">
                                <i className="fas fa-lock mr-1" />
                                Locked
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">
                              <i className="fas fa-info-circle mr-1" />
                              Auto-detected from your faculty profile
                            </p>
                          </>
                        ) : (
                          <>
                            <select
                              className={`input ${touched.component_type &&
                                validation.component_type
                                ? "border-red-500 focus:ring-red-500"
                                : ""
                                }`}
                              value={formData.component_type}
                              onChange={(e) =>
                                updateField(
                                  "component_type",
                                  e.target.value as "cwts" | "rotc" | "lts"
                                )
                              }
                              onBlur={() =>
                                setTouched((t) => ({
                                  ...t,
                                  component_type: true,
                                }))
                              }
                            >
                              <option value="cwts">CWTS</option>
                              <option value="rotc">ROTC</option>
                              <option value="lts">LTS</option>
                            </select>
                            {touched.component_type &&
                              validation.component_type && (
                                <p className="text-xs text-red-500 mt-1">
                                  <i className="fas fa-exclamation-circle mr-1" />
                                  {validation.component_type}
                                </p>
                              )}
                            <p className="text-xs text-slate-400 mt-1">
                              <i className="fas fa-info-circle mr-1" />
                              Component is required. “All Components” is no
                              longer allowed.
                            </p>
                          </>
                        )}
                      </div>

                      <div>
                        <label className="label">Venue</label>
                        <input
                          type="text"
                          className="input"
                          value={formData.venue}
                          onChange={(e) =>
                            updateField("venue", e.target.value)
                          }
                          placeholder="e.g. Barangay Hall, Opol"
                        />
                        <p className="text-xs text-slate-400 mt-1">
                          <i className="fas fa-info-circle mr-1" />
                          Where students should go
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Schedule */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <i className="fas fa-calendar-alt text-gold-500" />
                    <h4 className="text-sm font-semibold text-navy-800 uppercase tracking-wider">
                      Schedule
                    </h4>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs text-slate-500 mb-2">
                      Quick presets:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-full text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                        onClick={() => {
                          updateField("start_datetime", quickStart(1, 8));
                          updateField("end_datetime", quickEnd(1, 17));
                        }}
                      >
                        <i className="fas fa-sun mr-1" /> Tomorrow (8AM - 5PM)
                      </button>
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-full text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                        onClick={() => {
                          updateField("start_datetime", quickStart(7, 8));
                          updateField("end_datetime", quickEnd(7, 17));
                        }}
                      >
                        <i className="fas fa-calendar-week mr-1" /> Next Week
                      </button>
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-full text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                        onClick={() => {
                          const start = new Date();
                          start.setHours(start.getHours() + 1, 0, 0, 0);
                          const end = new Date(start);
                          end.setHours(end.getHours() + 2);
                          updateField("start_datetime", toLocalDatetime(start));
                          updateField("end_datetime", toLocalDatetime(end));
                        }}
                      >
                        <i className="fas fa-bolt mr-1" /> Starting in 1 hour
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">
                        Start Date & Time{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        className={`input ${touched.start_datetime && validation.start_datetime
                          ? "border-red-500 focus:ring-red-500"
                          : ""
                          }`}
                        value={formData.start_datetime}
                        onChange={(e) =>
                          updateField("start_datetime", e.target.value)
                        }
                        onBlur={() =>
                          setTouched((t) => ({ ...t, start_datetime: true }))
                        }
                      />
                      {touched.start_datetime && validation.start_datetime && (
                        <p className="text-xs text-red-500 mt-1">
                          <i className="fas fa-exclamation-circle mr-1" />
                          {validation.start_datetime}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="label">
                        End Date & Time{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        className={`input ${touched.end_datetime && validation.end_datetime
                          ? "border-red-500 focus:ring-red-500"
                          : ""
                          }`}
                        value={formData.end_datetime}
                        onChange={(e) =>
                          updateField("end_datetime", e.target.value)
                        }
                        onBlur={() =>
                          setTouched((t) => ({ ...t, end_datetime: true }))
                        }
                        min={formData.start_datetime || undefined}
                      />
                      {touched.end_datetime && validation.end_datetime && (
                        <p className="text-xs text-red-500 mt-1">
                          <i className="fas fa-exclamation-circle mr-1" />
                          {validation.end_datetime}
                        </p>
                      )}
                    </div>
                  </div>

                  {durationPreview && (
                    <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
                      <i className="fas fa-check-circle text-emerald-600" />
                      <span className="text-sm text-emerald-700">
                        Duration: <strong>{durationPreview}</strong>
                      </span>
                    </div>
                  )}
                </section>

                {/* Participation */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <i className="fas fa-users text-gold-500" />
                    <h4 className="text-sm font-semibold text-navy-800 uppercase tracking-wider">
                      Participation
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">
                        Training Hours{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        className={`input ${touched.training_hours && validation.training_hours
                          ? "border-red-500 focus:ring-red-500"
                          : ""
                          }`}
                        min={1}
                        max={24}
                        value={formData.training_hours}
                        onChange={(e) =>
                          updateField(
                            "training_hours",
                            Math.max(1, parseInt(e.target.value) || 1)
                          )
                        }
                        onBlur={() =>
                          setTouched((t) => ({ ...t, training_hours: true }))
                        }
                      />
                      {touched.training_hours && validation.training_hours && (
                        <p className="text-xs text-red-500 mt-1">
                          <i className="fas fa-exclamation-circle mr-1" />
                          {validation.training_hours}
                        </p>
                      )}
                      <p className="text-xs text-slate-400 mt-1">
                        <i className="fas fa-info-circle mr-1" />
                        Hours credited to each attending student
                      </p>
                    </div>

                    <div>
                      <label className="label">
                        Max Participants
                        <span className="text-xs text-slate-400 ml-2">
                          (0 = unlimited)
                        </span>
                      </label>
                      <input
                        type="number"
                        className="input"
                        min={0}
                        value={formData.max_participants}
                        onChange={(e) =>
                          updateField(
                            "max_participants",
                            Math.max(0, parseInt(e.target.value) || 0)
                          )
                        }
                      />
                      {formData.max_participants === 0 ? (
                        <p className="text-xs text-emerald-600 mt-1">
                          <i className="fas fa-infinity mr-1" />
                          Unlimited participants
                        </p>
                      ) : (
                        <p className="text-xs text-slate-500 mt-1">
                          <i className="fas fa-users mr-1" />
                          Capacity: {formData.max_participants} students
                        </p>
                      )}
                    </div>
                  </div>
                </section>

                {/* Location */}
                <section>
                  <button
                    type="button"
                    className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
                    onClick={() =>
                      setShowLocationSection(!showLocationSection)
                    }
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${formData.latitude && formData.longitude
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-slate-200 text-slate-500"
                          }`}
                      >
                        <i className="fas fa-map-pin" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-navy-900">
                          Location Settings
                        </p>
                        <p className="text-xs text-slate-500">
                          {formData.latitude && formData.longitude
                            ? `Set (${formData.geofence_radius}m radius)`
                            : "Optional — enable to track attendance on a map"}
                        </p>
                      </div>
                    </div>
                    <i
                      className={`fas fa-chevron-${showLocationSection ? "up" : "down"
                        } text-slate-400 transition-transform`}
                    />
                  </button>

                  {showLocationSection && (
                    <div className="mt-4 space-y-4 pl-2">
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-start gap-2">
                        <i className="fas fa-info-circle text-blue-500 mt-0.5" />
                        <p className="text-xs text-blue-700">
                          Set the venue on the map. Students checking in must
                          be within the geofence radius. Only applicable for
                          face-recognition check-ins.
                        </p>
                      </div>

                      <LocationPicker
                        latitude={formData.latitude}
                        longitude={formData.longitude}
                        onLocationSelect={(lat, lng) => {
                          setFormData((prev) => ({
                            ...prev,
                            latitude: lat,
                            longitude: lng,
                          }));
                        }}
                        venueName={formData.venue}
                      />

                      <div>
                        <label className="label flex justify-between">
                          <span>Geofence Radius (meters)</span>
                          <span className="text-xs text-slate-500">
                            {formData.geofence_radius}m
                          </span>
                        </label>
                        <input
                          type="range"
                          min={10}
                          max={500}
                          step={10}
                          className="w-full accent-gold-500"
                          value={formData.geofence_radius}
                          onChange={(e) =>
                            updateField(
                              "geofence_radius",
                              parseInt(e.target.value)
                            )
                          }
                        />
                        <div className="flex justify-between text-xs text-slate-400 mt-1">
                          <span>10m</span>
                          <span className="text-slate-600 font-medium">
                            {formData.geofence_radius}m radius
                          </span>
                          <span>500m</span>
                        </div>
                      </div>

                      {formData.latitude && formData.longitude && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm w-full"
                          onClick={() => {
                            updateField("latitude", null);
                            updateField("longitude", null);
                          }}
                        >
                          <i className="fas fa-times-circle mr-1" />
                          Clear location
                        </button>
                      )}
                    </div>
                  )}
                </section>
              </div>

              <div className="modal-footer border-t border-slate-200 bg-white">
                <div className="flex items-center gap-3 mr-auto text-xs text-slate-500">
                  {!isValid ? (
                    <span className="text-amber-600">
                      <i className="fas fa-exclamation-triangle mr-1" />
                      {Object.keys(validation).length} field
                      {Object.keys(validation).length !== 1 ? "s" : ""} need
                      attention
                    </span>
                  ) : (
                    <span className="text-emerald-600">
                      <i className="fas fa-check-circle mr-1" />
                      Ready to save
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeModal}
                  disabled={createMut.isPending || updateMut.isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary min-w-[140px]"
                  disabled={createMut.isPending || updateMut.isPending}
                >
                  {createMut.isPending || updateMut.isPending ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-1" /> Saving...
                    </>
                  ) : editingId ? (
                    <>
                      <i className="fas fa-save mr-1" /> Update Activity
                    </>
                  ) : (
                    <>
                      <i className="fas fa-plus mr-1" /> Create Activity
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Activities;