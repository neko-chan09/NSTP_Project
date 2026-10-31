<?php
// app/Models/ClassGroup.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class ClassGroup extends Model
{
    protected $table = 'classes';

    protected $fillable = [
        'teacher_id',
        'name',
        'description',
        'component_type',
        'class_code',
        'school_year',
        'academic_year_id',
        'status',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // ============================================================
    // RELATIONSHIPS
    // ============================================================

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class, 'academic_year_id');
    }

    public function students(): BelongsToMany
    {
        return $this->belongsToMany(Student::class, 'class_students', 'class_id', 'student_id')
            ->withPivot('joined_at', 'status', 'school_year', 'academic_year_id')
            ->wherePivot('status', 'active');
    }

    public function allStudentsWithPivot(): BelongsToMany
    {
        return $this->belongsToMany(Student::class, 'class_students', 'class_id', 'student_id')
            ->withPivot('joined_at', 'status', 'school_year', 'academic_year_id');
    }

    public function materials(): HasMany
    {
        return $this->hasMany(LearningMaterial::class, 'class_id');
    }

    // ============================================================
    // SCOPES
    // ============================================================

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeArchived($query)
    {
        return $query->where('status', 'archived');
    }

    public function scopeForSchoolYear($query, ?string $schoolYear)
    {
        if ($schoolYear) return $query->where('school_year', $schoolYear);
        return $query;
    }

    public function scopeForAcademicYear($query, ?int $academicYearId)
    {
        if ($academicYearId) return $query->where('academic_year_id', $academicYearId);
        return $query;
    }

    public function scopeForComponent($query, ?string $component)
    {
        if ($component && $component !== 'all') {
            return $query->where('component_type', $component);
        }
        return $query;
    }
}