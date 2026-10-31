// src/pages/faculty/ActivitiesMap.tsx

import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import { adminApi } from "../../services/api";
import RefreshButton from "../components/common/RefreshButton";
import toast from "react-hot-toast";

interface ActivityLocation {
  id: number;
  title: string;
  venue: string;
  latitude: number | null;
  longitude: number | null;
  geofence_radius: number;
  status: string;
  start_datetime: string;
  end_datetime: string;
  component_type: string;
  participants_count: number;
  creator: string;
  has_location: boolean;
}

type ViewMode = "list" | "grid";

const FacultyActivityMap: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id: urlId } = useParams<{ id: string }>();
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterComponent, setFilterComponent] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list"); // ✅ default = list

  // Fetch all activities
  const {
    data: activitiesData = [],
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["faculty-activities"],
    queryFn: () => adminApi.getActivities(),
    staleTime: 60000,
  });

  // Faculty component from user profile
  const facultyComponent = user?.nstp_component;

  // Normalize to array
  const allActivities: any[] = Array.isArray(activitiesData) ? activitiesData : [];

  // Filter activities: only those created by faculty AND matching their component
  const filteredActivities = useMemo(() => {
    return allActivities.filter((activity: any) => {
      if (activity.created_by !== user?.id) return false;
      if (
        facultyComponent &&
        activity.component_type !== facultyComponent &&
        activity.component_type !== "all"
      ) {
        return false;
      }
      if (filterStatus !== "all" && activity.status !== filterStatus) return false;
      if (filterComponent !== "all" && activity.component_type !== filterComponent)
        return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matches =
          (activity.title || "").toLowerCase().includes(q) ||
          (activity.venue || "").toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [
    allActivities,
    facultyComponent,
    user?.id,
    filterStatus,
    filterComponent,
    searchTerm,
  ]);

  // Activities with locations
  const activitiesWithLocation = useMemo(() => {
    return filteredActivities.filter((a: any) => a.latitude && a.longitude);
  }, [filteredActivities]);

  // URL-id resolution (not used for display here, kept for parity)
  const urlActivityId = urlId ? parseInt(urlId, 10) : null;
  const specificActivity =
    urlActivityId != null
      ? activitiesWithLocation.find((a: any) => a.id === urlActivityId)
      : null;

  const activities: ActivityLocation[] = useMemo(
    () =>
      activitiesWithLocation.map((a: any) => ({
        id: a.id,
        title: a.title,
        venue: a.venue || "No venue",
        latitude: a.latitude,
        longitude: a.longitude,
        geofence_radius: a.geofence_radius || 100,
        status: a.status,
        start_datetime: a.start_datetime,
        end_datetime: a.end_datetime,
        component_type: a.component_type,
        participants_count: a.participants_count || 0,
        creator: a.creator?.name || "Unknown",
        has_location: true,
      })),
    [activitiesWithLocation],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="spinner" />
        <span className="ml-3 text-slate-500">Loading activities...</span>
      </div>
    );
  }

  const hasActivitiesWithLocations = activities.length > 0;

  return (
    <div className="space-y-5">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold text-navy-900">
            <i className="fas fa-map-marked-alt text-gold-500 mr-2" />
            Location Monitor
          </h2>
          <p className="text-sm text-slate-500">
            Activities created by you with locations set
          </p>
        </div>
        <RefreshButton
          onRefresh={refetch}
          isLoading={isFetching}
          label="Refresh"
          className="btn-sm"
        />
      </div>

      {/* FILTERS + VIEW TOGGLE */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="search-box flex-1 min-w-[220px]">
            <i className="fas fa-search" />
            <input
              type="text"
              placeholder="Search by title or venue..."
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
            value={filterStatus}
            className="px-4 py-2.5 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={filterComponent}
            className="px-4 py-2.5 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
            onChange={(e) => setFilterComponent(e.target.value)}
          >
            <option value="all">All Components</option>
            <option value="cwts">CWTS</option>
            <option value="rotc">ROTC</option>
            <option value="lts">LTS</option>
          </select>

          {/* View toggle */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              type="button"
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
              type="button"
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1.5 ${viewMode === "grid"
                  ? "bg-white text-navy-900 shadow-sm"
                  : "text-slate-500 hover:text-navy-700"
                }`}
              onClick={() => setViewMode("grid")}
              title="Grid view"
            >
              <i className="fas fa-th" /> Grid
            </button>
          </div>
        </div>

        {(searchTerm ||
          filterStatus !== "all" ||
          filterComponent !== "all") && (
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Showing <strong>{activities.length}</strong> of{" "}
                {filteredActivities.length} activities with locations
              </span>
              <button
                className="text-gold-600 hover:text-gold-700"
                onClick={() => {
                  setSearchTerm("");
                  setFilterStatus("all");
                  setFilterComponent("all");
                }}
              >
                <i className="fas fa-times mr-1" /> Clear all filters
              </button>
            </div>
          )}
      </div>

      {/* EMPTY STATE */}
      {activities.length === 0 ? (
        <div className="empty-state bg-white rounded-xl border border-slate-200 p-8 text-center">
          <i className="fas fa-map-pin text-4xl text-slate-300 mb-3" />
          <h3 className="text-xl font-semibold text-navy-900 mb-2">
            No activities with locations
          </h3>
          <p className="text-slate-500 mb-4">
            Activities you create that have a venue location set will appear
            here. Edit an activity and set its location to enable monitoring.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/faculty/activities")}
          >
            <i className="fas fa-plus" /> Go to Activities
          </button>
        </div>
      ) : viewMode === "list" ? (
        /* ============================================================
           LIST VIEW (default)
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
                  <th>Location</th>
                  <th>Participants</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((activity) => {
                  const start = new Date(activity.start_datetime);
                  const end = new Date(activity.end_datetime);
                  const isSameDayEvent =
                    start.toDateString() === end.toDateString();

                  return (
                    <tr
                      key={activity.id}
                      className="group hover:bg-slate-50 transition-colors"
                    >
                      <td>
                        <div className="flex items-start gap-3 min-w-[220px]">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getStatusColor(
                              activity.status,
                            )} text-white`}
                          >
                            <i className="fas fa-map-pin" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-navy-900 truncate max-w-[260px]">
                              {activity.title}
                            </div>
                            <div className="text-xs text-slate-500 truncate max-w-[260px]">
                              <i className="fas fa-user mr-1" />
                              {activity.creator}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`badge ${getComponentBadge(
                            activity.component_type,
                          )}`}
                        >
                          {getComponentLabel(activity.component_type)}
                        </span>
                      </td>

                      <td>
                        <div className="text-sm text-navy-900 font-medium">
                          {start.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                        <div className="text-xs text-slate-500">
                          {start.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {isSameDayEvent
                            ? ` – ${end.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}`
                            : ` → ${end.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}`}
                        </div>
                      </td>

                      <td>
                        <div className="flex items-start gap-1.5 text-sm text-slate-700">
                          <i className="fas fa-map-marker-alt text-gold-500 mt-0.5" />
                          <span className="truncate max-w-[180px]">
                            {activity.venue}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                            <i className="fas fa-check-circle mr-1" />
                            Set
                          </span>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {activity.latitude?.toFixed(4)},{" "}
                            {activity.longitude?.toFixed(4)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            🎯 {activity.geofence_radius}m
                          </div>
                        </div>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
                          onClick={() =>
                            navigate(
                              `/faculty/activities/location/${activity.id}`,
                            )
                          }
                          title="View location map"
                        >
                          <i className="fas fa-users text-slate-400 text-xs" />
                          <span className="font-semibold text-sm text-navy-900">
                            {activity.participants_count}
                          </span>
                        </button>
                      </td>

                      <td>
                        <span
                          className={`badge ${getStatusBadge(
                            activity.status,
                          )}`}
                        >
                          {getStatusLabel(activity.status)}
                        </span>
                      </td>

                      <td>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            className="btn btn-info btn-sm"
                            onClick={() =>
                              navigate(
                                `/faculty/activities/location/${activity.id}`,
                              )
                            }
                            title="View Location Map"
                          >
                            <i className="fas fa-map-marked-alt" />
                          </button>
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
           GRID VIEW
           ============================================================ */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activities.map((activity) => {
            const hasLocation = activity.has_location;
            return (
              <div
                key={activity.id}
                className={`bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition-all cursor-pointer group ${hasLocation
                    ? "border-slate-200"
                    : "border-amber-200 bg-amber-50/30"
                  }`}
                onClick={() => {
                  if (hasLocation) {
                    navigate(`/faculty/activities/location/${activity.id}`);
                  } else {
                    toast("This activity doesn't have a location set yet", { icon: "ℹ️" });
                  }
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-navy-900 group-hover:text-gold-600 transition-colors">
                    {activity.title}
                  </h3>
                  <span
                    className={`badge ${getStatusColor(
                      activity.status,
                    )} text-white`}
                  >
                    {getStatusLabel(activity.status)}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mb-3">
                  <i className="fas fa-map-marker-alt text-gold-500 mr-1" />
                  {activity.venue}
                </p>
                <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                  <span>
                    <i className="fas fa-users mr-1" />
                    {activity.participants_count} participants
                  </span>
                  <span>
                    <i className="fas fa-tag mr-1" />
                    {getComponentLabel(activity.component_type)}
                  </span>
                  <span>
                    <i className="fas fa-calendar mr-1" />
                    {new Date(activity.start_datetime).toLocaleDateString()}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="badge badge-success">
                      <i className="fas fa-map-pin mr-1" /> Location Set
                    </span>
                    <span className="text-xs text-slate-400">
                      {activity.latitude?.toFixed(4)},{" "}
                      {activity.longitude?.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="btn btn-info btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(
                          `/faculty/activities/location/${activity.id}`,
                        );
                      }}
                    >
                      <i className="fas fa-eye" /> View Map
                    </button>
                  </div>
                </div>

                <div className="mt-2 text-xs text-slate-400">
                  <i className="fas fa-user mr-1" />
                  {activity.creator}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ============================================================
// Helpers
// ============================================================
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

export default FacultyActivityMap;