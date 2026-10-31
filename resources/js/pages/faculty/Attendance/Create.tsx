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

// ============================================================
// Local datetime helper — "YYYY-MM-DDTHH:mm" for <input type=datetime-local>
// ============================================================
const toLocalInput = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate(),
  )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

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

  // Default start: 15 minutes from now
  const getDefaultStart = () => {
    const date = new Date();
    date.setMinutes(date.getMinutes() + 15);
    return toLocalInput(date);
  };

  // Default end: +1 hour from now
  const getDefaultEnd = () => {
    const date = new Date();
    date.setHours(date.getHours() + 1);
    return toLocalInput(date);
  };

  const [formData, setFormData] = useState<AttendanceFormData>({
    component: facultyComponent,
    section: "",
    description: "",
    scheduled_start: getDefaultStart(),
    scheduled_end: getDefaultEnd(),
    grace_period_minutes: 15,
    require_location: true, // location is mandatory
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

  // ============================================================
  // Quick duration presets — set End based on current Start
  // ============================================================
  const applyDurationPreset = (minutes: number) => {
    const start = formData.scheduled_start
      ? new Date(formData.scheduled_start)
      : new Date();

    if (isNaN(start.getTime())) {
      toast.error("Please set a valid start time first");
      return;
    }

    const end = new Date(start.getTime() + minutes * 60_000);
    setFormData((prev) => ({
      ...prev,
      scheduled_end: toLocalInput(end),
    }));

    const label =
      minutes < 60
        ? `${minutes} min`
        : minutes % 60 === 0
          ? `${minutes / 60} hr`
          : `${Math.floor(minutes / 60)} hr ${minutes % 60} min`;
    toast.success(`End time set to +${label}`);
  };

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
      { enableHighAccuracy: true },
    );
  };

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
    >,
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    const numericFields = ["geofence_radius", "grace_period_minutes"];

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : numericFields.includes(name)
            ? value === ""
              ? 0
              : parseInt(value, 10)
            : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Location is checked FIRST
    if (!hasLocation) {
      toast.error("Please pick and confirm a location first");
      return;
    }

    if (formData.geofence_radius < 10) {
      toast.error("Geofence radius must be at least 10 meters");
      return;
    }

    if (!formData.component) {
      toast.error(
        "No component assigned to your account. Please contact an administrator.",
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

    setIsSubmitting(true);

    try {
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
        require_location: true,
        latitude: formData.latitude,
        longitude: formData.longitude,
        geofence_radius: formData.geofence_radius,
      };

      if (formData.class_id) {
        payload.class_id = formData.class_id;
      }

      await createMut.mutateAsync(payload);

      const startTime = new Date(formData.scheduled_start).toLocaleString();
      const endTime = new Date(formData.scheduled_end).toLocaleString();

      const locationMessage = `\n📍 Location restricted: ${formData.geofence_radius}m radius`;

      toast.success(
        `Attendance session scheduled!\n` +
          `📅 ${startTime} - ${endTime}${locationMessage}`,
      );

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

  const getDurationLabel = () => {
    if (!formData.scheduled_start || !formData.scheduled_end) return "—";
    const s = new Date(formData.scheduled_start);
    const e = new Date(formData.scheduled_end);
    if (e <= s) return "—";
    const mins = Math.round((e.getTime() - s.getTime()) / 60000);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  const lateCutoff = new Date(
    new Date(formData.scheduled_start).getTime() +
      (formData.grace_period_minutes || 15) * 60000,
  ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // Location must be picked & confirmed before anything else can be filled in
  const hasLocation =
    formData.latitude !== null &&
    formData.longitude !== null &&
    !isNaN(formData.latitude) &&
    !isNaN(formData.longitude);

  const canSubmit =
    !isSubmitting && hasLocation && !!formData.component && !!formData.section;

  // Reusable section heading
  const SectionHeading = ({
    step,
    icon,
    title,
    desc,
    right,
  }: {
    step: number;
    icon: string;
    title: string;
    desc: string;
    right?: React.ReactNode;
  }) => (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="flex items-start gap-3.5">
        <div className="w-9 h-9 rounded-full bg-navy-900 text-white text-sm font-semibold flex items-center justify-center shrink-0">
          {step}
        </div>
        <div>
          <h2 className="text-base font-semibold text-navy-900 flex items-center gap-2">
            <i className={`fas ${icon} text-gold-500 text-sm`} />
            {title}
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">{desc}</p>
        </div>
      </div>
      {right}
    </div>
  );

  return (
    <div className="w-full max-w-7xl mx-auto pb-28 lg:pb-12">
      {/* ── Breadcrumb ─────────────────────────────────────── */}
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-4">
        <button
          type="button"
          onClick={handleCancel}
          className="inline-flex items-center gap-1.5 hover:text-navy-900 transition-colors"
        >
          <i className="fas fa-arrow-left text-xs" />
          {preselectedClass ? preselectedClass.name : "Classes"}
        </button>
        <i className="fas fa-chevron-right text-[10px] text-slate-300" />
        <span className="text-navy-900 font-medium">Schedule session</span>
      </nav>

      {/* ── Page header ────────────────────────────────────── */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="flex items-start gap-4 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <i className="fas fa-calendar-plus text-lg" />
          </div>
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-navy-900 tracking-tight">
              Schedule Attendance Session
            </h1>
            <p className="text-slate-500 mt-1">
              {preselectedClass
                ? `Creating a session for ${preselectedClass.name}`
                : "Pick the venue first, then set the time window for student check-in"}
            </p>
          </div>
        </div>

        {preselectedClass && (
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="inline-flex items-center gap-2 text-sm text-slate-600">
              <i className="fas fa-link text-slate-400" />
              Linked class
            </span>
            <span
              className={`badge ${
                preselectedClass.status === "active"
                  ? "badge-success"
                  : "badge-secondary"
              }`}
            >
              {preselectedClass.status?.toUpperCase()}
            </span>
          </div>
        )}
      </header>

      <form
        id="attendance-form"
        onSubmit={handleSubmit}
        className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-10"
      >
        {/* ════════════ MAIN COLUMN ════════════ */}
        <div className="lg:col-span-8 divide-y divide-slate-200">
          {/* ── 1. Location (REQUIRED, first) ───────────────── */}
          <section className="pb-10">
            <SectionHeading
              step={1}
              icon="fa-map-marker-alt"
              title="Pick the venue location"
              desc="Required — choose and confirm where students must be to check in."
              right={
                hasLocation ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                    <i className="fas fa-check-circle" />
                    Location set
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200 shrink-0">
                    <i className="fas fa-exclamation-circle" />
                    Required
                  </span>
                )
              }
            />

            <div className="space-y-5 lg:pl-[50px]">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-blue-50/70 border border-blue-100">
                <i className="fas fa-info-circle text-blue-500 mt-0.5 shrink-0" />
                <p className="text-sm text-blue-700 leading-relaxed">
                  Click the map (or search / use your current position), then
                  press <strong>Confirm Location</strong>. The rest of the form
                  unlocks once a location is confirmed. Only students within the
                  radius can mark attendance.
                </p>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                <div className="xl:col-span-3 rounded-xl overflow-hidden border border-slate-200">
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
                </div>

                <div className="xl:col-span-2 space-y-5">
                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    disabled={isGettingLocation}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                               text-sm font-medium text-slate-700 bg-white border border-slate-200
                               hover:bg-slate-50 hover:border-slate-300
                               focus:outline-none focus:ring-2 focus:ring-slate-200
                               disabled:opacity-60 transition-colors"
                  >
                    <i
                      className={`fas ${
                        isGettingLocation
                          ? "fa-spinner fa-spin"
                          : "fa-location-crosshairs"
                      }`}
                    />
                    {isGettingLocation
                      ? "Getting location…"
                      : "Use my current location"}
                  </button>

                  {/* Geofence radius */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-slate-700">
                        Geofence radius
                      </label>
                      <span className="text-sm font-semibold text-navy-800 tabular-nums">
                        {formData.geofence_radius} m
                      </span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={500}
                      step={10}
                      value={formData.geofence_radius}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          geofence_radius: parseInt(e.target.value),
                        }))
                      }
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-gold-500"
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                      <span>10 m</span>
                      <span>500 m</span>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <input
                        type="number"
                        min={10}
                        max={1000}
                        name="geofence_radius"
                        value={formData.geofence_radius}
                        onChange={handleChange}
                        className="input w-28"
                      />
                      <span className="text-xs text-slate-500">
                        Students inside this circle can check in
                      </span>
                    </div>
                  </div>

                  {/* Location confirmation */}
                  {hasLocation ? (
                    <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-emerald-800 flex items-center gap-2">
                          <i className="fas fa-check-circle" />
                          Location set
                        </p>
                        <p className="text-xs text-emerald-700/80 mt-0.5 font-mono truncate">
                          {formData.latitude!.toFixed(6)},{" "}
                          {formData.longitude!.toFixed(6)}
                        </p>
                      </div>
                      <a
                        href={`https://www.google.com/maps?q=${formData.latitude},${formData.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                                   text-emerald-800 bg-emerald-100 hover:bg-emerald-200 transition-colors"
                      >
                        <i className="fas fa-external-link-alt" />
                        Maps
                      </a>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-100">
                      <i className="fas fa-lock text-red-400 mt-0.5" />
                      <p className="text-sm text-red-700">
                        No location confirmed yet. You can't schedule a session
                        until you pick one.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* ── Locked until location is confirmed ───────────── */}
          <fieldset
            disabled={!hasLocation}
            className={`min-w-0 border-0 m-0 p-0 transition-opacity ${
              hasLocation ? "" : "opacity-50 pointer-events-none select-none"
            }`}
            aria-disabled={!hasLocation}
          >
            {!hasLocation && (
              <div className="pt-8 pb-2 flex items-center gap-2 text-sm text-slate-500">
                <i className="fas fa-lock text-slate-400" />
                Confirm a location above to unlock the steps below.
              </div>
            )}
            <div className="divide-y divide-slate-200">
          {/* ── 1. Session details ───────────────────────────── */}
          <section className="pt-10 pb-10">
            <SectionHeading
              step={2}
              icon="fa-info-circle"
              title="Session details"
              desc="Which group of students is this attendance for?"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:pl-[50px]">
              {/* Component */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Component <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="component"
                    value={formData.component}
                    onChange={handleChange}
                    className="input pr-24 bg-slate-50 cursor-not-allowed text-slate-600"
                    disabled
                  >
                    <option value="">Select Component</option>
                    <option value="cwts">CWTS</option>
                    <option value="rotc">ROTC</option>
                    <option value="lts">LTS</option>
                  </select>
                  {formData.component && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${getComponentColor(
                          formData.component,
                        )}`}
                      >
                        {getComponentLabel(formData.component)}
                      </span>
                    </div>
                  )}
                </div>
                <p className="mt-1.5 text-xs text-slate-400">
                  Auto-detected from your faculty profile
                </p>
              </div>

              {/* Section */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Section <span className="text-red-500">*</span>
                </label>
                {sectionsLoading ? (
                  <div className="flex items-center gap-2 h-10 text-sm text-slate-500">
                    <i className="fas fa-spinner fa-spin" />
                    Loading sections…
                  </div>
                ) : (
                  <>
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
                      <p className="mt-1.5 text-xs text-amber-600 flex items-center gap-1.5">
                        <i className="fas fa-exclamation-triangle" />
                        No sections found. Please add sections first.
                      </p>
                    )}
                    {formData.section && (
                      <p className="mt-1.5 text-xs text-emerald-600 flex items-center gap-1.5">
                        <i className="fas fa-check-circle" />
                        Selected: Section {formData.section}
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Description{" "}
                  <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="e.g. Morning formation, Training Day 1, Field activity…"
                  className="input min-h-[96px] resize-y"
                  rows={3}
                />
              </div>
            </div>
          </section>

          {/* ── 2. Schedule ──────────────────────────────────── */}
          <section className="pt-10">
            <SectionHeading
              step={3}
              icon="fa-clock"
              title="Schedule"
              desc="When can students check in, and when are they marked late?"
            />

            <div className="space-y-6 lg:pl-[50px]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Start date & time <span className="text-red-500">*</span>
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
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    End date & time <span className="text-red-500">*</span>
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

              {/* Duration presets */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Quick duration
                  <span className="ml-1.5 text-xs font-normal text-slate-400">
                    sets End from current Start
                  </span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "30 min", minutes: 30 },
                    { label: "1 hr", minutes: 60 },
                    { label: "1.5 hr", minutes: 90 },
                    { label: "2 hrs", minutes: 120 },
                    { label: "3 hrs", minutes: 180 },
                    { label: "4 hrs", minutes: 240 },
                  ].map((preset) => (
                    <button
                      key={preset.minutes}
                      type="button"
                      onClick={() => applyDurationPreset(preset.minutes)}
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium
                                 bg-white text-slate-700 border border-slate-200
                                 hover:bg-gold-50 hover:border-gold-300 hover:text-gold-800
                                 focus:outline-none focus:ring-2 focus:ring-gold-200
                                 disabled:opacity-50 transition-colors"
                    >
                      <i className="fas fa-bolt text-[10px] opacity-60" />
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grace period */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Grace period
                </label>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="relative">
                    <input
                      type="number"
                      name="grace_period_minutes"
                      value={formData.grace_period_minutes}
                      onChange={handleChange}
                      min={0}
                      max={120}
                      className="input w-32 pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                      min
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 flex-1 min-w-[220px]">
                    Check-ins within this window after start are marked{" "}
                    <span className="font-medium text-emerald-600">Present</span>
                    . After that →{" "}
                    <span className="font-medium text-amber-600">Late</span>.
                  </p>
                </div>
              </div>
            </div>
          </section>

            </div>
          </fieldset>
        </div>

        {/* ════════════ SIDEBAR ════════════ */}
        <aside className="lg:col-span-4">
          <div className="lg:sticky lg:top-6 space-y-5">
            {/* Summary */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 bg-navy-900 text-white">
                <p className="text-xs uppercase tracking-wider text-white/60">
                  Session summary
                </p>
                <p className="text-lg font-semibold mt-0.5 flex items-center gap-2">
                  {formData.component
                    ? getComponentLabel(formData.component)
                    : "—"}
                  {formData.section && (
                    <span className="text-white/70 font-normal">
                      · Section {formData.section}
                    </span>
                  )}
                </p>
              </div>

              <dl className="px-5 py-4 text-sm divide-y divide-slate-100">
                {[
                  { k: "Starts", v: formatDateDisplay(formData.scheduled_start) },
                  { k: "Ends", v: formatDateDisplay(formData.scheduled_end) },
                  { k: "Duration", v: getDurationLabel() },
                  {
                    k: "Grace period",
                    v: `${formData.grace_period_minutes} min`,
                  },
                  { k: "Late after", v: lateCutoff },
                ].map((row) => (
                  <div
                    key={row.k}
                    className="flex items-center justify-between gap-4 py-2.5"
                  >
                    <dt className="text-slate-500">{row.k}</dt>
                    <dd className="font-medium text-navy-900 text-right truncate">
                      {row.v}
                    </dd>
                  </div>
                ))}
                <div className="flex items-center justify-between gap-4 py-2.5">
                  <dt className="text-slate-500">Location</dt>
                  <dd
                    className={`font-medium text-right ${
                      hasLocation ? "text-emerald-700" : "text-red-500"
                    }`}
                  >
                    {hasLocation
                      ? `${formData.geofence_radius} m geofence`
                      : "Not set"}
                  </dd>
                </div>
                {preselectedClass && (
                  <div className="flex items-center justify-between gap-4 py-2.5">
                    <dt className="text-slate-500">Class</dt>
                    <dd className="font-medium text-navy-900 text-right truncate">
                      {preselectedClass.name}
                    </dd>
                  </div>
                )}
              </dl>

              {/* Desktop actions */}
              <div className="hidden lg:flex flex-col gap-2.5 px-5 pb-5">
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="btn btn-primary w-full"
                  title={!hasLocation ? "Pick a location first" : undefined}
                >
                  {isSubmitting ? (
                    <>
                      <i className="fas fa-spinner fa-spin" />
                      Scheduling…
                    </>
                  ) : (
                    <>
                      <i className="fas fa-calendar-check" />
                      Schedule Session
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="btn btn-secondary w-full"
                >
                  Cancel
                </button>
              </div>
            </div>

            {/* How it works */}
            <div className="rounded-2xl border border-amber-100 bg-amber-50/60 px-5 py-4">
              <p className="text-sm font-semibold text-amber-900 mb-2.5 flex items-center gap-2">
                <i className="fas fa-lightbulb" />
                How check-in works
              </p>
              <ul className="text-xs text-amber-800/90 space-y-2 leading-relaxed">
                <li className="flex gap-2">
                  <i className="fas fa-clock mt-0.5 text-amber-500" />
                  <span>
                    Students can only check in during the scheduled window
                  </span>
                </li>
                <li className="flex gap-2">
                  <i className="fas fa-hourglass-half mt-0.5 text-amber-500" />
                  <span>
                    Within grace period → <strong>Present</strong> · After →{" "}
                    <strong>Late</strong>
                  </span>
                </li>
                <li className="flex gap-2">
                  <i className="fas fa-face-smile mt-0.5 text-amber-500" />
                  <span>
                    Identity verified with <strong>face recognition</strong>
                    <> + location (inside {formData.geofence_radius} m)</>
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </aside>

        {/* ── Mobile sticky action bar ───────────────────────── */}
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-slate-200 px-4 py-3 flex gap-3">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="btn btn-primary flex-1"
            title={!hasLocation ? "Pick a location first" : undefined}
          >
            {isSubmitting ? (
              <>
                <i className="fas fa-spinner fa-spin" />
                Scheduling…
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
  );
};

export default CreateAttendanceSession;