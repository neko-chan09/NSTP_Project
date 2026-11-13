<?php
// app/Models/User.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\SoftDeletes;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'first_name',
        'last_name',
        'middle_name',
        'email',
        'password',
        'profile_photo',
        'role',
        'student_id',
        'course',
        'year_level',
        'section',
        'contact_number',
        'is_active',
        'nstp_component',
        'class_code',
        'must_change_password',
    ];

    protected $appends = ['profile_photo_url'];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'is_active' => 'boolean',
        'must_change_password' => 'boolean',
    ];

    /**
     * Get the profile photo URL
     * This is the key fix for the profile photo issue
     */
    public function getProfilePhotoUrlAttribute()
    {
        $path = ltrim((string) $this->profile_photo, '/');
        if (!$path) return null;
        if (filter_var($path, FILTER_VALIDATE_URL)) return $path;
        $path = preg_replace('#^(?:storage/|public/)+#', '', $path);
        if (!str_starts_with($path, 'profile_photos/') || str_contains($path, '..') ||
            !\Illuminate\Support\Facades\Storage::disk('public')->exists($path)) return null;
        return url('/api/profile-photos/' . $this->id) . '?v=' . substr(hash('sha256', $path), 0, 16);
    }

    /**
     * Get default avatar based on name
     */
    public function getDefaultAvatar()
    {
        $name = $this->first_name ?? $this->last_name ?? 'User';
        $name = trim($name);
        if (empty($name)) {
            $name = 'User';
        }
        return 'https://ui-avatars.com/api/?name=' . urlencode($name) . '&background=D4AF37&color=0A1628&size=100&bold=true';
    }

    /**
     * Get user initials for avatar fallback
     */
    public function getInitialsAttribute()
    {
        $first = $this->first_name ? strtoupper(substr($this->first_name, 0, 1)) : '';
        $last = $this->last_name ? strtoupper(substr($this->last_name, 0, 1)) : '';
        return $first . $last ?: 'U';
    }

    /**
     * Get full name
     */
    public function getFullNameAttribute()
    {
        if ($this->first_name && $this->last_name) {
            return $this->first_name . ' ' . $this->last_name;
        }
        return $this->first_name ?? $this->last_name ?? 'User';
    }

    /**
     * Get display name (for forms)
     */
    public function getDisplayNameAttribute()
    {
        return $this->full_name;
    }

    // Relationships
    public function student()
    {
        return $this->hasOne(Student::class);
    }

    public function facultySessions()
    {
        return $this->hasMany(AttendanceSession::class, 'faculty_id');
    }

    public function documents()
    {
        return $this->hasMany(Document::class, 'verified_by');
    }

    public function certificates()
    {
        return $this->hasMany(Certificate::class, 'issued_by');
    }

    public function activities()
    {
        return $this->hasMany(Activity::class, 'created_by');
    }

    public function announcements()
    {
        return $this->hasMany(BulletinBoard::class, 'created_by');
    }
}
