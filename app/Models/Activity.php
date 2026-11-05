<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Activity extends Model
{
    protected $table = 'activities';

    protected $fillable = [
        'title',
        'description',
        'component_type',
        'start_datetime',
        'end_datetime',
        'venue',
        'latitude',
        'longitude',
        'geofence_radius',
        'training_hours',
        'max_participants',
        'status',
        'created_by',
    ];

    protected $casts = [
        'start_datetime' => 'datetime',
        'end_datetime' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'latitude' => 'float',
        'longitude' => 'float',
        'geofence_radius' => 'integer',
        'training_hours' => 'integer',
        'max_participants' => 'integer',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function participations()
    {
        return $this->hasMany(ActivityParticipation::class);
    }

    public function getParticipantsCountAttribute()
    {
        return $this->participations()->count();
    }

    /**
     * Status is derived from the schedule so it is always accurate.
     * "cancelled" is the only manual state and always wins.
     */
    public function getStatusAttribute($value)
    {
        if ($value === 'cancelled') {
            return 'cancelled';
        }

        $now = now();

        if ($this->end_datetime && $now->gte($this->end_datetime)) {
            return 'completed';
        }

        if ($this->start_datetime && $now->gte($this->start_datetime)) {
            return 'ongoing';
        }

        return 'upcoming';
    }

    public function isWithinGeofence($lat, $lng)
    {
if (is_null($this->latitude) || is_null($this->longitude) || is_null($lat) || is_null($lng)) {
            return false;
        }

        $distance = $this->calculateDistance((float)$lat, (float)$lng, (float)$this->latitude, (float)$this->longitude);
        return $distance <= ($this->geofence_radius ?? 100);
    }

    public function calculateDistance($lat1, $lng1, $lat2, $lng2)
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