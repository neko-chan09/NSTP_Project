<?php
// app/Http/Controllers/API/Web/Admin/ActivityMapController.php

namespace App\Http\Controllers\API\Web\Admin;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\ActivityParticipation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ActivityMapController extends Controller
{
    /**
     * Get activity location data for mapping
     */
    public function getActivityLocation($id)
    {
        try {
            Log::info('Getting activity location for ID: ' . $id);

            // Fetch activity with participants and nested user models
            $activity = Activity::with(['creator', 'participations.student.user'])->find($id);

            if (!$activity) {
                Log::error('Activity not found: ' . $id);
                return response()->json([
                    'success' => false,
                    'message' => 'Activity not found'
                ], 404);
            }

            $allParticipations = $activity->participations;

            $participants = $allParticipations->map(function ($participation) use ($activity) {
                $student = $participation->student;
                $user = $student->user ?? null;
                $distance = null;

                // FIX 1: Support both checkin_latitude/longitude AND latitude/longitude database columns
                $lat = $participation->checkin_latitude ?? $participation->latitude;
                $lng = $participation->checkin_longitude ?? $participation->longitude;

                // Validate coordinates are present and not zero
                $hasCheckIn = !is_null($lat) && !is_null($lng) && (float)$lat !== 0.0 && (float)$lng !== 0.0;

                if ($hasCheckIn && $activity->latitude && $activity->longitude) {
                    $distance = $this->calculateDistance(
                        (float)$lat,
                        (float)$lng,
                        (float)$activity->latitude,
                        (float)$activity->longitude
                    );
                }

                // FIX 2: Only calculate geofence status if valid coordinates exist
                $isWithin = null;
                if ($hasCheckIn) {
                    $geofenceRadius = $activity->geofence_radius ?? 100;
                    $isWithin = $distance !== null ? ($distance <= $geofenceRadius) : (bool)($participation->is_within_geofence ?? false);
                }

                return [
                    'id' => $participation->id,
                    'student_id' => $student->student_id ?? 'N/A',
                    'student_name' => $user ? ($user->first_name . ' ' . $user->last_name) : 'Unknown Student',
                    'latitude' => $hasCheckIn ? (float)$lat : null,
                    'longitude' => $hasCheckIn ? (float)$lng : null,
                    'has_checked_in' => $hasCheckIn,
                    'check_in_at' => $participation->check_in_at ?? $participation->attended_at ?? $participation->created_at,
                    'attendance_status' => $participation->attendance_status ?? 'registered',
                    'is_within_geofence' => $isWithin, // Returns true, false, or null if no GPS
                    'distance_from_venue' => $distance !== null ? round($distance, 2) : null, // Returns null instead of 0
                    'profile_photo' => ($user ?? null)->profile_photo_url ?? null,
                ];
            });

            // FIX 3: Count checked-in vs registered accurately
            $checkedInParticipants = $participants->filter(fn($p) => $p['has_checked_in'] === true);
            $withinGeofence = $checkedInParticipants->filter(fn($p) => $p['is_within_geofence'] === true)->count();
            $outsideGeofence = $checkedInParticipants->filter(fn($p) => $p['is_within_geofence'] === false)->count();

            $activityLocation = [
                'id' => $activity->id,
                'title' => $activity->title,
                'description' => $activity->description,
                'venue' => $activity->venue,
                'latitude' => $activity->latitude !== null ? (float)$activity->latitude : 0.0,
                'longitude' => $activity->longitude !== null ? (float)$activity->longitude : 0.0,
                'geofence_radius' => $activity->geofence_radius ?? 100,
                'status' => $activity->status,
                'start_datetime' => $activity->start_datetime,
                'end_datetime' => $activity->end_datetime,
                'component_type' => $activity->component_type,
                'total_participants' => $participants->count(),
                'checked_in_participants' => $checkedInParticipants->count(),
            ];

            $stats = [
                'total_registrations' => $participants->count(),
                'checked_in_with_location' => $checkedInParticipants->count(),
                'within_geofence' => $withinGeofence,
                'outside_geofence' => $outsideGeofence,
                'pending_checkin' => $participants->count() - $checkedInParticipants->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'activity' => $activityLocation,
                    'participants' => $participants->values(),
                    'stats' => $stats,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Activity Map Error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Failed to get activity location data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update activity location coordinates
     */
    public function updateLocation(Request $request, $id)
    {
        try {
            Log::info('Updating location for activity ID: ' . $id);
            
            $activity = Activity::find($id);

            if (!$activity) {
                return response()->json([
                    'success' => false,
                    'message' => 'Activity not found'
                ], 404);
            }

            $request->validate([
                'latitude' => 'required|numeric|between:-90,90',
                'longitude' => 'required|numeric|between:-180,180',
                'geofence_radius' => 'nullable|integer|min:10|max:1000',
            ]);

            $activity->update([
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
                'geofence_radius' => $request->geofence_radius ?? 100,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Activity location updated successfully',
                'data' => $activity
            ]);

        } catch (\Exception $e) {
            Log::error('Update Location Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update location: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all activities with locations for map overview
     */
    public function getActivitiesWithLocations(Request $request)
    {
        try {
            // Handle both authenticated and unauthenticated requests
            // If user is authenticated, we can include more detailed data
            // If not, we still return available data
            
            $query = Activity::with(['creator'])
                ->withCount('participations')
                ->whereNotNull('latitude')
                ->whereNotNull('longitude');

            // Filter by status
            if ($request->has('status') && $request->status !== 'all') {
                $query->where('status', $request->status);
            }

            // Filter by component
            if ($request->has('component') && $request->component !== 'all') {
                $query->where('component_type', $request->component);
            }

            // Filter by date range
            if ($request->has('start_date')) {
                $query->whereDate('start_datetime', '>=', $request->start_date);
            }
            if ($request->has('end_date')) {
                $query->whereDate('end_datetime', '<=', $request->end_date);
            }

            $activities = $query->orderBy('start_datetime', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $activities->map(function ($activity) {
                    return [
                        'id' => $activity->id,
                        'title' => $activity->title,
                        'venue' => $activity->venue,
                        'latitude' => $activity->latitude !== null ? (float)$activity->latitude : 0.0,
                        'longitude' => $activity->longitude !== null ? (float)$activity->longitude : 0.0,
                        'geofence_radius' => $activity->geofence_radius ?? 100,
                        'status' => $activity->status,
                        'start_datetime' => $activity->start_datetime,
                        'end_datetime' => $activity->end_datetime,
                        'component_type' => $activity->component_type,
                        'participants_count' => $activity->participants_count,
                        'creator' => $activity->creator ? 
                            ($activity->creator->first_name ?? '') . ' ' . ($activity->creator->last_name ?? '') : 
                            'Unknown',
                        'has_location' => !is_null($activity->latitude) && !is_null($activity->longitude),
                    ];
                })
            ]);

        } catch (\Exception $e) {
            Log::error('Activities Map Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to get activities: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Calculate distance between two points in meters using Haversine formula
     */
    private function calculateDistance($lat1, $lng1, $lat2, $lng2)
    {
        $earthRadius = 6371000; // meters

        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLng / 2) * sin($dLng / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }
}