// resources/js/pages/faculty/ClassDetail.tsx

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { facultyApi } from "../../services/api";
import RefreshButton from "../components/common/RefreshButton";
import LocationPicker from "../components/common/LocationPicker";
import toast from "react-hot-toast";
import { useReactToPrint } from "react-to-print";
import { useCreateAttendanceSession } from "../hooks/useAttendance";

interface ClassDetail {
    id: number;
    name: string;
    description: string;
    component_type: "cwts" | "rotc" | "lts" | "all";
    class_code?: string | null;
    school_year?: string | null;
    academic_year?: {          // ← add this
    id: number;
    academic_year: string;
    semester: string;
  } | null;
    status: "active" | "archived";
    students_count: number;
    teacher_id: number;
    teacher?: {
        id: number;
        first_name: string;
        last_name: string;
        email: string;
    };
    students: Array<{
        id: number;
        student_id: string;
        user: {
            first_name: string;
            last_name: string;
            email: string;
        };
        course: string;
        year_level: number;
        section: string;
    }>;
    created_at: string;
    updated_at: string;
}

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
}

const FacultyClassDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const printRef = useRef<HTMLDivElement>(null);

    const [showStudents, setShowStudents] = useState(true);
    const [students, setStudents] = useState<any[]>([]);
    const [selectedSession, setSelectedSession] = useState<any>(null);
    const [showSessionLogsModal, setShowSessionLogsModal] = useState(false);

    // Pagination state
    const [studentsPage, setStudentsPage] = useState(1);
    const [studentsPerPage, setStudentsPerPage] = useState(10);
    const [sessionsPage, setSessionsPage] = useState(1);
    const [sessionsPerPage, setSessionsPerPage] = useState(5);

    useEffect(() => {
        setStudentsPage(1);
    }, [studentsPerPage]);
    useEffect(() => {
        setSessionsPage(1);
    }, [sessionsPerPage]);

    // Fetch data
    const {
        data: classData,
        isLoading,
        refetch,
        isFetching: isRefreshing,
    } = useQuery<ClassDetail>({
        queryKey: ["faculty", "class", id],
        queryFn: async () => {
            const result = await facultyApi.getClass(parseInt(id!));
            return result;
        },
        enabled: !!id,
        staleTime: 30000,
    });

    const { data: studentsData, refetch: refetchStudents } = useQuery({
        queryKey: ["faculty", "class", id, "students"],
        queryFn: async () => {
            const result = await facultyApi.getClassStudents(parseInt(id!));
            return result;
        },
        enabled: !!id,
        staleTime: 30000,
    });

    const { data: attendanceSessions = [], refetch: refetchSessions } =
        useQuery({
            queryKey: ["faculty", "class", id, "attendance-sessions"],
            queryFn: async () => {
                const result = await facultyApi.getAttendanceSessions();
                return result.filter((s: any) => s.class_id === parseInt(id!));
            },
            enabled: !!id,
            staleTime: 30000,
        });

    const createMut = useCreateAttendanceSession();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGettingLocation, setIsGettingLocation] = useState(false);

    const [sessionFormData, setSessionFormData] = useState<AttendanceFormData>({
        component: classData?.component_type || "",
        section: classData?.name
            ? classData.name.replace("Section ", "").replace(" - 2025", "") ||
              ""
            : "",
        description: "",
        scheduled_start: "",
        scheduled_end: "",
        grace_period_minutes: 15,
        require_location: false,
        latitude: null,
        longitude: null,
        geofence_radius: 100,
    });

    useEffect(() => {
        if (classData) {
            const sectionName = classData.name
                ? classData.name.replace("Section ", "").replace(" - 2025", "")
                : "";
            setSessionFormData((prev) => ({
                ...prev,
                component: classData.component_type || "",
                section: sectionName || "",
                scheduled_start: new Date(Date.now() + 15 * 60000)
                    .toISOString()
                    .slice(0, 16),
                scheduled_end: new Date(Date.now() + 60 * 60000)
                    .toISOString()
                    .slice(0, 16),
            }));
        }
    }, [classData]);

    useEffect(() => {
        if (studentsData) {
            setStudents(studentsData);
        } else if (classData?.students) {
            setStudents(classData.students);
        }
    }, [studentsData, classData]);

    // ============================================================
    // PRINT — Formal document
    // ============================================================
    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Class_List_${classData?.name?.replace(/\s+/g, "_") || "Class"}_${new Date().toISOString().slice(0, 10)}`,
    });

    const applyDurationPreset = (minutes: number) => {
        const start = sessionFormData.scheduled_start
            ? new Date(sessionFormData.scheduled_start)
            : new Date();
        if (isNaN(start.getTime())) {
            toast.error("Please set a valid start time first");
            return;
        }
        const end = new Date(start.getTime() + minutes * 60_000);
        const pad = (n: number) => String(n).padStart(2, "0");
        const formatted = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(
            end.getDate(),
        )}T${pad(end.getHours())}:${pad(end.getMinutes())}`;
        setSessionFormData((prev) => ({ ...prev, scheduled_end: formatted }));
        const label =
            minutes < 60
                ? `${minutes} min`
                : minutes % 60 === 0
                  ? `${minutes / 60} hr`
                  : `${Math.floor(minutes / 60)} hr ${minutes % 60} min`;
        toast.success(`End time set to +${label}`);
    };

    const handleSessionSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sessionFormData.component || !sessionFormData.section) {
            toast.error("Component and Section are required");
            return;
        }
        setIsSubmitting(true);
        try {
            const payload = { class_id: parseInt(id!), ...sessionFormData };
            await createMut.mutateAsync(payload);
            toast.success("Attendance session scheduled successfully!");
            refetchSessions();
        } catch (err: any) {
            toast.error(err.message || "Failed to schedule attendance session");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleViewSessionLogs = (session: any) => {
        setSelectedSession(session);
        setShowSessionLogsModal(true);
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

    const getComponentColor = (type: string) => {
        const colors: Record<string, string> = {
            cwts: "bg-blue-100 text-blue-800",
            rotc: "bg-red-100 text-red-800",
            lts: "bg-emerald-100 text-emerald-800",
            all: "bg-purple-100 text-purple-800",
        };
        return colors[type] || "bg-slate-100 text-slate-800";
    };

    const getStatusBadge = (status: string) =>
        status === "active" ? "badge-success" : "badge-secondary";

    const teacherName = classData?.teacher
        ? `${classData.teacher.first_name} ${classData.teacher.last_name}`
        : null;
    const teacherEmail = classData?.teacher?.email || null;

    const studentList =
        students.length > 0 ? students : classData?.students || [];
    const studentCount = classData?.students_count || studentList.length || 0;

    // ----- Pagination: students -----
    const studentsPagination = useMemo(() => {
        const total = studentList.length;
        const lastPage = Math.max(1, Math.ceil(total / studentsPerPage));
        const safePage = Math.min(studentsPage, lastPage);
        const start = (safePage - 1) * studentsPerPage;
        const end = start + studentsPerPage;
        const data = studentList.slice(start, end);
        return {
            total,
            lastPage,
            currentPage: safePage,
            perPage: studentsPerPage,
            from: total === 0 ? 0 : start + 1,
            to: total === 0 ? 0 : Math.min(end, total),
            data,
        };
    }, [studentList, studentsPage, studentsPerPage]);

    useEffect(() => {
        if (studentsPagination.currentPage !== studentsPage) {
            setStudentsPage(studentsPagination.currentPage);
        }
    }, [studentsPagination.currentPage, studentsPage]);

    const goToStudentsPage = (p: number) => {
        if (p >= 1 && p <= studentsPagination.lastPage) setStudentsPage(p);
    };

    // ----- Pagination: sessions -----
    const sessionsPagination = useMemo(() => {
        const total = attendanceSessions.length;
        const lastPage = Math.max(1, Math.ceil(total / sessionsPerPage));
        const safePage = Math.min(sessionsPage, lastPage);
        const start = (safePage - 1) * sessionsPerPage;
        const end = start + sessionsPerPage;
        const data = attendanceSessions.slice(start, end);
        return {
            total,
            lastPage,
            currentPage: safePage,
            perPage: sessionsPerPage,
            from: total === 0 ? 0 : start + 1,
            to: total === 0 ? 0 : Math.min(end, total),
            data,
        };
    }, [attendanceSessions, sessionsPage, sessionsPerPage]);

    useEffect(() => {
        if (sessionsPagination.currentPage !== sessionsPage) {
            setSessionsPage(sessionsPagination.currentPage);
        }
    }, [sessionsPagination.currentPage, sessionsPage]);

    const goToSessionsPage = (p: number) => {
        if (p >= 1 && p <= sessionsPagination.lastPage) setSessionsPage(p);
    };

    // ============================================================
    // Helpers for print document
    // ============================================================
    const currentUser = useMemo(() => {
        try {
            return JSON.parse(localStorage.getItem("user") || "{}");
        } catch {
            return {};
        }
    }, []);

    const maleCount = studentList.filter(
        (s: any) => (s.gender || "").toLowerCase() === "male",
    ).length;
    const femaleCount = studentList.filter(
        (s: any) => (s.gender || "").toLowerCase() === "female",
    ).length;

    const printedOn = new Date().toLocaleString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    const docReference = `NSTP-CL-${classData?.class_code || "XXXX"}-${new Date()
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, "")}`;

    // ============================================================
    // RENDER
    // ============================================================
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="spinner" />
                <span className="ml-3 text-slate-500">
                    Loading class details...
                </span>
            </div>
        );
    }

    if (!classData) {
        return (
            <div className="text-center py-12">
                <i className="fas fa-exclamation-circle text-4xl text-red-400 block mb-3" />
                <p className="text-slate-500">Class not found</p>
                <button
                    className="btn btn-primary mt-4"
                    onClick={() => navigate("/faculty/classes")}
                >
                    <i className="fas fa-arrow-left" /> Back to Classes
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 no-print">
                <div className="flex items-center gap-3">
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => navigate("/faculty/classes")}
                    >
                        <i className="fas fa-arrow-left" /> Back
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-navy-900">
                            {classData.name}
                        </h2>
                        <p className="text-sm text-slate-500">
                            {classData.description || "No description"}
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
  <button
    className="btn btn-success btn-sm inline-flex items-center gap-1.5"
    onClick={() =>
      navigate(`/faculty/classes/${classData.id}/materials`)
    }
    title="View and manage learning materials for this class"
  >
    <i className="fas fa-folder-open" />
    <span>Materials</span>
  </button>
  <button
    className="btn btn-primary btn-sm inline-flex items-center gap-1.5"
    onClick={handlePrint}
  >
    <i className="fas fa-print" />
    <span>Print Class List</span>
  </button>
  <RefreshButton
    onRefresh={() => {
      refetch();
      refetchStudents();
      refetchSessions();
    }}
    isLoading={isRefreshing}
    label=""
    className="btn-sm"
  />
</div>
            </div>

            {/* INFO CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <span className="block text-xs text-slate-500">Status</span>
                    <span
                        className={`badge ${getStatusBadge(classData.status)} mt-1`}
                    >
                        {classData.status.toUpperCase()}
                    </span>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <span className="block text-xs text-slate-500">
                        Component
                    </span>
                    <span
                        className={`badge ${getComponentColor(classData.component_type)} mt-1`}
                    >
                        {getComponentLabel(classData.component_type)}
                    </span>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <span className="block text-xs text-slate-500">
                        Students
                    </span>
                    <span className="text-2xl font-bold text-navy-900">
                        {studentCount}
                    </span>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <span className="block text-xs text-slate-500">
                        Class Code
                    </span>
                    <span className="text-lg font-mono font-bold text-gold-600">
                        {classData.class_code || "—"}
                    </span>
                </div>
            </div>

            {/* INSTRUCTOR */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 no-print">
                <h4 className="font-semibold text-navy-900 mb-2">
                    <i className="fas fa-user-tie text-gold-500 mr-2" />
                    Instructor
                </h4>
                {teacherName ? (
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center text-navy-600 font-bold">
                            {teacherName.charAt(0)}
                        </div>
                        <div>
                            <p className="font-medium text-navy-900">
                                {teacherName}
                            </p>
                            {teacherEmail && (
                                <p className="text-sm text-slate-500">
                                    {teacherEmail}
                                </p>
                            )}
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-amber-600">
                        <i className="fas fa-exclamation-triangle mr-1" /> No
                        instructor assigned
                    </p>
                )}
            </div>

            {/* ============================================================ */}
            {/* PRINT DOCUMENT (hidden on screen) */}
            {/* ============================================================ */}
            <div style={{ display: "none" }}>
                <div ref={printRef}>
                    <style>
                        {`
              @media print {
                @page {
                  size: A4 portrait;
                  margin: 15mm 15mm 20mm 15mm;
                }
                body {
                  font-family: 'Times New Roman', Times, serif;
                  color: #000;
                  font-size: 11pt;
                  line-height: 1.35;
                }
                .doc-page {
                  padding: 0;
                }
                .doc-header {
                  text-align: center;
                  border-bottom: 3px double #000;
                  padding-bottom: 10px;
                  margin-bottom: 14px;
                }
                .doc-logo {
                  width: 70px;
                  height: 70px;
                  object-fit: contain;
                  display: block;
                  margin: 0 auto 6px;
                }
                .doc-school {
                  font-size: 11pt;
                  letter-spacing: 2px;
                  text-transform: uppercase;
                  margin: 0;
                  font-weight: normal;
                }
                .doc-office {
                  font-size: 15pt;
                  font-weight: bold;
                  text-transform: uppercase;
                  letter-spacing: 1px;
                  margin: 2px 0 0;
                }
                .doc-subtitle {
                  font-size: 10pt;
                  text-transform: uppercase;
                  letter-spacing: 3px;
                  margin: 4px 0 0;
                  color: #333;
                }
                .doc-title {
                  text-align: center;
                  margin: 14px 0 12px;
                  font-size: 16pt;
                  font-weight: bold;
                  letter-spacing: 2px;
                  text-transform: uppercase;
                  text-decoration: underline;
                }
                .doc-meta {
                  display: flex;
                  justify-content: space-between;
                  font-size: 10pt;
                  margin-bottom: 12px;
                }
                .doc-meta-left,
                .doc-meta-right {
                  width: 48%;
                }
                .doc-meta-row {
                  display: flex;
                  gap: 6px;
                  padding: 1.5px 0;
                }
                .doc-meta-label {
                  font-weight: bold;
                  min-width: 110px;
                }
                .doc-meta-value {
                  border-bottom: 1px dotted #555;
                  flex: 1;
                  padding-left: 4px;
                }
                .doc-summary {
                  display: flex;
                  gap: 10px;
                  margin: 10px 0 12px;
                  font-size: 10pt;
                }
                .doc-summary-box {
                  flex: 1;
                  border: 1px solid #000;
                  padding: 6px 10px;
                  text-align: center;
                }
                .doc-summary-box strong {
                  display: block;
                  font-size: 14pt;
                  margin-top: 2px;
                }
                table.doc-table {
                  width: 100%;
                  border-collapse: collapse;
                  font-size: 10pt;
                  margin-top: 6px;
                }
                table.doc-table th,
                table.doc-table td {
                  border: 1px solid #000;
                  padding: 4px 6px;
                  text-align: left;
                }
                table.doc-table th {
                  background-color: #eaeaea;
                  text-transform: uppercase;
                  font-size: 9pt;
                  letter-spacing: 0.5px;
                  text-align: center;
                }
                table.doc-table td.center {
                  text-align: center;
                }
                table.doc-table tbody tr:nth-child(even) td {
                  background-color: #f9f9f9;
                }
                .doc-signatures {
                  margin-top: 40px;
                  display: flex;
                  justify-content: space-between;
                  page-break-inside: avoid;
                }
                .doc-sign-block {
                  width: 45%;
                  text-align: center;
                  font-size: 10pt;
                }
                .doc-sign-space {
                  height: 50px;
                }
                .doc-sign-name {
                  font-weight: bold;
                  text-transform: uppercase;
                  border-top: 1px solid #000;
                  padding-top: 4px;
                }
                .doc-sign-title {
                  font-size: 9pt;
                  font-style: italic;
                }
                .doc-footer {
                  margin-top: 30px;
                  border-top: 1px solid #000;
                  padding-top: 6px;
                  display: flex;
                  justify-content: space-between;
                  font-size: 8.5pt;
                  font-style: italic;
                  color: #333;
                }
                .doc-footer-ref {
                  font-family: 'Courier New', monospace;
                  letter-spacing: 0.5px;
                }
              }
            `}
                    </style>

                    <div className="doc-page">
                        {/* DOCUMENT HEADER */}
                        <div className="doc-header">
                            <img
                                src="/images/nstpLogo.png"
                                alt="NSTP Logo"
                                className="doc-logo"
                            />
                            <p className="doc-school">Opol Community College</p>
                            <p className="doc-office">
                                National Service Training Program
                            </p>
                            <p className="doc-subtitle">
                                Office of the NSTP Coordinator
                            </p>
                        </div>

                        {/* DOCUMENT TITLE */}
                        <div className="doc-title">Official Class List</div>

                        {/* META BLOCK */}
                        <div className="doc-meta">
                            <div className="doc-meta-left">
                                <div className="doc-meta-row">
                                    <span className="doc-meta-label">
                                        Class / Section:
                                    </span>
                                    <span className="doc-meta-value">
                                        {classData.name}
                                    </span>
                                </div>
                                <div className="doc-meta-row">
                                    <span className="doc-meta-label">
                                        Class Code:
                                    </span>
                                    <span className="doc-meta-value">
                                        {classData.class_code || "—"}
                                    </span>
                                </div>
                                <div className="doc-meta-row">
                                    <span className="doc-meta-label">
                                        School Year:
                                    </span>
                                    <span className="doc-meta-value">
                                        {classData.school_year ||
                                            classData.academic_year
                                                ?.academic_year ||
                                            "—"}
                                    </span>
                                </div>
                                <div className="doc-meta-row">
                                    <span className="doc-meta-label">
                                        Component:
                                    </span>
                                    <span className="doc-meta-value">
                                        {getComponentLabel(
                                            classData.component_type,
                                        )}
                                    </span>
                                </div>
                            </div>
                            <div className="doc-meta-right">
                                <div className="doc-meta-row">
                                    <span className="doc-meta-label">
                                        Instructor:
                                    </span>
                                    <span className="doc-meta-value">
                                        {teacherName || "Unassigned"}
                                    </span>
                                </div>
                                <div className="doc-meta-row">
                                    <span className="doc-meta-label">
                                        Instructor Email:
                                    </span>
                                    <span className="doc-meta-value">
                                        {teacherEmail || "—"}
                                    </span>
                                </div>
                                <div className="doc-meta-row">
                                    <span className="doc-meta-label">
                                        Date Printed:
                                    </span>
                                    <span className="doc-meta-value">
                                        {printedOn}
                                    </span>
                                </div>
                                <div className="doc-meta-row">
                                    <span className="doc-meta-label">
                                        Printed By:
                                    </span>
                                    <span className="doc-meta-value">
                                        {currentUser.first_name &&
                                        currentUser.last_name
                                            ? `${currentUser.first_name} ${currentUser.last_name}`
                                            : currentUser.name || "Faculty"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* SUMMARY BLOCK */}
                        <div className="doc-summary">
                            <div className="doc-summary-box">
                                Total Students
                                <strong>{studentCount}</strong>
                            </div>
                            <div className="doc-summary-box">
                                Male
                                <strong>{maleCount}</strong>
                            </div>
                            <div className="doc-summary-box">
                                Female
                                <strong>{femaleCount}</strong>
                            </div>
                            <div className="doc-summary-box">
                                Class Status
                                <strong>
                                    {classData.status.toUpperCase()}
                                </strong>
                            </div>
                        </div>

                        {/* STUDENT ROSTER */}
                        <table className="doc-table">
                            <thead>
                                <tr>
                                    <th style={{ width: "6%" }}>No.</th>
                                    <th style={{ width: "18%" }}>Student ID</th>
                                    <th style={{ width: "36%" }}>Full Name</th>
                                    <th style={{ width: "14%" }}>Course</th>
                                    <th style={{ width: "10%" }}>Year</th>
                                    <th style={{ width: "16%" }}>Section</th>
                                </tr>
                            </thead>
                            <tbody>
                                {studentList.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="center">
                                            No students enrolled in this class.
                                        </td>
                                    </tr>
                                ) : (
                                    studentList.map((student, index) => {
                                        const fullName = `${student.user?.last_name ?? ""}, ${
                                            student.user?.first_name ?? ""
                                        }${student.user?.middle_name ? ` ${student.user.middle_name.charAt(0)}.` : ""}`;
                                        return (
                                            <tr key={student.id || index}>
                                                <td className="center">
                                                    {index + 1}
                                                </td>
                                                <td className="center">
                                                    {student.student_id || "—"}
                                                </td>
                                                <td>
                                                    {fullName.toUpperCase()}
                                                </td>
                                                <td className="center">
                                                    {student.course?.toUpperCase() ||
                                                        "—"}
                                                </td>
                                                <td className="center">
                                                    {student.year_level || "—"}
                                                </td>
                                                <td className="center">
                                                    {student.section?.toUpperCase() ||
                                                        "—"}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>

                        {/* SIGNATURE BLOCKS */}
                        <div className="doc-signatures">
                            <div className="doc-sign-block">
                                <p>Prepared by:</p>
                                <div className="doc-sign-space" />
                                <div className="doc-sign-name">
                                    {teacherName?.toUpperCase() ||
                                        "________________"}
                                </div>
                                <div className="doc-sign-title">
                                    NSTP Instructor
                                </div>
                            </div>
                            <div className="doc-sign-block">
                                <p>Noted by:</p>
                                <div className="doc-sign-space" />
                                <div className="doc-sign-name">
                                    ________________
                                </div>
                                <div className="doc-sign-title">
                                    NSTP Coordinator
                                </div>
                            </div>
                        </div>

                        {/* FOOTER */}
                        <div className="doc-footer">
                            <span className="doc-footer-ref">
                                Ref: {docReference}
                            </span>
                            <span>
                                Generated from NSTP Management System — this
                                document is not valid without the official seal.
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ============================================================ */}
            {/* STUDENTS LIST (on-screen, with pagination) */}
            {/* ============================================================ */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 flex flex-wrap justify-between items-center gap-3">
                    <h4 className="font-semibold text-navy-900">
                        <i className="fas fa-users text-gold-500 mr-2" />
                        Students ({studentList.length})
                    </h4>
                    <div className="flex items-center gap-3">
                        {showStudents && studentList.length > 0 && (
                            <select
                                className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-sm"
                                value={studentsPerPage}
                                onChange={(e) =>
                                    setStudentsPerPage(Number(e.target.value))
                                }
                            >
                                <option value={10}>10 per page</option>
                                <option value={25}>25 per page</option>
                                <option value={50}>50 per page</option>
                                <option value={100}>100 per page</option>
                            </select>
                        )}
                        <button
                            className="text-sm text-slate-500 hover:text-navy-600"
                            onClick={() => setShowStudents(!showStudents)}
                        >
                            {showStudents ? "Hide" : "Show"} List
                        </button>
                    </div>
                </div>
                {showStudents && (
                    <>
                        <div className="overflow-x-auto">
                            {studentList.length === 0 ? (
                                <div className="text-center py-8 text-slate-500">
                                    No students enrolled yet
                                </div>
                            ) : (
                                <table className="data-table w-full">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Student</th>
                                            <th>Student ID</th>
                                            <th>Course</th>
                                            <th>Year</th>
                                            <th>Section</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {studentsPagination.data.map(
                                            (student, index) => (
                                                <tr
                                                    key={student.id || index}
                                                    className="hover:bg-slate-50"
                                                >
                                                    <td className="text-center">
                                                        {studentsPagination.from +
                                                            index}
                                                    </td>
                                                    <td>
                                                        {
                                                            student.user
                                                                ?.first_name
                                                        }{" "}
                                                        {
                                                            student.user
                                                                ?.last_name
                                                        }
                                                    </td>
                                                    <td className="font-bold">
                                                        {student.student_id ||
                                                            "N/A"}
                                                    </td>
                                                    <td>
                                                        {student.course || "-"}
                                                    </td>
                                                    <td className="text-center">
                                                        {student.year_level ||
                                                            "-"}
                                                    </td>
                                                    <td className="text-center">
                                                        {student.section || "-"}
                                                    </td>
                                                </tr>
                                            ),
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {studentList.length > 0 &&
                            studentsPagination.total > 0 && (
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 px-4 py-3 border-t border-slate-200 bg-slate-50">
                                    <span className="text-sm text-slate-500">
                                        Showing {studentsPagination.from} –{" "}
                                        {studentsPagination.to} of{" "}
                                        {studentsPagination.total} students
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            className="btn btn-secondary btn-sm inline-flex items-center gap-1.5"
                                            onClick={() =>
                                                goToStudentsPage(
                                                    studentsPagination.currentPage -
                                                        1,
                                                )
                                            }
                                            disabled={
                                                studentsPagination.currentPage <=
                                                1
                                            }
                                        >
                                            <i className="fas fa-chevron-left" />
                                            <span>Previous</span>
                                        </button>
                                        <span className="text-sm font-medium text-navy-900 px-3">
                                            Page{" "}
                                            {studentsPagination.currentPage} of{" "}
                                            {studentsPagination.lastPage}
                                        </span>
                                        <button
                                            className="btn btn-secondary btn-sm inline-flex items-center gap-1.5"
                                            onClick={() =>
                                                goToStudentsPage(
                                                    studentsPagination.currentPage +
                                                        1,
                                                )
                                            }
                                            disabled={
                                                studentsPagination.currentPage >=
                                                studentsPagination.lastPage
                                            }
                                        >
                                            <span>Next</span>
                                            <i className="fas fa-chevron-right" />
                                        </button>
                                    </div>
                                </div>
                            )}
                    </>
                )}
            </div>

            {/* ============================================================ */}
            {/* ATTENDANCE SESSIONS (with pagination) */}
            {/* ============================================================ */}
            <div className="mt-5 space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-3">
                    <h3 className="font-semibold text-navy-900">
                        <i className="fas fa-calendar-check text-gold-500 mr-2" />
                        Attendance Sessions ({attendanceSessions.length})
                    </h3>
                    <div className="flex items-center gap-2">
                        {attendanceSessions.length > 0 && (
                            <select
                                className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-sm"
                                value={sessionsPerPage}
                                onChange={(e) =>
                                    setSessionsPerPage(Number(e.target.value))
                                }
                            >
                                <option value={5}>5 per page</option>
                                <option value={10}>10 per page</option>
                                <option value={25}>25 per page</option>
                                <option value={50}>50 per page</option>
                            </select>
                        )}
                        <button
                            className="btn btn-primary btn-sm inline-flex items-center gap-1.5"
                            onClick={() =>
                                navigate(
                                    `/faculty/attendance/create?class_id=${classData.id}`,
                                )
                            }
                        >
                            <i className="fas fa-plus" />
                            <span>New Session</span>
                        </button>
                    </div>
                </div>

                {attendanceSessions.length > 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="data-table min-w-full">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Session</th>
                                        <th>Date</th>
                                        <th>Start Time</th>
                                        <th>End Time</th>
                                        <th>Component</th>
                                        <th>Status</th>
                                        <th className="text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sessionsPagination.data.map(
                                        (session: any, index: number) => (
                                            <tr
                                                key={session.id}
                                                className="hover:bg-slate-50"
                                            >
                                                <td className="text-center text-slate-400 text-xs">
                                                    {sessionsPagination.from +
                                                        index}
                                                </td>
                                                <td className="font-mono font-bold text-navy-900">
                                                    Session #{session.id}
                                                </td>
                                                <td>
                                                    {session.scheduled_start
                                                        ? new Date(
                                                              session.scheduled_start,
                                                          ).toLocaleDateString()
                                                        : "Instant"}
                                                </td>
                                                <td>
                                                    {session.scheduled_start
                                                        ? new Date(
                                                              session.scheduled_start,
                                                          ).toLocaleTimeString(
                                                              [],
                                                              {
                                                                  hour: "2-digit",
                                                                  minute: "2-digit",
                                                              },
                                                          )
                                                        : "N/A"}
                                                </td>
                                                <td>
                                                    {session.scheduled_end
                                                        ? new Date(
                                                              session.scheduled_end,
                                                          ).toLocaleTimeString(
                                                              [],
                                                              {
                                                                  hour: "2-digit",
                                                                  minute: "2-digit",
                                                              },
                                                          )
                                                        : "N/A"}
                                                </td>
                                                <td>
                                                    <span className="badge bg-blue-100 text-blue-800">
                                                        {session.component?.toUpperCase() ||
                                                            "N/A"}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span
                                                        className={`badge ${
                                                            session.status ===
                                                            "active"
                                                                ? "badge-success"
                                                                : "badge-secondary"
                                                        }`}
                                                    >
                                                        {session.status}
                                                    </span>
                                                </td>
                                                <td className="text-center">
                                                    <button
                                                        className="btn btn-sm btn-info inline-flex items-center gap-1.5"
                                                        onClick={() =>
                                                            handleViewSessionLogs(
                                                                session,
                                                            )
                                                        }
                                                    >
                                                        <i className="fas fa-eye" />
                                                        <span>View Logs</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ),
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {sessionsPagination.total > 0 && (
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 px-4 py-3 border-t border-slate-200 bg-slate-50">
                                <span className="text-sm text-slate-500">
                                    Showing {sessionsPagination.from} –{" "}
                                    {sessionsPagination.to} of{" "}
                                    {sessionsPagination.total} sessions
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        className="btn btn-secondary btn-sm inline-flex items-center gap-1.5"
                                        onClick={() =>
                                            goToSessionsPage(
                                                sessionsPagination.currentPage -
                                                    1,
                                            )
                                        }
                                        disabled={
                                            sessionsPagination.currentPage <= 1
                                        }
                                    >
                                        <i className="fas fa-chevron-left" />
                                        <span>Previous</span>
                                    </button>
                                    <span className="text-sm font-medium text-navy-900 px-3">
                                        Page {sessionsPagination.currentPage} of{" "}
                                        {sessionsPagination.lastPage}
                                    </span>
                                    <button
                                        className="btn btn-secondary btn-sm inline-flex items-center gap-1.5"
                                        onClick={() =>
                                            goToSessionsPage(
                                                sessionsPagination.currentPage +
                                                    1,
                                            )
                                        }
                                        disabled={
                                            sessionsPagination.currentPage >=
                                            sessionsPagination.lastPage
                                        }
                                    >
                                        <span>Next</span>
                                        <i className="fas fa-chevron-right" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-8 text-slate-500 bg-white rounded-xl border border-slate-200">
                        <i className="fas fa-calendar-times text-3xl text-slate-300 block mb-2" />
                        <p>No attendance sessions scheduled yet</p>
                        <p className="text-sm text-slate-400 mt-1">
                            Click "New Session" to create one
                        </p>
                    </div>
                )}

                {/* SCHEDULE FORM */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-start gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-gold-100 flex items-center justify-center text-gold-600 flex-shrink-0">
                            <i className="fas fa-calendar-plus text-lg" />
                        </div>
                        <div>
                            <p className="font-medium text-navy-900">
                                Schedule Attendance Session
                            </p>
                            <p className="text-sm text-slate-500">
                                Create a new attendance session for{" "}
                                {classData.name}
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSessionSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">
                                    Component{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="component"
                                    value={sessionFormData.component}
                                    disabled
                                    className="input bg-slate-50 cursor-not-allowed"
                                >
                                    <option value="cwts">CWTS</option>
                                    <option value="rotc">ROTC</option>
                                    <option value="lts">LTS</option>
                                </select>
                            </div>
                            <div>
                                <label className="label">
                                    Section{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="section"
                                    value={sessionFormData.section}
                                    readOnly
                                    className="input bg-slate-50 cursor-not-allowed"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">
                                    Start Date & Time{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="datetime-local"
                                    name="scheduled_start"
                                    value={sessionFormData.scheduled_start}
                                    onChange={(e) =>
                                        setSessionFormData({
                                            ...sessionFormData,
                                            scheduled_start: e.target.value,
                                        })
                                    }
                                    className="input"
                                    required
                                />
                            </div>
                            <div>
                                <label className="label">
                                    End Date & Time{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="datetime-local"
                                    name="scheduled_end"
                                    value={sessionFormData.scheduled_end}
                                    onChange={(e) =>
                                        setSessionFormData({
                                            ...sessionFormData,
                                            scheduled_end: e.target.value,
                                        })
                                    }
                                    className="input"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="label">
                                Quick Duration{" "}
                                <span className="text-xs text-slate-400 ml-2">
                                    (sets End time based on Start)
                                </span>
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { label: "30 min", minutes: 30 },
                                    { label: "1 hr", minutes: 60 },
                                    { label: "1 hr 30 min", minutes: 90 },
                                    { label: "2 hrs", minutes: 120 },
                                    { label: "3 hrs", minutes: 180 },
                                    { label: "4 hrs (Half-day)", minutes: 240 },
                                ].map((preset) => (
                                    <button
                                        key={preset.minutes}
                                        type="button"
                                        className="px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 hover:bg-gold-100 hover:text-gold-700 text-slate-700 transition-colors border border-slate-200"
                                        onClick={() =>
                                            applyDurationPreset(preset.minutes)
                                        }
                                        disabled={isSubmitting}
                                    >
                                        <i className="fas fa-clock mr-1" />
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="label">
                                Grace Period (minutes)
                            </label>
                            <input
                                type="number"
                                name="grace_period_minutes"
                                value={sessionFormData.grace_period_minutes}
                                onChange={(e) =>
                                    setSessionFormData({
                                        ...sessionFormData,
                                        grace_period_minutes:
                                            parseInt(e.target.value) || 15,
                                    })
                                }
                                min="0"
                                max="120"
                                className="input w-32"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="require_location"
                                checked={sessionFormData.require_location}
                                onChange={(e) =>
                                    setSessionFormData({
                                        ...sessionFormData,
                                        require_location: e.target.checked,
                                    })
                                }
                                className="w-5 h-5 accent-gold-500"
                            />
                            <label
                                htmlFor="require_location"
                                className="font-semibold text-navy-700"
                            >
                                <i className="fas fa-map-pin text-gold-500 mr-2" />
                                Require Location for Attendance
                            </label>
                        </div>

                        {sessionFormData.require_location && (
                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 space-y-3">
                                <LocationPicker
                                    latitude={sessionFormData.latitude}
                                    longitude={sessionFormData.longitude}
                                    onLocationSelect={(lat, lng) =>
                                        setSessionFormData({
                                            ...sessionFormData,
                                            latitude: lat,
                                            longitude: lng,
                                        })
                                    }
                                    venueName="Attendance Venue"
                                />
                                <button
                                    type="button"
                                    className="btn btn-secondary btn-sm w-full inline-flex items-center justify-center gap-2"
                                    disabled={isGettingLocation}
                                    onClick={() => {
                                        if (navigator.geolocation) {
                                            setIsGettingLocation(true);
                                            navigator.geolocation.getCurrentPosition(
                                                (pos) => {
                                                    setSessionFormData({
                                                        ...sessionFormData,
                                                        latitude:
                                                            pos.coords.latitude,
                                                        longitude:
                                                            pos.coords
                                                                .longitude,
                                                    });
                                                    toast.success(
                                                        "Location set to current position",
                                                    );
                                                    setIsGettingLocation(false);
                                                },
                                                () => {
                                                    toast.error(
                                                        "Unable to retrieve location",
                                                    );
                                                    setIsGettingLocation(false);
                                                },
                                                { enableHighAccuracy: true },
                                            );
                                        }
                                    }}
                                >
                                    <i
                                        className={`fas ${
                                            isGettingLocation
                                                ? "fa-spinner fa-spin"
                                                : "fa-location-dot"
                                        }`}
                                    />
                                    <span>
                                        {isGettingLocation
                                            ? "Getting location..."
                                            : "Use My Current Location"}
                                    </span>
                                </button>
                            </div>
                        )}

                        <div className="flex gap-3 pt-3 border-t border-slate-200">
                            <button
                                type="submit"
                                className="btn btn-primary flex-1 inline-flex items-center justify-center gap-2"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin" />
                                        <span>Scheduling...</span>
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-calendar-check" />
                                        <span>Schedule Session</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* SESSION LOGS MODAL */}
            {showSessionLogsModal && selectedSession && (
                <div
                    className="modal-overlay"
                    onClick={() => setShowSessionLogsModal(false)}
                >
                    <div
                        className="modal max-w-4xl flex flex-col max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-header border-b border-slate-200 bg-white">
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-semibold text-navy-900">
                                    Session Attendance Logs
                                </h3>
                                <div className="flex flex-wrap gap-2 mt-1 text-sm text-slate-500 items-center">
                                    <span className="font-mono font-bold text-navy-900">
                                        Session #{selectedSession.id}
                                    </span>
                                    {selectedSession.scheduled_start && (
                                        <>
                                            <span className="text-slate-300">
                                                •
                                            </span>
                                            <span>
                                                {new Date(
                                                    selectedSession.scheduled_start,
                                                ).toLocaleString()}
                                            </span>
                                        </>
                                    )}
                                    <span className="text-slate-300">•</span>
                                    <span
                                        className={`badge ${
                                            selectedSession.status === "active"
                                                ? "badge-success"
                                                : "badge-secondary"
                                        }`}
                                    >
                                        {selectedSession.status?.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                            <button
                                className="modal-close"
                                onClick={() => setShowSessionLogsModal(false)}
                            >
                                ×
                            </button>
                        </div>

                        <div className="modal-body flex-1 overflow-y-auto">
                            {selectedSession.logs &&
                            selectedSession.logs.length > 0 ? (
                                <div className="overflow-x-auto rounded-lg border border-slate-200">
                                    <table className="data-table w-full">
                                        <thead>
                                            <tr>
                                                <th>Student</th>
                                                <th>Student ID</th>
                                                <th>Check-in Time</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedSession.logs.map(
                                                (log: any) => (
                                                    <tr
                                                        key={log.id}
                                                        className="hover:bg-slate-50"
                                                    >
                                                        <td>
                                                            {
                                                                log.student
                                                                    ?.user
                                                                    ?.first_name
                                                            }{" "}
                                                            {
                                                                log.student
                                                                    ?.user
                                                                    ?.last_name
                                                            }
                                                        </td>
                                                        <td className="font-bold">
                                                            {
                                                                log.student
                                                                    ?.student_id
                                                            }
                                                        </td>
                                                        <td>
                                                            {log.check_in_at
                                                                ? new Date(
                                                                      log.check_in_at,
                                                                  ).toLocaleString()
                                                                : "N/A"}
                                                        </td>
                                                        <td>
                                                            <span
                                                                className={`badge ${
                                                                    log.status ===
                                                                    "present"
                                                                        ? "badge-success"
                                                                        : log.status ===
                                                                            "late"
                                                                          ? "badge-warning"
                                                                          : "badge-danger"
                                                                }`}
                                                            >
                                                                {log.status?.toUpperCase()}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ),
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-10 text-slate-500">
                                    <i className="fas fa-user-check text-3xl text-slate-300 block mb-2" />
                                    <p>
                                        No students have checked in for this
                                        session yet
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="modal-footer border-t border-slate-200 bg-white">
                            <span className="text-sm text-slate-500 mr-auto">
                                Total: {selectedSession.logs?.length || 0}{" "}
                                check-in
                                {(selectedSession.logs?.length || 0) !== 1
                                    ? "s"
                                    : ""}
                            </span>
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowSessionLogsModal(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FacultyClassDetail;
