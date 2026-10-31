<?php
// app/Models/ActivityParticipation.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ActivityParticipation extends Model
{
    protected $fillable = [
        'activity_id',
        'student_id',
        'attendance_status',
        'check_in_at',
        'checkin_latitude',
        'checkin_longitude',
        'is_within_geofence',
        'distance_from_venue',
        'is_tracking_location',
        'tracking_started_at',
        'tracking_ended_at',
        'face_image_path',
        'latitude',
        'longitude',
    ];

    protected $casts = [
        'attended_at' => 'datetime',
        'check_in_at' => 'datetime',
        'checkin_latitude' => 'float',
        'checkin_longitude' => 'float',
        'is_within_geofence' => 'boolean',
        'distance_from_venue' => 'float',
        'is_tracking_location' => 'boolean',
        'tracking_started_at' => 'datetime',
        'tracking_ended_at' => 'datetime',
        'latitude' => 'float',
        'longitude' => 'float',
    ];

    public function activity()
    {
        return $this->belongsTo(Activity::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}