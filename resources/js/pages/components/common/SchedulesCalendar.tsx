// src/components/common/SchedulesCalendar.tsx

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../../../services/api";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icon issues in Vite/React builds
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

interface ActivitySchedule {
  id: number;
  title: string;
  component_type: "cwts" | "rotc" | "lts" | "all";
  start_datetime: string;
  end_datetime: string;
  venue: string;
  latitude: number | null;
  longitude: number | null;
  geofence_radius: number;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
}

interface SchedulesCalendarProps {
  title: string;
  showActivities: boolean;
  showSessions: boolean;
}

const SchedulesCalendar: React.FC<SchedulesCalendarProps> = ({
  title,
  showActivities = true,
  showSessions = true,
}) => {
  const [activities, setActivities] = useState<ActivitySchedule[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<"all" | "upcoming" | "ongoing" | "completed">("all");

  // Fetch activities
  // Note: Fetch handled manually in useEffect below

  // Manual fetch effect
  useEffect(() => {
    if (!isLoading) return;

    const fetchData = async () => {
      try {
        if (showActivities) {
          const result = await adminApi.getActivitiesWithLocations({
            status: "all",
          });
          const upcoming = result.data?.filter((a: any) => {
            const start = new Date(a.start_datetime);
            const end = new Date(a.end_datetime);
            const now = new Date();
            return (now >= start && now <= end) || now < start;
          });
          setActivities(upcoming);
        }

        if (showSessions) {
          const sessionsResult = await adminApi.getAttendanceSessions();
          const activeSessions = (sessionsResult as any)?.data?.filter(
  (s: any) => s.status === "active"
) || [];
          setSessions(activeSessions);
        }
        setIsLoading(false);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Failed to load schedules");
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isLoading, showActivities, showSessions]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredActivities = activities.filter((a) => {
    if (filterType === "all") return true;
    const now = new Date();
    const start = new Date(a.start_datetime);
    const end = new Date(a.end_datetime);
    return (
      (filterType === "upcoming" && now < new Date(a.start_datetime)) ||
      (filterType === "ongoing" &&
        now >= new Date(a.start_datetime) && now <= new Date(a.end_datetime)) ||
      (filterType === "completed" && now > new Date(a.end_datetime))
    );
  });

  const filteredSessions = sessions.filter((s: any) => {
    if (filterType === "all") return true;
    const now = new Date();
    const start = new Date(s.scheduled_start || s.start_time);
    const end = new Date(s.scheduled_end || s.end_time);
    return (
      (filterType === "upcoming" && now < start) ||
      (filterType === "ongoing" && now >= start && now <= end) ||
      (filterType === "completed" && now > end)
    );
  });

  const renderActivities = () => {
    if (activities.length === 0) {
      return (
        <div className="text-center py-4 text-slate-500">
          <i className="fas fa-calendar-xmark text-2xl mb-2" />
          <p>No upcoming activities</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {filteredActivities.map((activity) => {
          const start = new Date(activity.start_datetime);
          const end = new Date(activity.end_datetime);
          const now = new Date();
          const isOngoing = now >= start && now <= end;
          const statusColor = isOngoing
            ? "bg-amber-500"
            : start > now
              ? "bg-blue-500"
              : "bg-emerald-500";
          const statusText = isOngoing
            ? "Ongoing"
            : start > now
              ? "Upcoming"
              : "Completed";

          return (
            <div
              key={activity.id}
              className={`p-3 rounded-lg border border-slate-200 ${isOngoing ? "bg-amber-50" : ""
                } transition-colors`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`badge badge-gold text-xs font-medium`}>
                    {activity.component_type}
                  </span>
                  <span className="text-xs text-slate-500">
                    {formatDate(activity.start_datetime)}
                  </span>
                </div>
                <span className={`text-xs font-medium ${statusColor} text-white`}>
                  {statusText}
                </span>
              </div>
              <p className="text-sm text-slate-700 line-clamp-1">
                {activity.title}
              </p>
              <p className="text-xs text-slate-500">
                {activity.venue || "No venue"} • {activity.geofence_radius ||
                  100}m geofence
              </p>
            </div>
          );
        })}
      </div>
    );
  };

  const renderSessions = () => {
    if (sessions.length === 0) {
      return (
        <div className="text-center py-4 text-slate-500">
          <i className="fas fa-calendar-xmark text-2xl mb-2" />
          <p>No active sessions</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {filteredSessions.map((session: any) => {
          const start = new Date(session.scheduled_start || session.start_time);
          const end = new Date(session.scheduled_end || session.end_time);
          const now = new Date();
          const isOngoing = now >= start && now <= end;
          const statusColor = isOngoing
            ? "bg-amber-500"
            : start > now
              ? "bg-blue-500"
              : "bg-emerald-500";
          const statusText = isOngoing
            ? "Ongoing"
            : start > now
              ? "Upcoming"
              : "Completed";

          return (
            <div
              key={session.id}
              className={`p-3 rounded-lg border border-slate-200 ${isOngoing ? "bg-amber-50" : ""
                } transition-colors`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-navy-900 font-mono">
                    Session #{session.id}
                  </span>
                  <span className="text-xs text-slate-500">
                    {formatDate(session.scheduled_start || session.start_time)}
                  </span>
                </div>
                <span className={`text-xs font-medium ${statusColor} text-white`}>
                  {statusText}
                </span>
              </div>
              <p className="text-sm text-slate-700 line-clamp-1">
                {session.class?.name ||
                  session.description ||
                  "Attendance Session"}
              </p>
              <p className="text-xs text-slate-500">
                {session.faculty_id
                  ? `Faculty #${session.faculty_id}`
                  : session.component?.toUpperCase() || "No component"}
                {session.logs_count != null && ` • ${session.logs_count} check-ins`}
              </p>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center">
        <div>
          <h5 className="font-semibold text-navy-900">{title}</h5>
          <p className="text-xs text-slate-500">
            {activities.length} activities • {sessions.length} sessions
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${filterType === "all" ? "bg-slate-100 text-slate-600 hover:bg-slate-200" : ""
              }`}
            onClick={() => setFilterType("all")}
          >
            All
          </button>
          <button
            className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${filterType === "upcoming" ? "bg-blue-100 text-blue-600 hover:bg-blue-200" : ""
              }`}
            onClick={() => setFilterType("upcoming")}
          >
            Upcoming
          </button>
          <button
            className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${filterType === "ongoing" ? "bg-amber-100 text-amber-600 hover:bg-amber-200" : ""
              }`}
            onClick={() => setFilterType("ongoing")}
          >
            Ongoing
          </button>
          <button
            className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${filterType === "completed" ? "bg-emerald-100 text-emerald-600 hover:bg-emerald-200" : ""
              }`}
            onClick={() => setFilterType("completed")}
          >
            Completed
          </button>
        </div>
      </div>

      {showActivities && <div>{renderActivities()}</div>}
      {showSessions && <div>{renderSessions()}</div>}
    </div>
  );
};

export default SchedulesCalendar;