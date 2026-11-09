// src/App.tsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import Classes from "./pages/admin/Classes";
import OfflineBanner from "./pages/components/common/OfflineBanner";

// Layouts
import AdminLayout from "./pages/components/layouts/AdminLayout";
import GradesManagement from "./pages/admin/Grades";
import ForgotPassword from "./pages/auth/ForgotPassword";
import FacultyClasses from "./pages/faculty/Classes";
import FacultyClassDetail from "./pages/faculty/ClassDetail";
import FacultyActivityLocationView from "./pages/faculty/ActivityLocationView";

// Admin Pages (Super Admin & Admin only)
import Dashboard from "./pages/admin/Dashboard";
import Students from "./pages/admin/Students";
import StudentComponent from "./pages/admin/Students/Component";
import StudentRequests from "./pages/admin/Students/Requests";
import DocumentSubmissions from "./pages/admin/Documents/Submissions";
import DocumentLibrary from "./pages/admin/Documents/Library";
import GenerateCertificate from "./pages/admin/Certificates/Generate";
import CertificateDesigner from "./pages/admin/Certificates/Designer";
import IssuedCertificates from "./pages/admin/Certificates/Issued";
import EnrollmentReport from "./pages/admin/Reports/Enrollment";
import AttendanceReport from "./pages/admin/Reports/Attendance";
import DeficiencyReport from "./pages/admin/Reports/Deficiency";
import SuperAdminDashboard from "./pages/admin/SuperAdmin/Dashboard";
import CreateAttendanceSession from "./pages/faculty/Create";
import FacultyStudents from "./pages/faculty/Students";
import ActivityMap from "./pages/admin/Activities/ActivityMap";
import BackupSchedules from "./pages/admin/SuperAdmin/BackupSchedules";
// Activities & Schedules (Shared)
import ActivitiesLayout from "./pages/admin/Activities";
import Activities from "./pages/admin/Activities/Activities";
import Schedules from "./pages/admin/Activities/Schedules";
import AccomplishmentReport from "./pages/admin/Reports/Accomplishment";
import ActivityLocationView from "./pages/admin/Activities/ActivityLocationView";
import BackupPage from "./pages/admin/SuperAdmin/Backup";

// Bulletin Board (Shared)
import BulletinBoard from "./pages/admin/Bulletin";

// Faculty Dashboard
import FacultyDashboard from "./pages/faculty/Dashboard";
import FacultyActivityMap from "./pages/faculty/ActivitiesMap";
import FacultyMaterials from "./pages/faculty/Materials";
import FacultyMaterialUpload from "./pages/faculty/MaterialUpload";
import Profile from "./pages/shared/Profile";

// Auth Pages
import Login from "./pages/auth/Login";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 30000,
        },
    },
});

// Simple auth check
const getToken = () =>
    localStorage.getItem("token") || localStorage.getItem("nstp_token");

const App: React.FC = () => {
    const token = getToken();
    const userStr = localStorage.getItem("user");
    let userRole = null;

    try {
        if (userStr) {
            const user = JSON.parse(userStr);
            userRole = user?.role;
        }
    } catch (e) {
        // Invalid user data
    }

    const isAuthenticated = !!token && userRole;
    const isAdmin = userRole === "super_admin" || userRole === "admin";
    const isFaculty = userRole === "faculty";

    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <Toaster position="top-right" />
                <OfflineBanner />
                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route
                        path="/forgot-password"
                        element={<ForgotPassword />}
                    />

                    {/* ============================================================
              ADMIN ROUTES - Super Admin & Admin only
              ============================================================ */}
                    <Route
                        path="/admin/*"
                        element={
                            isAuthenticated && isAdmin ? (
                                <AdminLayout>
                                    <Routes>
                                        <Route index element={<Dashboard />} />
                                        <Route
                                            path="superadmin"
                                            element={<SuperAdminDashboard />}
                                        />
                                        <Route
                                            path="superadmin/backups"
                                            element={<BackupPage />}
                                        />
                                        <Route
                                            path="superadmin/backup-schedules"
                                            element={<BackupSchedules />}
                                        />
                                        <Route
                                            path="students"
                                            element={<Students />}
                                        />
                                        <Route
                                            path="students/component"
                                            element={<StudentComponent />}
                                        />
                                        <Route
                                            path="students/requests"
                                            element={<StudentRequests />}
                                        />
                                        <Route
                                            path="activities"
                                            element={<ActivitiesLayout />}
                                        >
                                            <Route
                                                index
                                                element={<Activities />}
                                            />
                                            <Route
                                                path="schedules"
                                                element={<Schedules />}
                                            />
                                        </Route>
                                        <Route
                                            path="activities/map"
                                            element={<ActivityMap />}
                                        />
                                        <Route
                                            path="activities/location/:id"
                                            element={<ActivityLocationView />}
                                        />
                                        <Route
                                            path="documents/submissions"
                                            element={<DocumentSubmissions />}
                                        />
                                        <Route
                                            path="documents/library"
                                            element={<DocumentLibrary />}
                                        />
                                        <Route
                                            path="attendance/create"
                                            element={
                                                <CreateAttendanceSession />
                                            }
                                        />
                                        <Route
                                            path="reports/accomplishment"
                                            element={<AccomplishmentReport />}
                                        />
                                        <Route
                                            path="certificates/generate"
                                            element={<GenerateCertificate />}
                                        />
                                        <Route
                                            path="grades"
                                            element={<GradesManagement />}
                                        />
                                        <Route
                                            path="certificates/designer"
                                            element={<CertificateDesigner />}
                                        />
                                        <Route
                                            path="certificates/issued"
                                            element={<IssuedCertificates />}
                                        />
                                        <Route
                                            path="bulletin"
                                            element={<BulletinBoard />}
                                        />
                                        <Route
                                            path="reports/enrollment"
                                            element={<EnrollmentReport />}
                                        />
                                        <Route
                                            path="reports/attendance"
                                            element={<AttendanceReport />}
                                        />
                                        <Route
                                            path="reports/deficiency"
                                            element={<DeficiencyReport />}
                                        />
                                        <Route
                                            path="classes"
                                            element={<Classes />}
                                        />
                                        <Route
                                            path="profile"
                                            element={<Profile />}
                                        />
                                        <Route
                                            path="*"
                                            element={
                                                <Navigate to="/admin" replace />
                                            }
                                        />
                                    </Routes>
                                </AdminLayout>
                            ) : (
                                <Navigate to="/login" replace />
                            )
                        }
                    />

                    {/* ============================================================
              FACULTY ROUTES - Faculty only
              ============================================================ */}
                    <Route
                        path="/faculty/*"
                        element={
                            isAuthenticated && isFaculty ? (
                                <AdminLayout>
                                    <Routes>
                                        {/* Dashboard */}
                                        <Route index element={<FacultyDashboard />} />
                                        {/* ===== LEARNING MATERIALS ===== */}
                                        <Route
                                            path="classes/:id/materials"
                                            element={<FacultyMaterials />}
                                        />
                                        <Route
                                            path="classes/:id/materials/upload"
                                            element={<FacultyMaterialUpload />}
                                        />

                                        <Route
                                            path="students"
                                            element={<FacultyStudents />}
                                        />
                                        {/* ===== CLASSES ===== */}
                                        <Route
                                            path="classes"
                                            element={<FacultyClasses />}
                                        />
                                        <Route
                                            path="classes/:id"
                                            element={<FacultyClassDetail />}
                                        />

                                        {/* Activities & Schedules */}
                                        <Route
                                            path="activities"
                                            element={<ActivitiesLayout />}
                                        >
                                            <Route
                                                index
                                                element={<Activities />}
                                            />
                                            <Route
                                                path="schedules"
                                                element={<Schedules />}
                                            />
                                            <Route
                                                path="map"
                                                element={<FacultyActivityMap />}
                                            />
                                            <Route
                                                path="location/:id"
                                                element={
                                                    <FacultyActivityLocationView />
                                                }
                                            />
                                        </Route>

                                        <Route
                                            path="attendance/create"
                                            element={
                                                <CreateAttendanceSession />
                                            }
                                        />

                                        {/* Bulletin Board */}
                                        <Route
                                            path="bulletin"
                                            element={<BulletinBoard />}
                                        />
                                        <Route
                                            path="profile"
                                            element={<Profile />}
                                        />

                                        {/* Catch all */}
                                        <Route
                                            path="*"
                                            element={
                                                <Navigate
                                                    to="/faculty"
                                                    replace
                                                />
                                            }
                                        />
                                    </Routes>
                                </AdminLayout>
                            ) : (
                                <Navigate to="/login" replace />
                            )
                        }
                    />

                    {/* Redirect root to admin */}
                    <Route
                        path="/"
                        element={<Navigate to="/admin" replace />}
                    />
                    <Route
                        path="*"
                        element={<Navigate to="/admin" replace />}
                    />
                </Routes>
            </BrowserRouter>
        </QueryClientProvider>
    );
};

export default App;
