<?php
// app/Models/AttendanceLog.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AttendanceLog extends Model
{
    use HasFactory;

    protected $table = 'attendance_logs';

    protected $fillable = [
        'session_id',
        'student_id',
        'check_in_at',
        'status',  // 'present', 'late', 'absent'
        'face_confidence',
        'location_lat',
        'location_lng',
        'remarks',
        'minutes_late', // New field to track how late
    ];

    protected $casts = [
        'check_in_at' => 'datetime',
        'face_confidence' => 'float',
        'location_lat' => 'float',
        'location_lng' => 'float',
        'minutes_late' => 'integer',
    ];

    /**
     * Get the session this log belongs to
     */
    public function session()
    {
        return $this->belongsTo(AttendanceSession::class, 'session_id');
    }

    /**
     * Get the student who checked in
     */
    public function student()
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    /**
     * Get the location as an array
     */
    public function getLocationAttribute()
    {
        if ($this->location_lat && $this->location_lng) {
            return [
                'latitude' => $this->location_lat,
                'longitude' => $this->location_lng,
            ];
        }
        return null;
    }

    /**
     * Set the location from an array
     */
    public function setLocationAttribute($value)
    {
        if (is_array($value)) {
            $this->attributes['location_lat'] = $value['latitude'] ?? null;
            $this->attributes['location_lng'] = $value['longitude'] ?? null;
        }
    }

    /**
     * Check if the log is present
     */
    public function isPresent()
    {
        return $this->status === 'present';
    }

    /**
     * Check if the log is late
     */
    public function isLate()
    {
        return $this->status === 'late';
    }

    /**
     * Check if the log is absent
     */
    public function isAbsent()
    {
        return $this->status === 'absent';
    }

    /**
     * Get status badge color
     */
    public function getStatusColorAttribute()
    {
        return match($this->status) {
            'present' => 'bg-emerald-500',
            'late' => 'bg-amber-500',
            'absent' => 'bg-red-500',
            default => 'bg-slate-500',
        };
    }

    /**
     * Get status label
     */
    public function getStatusLabelAttribute()
    {
        return match($this->status) {
            'present' => 'Present',
            'late' => 'Late',
            'absent' => 'Absent',
            default => ucfirst($this->status),
        };
    }

    /**
     * Scope for today's logs
     */
    public function scopeToday($query)
    {
        return $query->whereDate('check_in_at', today());
    }

    /**
     * Scope for a specific student
     */
    public function scopeForStudent($query, $studentId)
    {
        return $query->where('student_id', $studentId);
    }

    /**
     * Scope for a specific session
     */
    public function scopeForSession($query, $sessionId)
    {
        return $query->where('session_id', $sessionId);
    }

    /**
     * Scope for present logs
     */
    public function scopePresent($query)
    {
        return $query->where('status', 'present');
    }

    /**
     * Scope for late logs
     */
    public function scopeLate($query)
    {
        return $query->where('status', 'late');
    }

    /**
     * Scope for absent logs
     */
    public function scopeAbsent($query)
    {
        return $query->where('status', 'absent');
    }
}