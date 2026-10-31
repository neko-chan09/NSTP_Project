// src/pages/faculty/ActivityLocationView.tsx

import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import { adminApi } from "../../services/api";
import toast from "react-hot-toast";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icon issues in Vite/React builds
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

interface ActivityLocation {
  id: number;
  title: string;
  venue: string;
  latitude: number;
  longitude: number;
  geofence_radius: number;
  status: string;
  start_datetime: string;
  end_datetime: string;
  component_type: string;
  total_participants: number;
  checked_in_participants: number;
}

interface ParticipantLocation {
  id: number;
  student_id: string;
  student_name: string;
  latitude: number | null;
  longitude: number | null;
  check_in_at: string;
  attendance_status: string;
  is_within_geofence: boolean | null;
  distance_from_venue: number | null;
  profile_photo: string | null;
}

interface ActivityLocationData {
  activity: ActivityLocation;
  participants: ParticipantLocation[];
  stats: {
    total_participants: number;
    checked_in_with_location: number;
    within_geofence: number;
    outside_geofence: number;
  };
}

type FilterType = "all" | "within" | "outside";

const FacultyActivityLocationView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isFaculty, isAdmin, isSuperAdmin, user } = useAuth();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>("all");

  // Access control: faculty can view their own activities
  const canAccess = isFaculty ? true : isAdmin || isSuperAdmin ? "viewer" : false;

  // Fetch activity location data
  const { data: responseData, isLoading, refetch } = useQuery<ActivityLocationData>({
    queryKey: ["activity", id, "location"],
    queryFn: async () => {
  const result = await adminApi.getActivityLocation(parseInt(id!));
  return result;
},
    enabled: !!id && !isNaN(parseInt(id)),
    staleTime: 30000,
    retry: 1,
  });

  const activity = responseData?.activity;
  const participants = responseData?.participants || [];

  // Filter participants by geofence status
  const filteredParticipants = participants.filter((p) => {
    if (filterType === "within") return p.is_within_geofence === true;
    if (filterType === "outside") return p.is_within_geofence === false;
    return true;
  });

  // Track error state
  const [error, setError] = useState<string | null>(null);

  // (error state handled by useQuery)

  // Main Leaflet Map Initialization and Layer Synchronization Effect
  useEffect(() => {
    if (!activity || !mapContainerRef.current) return;

    // Initialize map instance once
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [venueLat, venueLng],
        zoom: 16,
        zoomControl: false,
        dragging: true,
        touchZoom: false,
        doubleClickZoom: false,
        scrollWheelZoom: false,
        boxZoom: false,
        keyboard: true,
        attributionControl: true,
      });

      // Disable scroll wheel behavior explicitly
      map.on("wheel", (e: any) => {
        e.originalEvent.preventDefault();
        e.originalEvent.stopPropagation();
        return false;
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: "topright" }).addTo(map);

      mapInstanceRef.current = map;
      setMapLoaded(true);
    }

    const map = mapInstanceRef.current;

    // Force Leaflet to recalculate canvas height/width on load
    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    // Clear previous markers/circles prior to re-drawing
    map.eachLayer((layer: any) => {
      if (layer instanceof L.Marker || layer instanceof L.Circle) {
        map.removeLayer(layer);
      }
    });

    // ===== 1. VENUE MARKER =====
    const venueIcon = L.divIcon({
      className: "custom-venue-marker cursor-pointer",
      html: `<div class="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg border-2 border-white hover:scale-110 transition-transform cursor-pointer">
              <i class="fas fa-map-pin"></i>
            </div>`,
      iconSize: [48, 48],
      iconAnchor: [24, 48],
      popupAnchor: [0, -48],
    });

    const venueMarker = L.marker([venueLat, venueLng], { icon: venueIcon }).addTo(map);

    const venuePopupContent = `
      <div class="text-center min-w-[200px]">
        <strong class="text-slate-800 text-lg block">${activity.title}</strong>
        <span class="text-sm text-slate-500 block">${activity.venue || "Venue"}</span>
        <hr class="my-2 border-slate-200" />
        <span class="text-xs text-slate-400 block">
          📍 ${venueLat.toFixed(6)}, ${venueLng.toFixed(6)}
        </span>
        <span class="text-xs text-emerald-600 block">
          🎯 Geofence: ${activity.geofence_radius || 100}m
        </span>
      </div>
    `;

    venueMarker.bindPopup(venuePopupContent);

    // ===== 2. GEOFENCE CIRCLE =====
    if (activity.geofence_radius) {
      const circle = L.circle([venueLat, venueLng], {
        radius: Number(activity.geofence_radius),
        color: "#D4AF37",
        fillColor: "#D4AF37",
        fillOpacity: 0.1,
        weight: 2,
        dashArray: "5, 5",
      }).addTo(map);

      circle.bindPopup(`
        <div class="text-center">
          <span class="text-sm text-slate-800 font-semibold">Geofence Boundary</span><br />
          <span class="text-xs text-slate-500">Radius: ${activity.geofence_radius}m</span>
        </div>
      `);
    }

    // ===== 3. STUDENT MARKERS =====
    const allLatLngs: [number, number][] = [[venueLat, venueLng]];

    participants.forEach((participant) => {
      const pLat = Number(participant.latitude);
      const pLng = Number(participant.longitude);

      if (
        participant.latitude === null ||
        participant.longitude === null ||
        isNaN(pLat) ||
        isNaN(pLng) ||
        (pLat === 0 && pLng === 0)
      ) {
        return;
      }

      allLatLngs.push([pLat, pLng]);

      const isWithin = participant.is_within_geofence === true;
      const color = isWithin ? "#22C55E" : "#EF4444";
      const statusText = isWithin ? "Within Geofence ✅" : "Outside Geofence ❌";

      const studentIcon = L.divIcon({
        className: "custom-student-marker cursor-pointer",
        html: `<div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md border-2 border-white hover:scale-110 transition-transform cursor-pointer" 
                     style="background-color: ${color}">
                    ${participant.student_name.charAt(0)}
                  </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([pLat, pLng], { icon: studentIcon }).addTo(map);

      const studentPopupContent = `
        <div class="text-center min-w-[180px]">
          <div class="flex items-center gap-2 justify-center mb-2">
            ${
              participant.profile_photo
                ? `<img src="${participant.profile_photo}" class="w-10 h-10 rounded-full object-cover border-2 border-amber-500" />`
                : `<div class="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-sm">${participant.student_name.charAt(0)}</div>`
            }
            <div>
              <strong class="text-slate-800 block">${participant.student_name}</strong>
              <span class="text-xs text-slate-500">${participant.student_id}</span>
            </div>
          </div>
          <hr class="my-2 border-slate-200" />
          <span class="text-xs ${isWithin ? "text-emerald-600" : "text-red-600"} block font-semibold">
            ${statusText}
          </span>
          <span class="text-xs text-slate-500 block">
            📏 ${participant.distance_from_venue ? Math.round(participant.distance_from_venue) : 0}m from venue
          </span>
          <span class="text-xs text-slate-400 block">
            📍 ${pLat.toFixed(6)}, ${pLng.toFixed(6)}
          </span>
        </div>
      `;

      marker.bindPopup(studentPopupContent);
    });

    // Automatically zoom/fit bounds to view venue + all student markers
    if (allLatLngs.length > 1) {
      const bounds = L.latLngBounds(allLatLngs);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [activity, participants]);

  // Clean up Leaflet map instance on component unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const zoomToVenueLocation = () => {
    if (mapInstanceRef.current && activity?.latitude && activity?.longitude) {
      mapInstanceRef.current.flyTo([Number(activity.latitude), Number(activity.longitude)], 18, {
        duration: 1.2,
      });
    }
  };

  const scrollToParticipant = (studentId: string) => {
    const element = document.getElementById(`participant-${studentId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.style.backgroundColor = "#FEF3C7";
      setTimeout(() => {
        element.style.backgroundColor = "";
      }, 3000);
    }
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
      all: "All Components",
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="spinner" />
        <span className="ml-3 text-slate-500">Loading activity location...</span>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="text-center py-12">
        <i className="fas fa-map-pin text-4xl text-slate-300 block mb-3" />
        <p className="text-slate-500">Activity not found</p>
        <p className="text-sm text-slate-400 mt-2">{error || "The activity could not be loaded"}</p>
        <button className="btn btn-primary mt-4" onClick={() => navigate("/faculty/activities/map")}>
          <i className="fas fa-arrow-left mr-2" /> Go Back
        </button>
      </div>
    );
  }

  // Access denied: user cannot view this activity's location monitor
  if (!canAccess) {
    return (
      <div className="text-center py-12">
        <i className="fas fa-lock text-4xl text-slate-300 block mb-3" />
        <p className="text-slate-500">Access Denied</p>
        <p className="text-sm text-slate-400 mt-2">You do not have permission to view the location monitor for this activity.</p>
        <button className="btn btn-primary mt-4" onClick={() => navigate("/faculty/activities/map")}>
          <i className="fas fa-arrow-left mr-2" /> Go to Activities
        </button>
      </div>
    );
  }

  // Admin/SuperAdmin as viewer mode
  if (canAccess === "viewer") {
    return (
      <div className="text-center py-12">
        <i className="fas fa-eye text-4xl text-amber-500 block mb-3" />
        <p className="text-slate-500">Viewer Mode</p>
        <p className="text-sm text-slate-400 mt-2">You are viewing this activity's location monitor in read-only mode. Faculty have full control over geofence settings and participant tracking.</p>
        <button className="btn btn-primary mt-4" onClick={() => navigate("/faculty/activities/map")}>
          <i className="fas fa-arrow-left mr-2" /> Go to Activities
        </button>
      </div>
    );
  }

  // Show default map centered on Opol Community College when activity has no coordinates
  const hasActivityCoords = activity.latitude && activity.longitude;
  const venueLat = hasActivityCoords ? Number(activity.latitude) : 8.521826076323629;
  const venueLng = hasActivityCoords ? Number(activity.longitude) : 124.57249491758405;

  // Faculty can only view location monitor for activities they created
  const outsideCount = participants.filter((p) => p.is_within_geofence === false).length;
  

  // Count participants within geofence
  const withinCount = participants.filter((p) => p.is_within_geofence === true).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <button className="btn btn-secondary btn-sm" onClick={() => navigate("/faculty/activities/map")}>
            <i className="fas fa-arrow-left" /> Back
          </button>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">{activity.title}</h3>
            <p className="text-sm text-slate-500 flex items-center gap-2">
              <span>{activity.venue || "No venue specified"}</span>
              <span className={`badge ${getStatusColor(activity.status)} text-white`}>
                {getStatusLabel(activity.status)}
              </span>
              <span className="badge badge-secondary">{getComponentLabel(activity.component_type)}</span>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary btn-sm" onClick={() => refetch()}>
            <i className="fas fa-sync" /> Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-slate-600">
          <span className="block text-xs text-slate-500">Total Participants</span>
          <span className="text-2xl font-bold text-slate-800">{activity.total_participants || participants.length}</span>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-blue-500">
          <span className="block text-xs text-slate-500">With Location</span>
          <span className="text-2xl font-bold text-slate-800">
            {participants.filter((p) => p.latitude !== null && p.longitude !== null).length}
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-emerald-500">
          <span className="block text-xs text-slate-500">Within Geofence</span>
          <span className="text-2xl font-bold text-emerald-600">{withinCount}</span>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-red-500">
          <span className="block text-xs text-slate-500">Outside Geofence</span>
          <span className="text-2xl font-bold text-red-600">{outsideCount}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-slate-700">Filter by:</span>
          <div className="flex gap-2">
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filterType === "all" ? "bg-slate-800 text-white shadow-md" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
              onClick={() => setFilterType("all")}
            >
              All ({participants.length})
            </button>
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filterType === "within" ? "bg-emerald-600 text-white shadow-md" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
              onClick={() => setFilterType("within")}
            >
              ✅ Within ({withinCount})
            </button>
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filterType === "outside" ? "bg-red-600 text-white shadow-md" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
              onClick={() => setFilterType("outside")}
            >
              ❌ Outside ({outsideCount})
            </button>
          </div>
          {filterType !== "all" && (
            <button className="text-xs text-slate-400 hover:text-slate-600 ml-auto" onClick={() => setFilterType("all")}>
              <i className="fas fa-times" /> Clear filter
            </button>
          )}
        </div>
      </div>

      {/* Venue Info Header & Action Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-amber-50/70 px-4 py-3 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white shadow-md">
                <i className="fas fa-map-pin text-lg" />
              </div>
              <div>
                <div className="font-semibold text-slate-800 flex items-center gap-2">
                  📍 Venue Location
                  <span className="badge badge-gold text-xs">Click to Zoom</span>
                </div>
                <div className="text-sm text-slate-600">
                  {activity.venue || "Venue"} • {Number(activity.latitude).toFixed(6)}, {Number(activity.longitude).toFixed(6)}
                </div>
              </div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={zoomToVenueLocation}>
              <i className="fas fa-search-plus mr-1" /> Zoom to Venue
            </button>
          </div>
        </div>

        {/* Participants Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="p-3">Student</th>
                <th className="p-3">Student ID</th>
                <th className="p-3">Attendance Status</th>
                <th className="p-3">Coordinates</th>
                <th className="p-3">Distance</th>
                <th className="p-3">Attendance Time</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {!filteredParticipants || filteredParticipants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
                    {filterType === "all"
                      ? "No participants checked in with location yet"
                      : filterType === "within"
                      ? "No participants within the geofence"
                      : "No participants outside the geofence"}
                  </td>
                </tr>
              ) : (
                filteredParticipants.map((participant) => (
                  <tr
                    key={participant.id}
                    id={`participant-${participant.student_id}`}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 flex-shrink-0">
                          {participant.profile_photo ? (
                            <img src={participant.profile_photo} alt={participant.student_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-xs text-white bg-slate-700">
                              {participant.student_name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <span className="font-medium text-slate-800">{participant.student_name}</span>
                      </div>
                    </td>
                    <td className="p-3 font-bold text-slate-700">{participant.student_id}</td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          participant.is_within_geofence ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {participant.is_within_geofence ? "✅ Within" : "❌ Outside"}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-slate-600 font-mono">
                      {participant.latitude ? Number(participant.latitude).toFixed(4) : "N/A"},{" "}
                      {participant.longitude ? Number(participant.longitude).toFixed(4) : "N/A"}
                    </td>
                    <td className="p-3">
                      <span
                        className={`font-medium ${
                          (participant.distance_from_venue || 0) <= (activity.geofence_radius || 100)
                            ? "text-emerald-600"
                            : "text-red-600"
                        }`}
                      >
                        {participant.distance_from_venue ? Math.round(participant.distance_from_venue) : 0}m
                      </span>
                    </td>
                    <td className="p-3 text-sm text-slate-600">
                      {participant.check_in_at ? new Date(participant.check_in_at).toLocaleString() : "N/A"}
                    </td>
                    <td className="p-3">
                      <button
                        className="btn btn-sm bg-blue-50 text-blue-600 hover:bg-blue-100"
                        onClick={() => {
                          if (mapInstanceRef.current && participant.latitude && participant.longitude) {
                            mapInstanceRef.current.flyTo([Number(participant.latitude), Number(participant.longitude)], 18, {
                              duration: 1.2,
                            });
                          }
                          scrollToParticipant(participant.student_id);
                        }}
                      >
                        <i className="fas fa-search-location mr-1" /> Zoom
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Map Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h4 className="font-semibold text-slate-800">
              <i className="fas fa-map-pin text-amber-500 mr-2" />
              Venue Location Map
            </h4>
            <p className="text-xs text-slate-400">Click on markers to view details • Drag to pan map</p>
          </div>
          <div className="flex gap-2">
            <span className="badge badge-success flex items-center gap-1">
              <i className="fas fa-circle text-[8px]" /> Within Geofence
            </span>
            <span className="badge badge-danger flex items-center gap-1">
              <i className="fas fa-circle text-[8px]" /> Outside Geofence
            </span>
            <span className="badge badge-gold flex items-center gap-1">
              <i className="fas fa-map-pin" /> Venue
            </span>
          </div>
        </div>

        <div className="relative">
          <div ref={mapContainerRef} className="h-[500px] w-full bg-slate-100" style={{ minHeight: "500px" }} />

          {!mapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-100/80">
              <div className="text-center">
                <i className="fas fa-spinner fa-spin text-3xl text-amber-500 mb-2" />
                <p className="text-sm text-slate-500">Loading map...</p>
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-amber-500 border-2 border-white shadow-md" />
              <span className="text-slate-600">Venue Location</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-md" />
              <span className="text-slate-600">Student (Within Geofence)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-md" />
              <span className="text-slate-600">Student (Outside Geofence)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full border-2 border-amber-500 border-dashed" />
              <span className="text-slate-600">Geofence ({activity.geofence_radius || 100}m)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyActivityLocationView;