// src/pages/admin/Activities/ActivityMap.tsx

import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../../../services/api";
import RefreshButton from "../../components/common/RefreshButton";
import LocationPicker from "../../components/common/LocationPicker";
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

const ActivityMap: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterComponent, setFilterComponent] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [showEditLocationModal, setShowEditLocationModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<any>(null);

  // ============================================================
  // Fetch
  // ============================================================
 const {
  data: activitiesData,
  isLoading: activitiesLoading,
  refetch: refetchActivities,
  isFetching: activitiesRefreshing,
} = useQuery({
    queryKey: ["activities", "map", filterStatus, filterComponent],
    queryFn: () =>
      adminApi.getActivitiesWithLocations({
        status: filterStatus === "all" ? undefined : filterStatus,
        component: filterComponent === "all" ? undefined : filterComponent,
      }),
    staleTime: 30000,
  });

  const activities: ActivityLocation[] = activitiesData?.data || [];

  // ============================================================
  // Filter
  // ============================================================
  const filteredActivities = useMemo(() => {
    let list = activities;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          (a.venue || "").toLowerCase().includes(q) ||
          (a.creator || "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [activities, searchTerm]);

  // ============================================================
  // Mutations
  // ============================================================
  const updateLocationMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: {
        latitude: number;
        longitude: number;
        geofence_radius?: number;
      };
    }) => adminApi.updateActivityLocation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities", "map"] });
      toast.success("Activity location updated successfully!");
      setShowEditLocationModal(false);
      setEditingActivity(null);
      refetchActivities();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update location");
    },
  });

  // ============================================================
  // Handlers
  // ============================================================
  const handleActivitySelect = (activityId: number) => {
    navigate(`/admin/activities/location/${activityId}`);
  };

  const handleEditLocation = (activity: ActivityLocation) => {
    setEditingActivity(activity);
    setShowEditLocationModal(true);
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    if (editingActivity) {
      setEditingActivity({
        ...editingActivity,
        latitude: lat,
        longitude: lng,
      });
    }
  };

  const handleSaveLocation = () => {
    if (!editingActivity) return;
    updateLocationMutation.mutate({
      id: editingActivity.id,
      data: {
        latitude: editingActivity.latitude || 0,
        longitude: editingActivity.longitude || 0,
        geofence_radius: editingActivity.geofence_radius || 100,
      },
    });
  };

  // ============================================================
  // Display helpers
  // ============================================================
  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      upcoming: "bg-blue-100 text-blue-800",
      ongoing: "bg-amber-100 text-amber-800",
      completed: "bg-emerald-100 text-emerald-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return badges[status] || "bg-slate-100 text-slate-800";
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
      all: "All",
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

  if (activitiesLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="spinner" />
        <span className="ml-3 text-slate-500">Loading activities...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold text-navy-900">
            <i className="fas fa-map-marked-alt text-gold-500 mr-2" />
            Activity Location Monitor
          </h2>
          <p className="text-sm text-slate-500">
            Monitor student locations during activities
          </p>
        </div>
        <RefreshButton
          onRefresh={refetchActivities}
          isLoading={activitiesRefreshing}
          label="Refresh"
          className="btn-sm"
        />
      </div>

      {/* FILTERS + VIEW TOGGLE */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-wrap items-center gap-3">
          <div className="search-box flex-1 min-w-[220px]">
            <i className="fas fa-search" />
            <input
              type="text"
              placeholder="Search by title, venue, or creator..."
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
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
          </select>

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
                Showing <strong>{filteredActivities.length}</strong> of{" "}
                {activities.length} activities
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

      {/* EMPTY */}
      {filteredActivities.length === 0 ? (
        <div className="empty-state bg-white rounded-xl border border-slate-200">
          <i className="fas fa-calendar-plus text-4xl text-slate-300 block mb-3" />
          <p className="text-slate-500">
            {activities.length === 0
              ? "No activities found"
              : "No activities match your filters"}
          </p>
          {activities.length === 0 ? (
            <>
              <p className="text-sm text-slate-400">
                Create activities first to monitor locations
              </p>
              <button
                className="btn btn-primary mt-4"
                onClick={() => navigate("/admin/activities")}
              >
                <i className="fas fa-plus" /> Create Activity
              </button>
            </>
          ) : (
            <button
              className="btn btn-secondary mt-4"
              onClick={() => {
                setSearchTerm("");
                setFilterStatus("all");
                setFilterComponent("all");
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
                  <th>Location</th>
                  <th>Participants</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredActivities.map((activity) => {
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
                        {activity.has_location ? (
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
                              🎯 {activity.geofence_radius || 100}m
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                            <i className="fas fa-exclamation-triangle mr-1" />
                            Not set
                          </span>
                        )}
                      </td>

                      <td>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
                          onClick={() =>
                            activity.has_location &&
                            handleActivitySelect(activity.id)
                          }
                          disabled={!activity.has_location}
                          title={
                            activity.has_location
                              ? "View location map"
                              : "Set a location first"
                          }
                        >
                          <i className="fas fa-users text-slate-400 text-xs" />
                          <span className="font-semibold text-sm text-navy-900">
                            {activity.participants_count || 0}
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
                          {activity.has_location ? (
                            <>
                              <button
                                type="button"
                                className="btn btn-info btn-sm"
                                onClick={() =>
                                  handleActivitySelect(activity.id)
                                }
                                title="View Location Map"
                              >
                                <i className="fas fa-map-marked-alt" />
                              </button>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleEditLocation(activity)}
                                title="Edit Location"
                              >
                                <i className="fas fa-edit" />
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => handleEditLocation(activity)}
                              title="Set Location"
                            >
                              <i className="fas fa-plus mr-1" /> Set Location
                            </button>
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
           GRID VIEW
           ============================================================ */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredActivities.map((activity) => {
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
                    handleActivitySelect(activity.id);
                  } else {
                    handleEditLocation(activity);
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
                  {activity.venue || "No venue"}
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
                    {hasLocation ? (
                      <>
                        <span className="badge badge-success">
                          <i className="fas fa-map-pin mr-1" /> Location Set
                        </span>
                        <span className="text-xs text-slate-400">
                          {activity.latitude?.toFixed(4)},{" "}
                          {activity.longitude?.toFixed(4)}
                        </span>
                      </>
                    ) : (
                      <span className="badge badge-warning">
                        <i className="fas fa-exclamation-triangle mr-1" /> No
                        Location
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!hasLocation && (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditLocation(activity);
                        }}
                      >
                        <i className="fas fa-plus" /> Set Location
                      </button>
                    )}
                    {hasLocation && (
                      <button
                        type="button"
                        className="btn btn-info btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleActivitySelect(activity.id);
                        }}
                      >
                        <i className="fas fa-eye" /> View Map
                      </button>
                    )}
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

      {/* EDIT LOCATION MODAL */}
      {showEditLocationModal && editingActivity && (
        <div
          className="modal-overlay"
          onClick={() => setShowEditLocationModal(false)}
        >
          <div
            className="modal max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3>
                  <i className="fas fa-map-pin text-gold-500 mr-2" />
                  Set Location for: {editingActivity.title}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {editingActivity.venue || "No venue specified"}
                </p>
              </div>
              <button
                className="modal-close"
                onClick={() => setShowEditLocationModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700">
                  <i className="fas fa-info-circle mr-2" />
                  Search for a location or click on the map to set the activity
                  venue. Students will be tracked based on this location.
                </p>
              </div>

              <LocationPicker
  latitude={editingActivity.latitude}
  longitude={editingActivity.longitude}
  onLocationSelect={handleLocationSelect}
  venueName={editingActivity.venue}
  radius={editingActivity.geofence_radius || 100}
/>

              <div className="mt-4">
                <label className="label">
                  Geofence Radius (meters)
                  <span className="text-xs text-slate-400 ml-2">
                    (Default: 100m)
                  </span>
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    className="input w-32"
                    min={10}
                    max={1000}
                    value={editingActivity.geofence_radius || 100}
                    onChange={(e) =>
                      setEditingActivity({
                        ...editingActivity,
                        geofence_radius: parseInt(e.target.value) || 100,
                      })
                    }
                  />
                  <span className="text-sm text-slate-500">
                    Students within this radius will be marked as "Within
                    Geofence"
                  </span>
                </div>
                <div className="mt-2">
                  <input
                    type="range"
                    min={10}
                    max={500}
                    step={10}
                    className="w-full"
                    value={editingActivity.geofence_radius || 100}
                    onChange={(e) =>
                      setEditingActivity({
                        ...editingActivity,
                        geofence_radius: parseInt(e.target.value),
                      })
                    }
                  />
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>10m</span>
                    <span>{editingActivity.geofence_radius || 100}m</span>
                    <span>500m</span>
                  </div>
                </div>
              </div>

              {editingActivity.latitude && editingActivity.longitude && (
                <div className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-emerald-700 font-medium">
                        <i className="fas fa-check-circle mr-1" />
                        Location Set
                      </p>
                      <p className="text-xs text-emerald-600">
                        Lat: {editingActivity.latitude}, Lng:{" "}
                        {editingActivity.longitude}
                      </p>
                      <p className="text-xs text-emerald-600">
                        Geofence: {editingActivity.geofence_radius || 100}m
                      </p>
                    </div>
                    <a
                      href={`https://www.google.com/maps?q=${editingActivity.latitude},${editingActivity.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-info btn-sm"
                    >
                      <i className="fas fa-external-link-alt" /> View on Maps
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowEditLocationModal(false)}
                disabled={updateLocationMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveLocation}
                disabled={
                  !editingActivity.latitude ||
                  !editingActivity.longitude ||
                  updateLocationMutation.isPending
                }
              >
                {updateLocationMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save" /> Save Location
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityMap;