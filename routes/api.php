<?php
// routes/api.php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;

// ============================================================
// SHARED CONTROLLERS
// ============================================================
use App\Http\Controllers\API\Mobile\Faculty\LearningMaterialController;
use App\Http\Controllers\API\Shared\AuthController;
use App\Http\Controllers\API\Shared\AttendanceController;
use App\Http\Controllers\API\Shared\PasswordResetController;

// ============================================================
// WEB ADMIN CONTROLLERS
// ============================================================
use App\Http\Controllers\API\Web\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\API\Web\Admin\StudentController as AdminStudentController;
use App\Http\Controllers\API\Shared\OptionsController;
use App\Http\Controllers\API\Web\Admin\ActivityController as AdminActivityController;
use App\Http\Controllers\API\Web\Admin\DocumentController as AdminDocumentController;
use App\Http\Controllers\API\Web\Admin\CertificateController as AdminCertificateController;
use App\Http\Controllers\API\Web\Admin\ReportController as AdminReportController;
use App\Http\Controllers\API\Web\Admin\AcademicYearController;
use App\Http\Controllers\API\Web\Admin\OfficeDocumentController;
use App\Http\Controllers\API\Web\Admin\BulletinController;
use App\Http\Controllers\API\Web\Admin\SettingsController;
use App\Http\Controllers\API\Web\Admin\OCRController;
use App\Http\Controllers\API\Web\Admin\GradeController;
use App\Http\Controllers\API\Web\Admin\ActivityMapController;
use App\Http\Controllers\API\Web\Admin\ComponentChangeController as AdminComponentChangeController;
use App\Http\Controllers\API\Web\Admin\UserController;
use App\Http\Controllers\API\Web\Admin\ClassController as AdminClasscontroller;
use App\Http\Controllers\API\Admin\AdminFaceResetController;

// ============================================================
// SUPER ADMIN CONTROLLERS
// ============================================================
use App\Http\Controllers\API\Web\SuperAdmin\SuperAdminController;
use App\Http\Controllers\API\Web\SuperAdmin\BackupController;
use App\Http\Controllers\API\Web\SuperAdmin\SuperAdminFaceResetController;

// ============================================================
// MOBILE STUDENT CONTROLLERS
// ============================================================
use App\Http\Controllers\API\Mobile\Student\DashboardController as StudentDashboardController;
use App\Http\Controllers\API\Mobile\Student\ProfileController;
use App\Http\Controllers\API\Mobile\Student\DocumentController as StudentDocumentController;
use App\Http\Controllers\API\Mobile\Student\CertificateController as StudentCertificateController;
use App\Http\Controllers\API\Mobile\Student\ActivityController as StudentActivityController;
use App\Http\Controllers\API\Mobile\Student\AnnouncementController as StudentAnnouncementController;
use App\Http\Controllers\API\Mobile\Student\ClassController as StudentClassController;
use App\Http\Controllers\API\Mobile\Student\NotificationController;
use App\Http\Controllers\API\Mobile\Student\FaceEmbeddingController;
use App\Http\Controllers\API\Mobile\Student\ComponentChangeController;
use App\Http\Controllers\API\Mobile\Student\LocationTrackingController;

// ============================================================
// MOBILE FACULTY CONTROLLERS
// ============================================================
use App\Http\Controllers\API\Mobile\Faculty\DashboardController as FacultyDashboardController;
use App\Http\Controllers\API\Mobile\Faculty\StudentController as FacultyStudentController;
use App\Http\Controllers\API\Mobile\Faculty\AnnouncementController as FacultyAnnouncementController;
use App\Http\Controllers\API\Mobile\Faculty\ClassController as FacultyClassController;
use App\Http\Controllers\API\Mobile\Faculty\LearningMaterialController as FacultyLearningMaterialController;

/*
|--------------------------------------------------------------------------
| PUBLIC ROUTES
|--------------------------------------------------------------------------
*/

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/admin/login', [AuthController::class, 'adminLogin']);
Route::get('/verify-certificate/{number}', [StudentCertificateController::class, 'verify']);
Route::post('/check-email', [AuthController::class, 'checkEmail']);
Route::post('/check-contact-number', [AuthController::class, 'checkContactNumber']);

