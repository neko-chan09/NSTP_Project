<?php
// app/Models/StudentLocation.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentLocation extends Model
{
    protected $fillable = [
        'student_id',
        'activity_id',
        'latitude',
        'longitude',
        'accuracy',
        'distance_from_venue',
        'is_within_geofence',
        'location_source',
        'tracked_at',
    ];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
        'accuracy' => 'float',
        'distance_from_venue' => 'float',
        'is_within_geofence' => 'boolean',
        'tracked_at' => 'datetime',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function activity()
    {
        return $this->belongsTo(Activity::class);
    }

    // Calculate distance from venue
    public function calculateDistanceFromVenue($venueLat, $venueLng)
    {
        if (!$venueLat || !$venueLng) {
            return null;
        }

        return $this->calculateDistance(
            $this->latitude,
            $this->longitude,
            $venueLat,
            $venueLng
        );
    }

    // Haversine formula
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