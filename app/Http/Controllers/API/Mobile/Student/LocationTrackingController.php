<?php
// app/Http/Controllers/API/Mobile/Student/LocationTrackingController.php

namespace App\Http\Controllers\API\Mobile\Student;

use App\Http\Controllers\Controller;
use App\Models\StudentLocation;
use App\Models\Activity;
use App\Models\ActivityParticipation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class LocationTrackingController extends Controller
{
    /**
     * Start location tracking for an activity (when student checks in)
     */
    public function startTracking(Request $request, $activityId)
    {
        try {
            Log::info('Starting location tracking for activity: ' . $activityId);
            
            $student = $request->user()->student;

            if (!$student) {
                Log::error('Student not found for user: ' . $request->user()->id);
                return response()->json([
                    'success' => false,
                    'message' => 'Student profile not found'
                ], 404);
            }

            $activity = Activity::find($activityId);

            if (!$activity) {
                Log::error('Activity not found: ' . $activityId);
                return response()->json([
                    'success' => false,
                    'message' => 'Activity not found'
                ], 404);
            }

            // Check if student is registered for this activity
            $participation = ActivityParticipation::where('activity_id', $activityId)
                ->where('student_id', $student->id)
                ->first();

            if (!$participation) {
                Log::error('Student not registered for activity: ' . $activityId . ', Student: ' . $student->id);
                return response()->json([
                    'success' => false,
                    'message' => 'You are not registered for this activity'
                ], 403);
            }

            // Check if activity has started
            $now = now();
            $startTime = Carbon::parse($activity->start_datetime);
            
            if ($now->lt($startTime)) {
                Log::warning('Activity not started yet: ' . $activityId . ', Start: ' . $startTime);
                return response()->json([
                    'success' => false,
                    'message' => 'Activity has not started yet. Starts at: ' . $startTime->format('h:i A'),
                    'data' => [
                        'activity_start' => $startTime->toISOString(),
                        'can_start' => false,
                    ]
                ], 403);
            }

            // Check if activity has ended
            $endTime = Carbon::parse($activity->end_datetime);
            if ($now->gt($endTime)) {
                Log::warning('Activity already ended: ' . $activityId . ', End: ' . $endTime);
                return response()->json([
                    'success' => false,
                    'message' => 'Activity has already ended',
                    'data' => [
                        'activity_end' => $endTime->toISOString(),
                        'can_start' => false,
                    ]
                ], 403);
            }

            // ===== FIX 1: Read latitude & longitude from the request body first =====
            $latitude = $request->input('latitude');
            $longitude = $request->input('longitude');

            // Fallback: Check latestLocation if request payload has no coordinates
            if (is_null($latitude) || is_null($longitude)) {
                $latestLocation = StudentLocation::where('student_id', $student->id)
                    ->where('activity_id', $activityId)
                    ->orderBy('tracked_at', 'desc')
                    ->first();

                if ($latestLocation) {
                    $latitude = $latestLocation->latitude;
                    $longitude = $latestLocation->longitude;
                }
            }

            $distanceFromVenue = null;
            $isWithinGeofence = null; // Default to null instead of false if coordinates missing

            if (!is_null($latitude) && !is_null($longitude) && $activity->latitude && $activity->longitude) {
                $distanceFromVenue = $this->calculateDistance(
                    (float)$latitude,
                    (float)$longitude,
                    (float)$activity->latitude,
                    (float)$activity->longitude
                );
                $isWithinGeofence = $distanceFromVenue <= ($activity->geofence_radius ?? 100);

                // Create initial location history record
                StudentLocation::create([
                    'student_id' => $student->id,
                    'activity_id' => $activityId,
                    'latitude' => $latitude,
                    'longitude' => $longitude,
                    'accuracy' => $request->input('accuracy'),
                    'distance_from_venue' => $distanceFromVenue,
                    'is_within_geofence' => $isWithinGeofence,
                    'location_source' => $request->input('location_source', 'gps'),
                    'tracked_at' => now(),
                ]);
            }

            // ===== FIX 2: Update both set of coordinate columns =====
            $participation->update([
                'is_tracking_location' => true,
                'tracking_started_at' => $participation->tracking_started_at ?? now(),
                'check_in_at' => $participation->check_in_at ?? now(),
                'checkin_latitude' => $latitude,
                'checkin_longitude' => $longitude,
                'latitude' => $latitude,       // Sync second column
                'longitude' => $longitude,     // Sync second column
                'is_within_geofence' => $isWithinGeofence ?? false,
                'distance_from_venue' => $distanceFromVenue,
                'attendance_status' => 'present',
            ]);

            Log::info('Location tracking started for student: ' . $student->id . ' activity: ' . $activityId);

            return response()->json([
                'success' => true,
                'message' => 'Location tracking started successfully',
                'data' => [
                    'is_tracking' => true,
                    'tracking_started_at' => $participation->tracking_started_at,
                    'check_in_at' => $participation->check_in_at,
                    'is_within_geofence' => $isWithinGeofence,
                    'distance_from_venue' => $distanceFromVenue,
                    'latitude' => $latitude,
                    'longitude' => $longitude,
                    'activity' => [
                        'id' => $activity->id,
                        'title' => $activity->title,
                        'venue' => $activity->venue,
                        'latitude' => $activity->latitude,
                        'longitude' => $activity->longitude,
                        'geofence_radius' => $activity->geofence_radius ?? 100,
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Start tracking error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Failed to start tracking: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Stop location tracking (when activity ends or student leaves)
     */
    public function stopTracking(Request $request, $activityId)
    {
        try {
            Log::info('Stopping location tracking for activity: ' . $activityId);
            
            $student = $request->user()->student;

            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student not found'
                ], 404);
            }

            $participation = ActivityParticipation::where('activity_id', $activityId)
                ->where('student_id', $student->id)
                ->first();

            if (!$participation) {
                return response()->json([
                    'success' => false,
                    'message' => 'Participation not found'
                ], 404);
            }

            if (!$participation->is_tracking_location) {
                return response()->json([
                    'success' => true,
                    'message' => 'Location tracking already stopped'
                ]);
            }

            // Stop tracking
            $participation->update([
                'is_tracking_location' => false,
                'tracking_ended_at' => now(),
            ]);

            Log::info('Location tracking stopped for student: ' . $student->id . ' activity: ' . $activityId);

            return response()->json([
                'success' => true,
                'message' => 'Location tracking stopped successfully',
                'data' => [
                    'is_tracking' => false,
                    'tracking_ended_at' => $participation->tracking_ended_at,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Stop tracking error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to stop tracking: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update student's location (called every minute by mobile)
     */
    public function updateLocation(Request $request)
    {
        try {
            $student = $request->user()->student;

            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'latitude' => 'required|numeric|between:-90,90',
                'longitude' => 'required|numeric|between:-180,180',
                'accuracy' => 'nullable|numeric|min:0',
                'activity_id' => 'required|exists:activities,id',
                'location_source' => 'nullable|string|in:gps,wifi,network',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $activityId = $request->activity_id;
            $latitude = $request->latitude;
            $longitude = $request->longitude;
            $accuracy = $request->accuracy ?? null;
            $source = $request->location_source ?? 'gps';

            // Check if tracking is active for this activity
            $participation = ActivityParticipation::where('activity_id', $activityId)
                ->where('student_id', $student->id)
                ->first();

            if (!$participation) {
                return response()->json([
                    'success' => false,
                    'message' => 'Not registered for this activity'
                ], 403);
            }

            // Get activity for geofence check
            $activity = Activity::find($activityId);
            $distanceFromVenue = null;
            $isWithinGeofence = false;

            if ($activity && $activity->latitude && $activity->longitude) {
                $distanceFromVenue = $this->calculateDistance(
                    (float)$latitude,
                    (float)$longitude,
                    (float)$activity->latitude,
                    (float)$activity->longitude
                );
                $isWithinGeofence = $distanceFromVenue <= ($activity->geofence_radius ?? 100);
            }

            // Create location record
            $location = StudentLocation::create([
                'student_id' => $student->id,
                'activity_id' => $activityId,
                'latitude' => $latitude,
                'longitude' => $longitude,
                'accuracy' => $accuracy,
                'distance_from_venue' => $distanceFromVenue,
                'is_within_geofence' => $isWithinGeofence,
                'location_source' => $source,
                'tracked_at' => now(),
            ]);

            // ===== FIX 3: Update BOTH coordinate column pairs in activity_participations =====
            $participation->update([
                'checkin_latitude' => $latitude,
                'checkin_longitude' => $longitude,
                'latitude' => $latitude,           // Sync secondary column
                'longitude' => $longitude,         // Sync secondary column
                'is_within_geofence' => $isWithinGeofence,
                'distance_from_venue' => $distanceFromVenue,
                'attendance_status' => 'present',
                'check_in_at' => $participation->check_in_at ?? now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Location updated successfully',
                'data' => [
                    'id' => $location->id,
                    'is_within_geofence' => $isWithinGeofence,
                    'distance_from_venue' => $distanceFromVenue,
                    'tracked_at' => $location->tracked_at,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Location update error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update location: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get tracking status for an activity
     */
    public function getTrackingStatus(Request $request, $activityId)
    {
        try {
            $student = $request->user()->student;

            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student not found'
                ], 404);
            }

            $participation = ActivityParticipation::where('activity_id', $activityId)
                ->where('student_id', $student->id)
                ->first();

            if (!$participation) {
                return response()->json([
                    'success' => false,
                    'message' => 'Not registered for this activity'
                ], 404);
            }

            $activity = Activity::find($activityId);
            $now = now();
            $startTime = Carbon::parse($activity->start_datetime);
            $endTime = Carbon::parse($activity->end_datetime);
            $isActive = $now->between($startTime, $endTime);
            $isEnded = $now->gt($endTime);

            // Auto-stop: If activity ended and tracking is still active
            if ($isEnded && $participation->is_tracking_location) {
                $participation->update([
                    'is_tracking_location' => false,
                    'tracking_ended_at' => $endTime,
                ]);
                
                Log::info('Auto-stopped tracking for student: ' . $student->id . ' activity: ' . $activityId . ' (activity ended)');
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'is_tracking' => $participation->is_tracking_location,
                    'tracking_started_at' => $participation->tracking_started_at,
                    'tracking_ended_at' => $participation->tracking_ended_at,
                    'check_in_at' => $participation->check_in_at,
                    'activity_is_active' => $isActive,
                    'activity_ended' => $isEnded,
                    'activity_start' => $startTime->toISOString(),
                    'activity_end' => $endTime->toISOString(),
                    'can_start_tracking' => $isActive && !$participation->is_tracking_location,
                    'can_stop_tracking' => $participation->is_tracking_location && !$isEnded,
                    'is_within_geofence' => $participation->is_within_geofence,
                    'distance_from_venue' => $participation->distance_from_venue,
                    'attendance_marked' => $participation->is_tracking_location,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Tracking status error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to get tracking status: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all active students' locations for an activity (for admin/faculty)
     */
    public function getActiveLocations(Request $request, $activityId)
    {
        try {
            $user = $request->user();
            if (!in_array($user->role, ['admin', 'super_admin', 'faculty'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }

            $locations = StudentLocation::where('activity_id', $activityId)
                ->where('tracked_at', '>=', now()->subMinutes(5))
                ->with(['student.user'])
                ->orderBy('tracked_at', 'desc')
                ->get()
                ->groupBy('student_id')
                ->map(function ($group) {
                    return $group->first();
                })
                ->values()
                ->map(function ($location) {
                    return [
                        'student_id' => $location->student_id,
                        'student_name' => $location->student->user->first_name . ' ' . $location->student->user->last_name,
                        'latitude' => $location->latitude,
                        'longitude' => $location->longitude,
                        'accuracy' => $location->accuracy,
                        'distance_from_venue' => $location->distance_from_venue,
                        'is_within_geofence' => $location->is_within_geofence,
                        'last_updated' => $location->tracked_at,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $locations
            ]);

        } catch (\Exception $e) {
            Log::error('Active locations error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to get active locations: ' . $e->getMessage()
            ], 500);
        }
    }

    // Helper to calculate distance in meters
    private function calculateDistance($lat1, $lng1, $lat2, $lng2)
    {
        $earthRadius = 6371000;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLng / 2) * sin($dLng / 2);
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
        return $earthRadius * $c;
    }
}