/*
|--------------------------------------------------------------------------
| PUBLIC ROUTES — no auth
|--------------------------------------------------------------------------
*/
Route::get('/activities/map', [ActivityMapController::class, 'getActivitiesWithLocations']);
Route::get('/activities/{id}/map', [ActivityMapController::class, 'getActivityLocation']);
Route::put('/activities/{id}/location', [ActivityMapController::class, 'updateLocation']);

/*
|--------------------------------------------------------------------------
| PASSWORD RESET (public)
|--------------------------------------------------------------------------
*/
Route::prefix('api')->group(function () {
    Route::post('/send-otp', [PasswordResetController::class, 'sendOtp']);
    Route::post('/verify-otp', [PasswordResetController::class, 'verifyOtp']);
    Route::post('/reset', [PasswordResetController::class, 'resetPassword']);
    Route::post('/resend-otp', [PasswordResetController::class, 'resendOtp']);
});

/*
|--------------------------------------------------------------------------
| AUTHENTICATED ROUTES
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    // ============================================================
    // SHARED AUTH
    // ============================================================
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);
    Route::post('/change-password-first-login', [AuthController::class, 'changePasswordFirstLogin']);

    // ============================================================
    // SELF-SERVICE PROFILE (Web + Mobile)
    // ============================================================
    Route::prefix('profile')->group(function () {
        Route::get('/', [AuthController::class, 'getProfile']);
        Route::post('/', [AuthController::class, 'updateProfile']);
        Route::post('/photo', [AuthController::class, 'uploadPhoto']);
        Route::delete('/photo', [AuthController::class, 'deletePhoto']);
        Route::post('/change-password', [AuthController::class, 'changePassword']);
    });

    // ============================================================
    // LOCATION TRACKING
    // ============================================================
    Route::post('/student/location', [LocationTrackingController::class, 'updateLocation']);
    Route::post('/student/location/update', [LocationTrackingController::class, 'updateLocation']);

    Route::get('/attendance/my-status/{sessionId}', [AttendanceController::class, 'myStatus']);

    Route::post('/student/activity/{activityId}/start-tracking', [LocationTrackingController::class, 'startTracking']);
    Route::post('/student/activity/{activityId}/stop-tracking', [LocationTrackingController::class, 'stopTracking']);

    Route::get('/student/activity/{activityId}/tracking-status', [LocationTrackingController::class, 'getTrackingStatus']);
    Route::get('/student/locations/{activityId}', [LocationTrackingController::class, 'getLocationHistory']);
    Route::get('/admin/activity/{activityId}/locations', [LocationTrackingController::class, 'getActiveLocations']);

    // ============================================================
    // BULLETIN (public reads, admin writes)
    // ============================================================
    Route::get('/bulletin', [BulletinController::class, 'index']);
    Route::post('/bulletin', [BulletinController::class, 'store']);
    Route::get('/bulletin/{id}', [BulletinController::class, 'show']);
    Route::put('/bulletin/{id}', [BulletinController::class, 'update']);
    Route::delete('/bulletin/{id}', [BulletinController::class, 'destroy']);

    // ============================================================
    // SETTINGS
    // ============================================================
    Route::get('/settings', [SettingsController::class, 'index']);
    Route::put('/settings', [SettingsController::class, 'update']);

    // ============================================================
    // DROPDOWN OPTIONS
    // ============================================================
    Route::prefix('options')->group(function () {
        Route::get('/courses', [OptionsController::class, 'getCourses']);
        Route::get('/sections', [OptionsController::class, 'getSections']);
        Route::get('/year-levels', [OptionsController::class, 'getYearLevels']);
        Route::get('/components', [OptionsController::class, 'getComponents']);
    });

    // ============================================================
    // DASHBOARD
    // ============================================================
    Route::get('/dashboard/stats', [AdminDashboardController::class, 'stats']);

    // ============================================================
    // ATTENDANCE (shared between admin, faculty, student)
    // ============================================================
    Route::get('/attendance/sessions', [AttendanceController::class, 'index']);
    Route::post('/attendance/session', [AttendanceController::class, 'store']);

    Route::match(['get', 'post'], '/attendance/check-active-broadcast', [AttendanceController::class, 'checkActiveBroadcast']);

    Route::post('/attendance/checkin', [AttendanceController::class, 'checkin']);
    Route::post('/attendance/check-geofence', [AttendanceController::class, 'checkGeofence']);
    Route::get('/attendance/sessions/{id}', [AttendanceController::class, 'show']);
    Route::patch('/attendance/session/{id}/close', [AttendanceController::class, 'close']);
    Route::get('/attendance/session/{id}/logs', [AttendanceController::class, 'logs']);

    Route::post('/attendance/my-history', [AttendanceController::class, 'history']);

    // ============================================================
    // ACTIVITIES (shared admin + faculty)
    // ============================================================
    Route::prefix('activities')->group(function () {
        Route::get('/', [AdminActivityController::class, 'index']);
        Route::post('/', [AdminActivityController::class, 'store']);
        Route::get('/{id}', [AdminActivityController::class, 'show']);
        Route::put('/{id}', [AdminActivityController::class, 'update']);
        Route::delete('/{id}', [AdminActivityController::class, 'destroy']);
        Route::get('/{id}/participants', [AdminActivityController::class, 'participants']);
        Route::put('/{activityId}/participants/{participantId}', [AdminActivityController::class, 'updateParticipant']);
        Route::delete('/{activityId}/participants/{participantId}', [AdminActivityController::class, 'removeParticipant']);
    });

    // ============================================================
    // OCR (shared)
    // ============================================================
    Route::post('/documents/save-ocr', [OCRController::class, 'saveOCR']);
    Route::get('/documents/{documentId}/ocr-history', [OCRController::class, 'getOCRHistory']);
    Route::get('/ocr-texts/{id}/download', [OCRController::class, 'downloadOCR']);
    Route::delete('/ocr-texts/{id}', [OCRController::class, 'deleteOCR']);
    Route::get('/ocr-stats', [OCRController::class, 'getStats']);

    // ============================================================
    // OFFICE DOCUMENTS (shared)
    // ============================================================
    Route::get('/office-documents', [OfficeDocumentController::class, 'index']);
    Route::post('/office-documents', [OfficeDocumentController::class, 'store']);
    Route::delete('/office-documents/{id}', [OfficeDocumentController::class, 'destroy']);
    Route::get('/office-documents/{id}/download', [OfficeDocumentController::class, 'download']);

    // ============================================================
    // ============================================================
    // ADMIN WEB ROUTES
    // ============================================================
    // ============================================================
    Route::middleware(['admin'])->prefix('admin')->group(function () {

        // ---------- USERS ----------
        Route::get('/users', [UserController::class, 'index']);

        // ---------- STUDENT IMPORT (chunked sync) ----------
        Route::get('/students/import/history', [\App\Http\Controllers\API\Web\Admin\StudentImportController::class, 'history']);
        Route::post('/students/import/start', [\App\Http\Controllers\API\Web\Admin\StudentImportController::class, 'start']);
        Route::post('/students/import/{id}/process-chunk', [\App\Http\Controllers\API\Web\Admin\StudentImportController::class, 'processChunk']);
        Route::get('/students/import/{id}/status', [\App\Http\Controllers\API\Web\Admin\StudentImportController::class, 'status']);
        Route::post('/students/import/{id}/cancel', [\App\Http\Controllers\API\Web\Admin\StudentImportController::class, 'cancel']);

        // ---------- STUDENTS ----------
        Route::get('/students/template', [AdminStudentController::class, 'templateCsv']);
        Route::post('/students/import', [AdminStudentController::class, 'import']);
        Route::get('/students/export', [AdminStudentController::class, 'export']);
        Route::get('/students/stats', [AdminStudentController::class, 'stats']);
        Route::get('/students/requests', [AdminStudentController::class, 'getChangeRequests']);
        Route::put('/students/requests/{id}', [AdminStudentController::class, 'handleChangeRequest']);
        Route::delete('/students/bulk', [AdminStudentController::class, 'bulkDestroy']);
        Route::get('/students', [AdminStudentController::class, 'index']);
        Route::post('/students', [AdminStudentController::class, 'store']);
        Route::get('/students/{id}', [AdminStudentController::class, 'show']);
        Route::put('/students/{id}', [AdminStudentController::class, 'update']);
        Route::delete('/students/{id}', [AdminStudentController::class, 'destroy']);
        Route::delete('/students/{student}/face-embeddings', [AdminFaceResetController::class, 'destroy']);

        // ---------- DOCUMENTS ----------
        Route::get('/documents', [AdminDocumentController::class, 'index']);
        Route::put('/documents/{id}/verify', [AdminDocumentController::class, 'verify']);
        Route::get('/documents/{id}/download', [AdminDocumentController::class, 'download']);

        // ---------- CERTIFICATES ----------
        Route::get('/certificates', [AdminCertificateController::class, 'index']);
        Route::get('/certificates/eligible-students', [AdminCertificateController::class, 'getEligibleStudents']);
        Route::post('/certificates/generate', [AdminCertificateController::class, 'generate']);
        Route::post('/certificates/batch', [AdminCertificateController::class, 'batchGenerate']);

        // ---------- REPORTS ----------
        Route::get('/reports/compliance', [AdminReportController::class, 'enrollmentSummary']);
        Route::get('/reports/deficiency', [AdminReportController::class, 'deficiencySummary']);
        Route::post('/reports/compliance', [AdminReportController::class, 'complianceReport']);
        Route::post('/reports/deficiency', [AdminReportController::class, 'deficiencyReport']);
        Route::get('/reports/attendance', [AdminReportController::class, 'attendanceReport']);

        // ---------- ACCOMPLISHMENT REPORT ----------
        Route::get('/reports/accomplishment/template', [AdminReportController::class, 'accomplishmentTemplate']);
        Route::post('/reports/accomplishment/import', [AdminReportController::class, 'accomplishmentImport']);
        Route::get('/reports/accomplishment', [AdminReportController::class, 'accomplishmentReport']);
        Route::post('/reports/accomplishment/pdf', [AdminReportController::class, 'accomplishmentReportPdf']);
        Route::get('/reports/accomplishment/export', [AdminReportController::class, 'accomplishmentExport']);

        // ---------- ACADEMIC YEARS ----------
        Route::get('/academic-years', [AcademicYearController::class, 'index']);
        Route::post('/academic-years', [AcademicYearController::class, 'store']);
        Route::put('/academic-years/{id}', [AcademicYearController::class, 'update']);
        Route::delete('/academic-years/{id}', [AcademicYearController::class, 'destroy']);
        Route::get('/academic-years/current', [AcademicYearController::class, 'current']);

        // ---------- COMPONENT CHANGE REQUESTS ----------
        Route::get('/component-requests', [AdminComponentChangeController::class, 'index']);
        Route::put('/component-requests/{id}', [AdminComponentChangeController::class, 'update']);

        // ---------- GRADES ----------
        Route::get('/grades', [GradeController::class, 'index']);
        Route::get('/grades/scale', [GradeController::class, 'getGradeScale']);
        Route::get('/grades/stats', [GradeController::class, 'getStats']);
        Route::get('/grades/export', [GradeController::class, 'exportGrades']);
        Route::post('/grades/batch', [GradeController::class, 'batchUpdateGrades']);
        Route::post('/grades/recalculate', [GradeController::class, 'recalculateAllGrades']);
        Route::get('/grades/{id}', [GradeController::class, 'show']);
        Route::put('/grades/{id}', [GradeController::class, 'updateGrade']);

        // ---------- CLASSES ----------
        Route::get('/classes/school-years', [AdminClasscontroller::class, 'schoolYears']);
        Route::get('/classes/export', [AdminClasscontroller::class, 'exportCsv']);
        Route::get('/classes/template', [AdminClasscontroller::class, 'templateCsv']);
        Route::post('/classes/import', [AdminClasscontroller::class, 'importCsv']);
        Route::post('/classes/import-enrollments', [AdminClasscontroller::class, 'importStudentsCsv']);
        Route::get('/classes', [AdminClasscontroller::class, 'index']);
        Route::post('/classes', [AdminClasscontroller::class, 'store']);
        Route::get('/classes/{id}', [AdminClasscontroller::class, 'show']);
        Route::put('/classes/{id}', [AdminClasscontroller::class, 'update']);
        Route::delete('/classes/{id}', [AdminClasscontroller::class, 'destroy']);
        Route::patch('/classes/{id}/toggle-archive', [AdminClasscontroller::class, 'toggleArchive']);
        Route::get('/classes/{id}/students', [AdminClasscontroller::class, 'getStudents']);
        Route::post('/classes/{id}/students', [AdminClasscontroller::class, 'addStudents']);
        Route::delete('/classes/{classId}/students/{studentId}', [AdminClasscontroller::class, 'removeStudent']);
    });

    // ============================================================
    // ============================================================
    // SUPER ADMIN ROUTES
    // ============================================================
    // ============================================================
    Route::prefix('superadmin')->group(function () {

        // ---------- USERS (admin + faculty) ----------
        Route::get('/users', [SuperAdminController::class, 'index']);
        Route::post('/users', [SuperAdminController::class, 'store']);
        Route::get('/users/{id}', [SuperAdminController::class, 'show']);
        Route::put('/users/{id}', [SuperAdminController::class, 'update']);
        Route::delete('/users/{id}', [SuperAdminController::class, 'destroy']);
        Route::patch('/users/{id}/toggle', [SuperAdminController::class, 'toggleActive']);
        Route::get('/stats', [SuperAdminController::class, 'stats']);

        // ---------- FACE RESET (search student + reset face) ----------
        Route::get('/students/search', [SuperAdminFaceResetController::class, 'search']);
        Route::delete('/students/{student}/face-embeddings', [SuperAdminFaceResetController::class, 'destroy']);

        // ---------- FACULTY CSV (chunked sync) ----------
        Route::get('/faculty/template', [SuperAdminController::class, 'templateCsv']);
        Route::get('/faculty/export', [SuperAdminController::class, 'exportCsv']);
        Route::get('/faculty/import/history', [SuperAdminController::class, 'importHistory']);
        Route::post('/faculty/import/start', [SuperAdminController::class, 'importStart']);
        Route::post('/faculty/import/{id}/process-chunk', [SuperAdminController::class, 'importProcessChunk']);
        Route::get('/faculty/import/{id}/status', [SuperAdminController::class, 'importStatus']);
        Route::post('/faculty/import/{id}/cancel', [SuperAdminController::class, 'importCancel']);

        // Legacy — kept for backward-compat (old modal)
        Route::post('/faculty/import', [SuperAdminController::class, 'importCsv']);

        // ---------- BACKUPS ----------
        Route::prefix('backups')->group(function () {
            // Manual backups
            Route::get('/', [BackupController::class, 'index']);
            Route::post('/', [BackupController::class, 'store']);
            Route::get('/stats', [BackupController::class, 'stats']);

            // Schedules (must come BEFORE /{id} routes)
            Route::get('/schedules', [BackupController::class, 'indexSchedules']);
            Route::post('/schedules', [BackupController::class, 'storeSchedule']);
            Route::put('/schedules/{id}', [BackupController::class, 'updateSchedule']);
            Route::patch('/schedules/{id}/toggle', [BackupController::class, 'toggleSchedule']);
            Route::post('/schedules/{id}/run-now', [BackupController::class, 'runScheduleNow']);
            Route::delete('/schedules/{id}', [BackupController::class, 'destroySchedule']);

            // Manual purge
            Route::post('/purge-now', [BackupController::class, 'purgeNow']);

            // Per-backup actions (must come AFTER /schedules)
            Route::get('/{id}/download', [BackupController::class, 'download']);
            Route::post('/{id}/restore', [BackupController::class, 'restore']);
            Route::delete('/{id}', [BackupController::class, 'destroy']);
        });
    });

    // ============================================================
    // ============================================================
    // STUDENT MOBILE ROUTES
    // ============================================================
    // ============================================================
    Route::middleware('student')->prefix('student')->group(function () {

        // Dashboard
        Route::get('/dashboard', [StudentDashboardController::class, 'stats']);

        // Profile
        Route::get('/profile', [ProfileController::class, 'profile']);
        Route::put('/profile', [ProfileController::class, 'updateProfile']);
        Route::post('/profile/photo', [ProfileController::class, 'uploadPhoto']);
        Route::delete('/profile/photo', [ProfileController::class, 'deletePhoto']);
        Route::post('/request-otp', [ProfileController::class, 'requestOtp']);
        Route::post('/change-password', [ProfileController::class, 'changePasswordWithOtp']);
        Route::get('/compliance-status', [ProfileController::class, 'complianceStatus']);

        // Face embeddings
        Route::post('/face-embeddings', [FaceEmbeddingController::class, 'store']);
        Route::get('/face-status', [FaceEmbeddingController::class, 'status']);

        // Documents
        Route::get('/documents', [StudentDocumentController::class, 'myDocuments']);
        Route::post('/documents', [StudentDocumentController::class, 'store']);
        Route::post('/documents/bulk', [StudentDocumentController::class, 'bulkUpload']);
        Route::delete('/documents/{id}', [StudentDocumentController::class, 'destroy']);
        Route::get('/documents/{id}/download', [StudentDocumentController::class, 'download']);

        // Certificates
        Route::get('/certificates', [StudentCertificateController::class, 'myCertificates']);
        Route::get('/certificates/{id}/download', [StudentCertificateController::class, 'download']);

        // Activities
        Route::get('/activities', [StudentActivityController::class, 'studentActivities']);
        Route::post('/activities/{id}/register', [StudentActivityController::class, 'register']);
        Route::get('/activities/{id}', [StudentActivityController::class, 'show']);

        // Announcements
        Route::get('/announcements', [StudentAnnouncementController::class, 'index']);

        // Notifications
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
        Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
        Route::post('/notifications/{id}/unread', [NotificationController::class, 'markAsUnread']);

        // Classes
        Route::get('/classes', [StudentClassController::class, 'myClasses']);
        Route::get('/classes/{id}', [StudentClassController::class, 'show']);
        Route::get('/classes/{classId}/materials', [StudentClassController::class, 'materials']);
        Route::get('/materials/{materialId}/download', [StudentClassController::class, 'downloadMaterial']);

        // Component change
        Route::get('/component-requests', [ComponentChangeController::class, 'index']);
        Route::post('/request-component-change', [ComponentChangeController::class, 'store']);
        Route::delete('/component-requests/{id}', [ComponentChangeController::class, 'cancel']);
    });

    // ============================================================
    // ============================================================
    // FACULTY MOBILE ROUTES
    // ============================================================
    // ============================================================
    Route::prefix('faculty')->group(function () {

        // Dashboard
        Route::get('/dashboard', [FacultyDashboardController::class, 'stats']);

        // Students
        Route::get('/students', [FacultyStudentController::class, 'index']);

        // Announcements
        Route::get('/announcements', [FacultyAnnouncementController::class, 'index']);
        Route::post('/announcements', [FacultyAnnouncementController::class, 'store']);
        Route::put('/announcements/{id}', [FacultyAnnouncementController::class, 'update']);
        Route::delete('/announcements/{id}', [FacultyAnnouncementController::class, 'destroy']);

        // Classes
        Route::get('/classes', [FacultyClassController::class, 'index']);
        Route::post('/classes', [FacultyClassController::class, 'store']);
        Route::get('/class/{id}', [FacultyClassController::class, 'show']);
        Route::put('/classes/{id}', [FacultyClassController::class, 'update']);
        Route::delete('/classes/{id}', [FacultyClassController::class, 'destroy']);
        Route::patch('/classes/{id}/archive', [FacultyClassController::class, 'archive']);
        Route::post('/classes/{id}/regenerate-code', [FacultyClassController::class, 'regenerateCode']);
        Route::get('/classes/{id}/students', [FacultyClassController::class, 'students']);

        // Learning Materials
        Route::get('/classes/{classId}/materials', [FacultyLearningMaterialController::class, 'index']);
        Route::post('/classes/{classId}/materials/bulk', [FacultyLearningMaterialController::class, 'storeBulk']);
        Route::post('/classes/{classId}/materials', [FacultyLearningMaterialController::class, 'store']);
        Route::get('/materials/{materialId}/download', [FacultyLearningMaterialController::class, 'download']);
        Route::put('/materials/{id}', [FacultyLearningMaterialController::class, 'update']);
        Route::delete('/materials/{id}', [FacultyLearningMaterialController::class, 'destroy']);

        // Shared activity detail
        Route::get('/activities/{id}', [AdminActivityController::class, 'show']);
    });

    // ============================================================
    // LEGACY MOBILE DASHBOARD (deprecated, kept for compatibility)
    // ============================================================
    Route::middleware('mobile')->prefix('mobile')->group(function () {
        Route::get('/dashboard', [StudentDashboardController::class, 'stats']);
    });
});

/*
|--------------------------------------------------------------------------
| FALLBACK
|--------------------------------------------------------------------------
*/
Route::fallback(function () {
    return response()->json([
        'success' => false,
        'message' => 'Route not found',
    ], 404);
});