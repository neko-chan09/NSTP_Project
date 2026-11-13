<?php
// app/Http/Controllers/API/Shared/AttendanceController.php

namespace App\Http\Controllers\API\Shared;

use App\Http\Controllers\Controller;
use App\Models\AttendanceSession;
use App\Models\AttendanceLog;
use App\Models\Student;
use App\Models\ClassGroup;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AttendanceController extends Controller
{
    /**
     * List attendance sessions.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = AttendanceSession::with(['faculty', 'class']);
        if ($user->role === 'student') {
            abort_unless($user->student, 403);
            $query->whereHas('class.students', fn($q) => $q->where('students.id', $user->student->id));
            $query->with(['logs' => fn($q) => $q->where('student_id', $user->student->id)->with('student.user')]);
        } else $query->with('logs.student.user');

        if ($user->role === 'faculty') {
            $query->where('faculty_id', $user->id);
        }

        // ✅ Optional: filter by class_id
        if ($request->filled('class_id')) {
            $query->where('class_id', $request->class_id);
        }

        $sessions = $query->orderBy('created_at', 'desc')->get();

        $sessions->transform(function ($session) {
            if ($session->is_scheduled) {
                if ($session->isOngoing()) {
                    $session->session_status = 'ongoing';
                } elseif ($session->hasEnded()) {
                    $session->session_status = 'ended';
                } elseif ($session->scheduled_start && $session->scheduled_start > now()) {
                    $session->session_status = 'upcoming';
                } else {
                    $session->session_status = 'unknown';
                }
            } else {
                $session->session_status = $session->status;
            }
            return $session;
        });

        return response()->json([
            'success' => true,
            'data' => $sessions,
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'course' => 'nullable|string',
            'section' => 'nullable|string',
            'component' => 'required|string|in:cwts,rotc,lts',
            'scheduled_start' => 'required|date',
            'scheduled_end' => 'required|date|after:scheduled_start',
            'description' => 'nullable|string',
            'grace_period_minutes' => 'nullable|integer|min:0|max:120',
            'class_id' => 'nullable|exists:classes,id',
            // Location fields
            'require_location' => 'boolean',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'geofence_radius' => 'nullable|integer|min:10|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = $request->user();

        if (!in_array($user->role, ['faculty', 'admin', 'super_admin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Determine the faculty's component for class filtering
        $facultyComponent = $user->role === 'faculty' ? $user->nstp_component : null;

        // Find class
        $class = null;

        if ($request->filled('class_id')) {
            $class = ClassGroup::find($request->class_id);
        }

        if (!$class && $request->filled('section')) {
            $class = ClassGroup::where(function ($query) use ($request, $facultyComponent) {
                $query->where('name', 'like', "%{$request->section}%");
                if ($facultyComponent) {
                    $query->where('component_type', $facultyComponent);
                }
            })->first();
        }

        if (!$class && $facultyComponent) {
            $class = ClassGroup::where('component_type', $facultyComponent)
                ->where('status', 'active')
                ->first();
        }

        if (!$class) {
            $class = ClassGroup::where('status', 'active')->first();
        }

        if (!$class) {
            return response()->json([
                'message' => 'No active class found. Please contact administrator.'
            ], 404);
        }

        if ($user->role === 'faculty') {
            if ($class->component_type !== 'all' && $user->nstp_component !== $class->component_type) {
                return response()->json([
                    'message' => 'You do not have permission for this class section. '
                        . 'Your component: ' . $user->nstp_component
                        . ', Class component: ' . $class->component_type
                ], 403);
            }
        }

        app(\App\Services\AttendanceAccess::class)->class($user, $class->id, true);

        $session = AttendanceSession::create([
            'faculty_id' => $user->role === 'faculty' ? $user->id : null,
            'class_id' => $class->id,
            'component' => $user->role === 'faculty' ? $user->nstp_component : $class->component_type,
            'scheduled_start' => $request->scheduled_start,
            'scheduled_end' => $request->scheduled_end,
            'start_time' => now(),
            'end_time' => now()->addHours(2),
            'grace_period_minutes' => $request->input('grace_period_minutes', 15),
            'is_scheduled' => true,
            'status' => 'active',
            'description' => $request->description ?? 'Attendance session for ' . $class->name,
            'require_location' => $request->input('require_location', false),
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
            'geofence_radius' => $request->input('geofence_radius', 100),
        ]);

        $class->update(['status' => 'active']);

        return response()->json([
            'success' => true,
            'message' => 'Attendance session started - broadcasting live.',
            'data' => $session->load(['faculty', 'logs', 'class']),
        ], 201);
    }

    public function checkActiveBroadcast(Request $request)
    {
        if ((int) $request->input('class_id')) app(\App\Services\AttendanceAccess::class)->class($request->user(), (int) $request->input('class_id'));
        try {
            $validator = Validator::make($request->all(), [
                'class_id' => 'required|integer|exists:classes,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'has_active_broadcast' => false,
                    'errors' => $validator->errors(),
                ], 422);
            }

            $classId = $request->class_id;
            $now = now();

            $activeSession = AttendanceSession::where('class_id', $classId)
                ->where('status', 'active')
                ->where(function ($query) use ($now) {
                    $query->where(function ($q) use ($now) {
                        $q->where('is_scheduled', true)
                            ->where('scheduled_start', '<=', $now)
                            ->where('scheduled_end', '>=', $now);
                    })->orWhere(function ($q) {
                        $q->where('is_scheduled', false);
                    });
                })
                ->latest('created_at')
                ->first();

            if (!$activeSession) {
                return response()->json([
                    'has_active_broadcast' => false,
                    'message' => 'No active attendance broadcast for this class',
                ]);
            }

            $class = ClassGroup::find($classId);
            if (!$class) {
                return response()->json([
                    'has_active_broadcast' => false,
                    'message' => 'Class section not found',
                ]);
            }

            $enrolledStudentIds = $class->students()
                ->where('class_students.status', 'active')
                ->pluck('students.id')
                ->toArray();

            $checkedInStudentIds = AttendanceLog::where('session_id', $activeSession->id)
                ->pluck('student_id')
                ->toArray();

            $remainingStudents = array_values(array_diff($enrolledStudentIds, $checkedInStudentIds));

            if (count($remainingStudents) === 0 && count($enrolledStudentIds) > 0) {
                return response()->json([
                    'has_active_broadcast' => false,
                    'message' => 'All students have checked in',
                ]);
            }

            return response()->json([
                'has_active_broadcast' => true,
                'session_id' => $activeSession->id,
                'time_remaining' => $activeSession->scheduled_end
                    ? max(0, now()->diffInSeconds($activeSession->scheduled_end, false))
                    : null,
                'remaining_students_count' => count($remainingStudents),
                'student_ids' => $remainingStudents,
                'message' => 'Active broadcast detected, '
                    . count($remainingStudents)
                    . ' students need to check in',
            ]);
        } catch (\Throwable $e) {
            Log::error('checkActiveBroadcast failed: ' . $e->getMessage(), [
                'class_id' => $request->class_id,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'has_active_broadcast' => false,
                'message' => 'Server error: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function checkGeofence(Request $request)
    {
        if ((int) $request->input('session_id')) app(\App\Services\AttendanceAccess::class)->session($request->user(), (int) $request->input('session_id'));
        try {
            $validator = Validator::make($request->all(), [
                'session_id' => 'required|integer|exists:attendance_sessions,id',
                'latitude' => 'required|numeric|between:-90,90',
                'longitude' => 'required|numeric|between:-180,180',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $session = AttendanceSession::where('id', $request->session_id)
                ->where('status', 'active')
                ->first();

            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found or inactive',
                ], 404);
            }

            $status = $session->getGeofenceStatus(
                (float) $request->latitude,
                (float) $request->longitude
            );

            return response()->json([
                'success' => true,
                'data' => $status,
            ]);
        } catch (\Throwable $e) {
            Log::error('checkGeofence error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to check geofence: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function show(Request $request, $id)
    {
        app(\App\Services\AttendanceAccess::class)->session($request->user(), (int) $id);
        $query = AttendanceSession::with(['faculty', 'class']);
        if ($request->user()->role === 'student') $query->with(['logs' => fn($q) => $q->where('student_id', $request->user()->student->id)]);
        else $query->with('logs.student.user');
        $session = $query->find($id);

        if (!$session) {
            return response()->json([
                'success' => false,
                'message' => 'Session not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $session,
        ]);
    }

    public function close(Request $request, $id)
    {
        app(\App\Services\AttendanceAccess::class)->session($request->user(), (int) $id, true);
        $session = AttendanceSession::find($id);

        if (!$session) {
            return response()->json([
                'success' => false,
                'message' => 'Session not found',
            ], 404);
        }

        $session->update([
            'status' => 'closed',
            'end_time' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Session closed',
            'data' => $session,
        ]);
    }

    public function logs(Request $request, $id)
    {
        app(\App\Services\AttendanceAccess::class)->session($request->user(), (int) $id, true);
        try {
            $session = AttendanceSession::with(['logs.student.user'])->find($id);

            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $session->logs,
            ]);
        } catch (\Throwable $e) {
            Log::error('logs error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to load logs: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function history(Request $request)
    {
        try {
            $student = $request->user()->student;

            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student profile not found',
                ], 404);
            }

            $logs = AttendanceLog::with(['session'])
                ->where('student_id', $student->id)
                ->orderBy('check_in_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $logs,
            ]);
        } catch (\Throwable $e) {
            Log::error('history error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to load history: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function myStatus(Request $request, $sessionId)
    {
        if ($sessionId) app(\App\Services\AttendanceAccess::class)->session($request->user(), $sessionId);
        try {
            $student = $request->user()->student;

            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student profile not found',
                ], 404);
            }

            $session = AttendanceSession::find($sessionId);

            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found',
                ], 404);
            }

            $log = AttendanceLog::where('session_id', $sessionId)
                ->where('student_id', $student->id)
                ->first();

            return response()->json([
                'success'      => true,
                'checked_in'   => $log !== null,
                'check_in_at'  => $log?->check_in_at,
                'status'       => $log?->status,
                'session_id'   => $session->id,
            ]);
        } catch (\Throwable $e) {
            Log::error('myStatus error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to check status: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function checkin(Request $request)
    {
        $size = (int) config('face.embedding_size', 192);

        $validator = Validator::make($request->all(), [
            'class_id' => 'required|integer|exists:classes,id',
            'session_id' => 'required_if:offline,true|nullable|integer|exists:attendance_sessions,id',
            'offline' => 'sometimes|boolean',
            'captured_at' => 'required_if:offline,true|nullable|date',
            'client_id' => 'nullable|string|max:100',
            'embedding' => "required|array|size:{$size}",
            'embedding.*' => 'numeric',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'accuracy' => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'match' => false,
                'message' => 'Invalid request',
                'errors' => $validator->errors(),
            ], 422);
        }

        $student = $request->user()->student;
        if (!$student) {
            return response()->json([
                'match' => false,
                'message' => 'Student profile not found',
            ], 404);
        }

        app(\App\Services\AttendanceAccess::class)->class($request->user(), (int) $request->class_id);
        $sessionQuery = AttendanceSession::where('class_id', $request->class_id);
        if ($request->filled('session_id')) $sessionQuery->where('id', $request->session_id);
        else $sessionQuery->where('status', 'active')->where(function ($q) {
            $q->where('is_scheduled', false)->orWhere(fn($q2) => $q2->where('scheduled_start', '<=', now())->where('scheduled_end', '>=', now()));
        });
        $session = $sessionQuery->latest('created_at')->first();
        if (!$session) return response()->json(['match' => false, 'message' => 'Attendance session not found for this class.'], 404);
        $capturedAt = app(\App\Services\AttendanceCaptureWindow::class)->time($session, $request->boolean('offline'), $request->input('captured_at'));

        $existing = AttendanceLog::where('session_id', $session->id)
            ->where('student_id', $student->id)
            ->first();
        if ($existing) {
            return response()->json([
                'match' => true,
                'message' => 'Already checked in',
                'confidence' => (float) ($existing->face_confidence ?? 1.0),
                'data' => $existing->load('student.user'),
            ]);
        }

        // ============================================================
        // LOCATION / GEOFENCE
        // ============================================================
        $latitude = $request->input('latitude');
        $longitude = $request->input('longitude');
        $accuracy = $request->input('accuracy');
        $distanceFromVenue = null;
        $isWithinGeofence = null;

        if ($session->require_location) {
            if (is_null($latitude) || is_null($longitude)) {
                return response()->json([
                    'match' => false,
                    'message' => 'Location required. Please enable GPS and try again.',
                    'location_status' => [
                        'enabled' => true,
                        'within' => false,
                        'distance' => null,
                        'radius' => $session->geofence_radius ?? 100,
                        'venue_lat' => $session->latitude,
                        'venue_lng' => $session->longitude,
                    ],
                ], 200);
            }

            if (is_null($session->latitude) || is_null($session->longitude)) {
                return response()->json([
                    'match' => false,
                    'message' => 'Venue location not configured. Please contact your instructor.',
                    'location_status' => [
                        'enabled' => true,
                        'within' => false,
                        'distance' => null,
                        'radius' => $session->geofence_radius ?? 100,
                        'venue_lat' => null,
                        'venue_lng' => null,
                    ],
                ], 200);
            }

            $distanceFromVenue = $session->calculateDistance(
                (float) $latitude,
                (float) $longitude,
                (float) $session->latitude,
                (float) $session->longitude,
            );

            $radius = $session->geofence_radius ?? 100;
            $isWithinGeofence = $distanceFromVenue <= $radius;

            Log::info('attendance.checkin geofence', [
                'student_id' => $student->id,
                'session_id' => $session->id,
                'student_lat' => $latitude,
                'student_lng' => $longitude,
                'venue_lat' => $session->latitude,
                'venue_lng' => $session->longitude,
                'distance' => round($distanceFromVenue, 2),
                'radius' => $radius,
                'within' => $isWithinGeofence,
            ]);

            if (!$isWithinGeofence) {
                return response()->json([
                    'match' => false,
                    'message' => sprintf(
                        'You are %.0fm from the venue. Please move within %dm to check in.',
                        $distanceFromVenue,
                        $radius
                    ),
                    'location_status' => [
                        'enabled' => true,
                        'within' => false,
                        'distance' => round($distanceFromVenue, 2),
                        'radius' => $radius,
                        'venue_lat' => $session->latitude,
                        'venue_lng' => $session->longitude,
                    ],
                ], 200);
            }
        }

        // ============================================================
        // FACE VERIFICATION
        // ============================================================
        $hasEmbeddings = \App\Models\FaceEmbedding::where('student_id', $student->id)->exists();
        if (!$hasEmbeddings) {
            return response()->json([
                'match' => false,
                'message' => 'You have not registered your face yet. Please register first.',
                'confidence' => 0,
            ], 200);
        }

        $liveEmbedding = array_map('floatval', $request->input('embedding'));
        if (!\App\Services\FaceMatchingService::validVector($liveEmbedding)) {
            return response()->json(['match' => false, 'message' => 'The face scan is invalid. Please scan again.'], 422);
        }

        /** @var \App\Services\FaceMatchingService $matcher */
        $matcher = app(\App\Services\FaceMatchingService::class);
        $result = $matcher->matchForStudent($student, $liveEmbedding);

        Log::info('attendance.checkin face', [
            'student_id' => $student->id,
            'session_id' => $session->id,
            'similarity' => $result['similarity'],
            'pose' => $result['pose'],
            'threshold' => $result['threshold'],
            'matched' => $result['matched'],
        ]);

        if (!$result['matched']) {
            return response()->json([
                'match' => false,
                'message' => 'Face not recognized. Please try again.',
                'confidence' => $result['similarity'],
            ], 200);
        }

        // ============================================================
        // STATUS
        // ============================================================
        $status = 'present';
        $minutesLate = 0;

        if ($session->scheduled_start) {
            $cutoff = $session->getLateCutoffTime();
            if ($capturedAt->gt($cutoff)) {
                $status = 'late';
                $minutesLate = max(0, (int) $cutoff->diffInMinutes($capturedAt, false));
            }
        }

        // ============================================================
        // RECORD ATTENDANCE
        // ============================================================
        $log = DB::transaction(function () use ($student, $session, $capturedAt, $status, $result, $latitude, $longitude, $minutesLate, $distanceFromVenue) {
            $lockedStudent = Student::where('id', $student->id)->lockForUpdate()->firstOrFail();
            $existing = AttendanceLog::where('session_id', $session->id)->where('student_id', $student->id)->first();
            if ($existing) return $existing;
            $log = AttendanceLog::create([
            'session_id'       => $session->id,
            'student_id'       => $student->id,
            'check_in_at'      => $capturedAt,
            'status'           => $status,
            'face_confidence'  => $result['similarity'],
            'location_lat'     => $latitude !== null ? (float) $latitude : null,
            'location_lng'     => $longitude !== null ? (float) $longitude : null,
            'minutes_late'     => $minutesLate,
            'remarks'          => sprintf(
                'Face check-in (%s)%s',
                $result['pose'] ?? 'n/a',
                $distanceFromVenue !== null
                    ? sprintf(' • %.0fm from venue', $distanceFromVenue)
                    : ''
            ),
        ]);

            $lockedStudent->increment('completed_training_hours', 1);
        if (method_exists($lockedStudent, 'updateTrainingGrade')) {
            $lockedStudent->updateTrainingGrade();
        }

            return $log;
        });

        return response()->json([
            'match' => true,
            'message' => $status === 'late'
                ? sprintf('Attendance recorded (late by %d min)', $minutesLate)
                : 'Attendance recorded successfully',
            'confidence' => $result['similarity'],
            'data' => $log->load('student.user'),
            'location_status' => $session->require_location
                ? [
                    'enabled' => true,
                    'within' => true,
                    'distance' => round((float) $distanceFromVenue, 2),
                    'radius' => $session->geofence_radius ?? 100,
                    'venue_lat' => $session->latitude,
                    'venue_lng' => $session->longitude,
                ]
                : [
                    'enabled' => false,
                ],
        ]);
    }
}
