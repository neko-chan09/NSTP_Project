<?php
// app/Models/AttendanceSession.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class AttendanceSession extends Model
{
    use HasFactory;

    protected $table = 'attendance_sessions';

    protected $fillable = [
        'faculty_id',
        'class_id',
        'component',
        'course',
        'section',
        'start_time',
        'end_time',
        'scheduled_start',
        'scheduled_end',
        'grace_period_minutes',
        'is_scheduled',
        'session_time',
        'day_of_week',
        'status',
        'description',
        // Location fields
        'require_location',
        'latitude',
        'longitude',
        'geofence_radius',
    ];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'scheduled_start' => 'datetime',
        'scheduled_end' => 'datetime',
        'is_scheduled' => 'boolean',
        'grace_period_minutes' => 'integer',
        'session_time' => 'datetime:H:i',
        // Location casts
        'require_location' => 'boolean',
        'latitude' => 'float',
        'longitude' => 'float',
        'geofence_radius' => 'integer',
    ];

    // ============================================================
    // RELATIONSHIPS
    // ============================================================

    public function faculty()
    {
        return $this->belongsTo(User::class, 'faculty_id');
    }

    public function class()
    {
        return $this->belongsTo(ClassGroup::class, 'class_id');
    }

    public function classGroup()
    {
        return $this->belongsTo(ClassGroup::class, 'class_id');
    }

    public function logs()
    {
        return $this->hasMany(AttendanceLog::class, 'session_id');
    }

    public function getLogsCountAttribute()
    {
        return $this->logs()->count();
    }

    // ============================================================
    // STATUS HELPERS
    // ============================================================

    public function isActive()
    {
        return $this->status === 'active';
    }

    public function isScheduled()
    {
        return $this->is_scheduled
            && $this->scheduled_start
            && $this->scheduled_start > now();
    }

    public function isOngoing()
    {
        if (!$this->scheduled_start) {
            return $this->status === 'active';
        }

        $now = now();
        return $now >= $this->scheduled_start && $now <= $this->scheduled_end;
    }

    public function hasEnded()
    {
        if (!$this->scheduled_end) {
            return false;
        }
        return now() > $this->scheduled_end;
    }

    public function isLate($checkInTime)
    {
        if (!$this->scheduled_start) {
            $start = Carbon::parse($this->start_time ?? $this->scheduled_start);
        } else {
            $start = Carbon::parse($this->scheduled_start);
        }

        $checkIn = Carbon::parse($checkInTime);

        if ($checkIn->lt($start)) {
            return false;
        }

        $graceMinutes = $this->grace_period_minutes ?? 15;
        return $checkIn->gt($start->copy()->addMinutes($graceMinutes));
    }

    public function getLateCutoffTime()
    {
        $start = Carbon::parse($this->scheduled_start ?? $this->start_time);
        $graceMinutes = $this->grace_period_minutes ?? 15;
        return $start->addMinutes($graceMinutes);
    }

    public function getMinutesLate($checkInTime)
    {
        if (!$this->isLate($checkInTime)) {
            return 0;
        }

        $start = Carbon::parse($this->scheduled_start ?? $this->start_time);
        $graceMinutes = $this->grace_period_minutes ?? 15;
        $cutoff = $start->addMinutes($graceMinutes);
        $checkIn = Carbon::parse($checkInTime);

        return $checkIn->diffInMinutes($cutoff);
    }

    public function close()
    {
        $this->update([
            'status' => 'closed',
            'end_time' => now(),
        ]);
    }

    public function start()
    {
        $this->update([
            'status' => 'active',
            'start_time' => now(),
        ]);
    }

    // ============================================================
    // LOCATION HELPERS
    // ============================================================

    public function isWithinGeofence($lat, $lng): bool
    {
        if (!$this->require_location || !$this->latitude || !$this->longitude) {
            return false;
        }

        $distance = $this->calculateDistance($lat, $lng, $this->latitude, $this->longitude);
        return $distance <= ($this->geofence_radius ?? 100);
    }

    public function calculateDistance($lat1, $lng1, $lat2, $lng2): float
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

    public function getGeofenceStatus($lat, $lng): array
    {
        if (!$this->require_location) {
            return [
                'enabled' => false,
                'within' => true,
                'distance' => null,
                'radius' => null,
                'venue_lat' => $this->latitude,
                'venue_lng' => $this->longitude,
                'message' => 'No location restriction',
            ];
        }

        if (!$this->latitude || !$this->longitude) {
            return [
                'enabled' => true,
                'within' => false,
                'distance' => null,
                'radius' => $this->geofence_radius ?? 100,
                'venue_lat' => $this->latitude,
                'venue_lng' => $this->longitude,
                'message' => 'Venue location not set. Geofence disabled. Please contact administrator to set venue coordinates.',
            ];
        }

        $distance = $this->calculateDistance($lat, $lng, $this->latitude, $this->longitude);
        $radius = $this->geofence_radius ?? 100;
        $within = $distance <= $radius;

        return [
            'enabled' => true,
            'within' => $within,
            'distance' => round($distance, 2),
            'radius' => $radius,
            'venue_lat' => $this->latitude,
            'venue_lng' => $this->longitude,
            'message' => $within
                ? "You are within the attendance zone ({$distance}m from venue)"
                : "You are outside the attendance zone ({$distance}m from venue). Please move within {$radius}m of the venue.",
        ];
    }

    // ============================================================
    // SCOPES
    // ============================================================

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeClosed($query)
    {
        return $query->where('status', 'closed');
    }

    public function scopeScheduled($query)
    {
        return $query->where('is_scheduled', true)
                    ->where('scheduled_start', '>', now());
    }

    public function scopeOngoing($query)
    {
        return $query->where('is_scheduled', true)
                    ->where('scheduled_start', '<=', now())
                    ->where('scheduled_end', '>=', now());
    }

    public function scopeForComponent($query, $component)
    {
        if ($component) {
            return $query->where('component', $component);
        }
        return $query;
    }

    public function scopeForClass($query, $classId)
    {
        return $query->where('class_id', $classId);
    }
}