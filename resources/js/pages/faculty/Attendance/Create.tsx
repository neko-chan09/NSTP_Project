// src/pages/faculty/Attendance/Create.tsx

import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCreateAttendanceSession } from "../../hooks/useAttendance";
import { useSections } from "../../hooks/useOptions";
import { useQuery } from "@tanstack/react-query";
import { facultyApi } from "../../../services/api";
import LocationPicker from "../../components/common/LocationPicker";
import toast from "react-hot-toast";

interface AttendanceFormData {
  component: string;
  section: string;
  description: string;
  scheduled_start: string;
  scheduled_end: string;
  grace_period_minutes: number;
  require_location: boolean;
  latitude: number | null;
  longitude: number | null;
  geofence_radius: number;
  class_id?: number | null;
}

const CreateAttendanceSession: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedClassId = searchParams.get("class_id");
  const createMut = useCreateAttendanceSession();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const facultyComponent = user?.nstp_component || "";

  const { data: sections = [], isLoading: sectionsLoading } = useSections();

  // Fetch faculty's classes (to pre-fill class info when class_id is provided)
  const { data: facultyClasses = [] } = useQuery({
    queryKey: ["faculty", "classes"],
    queryFn: () => facultyApi.getClasses(),
    staleTime: 60000,
    enabled: !!preselectedClassId,
  });

  const preselectedClass = preselectedClassId
    ? facultyClasses.find((c: any) => c.id === parseInt(preselectedClassId))
    : null;

  const getDefaultStart = () => {
    const date = new Date();
    date.setMinutes(date.getMinutes() + 15);
    return date.toISOString().slice(0, 16);
  };

  const getDefaultEnd = () => {
    const date = new Date();
    date.setHours(date.getHours() + 2);
    return date.toISOString().slice(0, 16);
  };

  const [formData, setFormData] = useState<AttendanceFormData>({
    component: facultyComponent,
    section: "",
    description: "",
    scheduled_start: getDefaultStart(),
    scheduled_end: getDefaultEnd(),
    grace_period_minutes: 15,
    require_location: false,
    latitude: null,
    longitude: null,
    geofence_radius: 100,
    class_id: preselectedClassId ? parseInt(preselectedClassId) : null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // ============================================================
  // Pre-fill form when coming from a specific class
  // ============================================================
  useEffect(() => {
    if (preselectedClass) {
      const sectionName = preselectedClass.name
        ? preselectedClass.name.replace("Section ", "").replace(" - 2025", "")
        : "";

      setFormData((prev) => ({
        ...prev,
        component: preselectedClass.component_type || facultyComponent,
        section: sectionName || prev.section,
        class_id: preselectedClass.id,
        description:
          prev.description ||
          `Attendance session for ${preselectedClass.name}`,
      }));
    }
  }, [preselectedClass, facultyComponent]);

  const handleLocationSelect = (lat: number, lng: number) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));
    toast.success("Location set successfully!");
  };

  const handleGetCurrentLocation = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsGettingLocation(true);
    toast.loading("Getting your location...");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setFormData((prev) => ({
          ...prev,
          latitude: latitude,
          longitude: longitude,
        }));
        toast.dismiss();
        toast.success("Location set to your current position");
        setIsGettingLocation(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        toast.dismiss();
        toast.error("Unable to get your location. Please try searching.");
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    if (formData.require_location && !formData.latitude) {
      setFormData((prev) => ({
        ...prev,
        latitude: 8.521826076323629,
        longitude: 124.57249491758405,
      }));
    }
    if (!formData.require_location && formData.latitude) {
      setFormData((prev) => ({
        ...prev,
        latitude: null,
        longitude: null,
      }));
    }
  }, [formData.require_location]);

  const getComponentLabel = (component: string) => {
    const labels: Record<string, string> = {
      cwts: "CWTS",
      rotc: "ROTC",
      lts: "LTS",
    };
    return labels[component] || component.toUpperCase();
  };

  const getComponentColor = (component: string) => {
    const colors: Record<string, string> = {
      cwts: "bg-blue-500",
      rotc: "bg-red-500",
      lts: "bg-emerald-500",
    };
    return colors[component] || "bg-slate-500";
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.component) {
      toast.error(
        "No component assigned to your account. Please contact an administrator."
      );
      return;
    }

    if (!formData.section) {
      toast.error("Please select a section");
      return;
    }

    const start = new Date(formData.scheduled_start);
    const end = new Date(formData.scheduled_end);

    if (start >= end) {
      toast.error("End time must be after start time");
      return;
    }

    if (start <= new Date()) {
      toast.error("Start time must be in the future");
      return;
    }

    if (formData.require_location) {
      if (!formData.latitude || !formData.longitude) {
        toast.error("Please set a location for attendance");
        return;
      }
      if (formData.geofence_radius < 10) {
        toast.error("Geofence radius must be at least 10 meters");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Convert empty string fields to null to match Laravel validation rules
      const descriptionValue = formData.description
        ? formData.description
        : null;

      const payload: any = {
        component: formData.component || null,
        section: formData.section || null,
        description: descriptionValue,
        scheduled_start: formData.scheduled_start,
        scheduled_end: formData.scheduled_end,
        grace_period_minutes: formData.grace_period_minutes,
        is_scheduled: true,
        require_location: formData.require_location,
        latitude: formData.latitude,
        longitude: formData.longitude,
        geofence_radius: formData.geofence_radius,
      };

      // ✅ Attach class_id when coming from a specific class page
      if (formData.class_id) {
        payload.class_id = formData.class_id;
      }

      const result = await createMut.mutateAsync(payload);

      const startTime = new Date(formData.scheduled_start).toLocaleString();
      const endTime = new Date(formData.scheduled_end).toLocaleString();

      const locationMessage = formData.require_location
        ? `\n📍 Location restricted: ${formData.geofence_radius}m radius`
        : "";

      toast.success(
        `Attendance session scheduled!\n` +
        `📅 ${startTime} - ${endTime}${locationMessage}`
      );

      // If came from a class page, return to that class
      if (preselectedClassId) {
        setTimeout(() => {
          navigate(`/faculty/classes/${preselectedClassId}`);
        }, 1500);
      } else {
        setTimeout(() => {
          navigate("/faculty/classes");
        }, 1500);
      }
    } catch (error: any) {
      console.error("Error creating session:", error);
      toast.error(error.message || "Failed to create attendance session");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (preselectedClassId) {
      navigate(`/faculty/classes/${preselectedClassId}`);
    } else {
      navigate("/faculty/classes");
    }
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return "Not set";
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gold-100 flex items-center justify-center text-gold-600">
            <i className="fas fa-calendar-plus text-lg" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-navy-900">
              Schedule Attendance Session
            </h2>
            <p className="text-sm text-slate-500">
              {preselectedClass
                ? `Creating session for ${preselectedClass.name}`
                : "Set a date and time for your attendance session"}
            </p>
          </div>
        </div>

        {/* Class Info Banner */}
        {preselectedClass && (
          <div className="mb-5 p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-start gap-3">
            <i className="fas fa-chalkboard-teacher text-blue-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-blue-700 font-medium">
                Linked to: {preselectedClass.name}
              </p>
              <p className="text-xs text-blue-600">
                This session will be associated with this class.
                Students enrolled in this class will be able to check in.
              </p>
            </div>
            <span
              className={`badge ${preselectedClass.status === "active"
                ? "badge-success"
                : "badge-secondary"
                }`}
            >
              {preselectedClass.status?.toUpperCase()}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Component - Auto-filled */}
          <div className="form-group">
            <label className="label">
              Component <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                name="component"
                value={formData.component}
                onChange={handleChange}
                className="input pr-12 bg-slate-50 cursor-not-allowed"
                disabled
              >
                <option value="">Select Component</option>
                <option value="cwts">CWTS</option>
                <option value="rotc">ROTC</option>
                <option value="lts">LTS</option>
              </select>
              {formData.component && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <span
                    className={`badge ${getComponentColor(
                      formData.component
                    )} text-white px-3 py-1`}
                  >
                    {getComponentLabel(formData.component)}
                  </span>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              <i className="fas fa-info-circle text-gold-500 mr-1" />
              Component is auto-detected from your faculty profile
            </p>
          </div>

          {/* Section */}
          <div className="form-group">
            <label className="label">
              Section <span className="text-red-500">*</span>
            </label>
            {sectionsLoading ? (
              <div className="flex items-center gap-2 text-slate-500">
                <i className="fas fa-spinner fa-spin" />
                Loading sections...
              </div>
            ) : (
              <div>
                <select
                  name="section"
                  value={formData.section}
                  onChange={handleChange}
                  className="input"
                  required
                  disabled={sections.length === 0}
                >
                  <option value="">Select Section</option>
                  {sections.map((section) => (
                    <option key={section} value={section}>
                      Section {section}
                    </option>
                  ))}
                </select>
                {sections.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    <i className="fas fa-exclamation-triangle mr-1" />
                    No sections found in the system. Please add sections first.
                  </p>
                )}
                {formData.section && (
                  <p className="text-xs text-emerald-600 mt-1">
                    <i className="fas fa-check-circle mr-1" />
                    Selected: Section {formData.section}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">
                Start Date & Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="scheduled_start"
                value={formData.scheduled_start}
                onChange={handleChange}
                className="input"
                required
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
            <div className="form-group">
              <label className="label">
                End Date & Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="scheduled_end"
                value={formData.scheduled_end}
                onChange={handleChange}
                className="input"
                required
                min={formData.scheduled_start}
              />
            </div>
          </div>

          {/* Grace Period */}
          <div className="form-group">
            <label className="label">Grace Period (minutes)</label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                name="grace_period_minutes"
                value={formData.grace_period_minutes}
                onChange={handleChange}
                min="0"
                max="120"
                className="input w-32"
              />
              <span className="text-sm text-slate-500">
                Students checking in after this time will be marked as "Late"
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Default: 15 minutes. Students checking in within this period after
              start time are marked as "Present"
            </p>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="label">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="e.g. Morning session, Training Day 1"
              className="input min-h-[80px]"
              rows={3}
            />
          </div>

          {/* Location Section */}
          <div className="border-t border-slate-200 pt-4 mt-4">
            <div className="flex items-center gap-3 mb-3">
              <input
                type="checkbox"
                id="require_location"
                name="require_location"
                checked={formData.require_location}
                onChange={handleChange}
                className="w-5 h-5 accent-gold-500"
              />
              <label
                htmlFor="require_location"
                className="font-semibold text-navy-700"
              >
                <i className="fas fa-map-pin text-gold-500 mr-2" />
                Require Location for Attendance
              </label>
              <span className="text-xs text-slate-400">
                (Students must be within the geofence to check-in)
              </span>
            </div>

            {formData.require_location && (
              <div className="pl-8 space-y-4">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-600">
                    <i className="fas fa-info-circle mr-2" />
                    Set the location where students can check-in. Only students
                    within the geofence radius will be able to mark attendance.
                  </p>
                </div>

                <LocationPicker
  latitude={formData.latitude}
  longitude={formData.longitude}
  onLocationSelect={handleLocationSelect}
  venueName="Attendance Venue"
  radius={formData.geofence_radius}
  onRadiusChange={(r) =>
    setFormData((prev) => ({ ...prev, geofence_radius: r }))
  }
/>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm w-full flex items-center justify-center gap-2"
                  onClick={handleGetCurrentLocation}
                  disabled={isGettingLocation}
                >
                  <i
                    className={`fas ${isGettingLocation
                      ? "fa-spinner fa-spin"
                      : "fa-location-dot"
                      }`}
                  />
                  {isGettingLocation
                    ? "Getting location..."
                    : "Use My Current Location"}
                </button>

                <div className="form-group">
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
                      name="geofence_radius"
                      value={formData.geofence_radius}
                      onChange={handleChange}
                    />
                    <span className="text-sm text-slate-500">
                      Students within this radius can check-in
                    </span>
                  </div>
                  <div className="mt-2">
                    <input
                      type="range"
                      min={10}
                      max={500}
                      step={10}
                      className="w-full"
                      value={formData.geofence_radius}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          geofence_radius: parseInt(e.target.value),
                        })
                      }
                    />
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>10m</span>
                      <span>{formData.geofence_radius}m</span>
                      <span>500m</span>
                    </div>
                  </div>
                </div>

                {formData.latitude && formData.longitude && (
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-emerald-700 font-medium">
                          <i className="fas fa-check-circle mr-2" />
                          Location Set
                        </p>
                        <p className="text-xs text-emerald-600">
                          Lat: {formData.latitude.toFixed(6)}, Lng:{" "}
                          {formData.longitude.toFixed(6)}
                        </p>
                        <p className="text-xs text-emerald-600">
                          Geofence: {formData.geofence_radius}m radius
                        </p>
                      </div>
                      <a
                        href={`https://www.google.com/maps?q=${formData.latitude},${formData.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-info btn-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <i className="fas fa-external-link-alt" /> View on Maps
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Schedule Preview */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <i className="fas fa-clock text-blue-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-blue-700 font-medium">
                  Session Schedule
                </p>
                <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                  <div>
                    <span className="text-xs text-blue-600">Starts</span>
                    <p className="font-semibold text-blue-800">
                      {formatDateDisplay(formData.scheduled_start)}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-blue-600">Ends</span>
                    <p className="font-semibold text-blue-800">
                      {formatDateDisplay(formData.scheduled_end)}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-blue-600">Grace Period</span>
                    <p className="font-semibold text-blue-800">
                      {formData.grace_period_minutes} minutes
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-blue-600">Late Cutoff</span>
                    <p className="font-semibold text-blue-800">
                      {new Date(
                        new Date(formData.scheduled_start).getTime() +
                        (formData.grace_period_minutes || 15) * 60000
                      ).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                {formData.section && (
                  <div className="mt-2 text-xs text-blue-600">
                    Section: {formData.section}
                  </div>
                )}
                {preselectedClass && (
                  <div className="mt-2 text-xs text-blue-600">
                    <i className="fas fa-chalkboard-teacher mr-1" />
                    Class: {preselectedClass.name}
                  </div>
                )}
                {formData.require_location && formData.latitude && (
                  <div className="mt-2 text-xs text-emerald-600">
                    <i className="fas fa-map-pin mr-1" />
                    Location restricted: {formData.geofence_radius}m radius
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-start gap-3">
              <i className="fas fa-info-circle text-amber-500 mt-0.5" />
              <div>
                <p className="text-sm text-amber-700 font-medium">
                  How it works
                </p>
                <ul className="text-xs text-amber-600 mt-1 space-y-1 list-disc list-inside">
                  <li>Students can only check-in during the scheduled time</li>
                  <li>
                    Students checking in within the grace period are marked as
                    "Present"
                  </li>
                  <li>
                    Students checking in after the grace period are marked as
                    "Late"
                  </li>
                  <li>
                    The session code will be active during the scheduled time
                  </li>
                  {formData.require_location && (
                    <li className="text-emerald-600 font-medium">
                      <i className="fas fa-map-pin mr-1" />
                      Location restriction is enabled - students must be within{" "}
                      {formData.geofence_radius}m
                    </li>
                  )}
                  <li className="text-blue-600">
                    <i className="fas fa-info-circle mr-1" />
                    Section must be selected from the available list
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={handleCancel}
              className="btn btn-secondary flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={isSubmitting || !formData.component || !formData.section}
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  <i className="fas fa-calendar-check" />
                  Schedule Session
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Quick Tips */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 text-center">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mx-auto mb-2">
            <i className="fas fa-qrcode" />
          </div>
          <h4 className="text-sm font-semibold text-navy-900">Generate Code</h4>
          <p className="text-xs text-slate-500">
            Unique 6-digit code for students to check-in
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 text-center">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mx-auto mb-2">
            <i className="fas fa-clock" />
          </div>
          <h4 className="text-sm font-semibold text-navy-900">
            Scheduled Session
          </h4>
          <p className="text-xs text-slate-500">
            Students can only check-in during the scheduled time
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 text-center">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mx-auto mb-2">
            <i className="fas fa-hourglass-half" />
          </div>
          <h4 className="text-sm font-semibold text-navy-900">
            Late Detection
          </h4>
          <p className="text-xs text-slate-500">
            Students after grace period are marked as "Late"
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreateAttendanceSession;